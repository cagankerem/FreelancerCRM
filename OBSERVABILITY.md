# Request ID ve güvenli uygulama logları

TASK-005 uygulama sözlüğü. Normatif kapsam `plan.md` içinde kalır.

## İstek sınırı

- Uygulama adı `requestId`, HTTP cevap başlığı `X-Request-ID`.
- Kriptografik UUID v4, küçük harf, tam 36 ASCII karakter; plan sınırı 64. Geçersiz ID kesilmez veya normalize edilmez.
- Native Next.js `proxy.ts` dış `X-Request-ID` değerini siler ve `x-kapsam-request-id` girdisini yeni UUID ile değiştirir. Bu dahili başlık yalnız proxy'den sonraki aynı isteğin aktarımıdır; imza veya kullanıcı yetkisi değildir. Next.js'in proxy'yi atlayan bir dış girişe açılması bu güven sınırını bozar.
- Worker her fetch için kendi UUID'sini üretir; `AsyncLocalStorage.run` içinde adaptör/proxy/handler/action aynı context'i kullanır. Aktif ID global değişkende tutulmaz. Native proxy ile route arasındaki ayrı framework bağlamında ID, proxy'nin üzerine yazdığı dahili request başlığından okunur.
- Yeni HTTP isteği yeni ID alır. Redirect hedefindeki GET yeni bir istektir. Action hatasının query'de gösterilen destek referansı önceki POST'a aittir; yetki kanıtı veya mevcut GET'in ID'si değildir.
- ID auth, authorization, CSRF, idempotency veya kullanıcı/oturum kimliği olarak kullanılmaz. Dış servislere ve yeni fetch'lere otomatik eklenmez.
- `_next/static`, `_next/image` ve bilinen public resim/font dosyaları uygulama korelasyon kapsamı dışındadır; asset servisi Worker'ı tamamen atlayabilir. Statik body'ye ID gömülmez. Genel cache kapatılmaz; private auth/public-token cevaplarının mevcut `private, no-store` politikası korunur. Proxy cevap başlığı her dinamik istekte yenilenir.
- `durationToResponseMs`, bulunduğu sınırın başlangıcından Response/işlem sonucunun elde edilmesine kadardır. Worker'da response headers/body stream hazır olma süresidir; stream tüketiminin bitişi veya ağ teslim süresi değildir. Native `proxy.ready` yalnız proxy/session hazırlığını ölçer, tam HTTP süresi değildir.

## JSON ve hatalar

Başarı: `{ data: DTO, error: null, requestId }`.
Hata: `{ data: null, error: { code, message }, requestId }`.

Public proposal API bu zarfı kullanır. Repo içindeki tüketiciler yalnız status/header kontrol ediyordu; HTML public sayfa resolver'ı doğrudan çağırır. Yeni JSON tüketicisi `body.data` okumalıdır. HTML, redirect, cookie ve stream cevapları kendi türünde kalır.

| Kod | HTTP | Anlam |
| --- | --- | --- |
| INVALID_INPUT | 400 | Sabit doğrulama hatası |
| UNAUTHENTICATED | 401 | Giriş gerekli/kimlik doğrulanamadı |
| FORBIDDEN | 403 | İşlem yetkisi yok |
| NOT_FOUND | 404 | İçerik bulunamadı; public token ayrıntısı açıklanmaz |
| CONFLICT | 409 | Sürüm/unique/transaction çakışması |
| UNAVAILABLE | 503 | Sağlayıcı/bağımlılık işlemi tamamlanamadı |
| INTERNAL_ERROR | 500 | Beklenmeyen hata; ham message/stack/cause paylaşılmaz |

`providerError` yalnız kod allowlist'i kullanır; tanınmayan sağlayıcı kodu UNAVAILABLE olur. Serbest hata metninden sınıf çıkarılmaz. Action sonuçlarında mevcut redirect akışı korunur, sabit hata query koduna POST destek referansı eklenir. `unstable_rethrow` redirect, notFound ve prerender kontrol akışını korur. `ErrorState.requestId` yalnız doğrulanmış UUID gösterir; framework `digest` ID sayılmaz. Mevcut dinamik ürün ekranları `renderOperation` ile güvenli hata durumuna güncel isteğin ID'sini açık prop olarak taşır. Kalıcı App Router layout context'inde önceki isteğin ID'si saklanmaz. React istemci hatası veya kök framework hatasında özgün sunucu isteği bilinmiyorsa referans uydurulmaz; instrumentation ID yoksa redakte edilmiş işaret yazar. Public HTML notFound, [Next.js'in belgelenmiş streaming sözleşmesine](https://nextjs.org/docs/app/api-reference/file-conventions/not-found) göre shell gönderildiyse 200/noindex, gönderilmediyse 404 dönebilir; testler not-found UI ve noindex'i de doğrular. JSON public API bulunamayan içerikte her zaman 404 verir.

## Log sözlüğü

Uygulama logger'ı satır başına JSON üretir. İzinli alanlar: `time`, `level`, `environment`, `event`, `operation`, `requestId`, `durationToResponseMs`, `outcome`, `status`, `code`. İlave alanlar serialize edilmez. Zaman ISO-8601 UTC; environment local/ci/preview/staging/production; level info/warn/error; outcome success/rejected/failure/control_flow. HTTP status 100–599; süre finite, 0–86.400.000 ms. Serbest metin veya iç içe object alanı yoktur; sınırlı enum'lar ve sayılar normal kaydı 4 KiB'nin altında tutar.

| Event | Kullanım |
| --- | --- |
| request.started | Native proxy veya Worker ingress |
| proxy.ready | Proxy/session hazırlığı bitti |
| request.finished | Worker Response hazır; stream sonu değil |
| operation.finished | İşlem döndü veya framework kontrol akışı |
| operation.failed | Güvenli kodla reddedilen/başarısız işlem |
| render.failed | Framework instrumentation hata bildirimi |
| logger.failed | Logger/sink hata fallback'i; yalnız sabit event ve level |

Operation allowlist: http, auth.session, auth.callback, auth.login, auth.register, auth.logout, profile.save, profile.read, client.create, client.list, proposal.create, proposal.publish, proposal.public, proposal.list, proposal.read, dashboard.read, diagnostic. Yeni işlem adı sözlüğe ve testlere açıkça eklenmelidir.

Önce alan allowlist'i uygulanır. Sonra UUID dışındaki requestId redakte edilir; enum dışındaki operation/event/outcome/code kabul edilmez. Request, Response, FormData, Error, header/body/query, URL, dinamik path, token, parola, cookie, authorization, IP, isim, e-posta, içerik veya sağlayıcı hata metni loga aktarılmaz. Getter/serialization/sink hatası cevabı bozmaz; fallback orijinal girdiye bakmaz. Console monkey-patch veya harici log bağımlılığı yoktur.

Kullanıcı kimliği şu anda loglanmaz. Gelecekte ilişkilendirme gerekirse ayrı server secret ile amaç/ortam bazlı HMAC, rotasyon ve saklama politikası belirlenmelidir. Ham UUID kullanıcı kimliği veya salt hash anonim sayılmaz; pseudonymous değer de erişim/saklama kontrolüne tabidir. TASK-005 bu alanı otomatik eklemez.

## Framework/platform sınırı ve açık kabul

Uygulama logger'ı Next.js, Vinext, Wrangler veya Cloudflare otomatik loglarını filtrelemez. Yerel test harness'i stdout ve stderr'i birlikte yalnız bellekte yakalar; sentetik private header/Error canary'si için tüm çıktıyı tarar, ham canary veya log artefaktı yayınlamaz. Route/query canary kontrolü ayrıca otomatik URL log riskini sınar.

Kurulu Wrangler 4.149.0 şeması `observability.redact_query_string` destekliyor, ancak yalnız bu alanın yazılması gerçek build'de reddedildi: ayrıca observability/log/trace/issues enablement kararı zorunlu. Mevcut uzak enablement ve persist politikası bilinmeden yeni log saklama açılmadı; kaynak `wrangler.json` ve preview config önceki ayarında bırakıldı. Onaylanacak örnek, mevcut enablement politikasını koruyarak aynı `observability` object'ine `redact_query_string: true` eklemektir. Enablement/invocation logging/sampling/persist ayarları bu görevde değiştirilmedi. Uzak config ve staging logları incelenmedi/değiştirilmedi; kaynak ayarın yazılması da uzak kabul kanıtı değildir.

Query redaksiyonu `/auth/callback?code=...` riskine yöneliktir; `/p/[shareToken]` veya `/api/public/proposals/[shareToken]` içindeki path token'ını korumaz. `npm run test:observability:platform-urls` yerel Wrangler çıktısında path canary'sini gerçekten yakaladı (`pathExposed=true`, `queryExposed=false`, `wranglerOutput=true`); kontrol başarısız kalır, canary değeri yazılmaz. Bu test uzak Cloudflare invocation loglarının sonucunu kanıtlamaz. Invocation URL/path ve beklenmeyen framework Error loglarının sızıntı riski açıktır. Uzak log görünürlüğü, sanitization/retention/access ve gerçek HTTPS staging canary kanıtı ayrı onay gerektirir. Testi geçirmek için logging kapatılmamalı veya sampling düşürülmemelidir. Nihai hata sağlayıcısı, log DB/dashboard/alarm bu görevin dışındadır.

2026-10-15 davranış doğrulaması kurulu kaynaklarla yapıldı: Next 16.3.8 `dist/server/instrumentation/types.d.ts`, `dist/client/components/unstable-rethrow.js`, `dist/server/lib/router-utils/resolve-routes.js`; Vinext 1.1.0 `dist/shims/navigation-errors.js`, `dist/server/instrumentation.js`, `dist/server/request-pipeline.js`; Wrangler `config-schema.json`; Supabase auth-js `src/lib/error-codes.ts`. Proxy request-header override, onRequestError header şekli, redirect/notFound yeniden fırlatması ve Worker Node AsyncLocalStorage desteği gerçek iki-runtime testleriyle ayrıca sınanır.

## Yerel kabul kanıtı — 2026-10-15

- Native Next.js ve gerçek workerd: eşzamanlı bağımsız ID'ler; ingress → operation → log → header/JSON; Server Action ve server-render hata ekranı; sentetik header/form/Error canary gizliliği; iki Set-Cookie, redirect, streaming, public API 404 ve statik asset cache sınırı doğrulandı.
- Yerel ürün/Auth: kayıt → onboarding → müşteri → teklif; yalnız sahip olunan sentetik cookie'nin expires_at alanı değiştirilerek gerçek SDK refresh/Set-Cookie; logout redirect ve cookie temizliği iki runtime'da geçti. SDK cookie base64/chunk biçimi ve expiry eşiği kurulu kaynaklardan doğrulandı. Gerçek token fixture dosyasına veya loga yazılmadı; mevcut kullanıcılar korunarak yalnız bu koşunun ürettiği sentetik hesaplar temizlendi, DB reset yapılmadı.
- 93 Vitest, 20 node:test integration, 70 CI/politika, 40 native ve 44 Workers Playwright/axe testi; format/typecheck/build, actionlint, uygulama kaynak lint'i ve secret scan/self-test geçti. Workers compatibility check mevcut Turbopack kısmi desteğini raporlar; gerçek runtime testi ayrıca geçti.
- Kök `npm run lint` mevcut, Git'te izlenmeyen `.cursor/skills` CommonJS betiklerinde 15 hata/1 uyarıyla başarısız; lint kuralı/ignore/CI kapısı gevşetilmedi. Yerel otomatik URL log kontrolü path canary nedeniyle başarısızdır. Bu iki sonuç ve uzak staging/platform kabulü kapanmadan TASK-005 tamamlanmış sayılmaz.
- Kaynak CI'ya native correlation kapısı eklendi; workerd harness'i de aynı kabulü çalıştırır. Workflow politika testi bu native kapının kaldırılmasını reddeder. Uzak PR/CI, deployment ve platform ayar doğrulaması yapılmadı.
