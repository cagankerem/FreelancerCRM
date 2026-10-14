# FreelancerCRM

## GitHub'a değişiklik gönderme

`main` dalı altı GitHub Actions kontrolü gerektirir: `secret-scan`, `quality`,
`browser`, `database`, `production-audit` ve `workers-runtime`.
Bu kural yönetici hesabına da uygulanır.
`expected`, GitHub'ın ilgili commit için kontrol sonucunu beklediğini belirtir.
Önceki commitlerin başarılı kontrolleri yeni commit için yeterli değildir.

CI, `main` hedefli PR açıldığında çalışır.
`secret-scan` yalnız PR olayında çalışır.
Yeni bir commit'i doğrudan `main`e göndermek GH006 hatasına neden olur.
Reddedilen push, `main` üzerindeki CI sürecini başlatmaz.

Her yeni çalışma için şu sırayı kullanın:

1. Yerel Git kancasını bir kez kurun: `npm run git:setup`.
2. `main` dalına geçin: `git switch main`.
3. `main` dalını güncelleyin: `git pull --ff-only origin main`.
4. Çalışma dalı oluşturun: `git switch -c codex/degisiklik-adi`.
5. Değişiklikleri commit edin.
6. Çalışma dalını gönderin: `git push -u origin HEAD`.
7. PR açın: `gh pr create --base main --fill`.
8. Kontrolleri izleyin: `gh pr checks --watch`.
9. Altı gerekli kontrol geçince PR'ı GitHub üzerinden birleştirin.

`main` dalında henüz gönderilmemiş commit varsa önce çalışma dalı oluşturun.
Bu durumda yukarıdaki dördüncü adımdan başlayın.
Yeni dal mevcut commitleri korur.
GitHub dalın güncellenmesini isterse çalışma dalında `git fetch origin` çalıştırın.
Ardından `git merge origin/main` çalıştırın.
Çakışmaları çözün ve çalışma dalını tekrar gönderin.
Yeni commit için kontrolleri tekrar bekleyin.

Kanca, hedefi `main` olan push işlemlerini yerelde durdurur.
Kanca, başka bir dal üzerinden `HEAD:main` gönderimini de durdurur.
Her yeni clone için `npm run git:setup` komutunu tekrar çalıştırın.
Git kancasını atlayan araçlarda GitHub koruması uygulanmaya devam eder.
GitHub koruması kalıcı denetimdir.

## Onaylı PR preview otomasyonu

Her onaylı PR için ayrı `freelancercrm-pr-<PR>.cagankeremergun.workers.dev`
Worker'ı kullanılır; staging Worker'ı değiştirilmez. Ortak test Supabase'i
kullanılır; migration, seed veya reset uzak test DB üzerinde otomatik çalıştırılmaz.

`Approved Workers preview` workflow'u yalnız `main` referansından başlatılır.
Deploy girdileri `operation=deploy`, `pr_number` ve incelenmiş tam `pr_sha`dır.
PR aynı repoda, açık, draft olmayan ve main hedefli olmalı; aynı SHA üzerinde
altı gerekli kontrol başarılı olmalıdır. PR HEAD değişirse yeniden onay gerekir.
Platform secretsız build ayrı runner'da çalışır. Vinext'in ürettiği dahili
prerender sırrı nedeniyle server çıktısı düz artefakt olarak yüklenmez:
tar arşivi AES-256-GCM ile şifrelenir, tek kullanımlık AES anahtarı repo public
RSA anahtarıyla OAEP-SHA256 kullanılarak sarılır; yalnız `preview.enc` bir gün
saklanır. Private RSA anahtarı yalnız korumalı publish adımındadır; build'e
verilmez. Deploy runner'ı PR scriptlerini çalıştırmaz; trusted
main denetleyicisi artefaktı, PR SHA'sını ve kontrolleri tekrar doğrular.

`workers-preview` GitHub environment'ında cagankerem onayı, yalnız korumalı
branch'ler ve kapalı admin bypass uygulanır. Secret'lar yalnız publish adımına
verilir. Cloudflare token'ı seçili hesabın Workers Scripts Edit ve Account
Settings Read izinleriyle sınırlıdır; bu account kapsamı Worker başına izolasyon
sağlamaz, bu nedenle denetleyici sahiplik ve PR namespace kontrollerini uygular.
Supabase token'ı yalnız test projesi Auth Config Read/Write, API Keys/Secrets
Read ve kullanıcının açık onayıyla Project Settings Read/Write kapsamındadır;
Auth PATCH endpoint'i son iki write iznini birlikte gerektirir. Project Settings
izni test projesini silme/duraklatma yetkisi de içerdiğinden token yalnız bu
proje ve onaylı main denetleyicisiyle kullanılır; production/Database write
izni yoktur. Supabase token'ının bitişi
2026-11-12; o tarihten önce aynı dar kapsamla yenilenip GitHub secret'ı güncellenir.
`PREVIEW_ARTIFACT_PRIVATE_KEY` de aynı environment'da korunur. Şifre çözümünde
MAC/anahtar hatası, arşiv traversal/link/device veya config/SHA uyuşmazlığı
yayını durdurur; plaintext yalnız private geçici deploy klasöründe açılır ve
işlem sonunda kaldırılır. Anahtar rotasyonunda public PEM ve environment private
key eşleşmeli; eski şifreli artefaktı retry etmek yerine yeniden build alınmalıdır.

Site URL staging olarak kalır. Yalnız ilgili PR'ın kesin `/auth/callback` adresi
allowlist'e eklenir; wildcard kullanılmaz. HTTPS sentetik giriş, Secure/Lax çerez,
ürün/RLS/refresh/logout ve geçersiz callback kontrolleri yayın sonrası çalışır.
Gerçek e-posta teslimi/başarılı email callback kabulü ayrı insan destekli testtir.
Onaylı mevcut test hesabıyla `AUTH_TEST_ORIGIN` ve `AUTH_TEST_EMAIL` verilerek
`npm run test:auth:email:preview` çalıştırılır: tek magic-link e-postası gönderilir,
en yeni orijinal link aynı Chromium'da açılır; hesap/parola değiştirilmez ve
oluşan test oturumu sonunda sonlandırılır. Yeni e-posta için insan onayı gerekir.

PR kapanınca secretsız `Preview cleanup signal`, main'deki cleanup denetleyicisini
tetikler. Yalnız `pull_request_target: closed` olayı kullanılır; bu sinyalde
checkout, PR kodu, secret veya dinamik shell komutu yoktur. Böylece merge
conflict içeren kapalı PR'lar da temizlenebilir. Sabit workflow kimliği/yolu ve
sayısal run başlığı doğrulanır; GitHub API'sinden alınan kapalı, aynı-repo/main
PR'ın HEAD/ref'i sinyalle eşleşmelidir. API'nin HEAD metadata'sı çalıştırılan
main kodunun referansı olarak yorumlanmaz. Aynı korumalı environment nedeniyle
temizlik de onay bekleyebilir;
GitHub Actions'ta pending deployment incelenip onaylanmalıdır. Denetleyici kapalı
PR ve `PREVIEW_OWNER` binding eşleşmesiyle yalnız o Worker'ı siler ve kesin
callback'ini kaldırır; staging, diğer preview'lar ve DB kayıtlarına dokunmaz.
Gerekirse main'den `operation=cleanup` ve kapalı `pr_number` ile tekrar çalıştırılır.
Başarısız yayın otomatik başarılı kabul edilmez; onaylı cleanup/retry yapılır.

Yerel sentetik PKCE regresyonları: `npm run test:auth:regression:local`.
Mevcut yerel Supabase/Mailpit kullanılır; yalnız kendi UUID hesapları/mailleri
temizlenir, DB reset ve gerçek e-posta gönderimi yoktur. Aynı test Workers CI
kapısında geçici yerel Supabase'e karşı çalışır.

## Workers staging kurulumu — kontrollü adaptör denemesi

Native Next.js komutları korunur. Workers için sabitlenmiş vinext 1.1.0 (beta),
Vite 8.3.4 ve Wrangler 4.149.0 kullanılır. Uyumluluk tarihi, kurulu workerd'in
desteklediği `2026-10-06` değeridir; tarihin ileri alınması ayrıca test gerektirir.

Kökten çalıştırılabilir komutlar:

- `npm run workers:check`: adaptör ön incelemesi.
- `npm run workers:dev`: yerel Workers geliştirme sunucusu, port 3000.
- `npm run workers:build`: yerel ortam için workerd production derlemesi.
- `npm run test:workers:runtime`: port 3000 boşken derlenmiş workerd'i başlatır;
  44 tarayıcı/Auth sınırı testi ve yerel ürün smoke akışını çalıştırıp sunucuyu kapatır.
- `npm run workers:build:staging`: yerel `.env`/`.dev.vars` dosyalarını kopyalamayan
  geçici kaynak klasöründe, yalnız test public ayarlarıyla derler. Çıktı klasörü
  terminalde yazılır; production proje kaydı derlemeye dahil edilmez.
- `npm run workers:deploy:staging -- <çıktı-klasörü>`: yalnız kendi interaktif
  terminalinizde çalıştırın. Test projesinin modern secret anahtarı gizli girişle
  alınır; test Auth erişimi ve profil şeması doğrulanmadan yüklenmez. Anahtarı
  sohbete, komut satırına veya git'e yazmayın. Geçici secret dosyası işlem sonunda
  silinir; mevcut Worker'ın paylaşım HMAC anahtarı yeniden üretilmez.
- Aynı komuta `--from-cli` eklenirse macOS Supabase CLI Anahtar Zinciri
  kimlik bilgisiyle yalnız test secret'ı alınır; değerler loglanmaz.
- `npm run auth:configure:test`: test Site URL/callback ayarlarını uygular ve
  yeniden doğrular; e-posta doğrulama zorunluluğunu değiştirmez.
  Bu başlangıç komutu allowlist'i yalnız staging callback'ine ayarlar;
  açık preview'lar varken çalıştırılmaz. PR callback ekleme/kaldırma işlemi
  allowlist'in diğer girdilerini koruyan preview denetleyicisine bırakılır.
- `npm run test:workers:staging`: yalnız test projesinde sentetik hesaplarla
  HTTPS giriş, çerez, profil/müşteri/teklif, public resolver, RLS, refresh ve
  çıkış akışını sınar; oluşturduğu hesapları ve bağlı kayıtları temizler.
  Gerçek e-posta doğrulaması bu otomatik testin kapsamı değildir.
- `npm run test:auth:email:staging`: `AUTH_TEST_EMAIL` ile seçilen, test projesinde
  henüz kayıtlı olmayan organizasyon üyesi adresiyle insan destekli gerçek kayıt
  testi. Gelen en yeni e-postanın bağlantısı aynı açılmış Chromium penceresine
  yapıştırılır; kod/link/token değerleri, screenshot veya trace kaydedilmez.
  Test başarıyla bitince oturum sonlandırılıp pencere kapatılır; hesap silinmez.
  Var olan test hesabını silmek ayrıca açık onay gerektirir; CI'da çalıştırılmaz.
- `npm run ci:workers`: yalnız bağımsız GitHub-hosted CI ortamında geçici yerel
  Supabase, migration/seed/DB ve Workers tarayıcı/ürün kontrollerini çalıştırır;
  kendi oluşturduğu kaynakları temizler.

Yerel derlemenin `dist/server/.dev.vars` dosyası yerel sunucu sırlarını içerebilir;
bu çıktı yayımlanmamalı veya artefakt olarak yüklenmemelidir. Staging yayını yalnız
izole staging çıktısından yapılır. Free plan için ek ücretli binding kurulmaz.
Production yayını bu kurulumun kapsamı değildir. Onaylı PR preview otomasyonu
üstteki bölümde açıklanır; kabul kanıtları `implementation_status.md` içindedir.

`workers-runtime` CI işi yalnız bağımsız GitHub-hosted runner'da geçici yerel
Supabase başlatır; migration/seed/SQL kontrollerinden sonra workerd build ve
tarayıcı/ürün testlerini çalıştırır. Uzak Supabase veya uygulama secret'ı almaz;
kendi oluşturduğu DB kaynaklarını ve yerel env dosyasını temizler. Workflow'un
eklenmesi GitHub'da çalıştığı veya required check olduğu anlamına gelmez.
PR #8 için CI koşusu `37999446531` tüm kapıları geçti; `workers-runtime`
mevcut beş required check korunarak eklendi. Negatif `37999942035` koşusunda
yalnız Workers kontrolü başarısızken PR `BLOCKED` oldu; geçici hata adımı
kaldırıldı. CI log secret taraması temiz, artefakt sayısı sıfırdır. Workers CI
kapısı PR #9 ile `main`e alındı.

Test Auth Site URL hedefi
`https://freelancercrm-staging.cagankeremergun.workers.dev`; izinli callback yalnız
bu origin'in `/auth/callback` yoludur. Preview origin'leri ayrıca onaylanıp
allowlist'e ve uygulama doğrulamasına eklenmeden kullanılamaz. Local/CI callback
varsayılanı `http://localhost:3000/auth/callback` olur; `NEXT_PUBLIC_SITE_URL`
yalnız doğrulanmış origin'e ayarlanabilir. `next` yalnız açık uygulama yollarını
kabul eder. Workers giriş katmanı dinamik yanıt/redirect'lere güvenlik başlıkları
ekler; özel form POST'larını origin kontrolünden geçirir. Public teklif ve
callback yanıtları `no-referrer`, özel formlar `same-origin` kullanır.
Uzak staging yayını ve bu otomatik HTTPS testleri 2026-10-10'da doğrulandı;
bulut oturum çerezleri `Secure` ve `SameSite=Lax` kullanır. 2026-10-10'da sonraya
bırakılan gerçek kayıt → e-posta doğrulaması → HTTPS callback → oturum testi,
2026-10-13'te onaylı temiz kayıt tekrarında başarıyla geçti; doğrulanmış Auth
kimliği ve korumalı rota erişimi kontrol edildi. İlk denemenin kök nedeni
kesinleşmedi; tekrar için eski boş test hesabı açık kullanıcı onayıyla silindi.
Başarılı test sonrası session sayısı sıfır; yeni doğrulanmış boş test hesabı
korundu. Rastgele test parolası kaydedilmedi veya paylaşılmadı.
Staging smoke ayrıca onboarding, yayınlama, süresi dolmuş oturumun yenilenmesi
ve geçersiz callback yönlendirmesini doğruladı. Test bitiminde iki sentetik hesap
ve bağlı kayıtları temizlendi; test DB'de kullanıcı/profil/teklif sayısı sıfır,
uygulanan migration ve RLS etkin tablo sayısı sekiz olarak doğrulandı.

Adaptörün getirdiği RSC paketi için React/React DOM ve react-server-dom-webpack
19.2.8'e sabitlenmiştir. `satori → fflate` override'ı yalnız ZIP64 açığının
düzeltilmiş 0.7.5 yamasını uygular; üst satori bağımlılığı bu sürümü gerektirdiğinde
override kaldırılabilir. Tam audit'teki beklenen `braces` kök bulgusu çözülmüş
sayılmaz; vinext'in dolaylı zinciri de aynı bulguya eklenir. Production audit ile
runtime bundle incelemesi birbirinin yerine geçmez.

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

Yerel Node.js ortamında production build ve çalıştırma:

~~~bash
npm run build
npm run start
~~~

Bu komutlar mevcut native Next.js runtime'ını çalıştırır; Workers build veya
deployment komutları değildir. Hosting hedefi 2026-10-09 kullanıcı kararıyla
Cloudflare Workers'tır; Cloudflare Pages kullanılmayacaktır. Next.js ve Supabase
korunur. Workers adaptörü vinext'tir (beta); native Next.js komutları da korunur.
Workers uyumluluk ve sınırları [ARCHITECTURE.md](./ARCHITECTURE.md#cloudflare-workers-hosting-kararı)
içindedir. Normatif yayın sırası [plan.md Bölüm 27](./plan.md#27-ortamlar-ve-dağıtım)
ile tanımlanır.

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
konulmamalıdır. Staging ve onaylı preview Worker'larına yalnız test projesinin
sunucu anahtarı ve doğrulanmış bağı runtime secret olarak aktarılır. Vinext'in
sunucu env erişimi HTTPS kabul testlerinde doğrulanır; production anahtarı
alınmaz veya test deployment'ına aktarılmaz.

2026-10-09 kullanıcı onayıyla iki uzak Supabase projesi hedeflenir:
preview ve staging ortak test projesini, production ayrı projeyi kullanır.
Preview/staging DB, Auth ve Storage kaynaklarını paylaşır; birbirinden izole
değildir. Ortak proje yalnız sentetik veri içerir; production verisi ve sunucu
secret'ları test ortamına taşınmaz. Ortak test migration dağıtımları kontrollü
ve sıralı yapılır. PR kalite CI'sı bağımsız geçici yerel DB kullanmaya devam eder;
production'a otomatik migration uygulanmaz.

`.env.local` buluta kopyalanmamalıdır. Production ile ortak test projesinin
public URL/key ve sunucu secret'ları ayrı tutulur; deployment kurulduğunda
Workers ortamlarına açık kapsamla eklenir. Preview/staging build ve runtime
yapılandırmasına production URL'si veya hiçbir production anahtarı aktarılmaz.
`NEXT_PUBLIC_*` değerleri tarayıcıya açılır; ortamına ait public değerler build
sırasında da doğru olmalıdır. Sunucu sırları public değişkenlere, tarayıcı bundle'ına veya
loglara girmez. Workers build değişkenleri, runtime secret/binding aktarımı ve
PR sahiplik etiketi trusted main denetleyicilerinde uygulanır; preview ve
şifreli artefakt aktarımının komutları üstte açıklanır. Gerçek ürünün production
yayını ayrı release onayı ve ilgili görevlerin kabulünü gerektirir.

### Workers yayın adresleri ve Auth

Staging uygulama adresi `https://freelancercrm-staging.cagankeremergun.workers.dev`;
onaylı PR preview adresi `https://freelancercrm-pr-<PR>.cagankeremergun.workers.dev`.
Supabase API adresleri uygulama yayın adresi değildir. Production uygulama
adresi/yayını henüz yoktur; varsayımsal bir production Auth URL'si tanımlanmaz.

Ortak test Supabase projesinin Site URL'si doğrulanmış staging uygulama adresi
olarak ayarlanmıştır; izin verilen yönlendirmeler yalnız bu staging ve onaylı preview
adreslerinin gerekli callback/reset yollarını içerecek. Production Supabase
Site URL ve allowlist'i yalnız doğrulanmış production uygulama adreslerini
kullanacak. Mevcut callback yolu `/auth/callback`; reset yolları TASK-007
kapsamında uygulanıp doğrulanacak. Site URL varsayılan yönlendirmedir; preview
akışının kendi izinli callback adresine dönmesi ayrıca sınanır ve PR kapanınca
yalnız o PR'ın kesin callback adresi kaldırılır.
[Supabase Auth yönlendirme belgesi](https://supabase.com/docs/guides/auth/redirect-urls)
referanstır. Uzak test Auth kabul sonuçları `implementation_status.md` içinde tutulur.

Sıra: önce yerel Workers runtime'ında yerel Supabase ile uyumluluk testi,
sonra yalnız ortak test Supabase'e bağlı staging deployment, ardından gerçek
HTTPS üzerinde Auth/cookie/session ve test–production izolasyon doğrulaması.
Production yayını ancak ilgili görevlerin kabulü ve release onayıyla yapılır.

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

Mevcut CI ve native Next.js build kanıtları korunur; Workers runtime kabulü
sayılmaz. Adaptör seçildikten sonra Workers build/runtime, bundle secret sınırı
ve kritik akış kontrollerinin kalite kapılarına nasıl ekleneceği doğrulanacak.
CI bağımsız geçici yerel Supabase kullanmayı sürdürecek; bu dokümantasyon işi
workflow veya required check ayarlarını değiştirmez.

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
