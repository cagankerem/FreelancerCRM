# TASK-005 kabul matrisi

2026-10-19. Normatif kaynak: `plan.md` TASK-005; bu dosya yalnız kanıt takibidir.
Durum: **Kısmi**. Geçmiş sonuçlar yeni koşu yerine geçmez; hiçbir açık satır silinmez.
Yerel veya PoC sonucu uzak/staging kabulüne otomatik yükseltilmez.

## Yetki kaydı

- L: Bu istekte yerel kod/test/belge çalışması onaylı.
- LD: Bu tur localhost Supabase sentetik hesap/profil/müşteri/teklif, refresh/logout
  ve yalnız koşunun verisinin temizliği açıkça onaylandı. Reset/mevcut kayıt silme yok.
- R: Bu tur staging settings/version/plan ve secret'sız erişim/export metadata'sı
  için yalnız salt-okunur inceleme onaylandı. Kullanıcı logları veya secret yok.
- P: Bu tur yalnız localhost C ingress/relay PoC'si onaylandı. Public ürün rotası,
  token modeli, staging diagnostic fixture'ı, DNS ve uzak ayar değişikliği yok.
- T: Yeni kısa filtreli tail, kalıcı sentetik log sorgusu ve staging HTTP testleri
  henüz onaylı değil; açık kapsamla ayrı izin gerekir.
- D: Deployment henüz onaylı değil. Kesin Worker, incelenmiş SHA + dirty-tree ve
  artefakt kimliği, ayar/secret etkileri ve rollback ile ayrıca istenecek.
- SD: Uzak sentetik Auth/veri oluşturma/koşuya ait temizlik henüz onaylı değil.
- C: Uzak log politikası yazımı, hosting/DNS/replay storage, üretim mimarisi ve
  üretim entegrasyonu için karar/onay henüz yok. Kullanıcı ek maliyet sınırını
  **0; yalnız ücretsiz seçenekler** olarak belirledi. Ücretli kaynak/otomatik
  yükseltme/domain satın alma yok; ücretsiz kaynak açılması da ayrıca onay ister.

## Zorunlu kabul satırları

G = bu tur ilgili sınırda geçti; K = kısmi; B = bekliyor; F = başarısız.
Kaynak varlığı çalışma kanıtı değildir. Satır numaraları koşu boyunca sabit kalır.

| ID / kriter | Durum / bu tur kanıt | Eksik iş | Yetki | Doğrulama yöntemi |
| --- | --- | --- | --- | --- |
| P1 Her request correlation ID alıyor | K: iki yerel runtime correlation/concurrency geçti | Doğru staging runtime | L, T, D | Aynı ingress→operation→log→header/body ID |
| P2 İstemci güvenli hata kodu görüyor | K: iki runtime API/action/render ve destek ID geçti | Staging hata ve destek ID kanıtı | L, T | Güvenli code/message, ham hata yok |
| P3 Token/PII maskeleniyor | K: uygulama allowlist'i mevcut | A–F tüm ilgili yüzeyler | L, T, C | Pozitif event ve negatif sentetik canary |
| P4 Logger testleri geçiyor | K: yerel unit/integration/E2E geçti | Staging; platform path audit başarısız | L, LD, T, SD | Unit/integration/E2E ve güvenli snapshot |
| N1 Edge ve Node uyumu | G: native ve gerçek workerd correlation/runtime geçti | Yok; staging ayrı | L | Native Next.js + workerd |
| N2 Allowlist ve denylist redaksiyon | G: 93 unit ve iki runtime canary geçti | Platform yüzeyleri ayrı | L | Nested veri/Error/secret/kontrol karakteri sınırları |
| T1 Unit: redaction | G: 93 unit geçti | Yok | L | `test:unit` |
| T2 Integration: propagation | G: 20 integration ve iki runtime correlation geçti | Staging S3–S5 ayrı | L | `test:integration`, iki runtime correlation |
| T3 E2E: hata correlation ID | K: native/workerd hata UI geçti | Staging hata UI | L, T | Gerçek browser support ID/header/log eşleşmesi |
| T4 Manuel: log snapshot | K: iki yerel runtime gözlendi, canary sayacı doğrulandı | Uzak snapshot | L, T | Ham log yayınlamadan sözlük/canary sayacı |
| F1 Kod tamamlandı | K: ana kod korunuyor; yerel relay PoC 9 test geçti | Gerçek gateway/ürün entegrasyonu ve platform gizliliği | P, C | Kod + gerçek sınır kabulü |
| F2 Testler geçti | K: yerel kalite/runtime geçti; URL audit F | Platform gizliliği ve staging kapıları | L, LD, T, SD | Komut günlüğü + staging senaryoları |
| F3 Lint/typecheck geçti | G: kök lint ve typecheck geçti; ESM port/installer korunuyor | Yok | L | Kök `lint`, `typecheck` |
| F4 Redaksiyon uygulandı | K: uygulama katmanı mevcut | Platform/ingress yüzeyleri | P, C, T | A–F ayrı test |
| F5 Log sözlüğü güncellendi | K: OBSERVABILITY mevcut | Nihai uygulama/politikayla eşleştir | L | Kaynak enum'ları ↔ belge |
| A Structured loglar | K: iki yerel runtime allowlist/canary geçti | Staging | L, T | Alan allowlist'i; içerik/secret yok |
| B Framework/runtime exception çıktısı | K: iki yerel runtime kontrollü hata geçti | Üretim gateway sınırları ve uzak exception | L, T | Tüm stdout/stderr ve uzak exception |
| C Yerel Wrangler URL gizliliği | F: pozitif event görüldü; pathExposed=true, queryExposed=false | Gerçek ürün akışına uygulanmış çözüm gerekli; PoC yeterli değil | L, P, C | Korunan `test:observability:platform-urls` |
| D Canlı tail metadata gizliliği | B: önceki gözlem tarihsel | Çözüm sonrası kısa filtreli event | T, C | Pozitif event, doğru ID, path/query canary yok |
| E Kalıcı Workers Logs gizliliği | B | Etkin politika ve sentetik persisted event | R, C, T | Kalıcı kaydı gerçekten gözle |
| E2 Traces gizliliği | B | Enablement/record/redaksiyon açıkla | R, C, T | Etkin ayar; etkinse ayrı trace canary kabulü |
| F Export hedeflerinin gizliliği | B | Envanter, erişim, etkinse aktarım kabulü | R, C, T | Tail/Logpush/OTEL hedeflerini ayrı doğrula |
| U1 Auth query code gizliliği | K: yerel PoC sentetik query safe upstream; gerçek SDK entegrasyonu yok | Her ilgili ürün/platform yüzeyinde gerçek kanıt | P, C, T, SD | Sentetik query; PKCE/SSR korunur |
| U2 Public path bearer gizliliği | F: uygulama Wrangler path audit başarısız; PoC ayrı geçti | Her ilgili ürün/platform yüzeyinde gerçek çözüm/kanıt | P, C, T | Sentetik path; query redaksiyonu yeterli değil |
| M1 Log/trace/invocation enablement | K: settings alanı yok; script-settings observability:null | Etkin değerler bilinmiyor; null kapalı demek değil | R, C | GET; missing/null/default ayrımı |
| M2 Query redaksiyonu/path yöntemi | B | Hedef politikayı onayla/uygula | C, T | Uzak ayarı yeniden oku + canary |
| M3 Sampling | K: kullanıcı varsayılan 1/range 0–1 bildirdi | Gerçek etkin değer/politika bilinmiyor | R, C | Açık örnekleme; düşürerek kabul yok |
| M4 Persist/destinations | K: logpush false, tail consumer 0; kullanıcı hesap/Worker OTLP destination ve metrics export olmadığını teyit etti | Persist bilinmiyor; kullanıcı teyidi yeni bağımsız API okuması değil | R, C | Secret'sız hedef metadata'sı; tekrar GET |
| M5 Saklama süresi | K: kullanıcı Free 3 gün log/7 gün trace bildirdi; resmi belgeyle uyumlu | Etkin kayıt politikası ve erişim kabulü | R, C | Redakte dashboard/plan metadata |
| M6 Rol/kullanıcı/token/export erişimi | K: bir üye Super Administrator; kullanıcı izin adlarını bildirdi | Etkin token/grup atamaları ve export kapsamları bilinmiyor | R, C | Yetki politikaları; secret değerleri yok |
| M7 Plan/kota/ücret | K: kullanıcı Free/kullanım 0 ve ek bütçe 0 bildirdi; subscriptions 403 | Ücretsiz gateway uygunluğu; kota anlık ölçüm değil | R, C | Plan adı, kalan kota, bütçe sınırı |
| S1 Aktif version ↔ kaynak/artefakt | K: 9 Ekim version 1bdc7d4a-6dcd-4755-bbc7-1a324a332ad0 yüzde 100; SHA annotation yok | Güncel çalışma ağacı/artefakt eşleşmesi kanıtlanmadı | R, D | SHA tek başına değil, çalışma ağacı + artefakt digest'i |
| S2 Staging yayını ve rollback | B | Kesin paket ve ayrı yayın onayı | D, C | İzole Workers build; version + non-versioned snapshot |
| S3 Concurrency ve sahte ID | K: iki runtime ve PoC geçti | Doğru staging | L, T | Paralel ID izolasyonu; dış header değişir |
| S4 X-Request-ID ve JSON/null | K: iki runtime geçti | Doğru staging | L, T | Başarı/hata zarfı ve header eşleşmesi |
| S5 Route Handler/Server Action/hata UI | K: iki runtime geçti | Güvenli staging hata yöntemi ve kabulü | L, T, SD | Gerçek HTTP/browser; staging fixture'ını açma yok |
| S6 SDK refresh/multi-cookie/redirect/logout | K: iki gerçek yerel SDK runtime geçti | Staging | LD, SD, T | Gerçek SDK; her Set-Cookie ayrı korunur |
| S7 Public/notFound/static/cache/streaming | K: iki runtime geçti | Staging | L, T | Gerçek status/noindex/cache/stream davranışı |
| S8 Secret/PII ve URL canary | F: app logger geçti; Wrangler path audit başarısız | Tüm ilgili log/metadata yüzeyleri | L, P, T, C | Event/parse/bağlantı/sampling başarısızlığı pass değil |
| S9 Geçici hata/tail/test verisi temizliği | K: yerel sahip olunan hesaplar, sunucular ve PoC temizlendi; uzak oturum açılmadı | Yeni uzak koşu sonunda ayrıca kanıt | LD, T, SD | finally; yalnız sahip olunan kaynaklar |
| Q1 Format, kök lint, typecheck | G: son kaynak üzerinde yeniden geçti | Markdown mevcut proje politikasında manuel | L | Kök komutlar; kapılar değişmez |
| Q2 Unit/integration/CI/workflow | G: 93/20/88; actionlint 1.7.12 geçti | Yok | L | Kök komutlar + actionlint |
| Q3 Native/Workers build ve browser | G: iki build; native 40, Workers 44 geçti | Staging ayrı | L | Native build/test → Workers build/test |
| Q4 Dört Workers Auth testi | G: dört Auth başlığı ve 44 başarı gözlendi | Yok | L | `test:workers:runtime` 44 browser dahil |
| Q5 Gerçek SDK yerel Auth/ürün | G: native 6 + workerd 6; sahip olunan hesap temizliği geçti | Uzak Auth ayrı | LD | `test:observability:product`, Workers runtime |
| Q6 Secret scan/self-test | G: 333 depo dosyası/Git geçmişi temiz; sentetik anahtar self-test yakalandı | Yok | L | `secrets:scan`, `secrets:self-test` |
| Q7 Belgeler/ilerleme/plan korunması | G: README/OBSERVABILITY/tasarım/matris/status güncellendi; plan/lock diff boş | Uzak kabul geldikçe kanıt güncellemesi | L | README/OBSERVABILITY/status; plan diff boş |

## Komut günlüğü

Bu bölüm her komutun sonucuyla güncellenir; bu dosyada canary/credential/ham log tutulmaz.
Yeni uzak test veya deployment başlamadan ayrı yetki satırı eklenir.

2026-10-19 bu tur komut sonuçları (exit 0, aksi açıkça belirtilir):

| Komut | Sonuç |
| --- | --- |
| `npm run format:check` | Başlangıç ve son kaynak geçti; Markdown mevcut ignore politikasında manuel |
| `npm run lint` | Geçti; portlar ve yeni PoC dahil, kural/ignore gevşetilmedi |
| `npm run typecheck` | Geçti |
| `npm run test:unit` | 93 geçti |
| `npm run test:ci` | Önce 79, PoC dahil son koşu 88 geçti |
| `npm run ci:validate` | Geçti; actionlint 1.7.12 |
| `npm run build` | Native build geçti |
| `npm run test:integration` | Build sonrası 20 geçti |
| `npm run test:observability` | Native correlation/concurrency/hata/canary geçti |
| `npm run test:observability:product` | Gerçek yerel SDK altı kontrol; own-data cleanup geçti |
| `PLAYWRIGHT_SERVER_MODE=production CI=true npm run test:browser` | 40 geçti |
| `npm run workers:build` | Geçti; adaptör/dynamic import uyarıları gizlenmedi |
| `npm run test:workers:runtime` | 44 browser, dört Auth başlığı, altı SDK ürün kontrolü ve correlation geçti; cleanup raporlandı |
| `npm run workers:check` | 98%; Turbopack kısmi, runtime kabulü yerine kullanılmadı |
| `npm run test:relay:poc` | Dokuz geçti; ilk flat API/modulesRules/log kanal kurulum denemeleri başarısız oldu, kurulu Miniflare API'sine göre düzeltildi |
| `npm run test:observability:platform-urls` | **Exit 1**; positiveControlObserved=true, pathExposed=true, queryExposed=false, wranglerOutput=true |
| `npm run secrets:scan` | 333 depo dosyası ve Git geçmişi temiz |
| `npm run secrets:self-test` | Sentetik anahtar yakalandı; geçti |
| Son `lint`, `typecheck`, `test:relay:poc`, `ci:validate` | Hepsi yeniden geçti; PoC 9/9, gateway kapandı/workerd dispose edildi |
| `git diff --check` ve plan/lock diff | Temiz; plan ve iki lockfile değişmedi |

Uzak salt-okunur inceleme: settings/script-settings/deployments/version/account/members
200; subscriptions 403. Deployment `134ed9d3-7393-4060-9b12-7044bc01969e`,
2026-10-09T22:28:22.645809Z; yukarıdaki version yüzde 100. HEAD
`c00299506e08fcdc1659dbbfa72eae786e7e9ca4` ve dirty-tree ile eşleşme kanıtı yok.
Yeni uzak tail, test isteği, kalıcı event sorgusu veya deployment yapılmadı.

Kullanıcı hesabı için Free ve kullanım 0 bildirdi. Resmî Workers Logs belgesinde
Free 200.000 event/gün ve 3 gün retention; traces belgesinde 7 gün retention
doğrulandı. Bu, staging enablement/persist/destination/rol atamalarını kanıtlamaz.
`persist:false` dış destination oluşturmaz; yapılandırılmış export ayrıca gerekir.
Belgelerde 1 Aralık 2026 fiyat değişikliği duyurulur; bütçe taahhüdü verilmez.

## Açık ürün/operasyon kararları

C yerel PoC onaylıdır; sağlayıcı/domain, eski workers.dev linkleri,
production-grade replay kontrolü, kalıcı politika ve staging yayını henüz onaylı
değildir. PoC bu eksikleri kapatmaz. Abonelik/erişim API'si izin vermiyorsa yalnız
plan/kota/retention/izin adlarını içeren redakte bilgi istenir; token/anahtar veya
tam destination credential'ı istenmez.

Kullanıcının canonical domain'i yok. §27 workers.dev staging'i yasaklamaz; özel
domain satın almak tek başına gizlilik çözümü değildir. C için denetlenebilir
haricî public HTTPS giriş noktası (kullanıcı domain'i veya sağlayıcı hostname'i)
ve bütçe kararı gerekir; mevcut workers.dev sabit upstream kalabilir. Eski bearer
URL redirect'i ilk hop kaydını geriye dönük temizlemez.

## Kullanıcı metadata teyidi ve ücretsiz adaylar — 2026-10-19

Kullanıcı ek bütçeyi 0 ile sınırladı. Son API incelemesinden observability:null,
logpush:false, hesap/Worker OTLP destination yok, tail consumers yok, metrics export
ve saved queries yok bilgisini paylaştı. Yeni uzak API çağrısı yapılmadı; kaynak
kullanıcı teyididir. Logs/traces/invocation/sampling/persist/query redaksiyonu hâlâ
bilinmiyor. Null değer bu etkin değerleri veya tüm varsayılanların uygulandığını
kanıtlamaz. Saved query olmaması kayıt veya saklama yok demek değildir.

Güncel [resmî settings API](https://developers.cloudflare.com/api/resources/workers/subresources/scripts/subresources/settings/methods/get/)
`redact_query_string` alanını logs/traces request URL query'leri için tanımlar;
alandan haberdar olmamak onun desteklenmediğini göstermez. Staging'de etkinliği,
tail kapsamı ve path gizliliği kanıtlanmadı. Yeni trace/OTLP etkinleştirme yapılmadı.

Ücretsiz aday araştırması (sağlayıcı hesabı/kaynak oluşturulmadı):

- Render ücretsiz planı mevcut; fakat [resmî açıklamasına](https://render.com/articles/how-render-handles-ddos-attacks)
  göre inbound web trafiği Cloudflare'dan geçer. Bu, Worker invocation metadata'sı
  yazıldığını kanıtlamaz; C tasarımının Cloudflare HTTP sınırından bağımsız ilk hop
  koşulunu sağladığını da göstermez. Bu topoloji güvenli aday kabul edilmedi.
- [Koyeb Free Instance](https://www.koyeb.com/docs/reference/instances) tek ücretsiz
  instance, 512 MB/0.1 vCPU/2 GB, persistent volume yok ve bir saat boşta scale-to-zero
  sınırlarını belgeler; üretim için önerilmez. Ücretsiz staging adayı olabilir;
  edge/LB/access/error/crash kayıtlarında orijinal path/query, redaksiyon, erişim ve
  retention sözleşmesi doğrulanamadı. Güvenli veya kesinlikle ücretsiz son çözüm
  kabul edilmedi; hesap uygunluğu, egress/overage ve ücret önleme koşulları da teyit ister.

Sonraki somut kapı: aday sağlayıcıdan, uygulama kodundan önceki TLS/edge/LB
katmanlarının path/query saklama/redaksiyon/erişim/retention davranışını ve 0 ek
ücretle staging kullanım koşullarını teyit etmek. Hesap açma/deployment onayı bu
belirsizliği kendiliğinden kapatmaz. Kullanıcı/sağlayıcı teyidi olmadan ücret,
mimari veya token değişikliği yapılmaz; TASK-005 kısmi kalır.

### Koyeb hakkında sonraki kullanıcı yanıtı — 2026-10-19

Kullanıcı edge TLS sonlandırmasında URL'nin görülebileceğini, edge/LB path/query
loglama, redaksiyon ve retention davranışlarının belgelerde bilinmediğini bildirdi.
Bu yanıt sağlayıcıdan alınmış kesin bir gizlilik garantisi olarak sunulmadı.
Aktarılan Pro uygulama logu/build retention ve DPA rol bilgileri, ücretsiz edge
log politikasının kanıtı değildir; bu ayrıntılar bağımsız kabul olarak kullanılmadı.

Tek Free Instance'ın ücretsizliği ve kaynak/idle sınırları resmi instance/fiyat
belgeleriyle uyumludur; kullanıcı harcama limiti olmadığını ve ek/büyük servislerin
ücret doğuracağını ayrıca belirtti. Bu, ücretli kaynak açma izni değildir. Bütçe 0
korunur; account/service oluşturulmadı. TLS katmanının URL'yi görebilmesi tek başına
log sızıntısı kanıtı değildir; loglama bilinmiyor olması da gizlilik başarısı değildir.

C için kalan somut engel sağlayıcının uygulama öncesi edge/access/error/crash
yüzeylerine ait yazılı path/query kayıt, redaksiyon, retention ve erişim teyididir.
Sonra onaylı sentetik gerçek test gerekir; yalnız yazılı yanıt staging kabulü olmaz.
Koyeb güvenli gateway olarak seçilmedi. Kullanıcıdan iletişim/onay gelmeden destek
adına mesaj gönderilmez; alternatif token/Auth modeli açık karar olmadan uygulanmaz.

[Resmî fiyat SSS](https://www.koyeb.com/docs/faqs/pricing) ayrıca kart doğrulamada
29 USD geçici provizyon ve seçilen ücretli plana göre orantılı kayıt ücreti
belirtir; örneğinde kayıt planı Pro'dur. Dolayısıyla ücretsiz instance bulunması
hesap açmanın 0 maliyetli olduğunu kanıtlamaz. Bütçe 0 nedeniyle kayıt/ödeme adımı
başlatılmaz; ücretsiz Starter kayıt yolu ve olası provizyon ayrıca netleşmelidir.

Bu takipte yalnız belgeler güncellendi; uygulama/runtime testleri yeniden koşulmadı.
