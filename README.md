# FreelancerCRM

## v0.1.0

### Kapsam — alpha landing ve yönlendirilmiş ürün demosu

Kapsam, freelance yazılımcı ve tasarımcıların profesyonel teklif hazırlamasını,
bağlantı olarak paylaşmasını, yaklaşık görüntülenme sinyallerini izlemesini ve
takip mesajı taslağı üretmesini hedefleyen bir üründür.

Bu v0.1.0 arayüzü alpha uygulamasının temelidir; ilerleyen adımda `/app` altında
gerçek kayıt/giriş, auth, kalıcı veri ve Supabase ile çalışacaktır. Şu an `/demo`
rotasında açılan tanıtım modu yalnız sentetik veri kullanır ve demo değişikliklerini
kalıcı tarayıcı verisine yazmaz.

## Landing sayfası

Ana rota (`/`), alpha değer önerisini, 149/249 TL fiyat
varyantını ve tarayıcıda çalışan bekleme listesi durumlarını gösterir. E-posta,
isteğe bağlı persona ve açık iletişim izni dışında veri istenmez. Mevcut
yönlendirilmiş ürün tanıtımı `/demo` rotasındadır. Landing formu production
bekleme listesine bağlı değildir; demo kaydı yalnız aynı tarayıcıda tutulur ve
gerçek erken erişim başvurusu sayılmaz. Kaynak, fiyat varyantı ve CTA demo
eventleri de doğrulama amacıyla tarayıcıda en fazla son 100 kayıt olarak saklanır.

## Ürün demosunda bulunan akışlar

- Genel bakıştan başlayan dört adımlı yönlendirilmiş ürün turu
- Dashboard, teklif listesi, arama ve durum filtreleri
- Dört adımlı teklif oluşturucu
- Düzenlenebilir ve seçmeli AI teklif taslağı simülasyonu
- Hizmet kalemleri ve anlık fiyat toplamı
- Teklif önizleme, yayınlama ve paylaşım bağlantısı
- Hesapsız müşteri teklif görünümü
- Kabul, ret ve müşteri mesajı akışı
- İlk, son ve toplam yaklaşık görüntülenme sinyalleri
- Senaryo ve ton seçilebilen takip mesajı taslağı
- Teklif çoğaltma ve bağlantı erişimini iptal etme
- Masaüstü ve mobil uyumlu arayüz

## Bilinçli kapsam sınırı

Mevcut demo gerçek auth, sunucu veritabanı, RLS, AI sağlayıcısı, ödeme,
e-posta/WhatsApp gönderimi, PDF, CRM veya cihazlar arası kalıcı veri içermez.
Demo içindeki değişiklikler yalnız açık oturumda tutulur ve sayfa yenilendiğinde sıfırlanır.
Güvenli token, idempotency,
rate-limit, tracking ve müşteri yanıtları yalnız ürün davranışını göstermek
amacıyla simüle edilir; production güvenlik kontrolü sayılmaz.

## Çalıştırma

Node.js 22.13.0 veya üzeri ile:

~~~bash
npm run install-all
npm run dev
~~~

Production çalıştırması:

~~~bash
npm run build
npm run start
~~~

Kalite kontrolleri:

~~~bash
npm test
npm run lint
npm run typecheck
~~~

Secret taraması için Gitleaks `8.30.1` kurulu olmalıdır. Aynı tarayıcı ve
varsayılan kurallarla önce geçici, kullanılmayan sentetik anahtar self-test'i,
ardından Git'e girebilecek mevcut dosyalar ve tüm yerel Git geçmişi taranır:

~~~bash
npm run secrets:self-test
npm run secrets:scan
~~~

PR'da `secret-scan` kontrolü aynı sırayı çalıştırır. Workflow yalnız okuma
izniyle çalışır; production anahtarı, PR yorumu veya bulgu artefaktı kullanmaz.
Bulgu çıktısı anahtar değerini içermez, yalnız dosya/satır/kuralı gösterir;
ham tarama raporları geçici dizinde tutulup silinir. İstisnalar gerekirse
yalnız doğrulanmış sahte pozitife dar kapsamda eklenir; `.env` dosyaları için
genel istisna yoktur. Git'in yok saydığı kişisel dosyalar PR kapsamına girmez.
Public GitHub deposunda `main` için `secret-scan` job'ı gerekli status check
olarak ayarlıdır; GitHub Actions kaynağına bağlıdır ve yönetici için de
uygulanır. Geçici PR ile başarısız check'in birleşmeyi engellediği, temiz
güncellemeden sonra PR'ın tekrar birleşebilir olduğu doğrulandı.

TASK-001 temelinin temiz kurulumdan development ve production smoke testlerine
kadar tam kabul kontrolü:

~~~bash
npm run validate:task-001
~~~

Bu komut `npm ci`, lint, strict type-check, iki production build, tüm testler,
tarayıcı bundle'ında server/secret sızıntısı kontrolü ve hem `/` hem `/demo` için
development/production HTTP 200 smoke kontrollerini sırasıyla çalıştırır.

TASK-002 UI, form ve erişilebilirlik temelinin tek komutluk kabul kontrolü:

~~~bash
npm run validate:task-002
~~~

Bu komut üretilmiş Next.js çıktısını temizleyip sırasıyla lint, strict type-check,
Vitest unit/integration testleri, Webpack production build, mevcut `node:test`
sınır/render testleri ve tek Playwright koşusunda klavye, focus, responsive,
reduced-motion ile axe WCAG A/AA kontrollerini çalıştırır. `npm test` mevcut
`node:test` akışını bağımsız olarak çalıştırmaya devam eder; `test:unit`,
`test:e2e` ve `test:a11y` komutları da ayrı kullanım için korunur.

Tema altyapısı sistem tercihini varsayılan kabul eder ve kullanıcının açık
`light`/`dark` seçimini `kapsam-theme` anahtarında saklar. Semantic tokenlar,
tipografi rolleri ve temel kontrol ölçüleri için normatif kaynak
[DESIGN.md](./DESIGN.md) dosyasıdır.

Kök `install-all` komutu, `apps/web/package-lock.json` dosyasını normatif kabul
ederek temiz ve tekrar üretilebilir `npm ci` kurulumu yapar. Repoda ikinci bir
paket yöneticisi lockfile'ı tutulmaz.

Uygulama kodu `apps/web/` klasöründedir. Landing yüzeyi
`components/marketing/landing-page.tsx` ve `components/marketing/landing-page.css`;
demo girişi `components/demo/demo-app.tsx`, paylaşılan sentetik ürün arayüzü ise
`components/demo/prototype-app.tsx` ve `app/globals.css` dosyalarındadır.

## Yerel Supabase

Docker Desktop arka planda açıkken proje kökünden:

~~~bash
npm run db:start
npm run db:status
npm run db:stop
~~~

`db:start`, projede sabitlenmiş CLI sürümünü ve `freelancercrm-local` Docker
ağını kullanır. Bu makinedeki Docker Desktop, ağın localhost varsayılanını
uygulamadığı için yalnız Supabase alt süreçlerine özel Docker adaptörü portları
açıkça `127.0.0.1` adresine bağlar. Global Docker ayarları değişmez. Başlatma
sonunda gerçek port bağları kontrol edilir; dış arayüz tespit edilirse servisler
veriler korunarak durdurulur. Bu korumayı atlamamak için doğrudan `supabase start`
yerine kök komutlarını kullanın.

`db:reset` **yerel verileri silip veritabanını yeniden kurar**; `db:types` ise
TypeScript veritabanı tiplerini standart çıktıya üretir. İkisi de aynı proje ağı
ve adaptörünü kullanır; uzak veritabanı seçenekleri kabul edilmez. Yerel
`seed.sql` yalnız kurgusal test kayıtları içerir. `db:status` çıktısını paylaşırken
anahtarları gizleyin.

`npm run db:setup-app-env`, yalnız yerel Supabase çalışırken
`apps/web/.env.local` dosyasını oluşturur; var olan dosyayı değiştirmez.
`NEXT_PUBLIC_SUPABASE_URL` ve `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` tarayıcıda
görünür. `SUPABASE_SERVICE_ROLE_KEY` ve `SHARE_HMAC_KEY_V1` yalnız sunucuda
kalmalıdır. Browser/server client'ları eksik veya geçersiz public env değerinde
hata verir; korumalı rotaların proxy'si env eksikken sessizce geçiş yapmaz.
Yerel ortam dışında HTTP Supabase URL kabul edilmez.

### Uygulama ortamı–proje eşlemesi

| Çalışma yeri | `NEXT_PUBLIC_APP_ENV` | İzin verilen Supabase |
|---|---|---|
| Yerel geliştirme | `local` | Yalnız `localhost` / `127.0.0.1` |
| PR kalite testleri | `ci` | CI'ın bağımsız geçici yerel Supabase'i |
| Preview / staging | `preview` / `staging` | `https://pbqgjfzylnhaiadlpvkq.supabase.co` |
| Production | `production` | `https://ammrkpwfznlcbdyrqlkn.supabase.co` |

Her deployment'a kendi URL/public anahtarı ve gerekiyorsa sunucu anahtarı
verilir. Bulutta ortam seçicisi zorunludur. Eski yerel `.env.local` dosyaları
korunur; seçici yoksa yalnız loopback URL yerel kabul edilir.
`NODE_ENV=production` deployment seçicisi değildir: yerel/CI production
build'i bulut production projesine yönlendirilmez.

Browser, server ve Auth proxy istemciyi oluşturmadan önce aynı URL/public-key
eşlemesini doğrular. URL'de kullanıcı bilgisi, path, query ve fragment
reddedilir. CI sunucusu, seçici değiştirilse de uzak proje kabul etmez.
Bu kontrol ağ isteğiyle proje keşfetmez.

Uzak public anahtarlar salt-okunur proje bilgisinden alınan güncel
`sb_publishable_` değerleriyle eşleştirilir; yalnız bu public değerler
`apps/web/lib/shared/supabase-projects.ts` içinde bulunur. Key rotation sonrası
liste doğrulanmış yeni public değerlerle güncellenmeli ve uygulama yeniden
build edilmelidir. Uzak legacy anon anahtar yerine publishable anahtar kullanılır.
Sunucu anahtarı bu dosyaya veya `NEXT_PUBLIC_*` değişkenlerine konulmaz.
Gitleaks'in genel API-key kuralının bu iki doğrulanmış public değerdeki
sahte pozitifleri yalnız ilgili iki satırdaki açıklamalı istisnayla ayrılır;
klasör/env dosyaları veya secret kuralları topluca dışlanmaz.

`SUPABASE_SERVICE_ROLE_KEY` mevcut sunucu değişkeninin adıdır; legacy
`service_role` veya yeni `sb_secret_` değeri alabilir. Legacy anahtarın
role/proje claim'i kontrol edilir; bu imza doğrulaması değildir, gerçek
yetkilendirmeyi Supabase yapar. Opak secret için sunucuda ayrıca
`SUPABASE_SERVER_KEY_BINDING=<proje-ref>:<anahtarın SHA-256 hex özeti>`
gerekir (local için ref `local`). Bu bağ hedef projenin doğrulanmış anahtarından
bağımsız provisioning sırasında hazırlanmalı; çalışma anında verilen herhangi
bir anahtardan otomatik türetilmemelidir. Eksik/uyuşmayan bağda admin istemcisi
oluşturulmaz. Anahtar veya özeti loglanmamalı, secret değerleri sohbet/git'e
konulmamalıdır. Bu aşamada uzak sunucu anahtarı alınmadı veya deployment
değişkeni kurulmadı; Vercel dağıtımında bu değerler ortam kapsamında sağlanacak.

2026-10-09 kullanıcı onayıyla iki uzak Supabase projesi hedeflenir:
preview ve staging ortak test projesini, production ayrı projeyi kullanır.
Preview/staging DB, Auth ve Storage kaynaklarını paylaşır; birbirinden izole
değildir. Ortak proje yalnız sentetik veri içerir; production verisi ve sunucu
secret'ları test ortamına taşınmaz. Ortak test migration dağıtımları kontrollü
ve sıralı yapılır. PR kalite CI'sı bağımsız geçici yerel DB kullanmaya devam eder;
production'a otomatik migration uygulanmaz.

`.env.local` buluta kopyalanmamalıdır. Production ile ortak test projesinin
public URL/key ve sunucu secret'ları ayrı tutulur; deployment kurulduğunda
platformun ortam ayarlarına uygun kapsamla eklenir. Vercel kurulumu ve gerçek
ürün yayını bu aşamada ertelenir.

Kullanıcı mevcut FreelancerCRM bulut projesinde yalnız deneme verileri
olduğunu bildirdi; bu bildirim sıfırlama veya veri silme onayı değildir.
2026-10-09'da kullanıcı tarafından verilen referanslarla doğrudan erişim
doğrulandı. `FreelancerCRM` organizasyonu (`xyyupigqexfdjtqcvmgs`) Free
plandadır; yeni test projesi aylık 0 maliyet teyidiyle aynı organizasyonda
oluşturuldu. İki proje de Frankfurt (`eu-central-1`) bölgesindedir.

| Rol | Proje | Referans |
|---|---|---|
| Production için ayrılmış; henüz yayın yok | FreelancerCRM | `ammrkpwfznlcbdyrqlkn` |
| Ortak preview/staging | FreelancerCRM-test | `pbqgjfzylnhaiadlpvkq` |

Her iki projede salt-okunur SQL bağlantısı geçti; public iş tablosu ve Auth
kullanıcı sayısı 0, güvenlik advisor bulgusu yok. Mevcut projeye migration,
seed veya reset uygulanmadı. Bu kontroller uygulama env eşlemesi, Auth
callback ayarları veya uçtan uca production–test izolasyonu yerine geçmez.
Yerel uygulama env dosyaları değiştirilmedi, sunucu anahtarları alınmadı
ve projeler CLI üzerinden bu depoya bağlanmadı. TASK-003 kalan ortam/config
ve uçtan uca bağlantı/izolasyon kontrolleri geçene kadar kısmi kalır.

Adaptör testleri: `npm run test:local-db-tools`. Adaptör, CLI `2.116.0` komut
biçimi için testlidir; CLI yükseltilirken testler ve gerçek port bağları tekrar
kontrol edilmelidir. Desteklenmeyen Docker seçenekleri sessizce geçirilmez.

## CI ve kalite kapıları

`CI` workflow'u `main` hedefli her PR'da ve `main` push'larında çalışır.
Her iş yeni `ubuntu-24.04` runner'ında, Node `22.23.3` ile başlar;
`npm run ci:clean` yerel env, eski bağımlılık ve build çıktısı olmadığını
doğrular. Ardından tek normatif lockfile ile `npm ci --prefix apps/web`
çalışır ve lockfile'ın değişmediği kontrol edilir. `node_modules` veya
`.next` çıktısı işler arasında taşınmaz.

| Check | Kapsam | Kökten yerel komutlar |
| --- | --- | --- |
| `quality` | Workflow/politika doğrulaması, format, lint, temiz Next.js tip üretimi, strict TypeScript, Vitest, Docker adaptörü, production build, node:test ve rendered HTML | `npm run ci:validate`, `npm run test:ci`, `npm run format:check`, `npm run lint`, `npm run typecheck`, `npm run test:unit`, `npm run build`, `npm run test:integration` |
| `browser` | Production sunucuda Chromium tam E2E/axe matrisi; Firefox ve WebKit kritik light/dark smoke | `CI=true PLAYWRIGHT_SERVER_MODE=production npm run test:browser` (önce `npm run build`) |
| `database` | Yeni yerel Postgres, tüm migration'lar, iki kurgusal kullanıcılı seed, SQL/RLS izolasyonu, yarış testleri, security advisor, kaynak temizliği | CI: `npm run ci:db`; mevcut yerel geliştirme: `npm run test:db` |
| `production-audit` | Production high/critical bulguları engeller | `npm run audit:production` |
| `dependency-report` | Development dahil tam bağımlılık ağacını ayrı iş özeti olarak raporlar | `npm run audit:all` |
| `secret-scan` | Gitleaks self-test, mevcut dosyalar ve Git geçmişi | `npm run secrets:self-test`, `npm run secrets:scan` |

İlk kurulum: `npm run install-all`. Tarayıcı kurulumu:
`cd apps/web && npx --no-install playwright install --with-deps chromium firefox webkit`.
Format düzeltmesi: `npm run format`. Prettier `3.9.9` kaynak kodu,
JSON/CSS ve workflow dosyalarını kapsar; üretilmiş çıktılar, lockfile'lar
ve elle yönetilen Markdown belgeleri kapsam dışıdır. `plan.md` normatif
kabul kriterlerini korur. SQL, Supabase migration/DB kapısında doğrulanır.

DB CI komutu yalnız GitHub-hosted Linux runner'ında çalışır. Önceden var
olan proje container/volume/network'ünü ve uygulama/uzak DB env değerlerini
reddeder; oluşturduğu kaynakları kendi run kimliğiyle işaretler. Temiz DB'de
`db reset --local` migration ve seed'i baştan uygular; ikinci migration
uygulaması no-op olarak doğrulanır. Testlerin sonunda ve workflow'un
`always()` adımında yalnız bu run'ın kaynakları `stop --no-backup` ile silinir.
Kişisel yerel DB bu komutun hedefi değildir. Mevcut verili yerel DB'ye reset
uygulamadan önce içeriği kontrol edip kullanıcı onayı alınmalıdır.

Workflow ve bütün işler `contents: read` ile çalışır; checkout credentials
kalıcı tutulmaz. Action'lar tam commit SHA'sına, actionlint `1.7.12`
SHA-256 doğrulamasına sabitlenmiştir. CI production anahtarı veya verisi
almaz. Ham Supabase çıktısı ve audit JSON'u loglanmaz; audit özeti yalnız
paket/severity bilgisi içerir. CI'da trace, video ve screenshot kapalıdır;
test/DB/env dosyaları artefakt olarak yüklenmez.

`main` için `secret-scan`, `quality`, `browser`, `database` ve
`production-audit` GitHub Actions kaynaklı required check'lerdir. Kural
yöneticiye de uygulanır ve dalın güncel olması gerekir. Check adları
değişirse GitHub branch protection ayarı da güncellenmelidir.
`dependency-report` bulguları ayrıca raporlar; high/critical production
bulgusu `production-audit` üzerinden engellenir. Audit servisine erişim
veya rapor doğrulama hatası ilgili işi başarısız yapar.

Kırmızı check için aynı satırdaki yerel komutu çalıştırın. Typecheck Next.js
tiplerini kendisi üretir; integration testleri build'den sonra çalışır.
Tarayıcı hatasında önce browser kurulumunu ve production sunucuyu kontrol
edin; yerelde `CI` olmadan mevcut screenshot/trace desteği kullanılabilir.
DB hatası için geçici runner'da migration/seed/test aşamasını ve varsa
güvenli SQLSTATE kodunu kontrol edin; ham CLI çıktısı loglanmaz.
production'a bağlanarak veya mevcut yerel verileri silerek hata gidermeyin.
Audit bulgusunda ilgili paketi/lockfile'ı kontrollü güncelleyin ve testleri
yeniden çalıştırın; `npm audit fix --force` kullanılmaz.

Maintainer kabul kontrolü: `npm run ci:evidence -- <CI-run-id> <secret-run-id>`.
Bu salt-okunur komut tamamlanmış işlerin loglarını geçici dizinde Gitleaks
ile tarar, artefakt olmadığını ve `main` required check/yönetici kuralını
doğrular. Ham loglar ve rapor işlem sonunda silinir; değerler ekrana basılmaz.

Kabul kanıtı: [PR #6](https://github.com/cagankerem/FreelancerCRM/pull/6)
üzerinde kasıtlı format, E2E, migration ve production bağımlılık hataları
ilgili dört check'i başarısız ve PR'ı `BLOCKED` yaptı
([negatif çalışma](https://github.com/cagankerem/FreelancerCRM/actions/runs/37616249854)).
Hatalar geri alınınca aynı PR'da bütün check'ler geçti ve durum `CLEAN` oldu
([pozitif çalışma](https://github.com/cagankerem/FreelancerCRM/actions/runs/37617485109)).
Test PR'ı birleştirilmez; kasıtlı girdiler ürün dalına taşınmaz.

## Mimari

Yerel şema, migration sırası, dar yetkili DB işlemleri ve test komutları:
[Supabase veritabanı temeli](./supabase/README.md).

Uygulama dizinleri, Server/Client Component sınırı, secret import kuralları,
`/demo` ile gelecekteki gerçek `/app` ayrımı ve TASK-003 Supabase yerleşimi
[ARCHITECTURE.md](./ARCHITECTURE.md) içinde tanımlanır.
