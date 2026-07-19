# FreelanceMCP

## Prototip Fazı

### Kapsam — tıklanabilir ürün prototipi

Kapsam, freelance yazılımcı ve tasarımcıların profesyonel teklif hazırlamasını,
bağlantı olarak paylaşmasını, yaklaşık görüntülenme sinyallerini izlemesini ve
takip mesajı taslağı üretmesini hedefleyen bir ürün prototipidir.

Bu sürüm plan.md içindeki Faz 0 / TASK-006 kapsamını doğrulamak için hazırlanmıştır.
Yalnız sentetik veri kullanır. Güncel profil ve teklif taslağı aynı tarayıcıdaki
demo paylaşım bağlantısının açılabilmesi için yerel tarayıcı deposunda tutulur.

## Prototipte bulunan akışlar

- Üç adımlı profil ve marka onboarding'i
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

Bu prototip gerçek auth, sunucu veritabanı, RLS, AI sağlayıcısı, ödeme,
e-posta/WhatsApp gönderimi, PDF, CRM veya cihazlar arası kalıcı veri içermez.
Demo paylaşım bağlantısı yalnız aynı tarayıcıdaki yerel sentetik taslağı açar.
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

Ana ürün yüzeyi app/prototype-app.tsx, görsel sistem ise app/globals.css
dosyasındadır.
