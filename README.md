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
ve adaptörünü kullanır; uzak veritabanı seçenekleri kabul edilmez. `seed.sql`
henüz oluşturulmadığından seeding kapalıdır. `db:status` çıktısını paylaşırken
anahtarları gizleyin.

Adaptör testleri: `npm run test:local-db-tools`. Adaptör, CLI `2.116.0` komut
biçimi için testlidir; CLI yükseltilirken testler ve gerçek port bağları tekrar
kontrol edilmelidir. Desteklenmeyen Docker seçenekleri sessizce geçirilmez.

## Mimari

Uygulama dizinleri, Server/Client Component sınırı, secret import kuralları,
`/demo` ile gelecekteki gerçek `/app` ayrımı ve TASK-003 Supabase yerleşimi
[ARCHITECTURE.md](./ARCHITECTURE.md) içinde tanımlanır.
