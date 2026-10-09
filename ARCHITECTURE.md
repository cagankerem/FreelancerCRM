# FreelancerCRM Mimarisi

Bu belge, `plan.md` içindeki normatif ürün planını değiştirmez; uygulama kodunun
hangi katmana yerleşeceğini ve katmanlar arasındaki import kurallarını açıklar.
Mevcut temel native Next.js App Router, React ve strict TypeScript kullanır.

## Cloudflare Workers hosting kararı

2026-10-09 kullanıcı kararı: uygulama Cloudflare Workers üzerinde barındırılacak;
Cloudflare Pages hedef değildir. Mevcut Next.js uygulaması ve Supabase korunur.
Hosting kararı adaptör veya build altyapısı seçimi değildir. Bu dokümantasyon
revizyonunda paket, kod, lockfile, CI, env veya uzak servis değişikliği yapılmaz.

### Next.js uyumluluk değerlendirmesi — 2026-10-09

Depoda Next.js `16.3.8`, React `19.2.6`, `@supabase/ssr` `0.12.6` ve
`@supabase/supabase-js` `2.115.0` kullanılıyor. Mevcut komutlar `next dev`,
`next build` ve `next start`; Workers adaptörü kurulu değildir.

| Seçenek | Resmî belgelerdeki durum | Proje açısından değerlendirme |
| --- | --- | --- |
| vinext | Cloudflare'ın güncel Next.js rehberinde önerilen beta yol; Vite ile Next.js API yüzeyini yeniden uygular. App Router, `proxy.ts`, Server Actions ve Route Handlers desteği belirtilir. | Next.js 16 uygulaması adaydır; `16.3.8` ve kullanılan API'ler için proje testi gerekir. Vite, vinext ve Workers build yapılandırması eklemek altyapı değişikliğidir; basit hosting ayarı veya otomatik onay sayılmaz. |
| OpenNext (`@opennextjs/cloudflare`) | Next.js build çıktısını Workers'a uyarlar. OpenNext belgeleri Next.js 16 minor/patch sürümlerini kapsar. Cloudflare rehberi App Router, Server Actions ve Route Handlers desteği; Node.js middleware için destek eksikliği bildirir. | Native Next.js build yaklaşımına daha yakın bir adaydır; adaptör/Wrangler yapılandırması gerekir. Sürüm kapsamı uygulama uyumluluğunu kanıtlamaz; özellikle mevcut `proxy.ts` çözülmeden uygun kabul edilmez. |

vinext bilgisi [Cloudflare Next.js rehberinden](https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/),
OpenNext özellik/kısıtları [Cloudflare OpenNext rehberinden](https://developers.cloudflare.com/workers/framework-guides/web-apps/opennext/),
sürüm ve build yaklaşımı [OpenNext bakımcı belgelerinden](https://opennext.js.org/cloudflare)
2026-10-09'da kontrol edildi. Bu destek beyanları FreelancerCRM test sonucu değildir.
Adaptör ve sabitlenecek sürümü **belirlenecek**; kurulum/deployment komutları
seçim ve proje doğrulaması sonrasında yazılacak.

Yerel Workers uyumluluk testinde şu mevcut davranışlar korunmalı:

- `apps/web/proxy.ts`, `/app`, `/onboarding` ve `/auth` için Supabase claims
  doğrulaması, request/response cookie yenilemesi ve `private, no-store` uygular.
  [Next.js Proxy belgesi](https://nextjs.org/docs/app/api-reference/file-conventions/proxy)
  Node.js runtime'ını varsayılan sayar ve Proxy'de runtime seçeneğine izin vermez.
  OpenNext'in middleware kısıtı ile birlikte bu, proje için açık uyumluluk
  riskidir; yalnız dosyayı yeniden adlandırmak veya runtime etiketi eklemek
  doğrulanmış çözüm değildir. Auth güvenliği gevşetilmeden test edilmelidir.
- `app/auth/callback/route.ts`, GET isteğindeki kodu `exchangeCodeForSession`
  ile değiştirir ve request URL üzerinden yönlendirir. HTTPS origin, hata
  yönlendirmesi, cookie yazımı ve oturumun sonraki isteğe taşınması sınanmalı.
- Auth, onboarding, müşteri ve teklif Server Actions için form POST, sunucu
  yetkilendirmesi, mutation, redirect ve cookie davranışı sınanmalı.
- Auth ve public teklif Route Handlers için HTTP yanıtı, dinamik route,
  güvenlik başlıkları, cache sınırı ve server-only/secret importları sınanmalı.
  Gelecekteki webhook/AI endpointleri kendi görev kabulünde Workers üzerinde
  doğrulanır; henüz uygulanmamış akışlar uyumlu sayılmaz.

### Ortamlar, sırlar ve yayın sırası

Normatif kaynak [plan.md Bölüm 27](./plan.md#27-ortamlar-ve-dağıtım);
gerçek Supabase proje eşlemesi ve bekleyen Auth adresleri [README.md](./README.md#uygulama-ortamıproje-eşlemesi)
içindedir. Local yerel Supabase'i, CI bağımsız geçici yerel Supabase'i kullanır;
preview/staging ortak test Supabase'i, production ayrı production Supabase'i kullanır. Preview/staging'e
production bağlantısı veya anahtarı aktarılmaz. Mevcut Next.js yerel geliştirme
ve CI komutları korunur; bunların başarısı Workers uyumluluğunu kanıtlamaz.

Workers'ta sırlar sunucu secret'ları olarak tutulacak; plaintext `vars` alanına
konmayacak. Ortam değişkenleri/binding'ler ve secret'lar her ortam için açıkça
tanımlanır. Build ve runtime kapsamları ile mevcut `process.env` okuyucularına
aktarım seçilen adaptörde doğrulanacak. `NEXT_PUBLIC_*` değerleri tarayıcıya
açılır; production public değerleri de test build'ine taşınmaz.
[Workers secrets](https://developers.cloudflare.com/workers/configuration/secrets/)
ve [Workers ortam belgeleri](https://developers.cloudflare.com/workers/wrangler/environments/)
2026-10-09'da kontrol edildi. PR preview yöntemi, ortam adlarının Workers
yapılandırmasına eşlemesi ve build/deployment entegrasyonu henüz seçilmedi.

Uygulama sırası: adaptör/build kararı ve kontrollü uygulama → yerel Workers
runtime'ında yerel Supabase ile uyumluluk testi → test Supabase'e bağlı staging
deployment → gerçek HTTPS Auth, cookie/session, secret ve izolasyon doğrulaması
→ release kapıları ve onay → production. Preview/staging/production HTTPS
uygulama adresleri henüz doğrulanmadı; Site URL ve callback allowlist'leri gerçek
yayın adresleriyle test/production ayrı yapılandırılacak.

Mevcut native runtime ve platformdan bağımsız test kanıtları geçerlidir;
Workers build, runtime, Auth ve bundle sınırları ayrıca doğrulanmalıdır.
2026-08-11'de eski Vinext/Cloudflare iskeletinin kaldırılması tarihsel kayıttır;
bugünkü karar o iskeletin uygun veya yeniden kullanılabilir olduğunu kanıtlamaz.

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
