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

Ana rota (`/`), Faz 0 / TASK-004 için alpha değer önerisini, 149/249 TL fiyat
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
npm install
npm run dev
~~~

Kalite kontrolleri:

~~~bash
npm test
npm run lint
npx tsc --noEmit
~~~

Uygulama kodu `v0.1.0/` klasöründedir. Landing yüzeyi
`app/landing-page.tsx` ve `app/landing-page.css`; demo girişi `app/demo-app.tsx`,
paylaşılan ürün arayüzü ise `app/prototype-app.tsx` ve `app/globals.css` dosyalarındadır.
