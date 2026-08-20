# FreelancerCRM Mimarisi

Bu belge, `plan.md` içindeki normatif ürün planını değiştirmez; uygulama kodunun
hangi katmana yerleşeceğini ve katmanlar arasındaki import kurallarını açıklar.
Mevcut temel native Next.js App Router, React ve strict TypeScript kullanır.

## Dizin yapısı

```text
.
├── apps/web/
│   ├── app/                    # Rotalar, layout ve route metadata
│   │   ├── page.tsx            # / landing sayfası
│   │   └── demo/page.tsx       # /demo sentetik ürün demosu
│   ├── components/
│   │   ├── marketing/          # Landing yüzeyi
│   │   ├── demo/               # Yalnız sentetik demo bileşenleri
│   │   └── ui/                 # Üründen bağımsız temel UI parçaları
│   ├── lib/
│   │   ├── server/             # Auth, secret, DB ve server SDK işlemleri
│   │   ├── client/             # Browser API ve client-only yardımcılar
│   │   └── shared/             # Saf yardımcılar ve runtime-bağımsız tipler
│   └── tests/                  # Build, rota ve katman sınırı testleri
├── scripts/                    # Repo düzeyi doğrulama komutları
├── plan.md                     # Normatif ürün ve kabul kriterleri
└── implementation_status.md    # Kısa uygulama ilerleme kaydı
```

Gerçek ürün rotaları geliştirilmeye başlandığında `apps/web/app/app/` altında,
üretim bileşenleri ise `apps/web/components/app/` altında ayrı oluşturulur.
Yeni `/app` ekranları `components/demo/` veya devasa `prototype-app.tsx`
bileşenini production koduna dönüştürmez. `components/ui/` ve gerçekten genel,
saf `lib/shared/` parçaları iki deneyim tarafından kullanılabilir.

## Server ve Client Component sınırı

App Router dosyaları varsayılan olarak Server Component kalır. Veri okuma,
yetkilendirme ve secret gerektiren işlemler sunucuda tamamlanır; Client
Component'a yalnız gerekli ve serileştirilebilir veri aktarılır. `"use client"`
yalnız state, event, browser API veya client hook gerektiren etkileşimli yaprak
bileşenlerde kullanılır.

Server Component bir Client Component render edebilir. Client Component ise
doğrudan veya dolaylı olarak `lib/server/` import edemez. Bir dosyayı barrel
export üzerinden yeniden dışa aktarmak bu kuralı aşmanın geçerli bir yolu
değildir.

## Kütüphane katmanları

| Katman | Sorumluluk | İzin verilen yerel bağımlılık |
| --- | --- | --- |
| `lib/server/` | Auth, DB, secret, sağlayıcı ve server SDK adaptörleri | `lib/server/`, `lib/shared/` |
| `lib/client/` | `window`, storage ve diğer browser-only yardımcılar | `lib/client/`, `lib/shared/` |
| `lib/shared/` | Saf fonksiyonlar ve framework/runtime bağımsız tipler | Yalnız başka saf shared modüller |

Her `lib/server/` giriş modülü ilk ifade olarak `import "server-only";` içerir.
Server modülleri `lib/client/` import edemez. Shared modüller React, Next.js,
runtime ortam değişkeni, server veya client katmanına bağımlı olamaz. Ayrıntılı
kurallar `apps/web/lib/README.md` içinde, otomatik kontroller ise
`apps/web/tests/server-boundary.test.mjs` içindedir.

## Secret kuralları

- Secret ve ayrıcalıklı SDK yalnız `lib/server/` içinde okunur veya oluşturulur.
- Browser'a açılması amaçlanmayan hiçbir değer `NEXT_PUBLIC_*` adı taşımaz.
- Client kodu yalnız açıkça yayınlanabilir değerleri kullanır; service-role,
  AI, ödeme ve benzeri ayrıcalıklı anahtarları alamaz.
- Server modülü client/shared barrel dosyasından yeniden export edilmez.
- Güvenilmeyen browser, ağ ve ortam değerleri sınırda runtime olarak doğrulanır.
- Import grafiği ve browser çıktısı sırasıyla `server-boundary.test.mjs` ve
  `client-bundle.test.mjs` tarafından kontrol edilir.

## `/demo` ve gerçek `/app` sınırı

`/demo`, ürün davranışını örnek verilerle gösteren sentetik ve `noindex`
deneyimdir. Gerçek auth, Supabase verisi, RLS güvencesi, ödeme veya kalıcı ürün
işlemi sunmaz. Demo içindeki güvenlik ve sunucu davranışı simülasyonları
production kontrolü sayılmaz.

Gerçek `/app` ekranları daha sonra temiz Server/Client Component sınırlarıyla
ayrı geliştirilecektir. `/app`, demo state modeline veya demo bileşenlerine
bağımlı olmayacak; auth, veri erişimi ve mutasyonlar production server
katmanından geçecektir. `/demo` da production veritabanına yazmayacaktır.

## Supabase'in TASK-003 yerleşimi

TASK-003 sırasında katmanlar şu şekilde genişletilecektir:

- `lib/server/env.ts`: fail-fast ve tipli private/public ortam doğrulaması.
- `lib/server/supabase/`: cookie kullanan server client ve yalnız gerektiğinde
  dar amaçlı service-role/admin adaptörü.
- `lib/client/supabase/`: yalnız yayınlanabilir URL/anahtarla browser client.
- `lib/shared/`: secret veya SDK instance içermeyen üretilmiş DB tipleri.
- Kök `supabase/`: local config, migration ve seed dosyaları.

Browser üzerinden doğrudan veri erişiminin yetki sınırını RLS uygular;
service-role RLS'i atladığı için hiçbir zaman browser bundle'a girmez ve genel
amaçlı uygulama client'ı olarak kullanılmaz. Bu yerleşim TASK-003'te uygulanacak
ve doğrulanacaktır; mevcut TASK-001 bu bağımlılıkları henüz kurmaz.

## Çalıştırma ve doğrulama

Node.js 22.13.0 veya üzeri gerekir. Komutlar repo kökünden çalıştırılır:

```bash
npm run install-all           # apps/web için temiz npm ci
npm run dev                   # local development
npm run build                 # production build
npm run start                 # production sunucusu; önce build gerekir
npm run lint
npm run typecheck
npm test
npm run validate:task-001     # TASK-001'in tam, temiz kabul seti
```

`validate:task-001`; temiz kurulumu, lint ve strict type-check'i, iki production
build'i, tam test setini, server/client ve browser bundle sınırlarını, ayrıca
development/production altında `/` ile `/demo` HTTP smoke kontrollerini çalıştırır.
