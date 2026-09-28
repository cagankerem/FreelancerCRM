# Yerel veritabanı temeli

Normatif ürün kaynağı `../plan.md`; bu belge uygulanan SQL sınırlarını açıklar.
Migration'lar şema/kural içerir, kurgusal kullanıcı veya demo verisi içermez.
`seed.sql` yalnız yerel geliştirme için iki kurgusal Auth kullanıcısı, profil,
müşteri ve taslak teklif oluşturur. Seeding açıktır; reset bu seed'i yeniden uygular.
İki test hesabı `deniz@kapsam.invalid` ve `ece@kapsam.invalid`; yerel parola
`YerelTest2026!`. Bunlar production hesabı veya gerçek kişi değildir.
Gerçek local DB artık boş değildir; `db:check-empty` bu nedenle reseti durdurur.

## Migration sırası

1. `20260925133849_profile_client_foundation.sql`: private yardımcılar, profiles, clients, owner RLS ve kolon izinleri.
2. `20260925133850_proposal_content_and_entitlements.sql`: proposals, sections, items, minimum subscriptions; numeric hesap, FK/index/check, içerik kilidi.
3. `20260925134004_proposal_events_and_controlled_writes.sql`: responses/views, değişmez karar ve kontrollü yazma fonksiyonları.
4. `20260926152859_auth_account_cascade_permissions.sql` ve `20260926153021_auth_client_snapshot_cascade.sql`: Auth hesabı silinirken FK cascade için yalnız silinmiş kullanıcıya ait teklifin dar DELETE/SELECT ve `client_id` UPDATE izinleri.
5. `20260926154224_guard_child_auth_cascade.sql`: yalnız private ve doğrudan çağrı izni kapalı çocuk satır trigger'ına sahibi bağlamı.
6. `20260926154401_skip_totals_during_auth_cascade.sql` ve `20260926154504_identify_auth_cascade_by_current_user.sql`: Auth silme zincirinde artık silinecek teklifi yeniden toplamama; ikinci migration doğrudan bağlantının gerçek rolünü `current_user` ile tespit eder.

Free ve Pro aynı tabloları kullanır. `subscriptions` satırı yoksa Free sayılır.
Yalnız `pro + active + gelecekte current_period_end` Pro hakkı verir; trial/grace
varsayılmaz. Kullanıcı abonelik yazamaz. Sağlayıcı/webhook ve fiyat alanları bu
minimum modele eklenmedi; gerçek faturalama için sonraki migration gerekir.

## Yazma sınırı

| İşlem | Yetki | DB davranışı |
|---|---|---|
| Profil/müşteri | authenticated + owner RLS | İzinli kolonlar; logo yolu server-owned |
| `save_proposal` | authenticated, doğrulanmış `auth.uid()` sahibi | Draft create/update; Pro canlı edit; parent + sections + items atomik |
| `proposal_action` | authenticated sahibi | Draft silme, revoke; Pro/pending locked/live seçimi |
| `publish_proposal` | yalnız service_role | Sunucunun doğruladığı actor, version, quota, selector/hash; ilk yayın veya Pro yeniden yayınlama |
| `record_proposal_response` | yalnız service_role | İçerik sürümü/generation kontrolü, idempotency, ilk karar ve canonical durum aynı transaction |
| `record_proposal_view` | yalnız service_role | Event/window dedupe, bot ayrımı ve atomik aggregate |

Public fonksiyonlar SECURITY INVOKER sarmalayıcılardır. Gerekli dar SECURITY
DEFINER fonksiyonları exposed olmayan private schema'dadır; sabit search_path,
açık sahiplik veya gerçek server rol kontrolü ve explicit EXECUTE izinleri vardır.
Normal browser erişiminde teklif/section/item doğrudan DML kapalıdır. Service role
de bu iş tablolarında genel DML hakkı almaz; yalnız amaç sınırlı fonksiyonları çağırır.
Postgres yöneticisi güven sınırının dışındadır; buna rağmen trigger'lar cevaplanmış
içeriği ve kararı korur. Doğrulanmış hesap silme FK cascade'i desteklenir.

`save_proposal` bir patch document ve isteğe bağlı section/item dizileri alır.
Dizi `null` ise korunur, `[]` ise temizlenir; gönderilen dizi bütünüyle değiştirilir.
Alt satır UUID'leri değişebilir; bölüm anahtarı/sıra form eşlemesi için kullanılmalıdır.
Fiyat girdisi 2, miktar 3 ondalığı aşarsa reddedilir. Her satır ayrı 2 ondalığa
yuvarlanır; toplam DB tarafından bu satırlardan hesaplanır. Toplam/version/token
gibi korunan alanlar document allowlist'inde yoktur. Uygulama RPC sonucundaki
güncel `lock_version` değerini bir sonraki değişiklikte göndermelidir.
Owner mutation constraint hataları özel satır DETAIL'ini döndürmez; verifier
hash gibi SELECT'e kapalı kolonlar hata üzerinden de ifşa edilmez.

Free'nin eşzamanlı aktif sınırı 3'tür. Pro'nun sayısal limiti **tanımlanmadı**:
`publish_proposal` için yalnız güvenilir sunucu sürümlü konfigürasyondan
`pro_active_limit` sağlamalıdır. Null/geçersiz limit yayınlamayı reddeder;
testlerdeki 10 yalnız fixture değeridir, ürün veya abonelik varsayılanı değildir.
Bu parametre tarayıcıdan alınmamalıdır; kullanıcıya EXECUTE verilmez.

DB'nin başlangıç yayın kontrolleri müşteri/proje adı, currency, tax mode, en az
bir hizmet kalemi, geçerlilik ve bütün kolon constraint'lerini kapsar. Tam form
zorunlulukları ve yayın önizlemesi ilgili API/UI görevlerinde bu kontrolleri tamamlar.
`valid_until` UTC `timestamptz`, `start_date` takvim `date` alanıdır. `tax_mode`
included/excluded yalnız bilgilendirici etikettir; otomatik başlangıç değeri yoktur.

## Public API durumu

Anonim kullanıcı DB fonksiyonlarını çağıramaz. `/p/[shareToken]` ve salt okunur
`/api/public/proposals/[shareToken]` sunucu resolver'ı selector ve HMAC verifier'ı
constant-time denetler; yalnız allowlist içeriği döndürür. Kayıtlı hesap sahibi,
Free plan sınırları ve içerik kontrolünden sonra uygulama üzerinden yayınlayabilir.
Anonim kabul/ret/mesaj ve view endpointleri henüz açılmadı; bu işlemler için
nonce, Origin, rate limit ve body sınırları ayrıca tamamlanmalıdır. Storage logo,
AI, ödeme/webhook, audit ve retention işleri de bu aşamada tamamlanmış sayılmaz.

`content_version` ve `share_generation`, yanıt kaydında onayın hangi içerik/link
üzerinden verildiğini ilişkilendiren teknik alanlardır; sürüm arşivi değildir.
Teklif sahibinin normal SELECT kolonlarına verifier hash/selector/key sürümü dahil
değildir; açık kolon listesi kullanılır, `select *` kullanılmaz.

## Yerelde doğrulama

Proje kökünden, Docker Desktop açıkken:

```sh
npm run db:migrate
npm run db:migrations
npm run test:db
npm run db:advisors
npm run db:types
```

`test:db` ilk olarak SQL sözleşme testlerini transaction içinde çalıştırıp rollback
yapar. Sonra iki rastgele UUID'li kurgusal kullanıcıyla çok bağlantılı yarış testleri
yapar; yalnız kendi oluşturduğu kullanıcıları ve bağlı kayıtlarını sonunda siler.
Makine/test işlemi zorla kapatılırsa `dbtest-...@example.invalid` kayıtları kalabilir;
silmeden önce ilgili UUID'leri inceleyin. Mevcut kullanıcılar seçilmez/silinmez.

Uygulamanın yerel `.env.local` dosyası `npm run db:setup-app-env` ile üretilir;
var olan dosyaya dokunulmaz ve içindeki değerler konsola basılmaz. `npm run dev`
ardından `npm run test:product:local`, taze kayıt → profil → müşteri → taslak
akışını gerçek tarayıcıda sınar ve yalnız oluşturduğu hesabı Auth Admin API ile
siler. Önceki testten `product-smoke-...@example.invalid` hesabı kalmışsa yeni
hesap açmadan durur. Auth FK cascade'i için gereken izin düzeltmesi ve temizlik
yerel testte doğrulandı; tam ürün hesabı silme akışı henüz uygulanmadı.

Temiz baştan uygulama **veri kaybettiren** ayrı işlemdir:

```sh
npm run db:check-empty
# Sonuç boş değilse DUR: mevcut veriyi incele, kullanıcı onayı olmadan reset yapma.
npm run db:reset
npm run test:db
```

`db:check-empty` yalnız okur; reset çalıştırmaz. Reset öncesinde servisleri kullanan
diğer geliştirme işlemleri durdurulmalı; kontrol ile reset arasında yazım olmamalıdır.
Bu komutlar sabit local hedeflidir; linked/remote URL override kabul edilmez.
Uzak ortama uygulanmış migration dosyaları değiştirilmez; yeni migration eklenir.
