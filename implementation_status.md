# Implementation Status

Normatif kaynak: [plan.md](./plan.md)  
Son güncelleme: 2026-10-09

## Takip Sistemi

- `[ ]` tamamlanmadı
- `[x]` tamamlandı
- Tamamlanmamış görevlerin sonuna gerektiğinde `— Devam ediyor`, `— Kısmi` veya `— Bloke` eklenir.
- Anlamlı bir gelişme olduğunda görevin altına tarihli tek satır yazılır.
- Kabul kriterleri burada tekrarlanmaz; `plan.md` içinde tutulur.

## Kullanıcının İstediği Proje Araçları

- 2026-10-09: `asd-ste100` v0.4.0 skill'i `.agents/skills/asd-ste100` altına [upstream commit](https://github.com/danyuchn/asd-ste100-skill/commit/32511c6992ecb5f1971e46a2943f2e6adceedafe) üzerinden eklendi; yedi dosyanın Git blob hash'i kaynakla eşleşti. Mac'in aktif Homebrew `python3` sürümü 3.14.5'ten Python.org ve Homebrew'da doğrulanan güncel kararlı 3.14.8'e yükseltildi. Linter `--selftest`, temiz stdin ve iki beklenen bulgulu negatif fixture kontrolleri yeni Python ile geçti; pip ve SSL import'u doğrulandı. Bu kullanıcı talebi TASK kabul durumlarını değiştirmez.

## Faz 1A: Proje Temeli

- [x] TASK-001: Next.js ve strict TypeScript temelini kur
  - 2026-08-06: Next.js, React ve strict TypeScript mevcut; production runtime ve server/client sınırları kesinleşmedi.
  - 2026-08-11: Native Next.js dev/production runtime, kök komutları ve rota smoke testleri tamamlandı; Vinext/Cloudflare/Sites/Vite/Wrangler ile boş D1/SQLite-Drizzle iskeleti kaldırıldı, server-only guard ve bundle sınırı testi eksik.
  - 2026-08-17: Server/client/shared import kuralları dokümante edilip otomatik import-grafiği ve negatif Next.js build testiyle zorunlu kılındı; dev/production build, root smoke, lint ve strict typecheck geçti.
  - 2026-08-20: Next.js ve eslint-config-next 16.3.1’e yükseltildi; lint, typecheck, production build, 8 test ve production/tam bağımlılık auditleri geçti.
  - 2026-08-20: Tek normatif `apps/web/package-lock.json`, kökten temiz `npm ci`, standart Next.js tipleri ve gerekçeli type-boundary politikası otomatik foundation testleriyle doğrulandı; tarayıcı/DOM sınırlarındaki doğrulanmamış type assertion’lar runtime daraltmayla kaldırıldı.
  - 2026-08-20: TASK-001 için temiz kurulum, lint, strict typecheck, tekrarlı production build, tam test seti, browser bundle sızıntı kontrolü ve `/` ile `/demo` development/production smoke kontrollerini birleştiren tek komutluk kabul seti eklendi.
  - 2026-08-20: Kök mimari belgesi; dizin yapısı, Server/Client Component ve secret sınırları, sentetik `/demo` ile ayrı geliştirilecek production `/app` ayrımı, çalışma komutları ve TASK-003 Supabase yerleşimiyle tamamlandı.
- [x] TASK-002: Tailwind, shadcn ve form temelini kur
  - 2026-08-06: Tailwind ve temel UI bileşenleri mevcut; React Hook Form, Zod ve ortak form altyapısı eksik.
  - 2026-08-20: shadcn 4.18.0 tam sürümle devDependency olarak sabitlendi ve tema CSS’inin production build’de çözüldüğü doğrulandı; form altyapısı hâlâ eksik.
  - 2026-08-21: Vitest/jsdom/Testing Library ve Playwright/axe bağımlılıkları exact devDependency olarak sabitlendi; ayrı unit, E2E ve a11y komutları ile smoke testleri eklendi, mevcut node:test seti korundu; a11y kapısı etiketsiz checkbox ve iki kontrast ihlalini açıkça yakalıyor.
  - 2026-08-21: Landing bekleme listesi RHF/Zod örnek entegrasyonuna dönüştürüldü; sürümlü localStorage adaptörü, güvenli hata sonuçları, ilk hatalı alana odak, ARIA hata bağlantıları ve erişilebilir checkbox tamamlandı; 15 unit/integration, 3 E2E ve axe WCAG A/AA testi geçti.
  - 2026-08-25: Loading, empty ve güvenli error durum bileşenleri App Router sınırlarına bağlandı; retry, teknik hata gizliliği, gerçek 404/noindex ve 404 axe kapsamı eklendi, 24 unit/integration, 12 node:test ve 6 tarayıcı testi ile production build geçti.
  - 2026-09-02: Form hata/live-region sözleşmeleri, 320/375/768/1440 px taşma ve mobil tek sütun kontrolleri, Tab/Space/Enter akışı, 3 px focus görünürlüğü, reduced-motion ve sticky menüden bağımsız form anchor’ı doğrulandı; mobil/masaüstü görsel kontrast incelemesiyle birlikte 26 unit/integration, 12 node:test ve 12 Playwright/axe testi, lint, strict typecheck ve production build geçti.
  - 2026-09-02: Manrope/Sora rolleri, açık/koyu semantic tokenlar, kalıcı sistem-tema sağlayıcısı, izole demo paleti ve 42/52/48 px temel kontrol ölçüleri tamamlandı; `validate:task-002` ile 29 unit/integration, 12 node:test ve 15 Playwright/axe testi, lint, strict typecheck ve production build tek komutta geçti.
  - 2026-09-04: Light/dark form ve UI durum matrisi, 32 Chromium tam kapsam testi ile Firefox ve WebKit için dörder kritik smoke testi tamamlandı; 31 unit/integration, 18 node:test ve 40 Playwright/axe testi `validate:task-002` içinde geçti. Axe, ARIA, klavye, focus ve tarayıcı matrisi erişilebilirlik kabulünü tamamlıyor; VoiceOver bu görev için eksik veya bloke sayılmıyor, App Store/pazarlamada destek beyanına dayanak oluşturmuyor ve gelecekteki native yayın için ayrı kalite çalışması olarak ele alınacak.
  - 2026-09-04: Manrope `200–800` ve Sora `100–800` variable font eksenleriyle yüklenerek landing’deki ara ağırlıkların en yakın statik yüze yuvarlanması kaldırıldı; kaynak sözleşme testi eklendi ve 20 node:test içeren `validate:task-002` kabul seti yeniden geçti.
  - 2026-09-04: `shadcn@4.18.0` korunarak transitive `browserslist`, `fast-uri` ve `qs` güvenli sürümlere kilitlendi; production ve tam bağımlılık auditleri sıfır bulguyla geçti.
- [ ] TASK-003: Supabase, ortam ve local geliştirmeyi yapılandır — Kısmi
  - 2026-10-10: PR #8'in CI koşusu 37999446531 tüm kalite/Workers/tarayıcı/migration/seed/DB/production-audit kapılarını geçti; altıncı gerekli check workers-runtime mevcut beş kontrol ve yönetici zorunluluğu korunarak eklendi, negatif koşu 37999942035'te yalnız Workers başarısızken PR BLOCKED oldu; CI log secret taraması temiz ve artefakt sayısı 0; HTTPS staging sentetik giriş/çerez/ürün/RLS/refresh/çıkış testleri ve temizlik geçti; e-posta doğrulaması kullanıcı isteğiyle ertelendi, preview otomasyonu henüz yok, PR birleştirilmedi ve production değiştirilmedi.
  - 2026-10-10: Kontrollü vinext/Workers adaptörü, test-only izole staging build/yayını, 8 uzak test migration’ı ve RLS/advisor kontrolü, kesin HTTPS Auth Site URL/callback ve bağımsız yerel Workers CI kapısı kuruldu; gerçek e-posta doğrulama callback testi kullanıcı isteğiyle ertelendi, preview ve CI kabul kanıtı henüz tamamlanmadı; production değiştirilmedi.
  - 2026-09-15: Local config'te explicit Data API grant, HTTP Auth callback/reset allowlist, en az 8 karakter + harf/rakam politikası uygulandı; S3/vector/pgdelta ve seed oluşturulana kadar seeding kapatıldı. Parola negatif testleri ve onaylı local reset sonrası tablo izin testi geçti; localhost Docker ağına rağmen host port bağları tüm arayüzlerde kaldığından başlatma kontrolü servisleri verileri korunarak durdurdu. Ağ sorunu açık; seed.sql sonraki adım.
  - 2026-09-15: Docker Desktop'ın ağ varsayılanını uygulamaması, yalnız projeye ait Supabase alt süreçlerinde açık 127.0.0.1 port bağı kullanan adaptörle çözüldü; başlatma, tekrar başlatma ve onaylı boş local reset sonrası beş yayınlanan port localhost olarak doğrulandı, otomatik tablo izinleri kapalı kaldı ve 5 adaptör testi geçti. Seed.sql henüz oluşturulmadı; sonraki adım.
  - 2026-09-23: Migration/seed öncesi ürün kararları plan.md'ye işlendi: Free eşzamanlı 3 aktif teklif ve AI kapalı; Pro yayın sonrası yetkiler; değişmez kabul/ret ve yanıtlanan içerik; alan bazlı metin sınırları ve önce kalem yuvarlama. Abonelik fiyatı ertelendi, teklif TRY/USD/EUR desteği korundu; bu adımda migration/seed veya veri silme yapılmadı.
  - 2026-09-26: CLI ile oluşturulan 3 migration ve 8 iş tablosu, her reset öncesi boşluğu doğrulanan local DB'de baştan uygulandı; 82 SQL ve 9 eşzamanlılık/yaşam döngüsü testi, security advisor ve tip üretimi geçti. Seed henüz yok; seeding kapalı, ortam/client entegrasyonu tamamlanmış sayılmıyor.
  - 2026-09-26: Yalnız boşluğu kontrol edilen local DB'ye iki kurgusal Auth kullanıcısı/profil/müşteri/taslak içeren seed uygulandı; seeding açıldı, gizli local uygulama env dosyası üretildi ve her iki seed hesabının girişi doğrulandı. Eski gelişme satırları tarihsel kayıt olarak korunuyor.
  - 2026-09-26: Görev sırasına dönülerek typed public env doğrulaması, browser client ve korumalı rota proxy'sinde eksik env için fail-fast eklendi; 5 env testi, lint ve typecheck geçti. Uzak ortamların gerçek izolasyonu ve otomatik secret taraması doğrulanmadığı için görev kısmi.
  - 2026-09-28: Kullanıcı kararıyla preview, staging ve production Supabase projeleri yayına çıkış aşamasına ertelendi; yerel ortam ve ayrım kuralları hazırlanacak. Gerçek uzak ortam izolasyonu doğrulanmadığından TASK-003 kısmi kalır; otomatik secret taraması da açıktır.
  - 2026-09-28: Sabit Gitleaks 8.30.1 ile `secrets:self-test` geçici sentetik anahtarı yakaladı; `secrets:scan` 247 depo dosyasını ve Git geçmişini bulgusuz taradı. Uzak ortam izolasyonu ertelendiğinden görev kısmi kalır.
  - 2026-09-28: Public depoda `main` için gerekli `secret-scan` kontrolü yöneticiye de uygulanacak şekilde etkinleştirildi; PR negatif/pozitif testiyle birleşme kapısı doğrulandı. Uzak Supabase ortam izolasyonu ertelendiğinden görev kısmi kalır.
  - 2026-10-09: Kullanıcı ortak preview/staging test projesi + ayrı production olmak üzere iki uzak Supabase projesini onayladı; plan/README ortam kararı güncellendi. Mevcut FreelancerCRM'in yalnız deneme verisi içerdiği kullanıcı bildirimi, silme onayı sayılmadı; bağlı Supabase hesabında proje görünmediği için hedef organizasyon/proje referansı bekleniyor. Uzak kaynak veya veri değiştirilmedi; izolasyon/bağlantı kabulü henüz geçmedi.
  - 2026-10-09: Kullanıcının verdiği proje/organizasyon referanslarıyla erişim ve Free plan doğrulandı; Frankfurt'ta aylık 0 maliyet teyidiyle FreelancerCRM-test (pbqgjfzylnhaiadlpvkq) oluşturuldu, mevcut FreelancerCRM (ammrkpwfznlcbdyrqlkn) production için ayrıldı. Her ikisinde salt-okunur SQL bağlantısı geçti, public tablo/Auth kullanıcı sayısı 0 ve güvenlik advisor bulgusu yok; mevcut DB/env verileri değiştirilmedi. Uygulama env eşlemesi, Auth callback ve uçtan uca izolasyon/bağlantı testleri henüz tamamlanmadığından görev kısmi.
  - 2026-10-09: local/ci yalnız loopback, preview/staging FreelancerCRM-test ve production FreelancerCRM olacak şekilde istemci/proxy öncesi URL/public-key eşlemesi ve sunucu key kontrolü eklendi; mevcut local env korundu, CI seçicisi tanımlandı. 59 unit, 20 integration, 24 CI politika testi; format/lint/typecheck/build ve secret scan/self-test geçti. İki doğrulanmış public anahtarın Gitleaks sahte pozitifi yalnız ilgili satırlarda ayrıldı; plan.md, uzak Auth/DB ve deployment ayarları değiştirilmedi. Auth callback ve uzak uçtan uca izolasyon testleri beklediğinden görev kısmi.
- [x] TASK-004: Test ve CI kapılarını kur
  - 2026-08-06: Build ve temel rendered HTML testleri mevcut; CI, migration, unit, integration ve E2E kapıları eksik.
  - 2026-08-20: Production high/critical bulgularını engelleyen ve tam bağımlılık ağacını ayrıca raporlayan audit politikası plan.md’ye eklendi; kalıcı CI kapısı henüz uygulanmadı.
  - 2026-09-26: `test:db`, `db:check-empty`, `db:migrate`, `db:migrations` ve `db:advisors` local komutları eklendi; DB testleri mevcut verileri hedeflemiyor, CI bağlantısı henüz yok.
  - 2026-09-28: Kullanıcı TASK-003'ün bulut ortamı izolasyonu ertelendiği için kısmi kalmasına rağmen TASK-004'e geçiş istisnasını onayladı. İlk CI işi TASK-003'te açık otomatik secret taramasını da doğrulayacak; TASK-005'e geçiş izni verilmedi.
  - 2026-09-28: PR için salt-okunur, SHA ile sabitlenmiş action'lı `secret-scan` workflow'u eklendi; yerel self-test ve çalışma ağacı/geçmiş taraması geçti. Gerçek PR sonucu ve GitHub Pro gerekli status check/merge engeli henüz doğrulanmadı.
  - 2026-09-28: PR #2'de `secret-scan` geçti; yalnız sentetik anahtar içeren geçici PR #3'te aynı check başarısız oldu. Test PR'ı kapatılıp dalı silindi, yerel tarama yeniden temiz geçti. GitHub Pro henüz etkin olmadığından required check ve fiili merge engeli doğrulanmadı.
  - 2026-09-28: Depo kullanıcı kararıyla public yapıldı; `main` dalında GitHub Actions kaynaklı `secret-scan` required check'i ve yöneticiye uygulama etkin. Geçici PR #4 sentetik bulguyla `FAILURE`/`BLOCKED`, girdi geçmişten çıkarılınca `SUCCESS`/`CLEAN` oldu; PR birleşmeden kapatılıp dalı silindi. Diğer TASK-004 CI kapıları henüz eksik.
  - 2026-10-07: Temiz npm kurulum, Prettier, lint/typegen/typecheck, unit/integration/build, production tarayıcı, geçici local DB ve audit işleri eklendi. Yerelde 36 Vitest, 20 node:test, 24 CI politika ve 40 tarayıcı testi geçti; production audit sıfır, tam audit geliştirme ağacında 8 high bulgu raporluyor. Gerçek PR ve yeni required check negatif/pozitif kabulü sürüyor.
  - 2026-10-07: PR #5 CI kapıları geçti; geçici PR #6 format/E2E/migration/production audit hatalarıyla FAILURE/BLOCKED, hatalar kaldırılınca tüm kontroller SUCCESS/CLEAN oldu. Beş required check yöneticiye de uygulanıyor; 8 migration, sentetik seed, 82 SQL ve 9 eşzamanlılık testi ile kaynak temizliği doğrulandı. Salt-okunur/SHA sabitli CI, log secret taraması, sıfır artefakt ve README komutları doğrulandı; production audit 0, development ağacındaki 8 high ayrıca raporlanıyor.
  - 2026-10-08: Development güvenlik giderimi bloke: 8 high paketin kökü [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm), braces <=3.0.3 için yayımlanmış yama yok; güncel Next ESLint/shadcn aynı zinciri taşıyor, shadcn CSS build'de kullanılıyor. Manifest/lockfile/CI değişmedi; tam audit 8 high/0 critical, production 0, düşük seviye bulgu 0; npm ci, format/lint/typecheck/build, 36 unit/20 integration/24 CI politika/40 tarayıcı testi, workflow doğrulaması ve secret self-test/taraması geçti. Upstream yama veya ayrıca onaylanmış alternatif bağımlılık/yama bakımı kararı gerekiyor; bu güvenlik giderimi tamamlanmadı.
- [ ] TASK-005: Correlation ID ve güvenli logger kur

## Faz 1B: Auth ve Profil

- [ ] TASK-006: Kayıt, giriş ve çıkış akışlarını geliştir — Kısmi
  - 2026-09-26: SSR Auth kayıt/giriş/çıkış formları ve callback eklendi; seed girişleri ve sıfırdan kayıt tarayıcıda geçti. Çıkış ve güvenlik E2E matrisi henüz tamamlanmadı.
- [ ] TASK-007: Şifre sıfırlama, session ve korumalı rotaları geliştir — Kısmi
  - 2026-09-26: Next.js proxy ile cookie yenileme ve doğrulanmış claims altında app/onboarding guard eklendi; parola sıfırlama ve expiry/reuse testleri henüz yok.
- [x] TASK-008: Profil şeması ve RLS migration’ını oluştur
  - 2026-09-26: Profil şeması, Auth FK, alan/Unicode sınırları, owner RLS ve kolon izinleri oluşturuldu; SQL insert/read/update ve cross-user/anon negatifleri, temiz migration, lint ve typecheck doğrulandı; şema belgelendi. Auth ekranları bu işin dışında.
- [ ] TASK-009: Onboarding ve profil/marka UI’sini geliştir — Kısmi
  - 2026-09-26: Ad, meslek ve TRY/USD/EUR seçimiyle gerçek DB'ye profil kaydı tarayıcıda geçti; marka/logo ayarları henüz yok.
- [ ] TASK-010: Güvenli logo yüklemeyi geliştir

## Faz 1C: Teklif Veri Modeli

- [x] TASK-011: Clients migration ve RLS oluştur
  - 2026-09-26: Minimum müşteri şeması, owner CRUD/RLS, metin sınırları ve indexler tamamlandı; duplicate ad kabulü, kullanıcı izolasyonu ve müşteri silindiğinde teklif snapshot'ının korunması test edildi; şema belgelendi.
- [x] TASK-012: Proposal, section ve item migration’larını oluştur
  - 2026-09-26: Üç içerik tablosu, numeric kalem/toplam hesabı, currency/metin sınırları, kontrollü yayın alanları ve Free/Pro içerik koruması tamamlandı; temiz migration ve sınır/izolasyon testleri geçti; şema belgelendi.
- [ ] TASK-013: View, response, AI, subscription ve log migration’larını oluştur — Kısmi
  - 2026-09-26: View/response ve minimum subscription modeli eklendi; değişmez ilk karar, idempotency ve görüntülenme dedupe testleri geçti. AI, usage counter, activity log, webhook ve tam faturalama modeli henüz yok; Pro kota/fiyatı varsayılmadı.
- [ ] TASK-014: Tam RLS matrisi ve testlerini uygula — Kısmi
  - 2026-09-26: Mevcut 8 iş tablosunda RLS, dar kolon/RPC izinleri ve iki kullanıcı izolasyonu doğrulandı; security advisor temiz. Gelecekteki AI/webhook/log tablolarının aktör matrisi kapsam dışı kaldı.
- [ ] TASK-015: Minimum müşteri oluşturma/seçme işlemlerini geliştir — Kısmi
  - 2026-09-26: Auth altında minimal müşteri oluşturma/listesi ve teklif formunda seçim tarayıcıda geçti; çoklu teklif/negatif UI matrisi ve API belgesi tamamlanmadı.
- [ ] TASK-016: Teklif taslak CRUD işlemlerini geliştir — Kısmi
  - 2026-09-26: Atomik DB kayıt/güncelleme ve taslak silme fonksiyonları, owner kontrolü ve optimistic version eklendi; HTTP/server action ve uygulama bağlantısı henüz yok.
  - 2026-09-26: Taslak oluşturma action'ı, owner listesi/detayı ve kalem toplamı gerçek tarayıcıda doğrulandı; düzenleme/silme arayüzü henüz yok.
- [ ] TASK-017: Teklif durum makinesini uygula — Kısmi
  - 2026-09-26: DB seviyesinde yayın/iptal, Pro kilit/canlı/yeniden yayın, değişmez yanıt ve Free eşzamanlı kota yarışları test edildi; uygulama servisleri ve public güvenlik katmanı henüz yok.
  - 2026-09-26: Free sahibi için tarih seçimiyle server-side yayınlama ve HMAC paylaşım bağlantısı tarayıcıdan çalıştı; Pro sayısal kota hâlâ belirsiz olduğundan Pro yayını fail-closed.

## Faz 1D: Teklif Oluşturucu

- [ ] TASK-018: Tüm alanlı teklif formunu geliştir
- [ ] TASK-019: Hizmet kalemi ve fiyat özetini geliştir
- [ ] TASK-020: Taslak kaydetme ve düzenlemeyi tamamla
- [ ] TASK-021: Teklif çoğaltmayı geliştir
- [ ] TASK-022: Teklif önizlemesini geliştir

## Faz 1E: AI Teklif Üretimi

- [ ] TASK-023: AI sağlayıcı adaptörü ve promptları geliştir
- [ ] TASK-024: AI endpoint, Zod ve limitleri geliştir
- [ ] TASK-025: Düzenlenebilir AI paneli ve güvenli merge geliştir
- [ ] TASK-026: AI kota, maliyet, log ve fallback geliştir

## Faz 1F: Public Teklif Sayfası

- [ ] TASK-027: Yayınlama, token, iptal ve expiry işlemlerini geliştir — Kısmi
  - 2026-09-26: Free yayınlama action'ı, sürümlü HMAC verifier ve hash doğrulaması eklendi; iptal/rotasyon UI ve Pro kota kararı bekliyor.
- [ ] TASK-028: Public teklif resolver’ı geliştir — Kısmi
  - 2026-09-26: Selector + constant-time verifier denetimli read-only API, minimum DTO ve invalid/tamper 404 kontrolü geçti; rate limit ve diğer public mutation katmanı tamamlanmadı.
- [ ] TASK-029: Responsive public teklif sayfasını geliştir — Kısmi
  - 2026-09-26: Server render belge, toplam, vergi/fatura uyarısı ve noindex/no-referrer eklendi; responsive/a11y ve kabul/ret UI doğrulaması bekliyor.
- [ ] TASK-030: Kabul ve ret işlemlerini geliştir
- [ ] TASK-031: Public müşteri mesajını geliştir

## Faz 1G: Görüntülenme Takibi

- [ ] TASK-032: Görüntülenme event kaydını geliştir
- [ ] TASK-033: Görüntülenme özeti, geçmişi ve uyarıyı geliştir

## Faz 1H: Teklif Listesi ve Detay

- [ ] TASK-034: Teklif listesi, filtre ve sayfalamayı geliştir
- [ ] TASK-035: Teklif detayını ve sahip aksiyonlarını geliştir

## Faz 1I: AI Takip Mesajları

- [ ] TASK-036: AI takip mesajı backend’ini geliştir
- [ ] TASK-037: Takip mesajı düzenleme ve kopyalama UI’sini geliştir

## Faz 1J: Plan ve Ödeme Sistemi

- [ ] TASK-038: Entitlement ve kota servisini geliştir
- [ ] TASK-039: Dürüst fiyatlandırma ve plan UI’sini geliştir
- [ ] TASK-040: Ödeme adaptörü ve hosted checkout geliştir
- [ ] TASK-041: İmzalı ve idempotent ödeme webhook’unu geliştir
- [ ] TASK-042: Abonelik yaşam döngüsü ve downgrade geliştir

## Faz 1K: KVKK, Güvenlik ve Yayına Hazırlık

- [ ] TASK-043: Hukuki sayfaları ve takip/fatura bildirimlerini hazırla
- [ ] TASK-044: Analitik pipeline ve event sözlüğünü geliştir
- [ ] TASK-045: Hesap ve veri silmeyi geliştir — Kısmi
  - 2026-09-26: Auth Admin API ile yalnız smoke hesabı silinirken private trigger'ın proposals erişim izni hatası görüldü; geniş yetki değişiklikleri otomatik güvenlik incelemesinde reddedildi. Dar çözüm için kullanıcı onayı bekleniyor; test hesabı duruyor.
  - 2026-09-26: Kullanıcı onayıyla yalnız `private.guard_child` trigger'ı sahibi bağlamına alındı; Auth FK silme sırasında gereksiz kalem toplamı güncellemesi gerçek `current_user` kontrolüyle atlandı. Önceki smoke hesabı ve yeni test hesabı Auth Admin API ile silindi, bağlı kayıt kalmadı; tam ürün silme/saga akışı henüz yok.
- [ ] TASK-046: Rate limit ve güvenlik sertleştirmesini tamamla
- [ ] TASK-047: Hata sağlayıcısı, health, metric ve alarmları kur
- [ ] TASK-048: Performans ve erişilebilirliği tamamla
- [ ] TASK-049: Tam regression, RLS, güvenlik ve yük testini çalıştır
- [ ] TASK-050: Production deployment ve runbook’u tamamla

## Faz 2: Doğrulama Sonrası

- [ ] TASK-051: Faz 2 kanıt kapısını değerlendir
