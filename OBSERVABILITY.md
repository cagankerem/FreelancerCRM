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

## Onaylı staging incelemesi — 2026-10-16

Yukarıdaki uzak inceleme yapılmadığına ilişkin ifadeler 2026-10-15 durumudur; aşağıdaki bulgular bunları günceller. Kullanıcının ayrı onaylarıyla Worker settings GET ve sentetik HTTPS/canlı log testi yapıldı. Deployment, kalıcı ayar değişikliği veya log saklama açılması yapılmadı. Settings yanıtında `logpush=false`, sıfır Tail Worker consumer ve eksik `observability` alanı görüldü; eksik alan enablement/sampling/persist/redaksiyon değerlerinin kesin kanıtı sayılmadı.

Canlı log oturumları sunucu tarafında yalnız tek kullanımlık sentetik audit header'ına filtrelendi. `/p/[shareToken]` ve `/api/public/proposals/[shareToken]` için biçimi geçersiz sentetik path ve farklı sentetik `code` query değerleri kullanıldı; gerçek paylaşım token'ı veya auth callback kodu kullanılmadı. GET istekleri sırasıyla HTML 200 ve API 404 döndü; ikisinde de `X-Request-ID` yoktu. Bu sonuç mevcut staging deployment'ına aittir; yereldeki TASK-005 sürümünün staging'e dağıtıldığı veya correlation kabulünün geçtiği iddia edilmez.

İlk oturumda eşleşen event alınamadı; bu başarılı kabul sayılmadı. Binary WebSocket mesajlarını açıkça ArrayBuffer olarak çözen ikinci denemede iki event, sıfır parse hatasıyla yakalandı. Her iki event'in `event.request.url` metadata'sında hem path hem query canary'si bulundu. İki event'te de uygulama logu/exception yoktu; bu sıfır örnek logger redaksiyonunun staging kabulü değildir. Ham loglar/canary değerleri yalnız bellekte işlendi, dosya/rapor çıktısına yazılmadı. İki geçici tail oturumu da API DELETE ile başarıyla kaldırıldı; bu işlem mevcut log kayıtlarını silmez.

Sonuç: uzak **canlı tail metadata** URL gizliliği kontrolü başarısızdır. Kalıcı Workers Logs'a yazılma, saklama süresi ve erişim politikası bu testle kanıtlanmaz. Query redaksiyonu path token'ını çözmez; logging/sampling kapatılmadan canlı ve kalıcı metadata için sanitization seçeneği veya ayrıca onaylanmış token taşıma modeli kararı gerekir. Cloudflare ayar/deployment değişikliği ve gerçek callback testi hâlâ ayrı yetki gerektirir. TASK-005 kısmi kalır.

## Güncel yeniden inceleme ve karar kapısı — 2026-10-16

Bu bölüm önceki tarihli sonuçları günceller; geçmiş kayıtlar silinmez. Çalışma
ağacındaki önceki belge değişiklikleri korundu. `plan.md`, uygulamanın request ID
ve güvenli logger kodu değiştirilmedi. Yeni uzak inceleme için yeniden açık onay
alındı; bu turda canlı tail/test isteği/deployment veya uzak ayar değişikliği yoktur.

### Log yüzeyleri ve sanitization sınırı

| Yüzey | Güncel kanıt / destek sınırı | Kabul durumu |
| --- | --- | --- |
| Uygulama JSON logger'ı | Allowlist ve sabit sözlük; header/body/Error/URL aktarmaz. Native ve gerçek workerd correlation/canary testi yeniden geçti. | Yerelde geçti; staging sürümünde kanıtlanmadı. |
| Next.js / Vinext otomatik çıktı | Uygulama sink'i bu çıktıları filtrelemez. Harness tüm stdout/stderr'i bellekte tarar; kontrollü hata canary'si geçer, tüm olası framework hataları için garanti değildir. | Üretim hatalarının ham URL/stack riski ayrı kalır. |
| Yerel Wrangler | Yeniden çalıştırılan platform URL testi `pathExposed=true`, `queryExposed=false` verdi ve başarısız kaldı. | Path gizliliği başarısız; çıktı gizlenmedi/test kaldırılmadı. |
| Cloudflare canlı WebSocket tail | Önceki ayrı onaylı iki event'te biçimi geçersiz sentetik path/query göründü; bu tur yeniden oturum açılmadı. | Önceki risk kanıtı korunur; ayar sonrası kabul yapılmadı. |
| Kalıcı Workers Logs / traces | Settings'te observability alanı yok; missing değerler true/false/default sayılmadı. | Enablement/persist/redaksiyon ve kayıt kabulü belirsiz. |
| Tail Worker / OTEL / Logpush | Staging consumer sayısı sıfır, Logpush false. Observability destination referansları alan eksikliği nedeniyle bilinmiyor. | Diğer export hedefleri yok sayılmadı. |

[Resmî script settings API](https://developers.cloudflare.com/api/resources/workers/subresources/scripts/subresources/settings/methods/get/)
ve kurulu Wrangler 4.149.0 şeması `redact_query_string` için logs/traces istek URL
query'sini kaldırma sözleşmesi verir; path redaksiyonu sunmaz. Yerel access logunu,
canlı tail'i, ham console/exception içeriğini veya başka export'u temizlediği bu
incelemede doğrulanmadı. Bu yüzeylere otomatik olarak etki ettiği iddia edilmez.
Worker içinde URL değiştirmek orijinal platform metadata'sını değiştirme kanıtı
değildir; `invocation_logs=false` da canlı tail/diğer event metadata'sı için
sanitization garantisi değildir ve bu görevde kabul hilesi olarak kullanılmaz.

[Tail handler API](https://developers.cloudflare.com/workers/runtime-apis/handlers/tail/)
ayrı bir mekanizmadır: URL redaksiyonu sezgiseldir, yanlış negatif verebilir ve
`getUnredacted()` ile aşılabilir. Bir Tail Worker'da temizlenmiş export üretmek,
producer'ın canlı tail'ini veya daha önce saklanan metadata'yı temizlemez. Önceki
canary'ler geçerli bir gerçek token biçiminde değildi; dolayısıyla sonuç gerçek
paylaşım token'ının birebir sızdığının kanıtı olarak genişletilmez. Güvenlik garantisi
ise sezgisel maskeleme üzerine kurulamaz. Auth PKCE query kodu ile paylaşım bearer
token'ı da aynı yetki modeli değildir; ikisi de hassas girdi kabul edilir.

İncelenen güncel resmî ayarlarda bütün bu yüzeyler için orijinal path'i route
şablonuna çeviren desteklenmiş bir sanitizer bulunamadı. Bu bir platformda hiçbir
özel/kurumsal seçeneğin olmadığı iddiası değildir; destek teyidi ve gerçek kabul
gerektirir. Şu seçenekler uygulama öncesinde kullanıcı kararı gerektirir:

| Seçenek | Gizlilik | Kullanım, Auth/SSR ve eski linkler | Operasyon etkisi |
| --- | --- | --- | --- |
| Cloudflare tarafından desteklenen ingress metadata sanitization teyidi | Tercih edilen yol: mevcut orijinal path/query'nin gerekli her yüzeyde temizlendiği kanıtlanmalı; şu anda böyle bir garanti yok. | Rotalar/SSR/PKCE ve mevcut linkler korunabilir; desteklenmezse çözüm sayılmaz. | Hesap/plan özelliği, ücret ve destek teyidi gerekebilir; yeni servis kurulmadı. |
| Paylaşım secret'ını fragment → same-origin POST → kısa süreli HttpOnly session modeline taşımak | Fragment HTTP URL'sine gitmez; body/cookie/exception logları yine korunmalı. Auth PKCE callback query'sini tek başına çözmez. | İlk açılışta JS exchange ve sonra SSR gerekir; JS kapalı kullanım ve cookie sınırları değişir. Eski bearer URL'nin ilk isteği yine sızabileceği için redirect tek başına geriye uyumlu gizlilik çözümü değildir; iptal/rotasyon/veri işlemi ayrıca onaylanmalıdır. | Yeni oturum/CSRF/rate-limit tasarımı ve plan/ürün kararı; uygulamaya alınmadı. |
| Ayrı, kontrollü bir ingress/relay ve private backend | Token backend URL'sine taşınmayabilir; ingress'in kendi logları ve güven sınırı ayrıca denetlenmeli. | Host/origin, callback allowlist, cookie, streaming, cache ve SSR tekrar kabul gerektirir. Eski link ancak aynı public host ingress'e alınırsa korunabilir; o ingress de hassas ilk URL'yi alır. | Ek altyapı, işletim/maliyet ve saldırı yüzeyi; küçük config değişikliği değildir. |

### Kalıcı politika: doğrulanan / resmî varsayılan / bilinmeyen

Yeni onayla yapılan yalnız GET incelemesinde:

- Settings HTTP 200: `logpush=false`, `tail_consumers=[]`; `observability` alanı yok.
  Log/trace/invocation enablement, sampling, persist, query redaksiyonu ve
  destinations **bilinmiyor**. Kaynak config'te de observability bloğu yok; bu
  platform varsayılanı doğrulaması değildir.
- Account settings HTTP 200: `default_usage_model=standard`. Bu değer Free/Paid
  aboneliğini belirlemez. Subscription metadata HTTP 403; ücretli plan ve gerçek
  saklama süresi doğrulanamadı. Yetki otomatik genişletilmedi.
- Member metadata HTTP 200: bir üye, `Super Administrator - All Privileges` rolü.
  Kişi kimliği yazılmadı; token politikaları/user-group kapsamları tam envanter
  edilmedi. Least-privilege erişim kabulü verilmedi; rol/izin değiştirilmedi.
- Destination list API tam configuration/header değerleri döndürebildiğinden,
  secret okumama sınırını korumak için çağrılmadı. Mevcut credential'sız metadata
  görünümü veya sahibin redakte ayar dökümü gerekir; export yok kabul edilmedi.
- [Workers Logs dokümanı](https://developers.cloudflare.com/workers/observability/logs/workers-logs/)
  etkin logging için belirtilmemiş sampling'i 1 olarak tanımlar; Free/Paid için
  sırasıyla 3/7 günlük saklama ve kota üstü ücret olasılığı bildirir. Bunlar hesapta
  doğrulanmış ayarlar değildir. Kurulu şemadaki `redact_query_string=false`,
  `persist=true`, `destinations=[]` varsayılanları da eksik uzak alanlara uygulanmadı.
  Trace maliyeti/saklaması ayrıca plan teyidi gerektirir; kendiliğinden açılmayacak.

Önerilen fakat henüz **onaylanmamış/uygulanmamış** hedef politika: yalnız gerekli
structured logları tutmak, query redaksiyonunu her desteklenen yüzeyde açmak,
path-token için kanıtlanmış çözümü önce seçmek, açıkça onaylı saklama/erişim/export
sınırı belirlemek. Sampling/visibility düşürerek test geçirme yoktur. Uzak hesaba
bu politikanın yazılması ve kalıcı kayıtta pozitif event + negatif canary kabulü
ayrı yetki ve test ister; yeni dashboard/log veritabanı kapsam dışıdır.

### Deployment ilişkisi ve yayın önkoşulu

Aktif deployment `134ed9d3-7393-4060-9b12-7044bc01969e` (2026-10-09T22:28:22Z)
yüzde 100 version `1bdc7d4a-6dcd-4755-bbc7-1a324a332ad0` kullanıyor; version kaynağı
Wrangler, yalnız triggered-by annotation var, commit etiketi yok. Yerel HEAD
`c00299506e08fcdc1659dbbfa72eae786e7e9ca4` ve TASK-005 değişiklikleri 16 Ekim
commit'lerinde. Header yokluğu yerine gerçek version metadata'sı incelendi;
birebir artefakt/commit eşleşmesi kurulamadı ve staging kabulü iddia edilmedi.

İleride yayın onayı istenirken hedef yalnız `freelancercrm-staging` olmalı;
dağıtılacak incelenmiş SHA/çalışma ağacı ve artefakt digest'i kaydedilmeli, native
değil izole Workers staging build'i kullanılmalı, gerekli observability kararları
ve mevcut test secret'larının korunması açıklanmalıdır. Geri dönüş adayı yukarıdaki
mevcut version'dır; version rollback'in non-versioned settings/secret değişikliklerini
geri almadığı ayrıca hesaba katılmalıdır. Uyumlu ayar snapshot'ı/geri dönüş planı
olmadan yayın yoktur. Test fixture'ları staging'de bilerek kapalıdır; yerel diagnostic
testini yalnız staging URL'sine yönlendirmek gerçek kabul sağlamaz.

Gerçek HTTPS kabulü için ayrıca yalnız test Supabase ortamında sentetik hesap ve
ürün kayıtları oluşturma, gerçek SDK cookie refresh/logout ve kontrollü hata üretme
işlemleri açıklanıp onaylanmalıdır. Gerçek e-posta/gerçek token fixture'ı kullanılmaz;
mevcut kayıt silme/reset yapılmaz. Sahip olunan test verisinin temizliği de onay
kapsamında açık olmalıdır. Bu tur bu işlemler yapılmadı.

### Kök lint: onaylı sahiplik düzeltmesi

İlk yeniden üretim aynı 15 require-import hatası/1 unused uyarısını verdi. Yedi
dosya `.gitignore` kapsamındaki proje-içi üçüncü taraf ClaudeKit 1.0.0 CLI'larıydı.
Kullanıcı açıkça sürümlenen ESM uyarlamasını onayladı. Native ESM sürümleri,
hash-pinned opt-in installer, regression testleri ve provenance notu
`scripts/vendor/claudekit` altında sürümlendi; ignored dosyalar yalnız CLI launcher
oldu. Orijinal yedi dosya `.upstream` olarak korundu ve manifest SHA-256'larıyla
eşleşmeleri doğrulandı. Genel agent ortamı, ignore dosyası veya lint kuralı
değiştirilmedi. Kök lint kapsamı yeni kaynakları da kapsayacak şekilde genişledi;
Next lint root'u mutlak app dizinine sabitlendi. Temiz checkout'ta bu optional
paketler yoksa installer hiçbir şey yaratmaz; testler ignored girdilere dayanmaz.
Yerel/upstream değişikliği bilinmiyorsa installer üzerine yazmak yerine durur.

### Bu tur yeniden çalıştırılan kontroller

Format, kök lint, typecheck, 93 unit, 20 integration, 79 CI/politika (9 yeni CLI
uyarlama regresyonu dahil), actionlint/workflow doğrulaması, native ve Workers
build'leri, native ve gerçek workerd correlation/canary kabulü geçti. Browser/axe
kapsamında 40 native ve 40 gerçek workerd testi geçti. `workers:check` mevcut
Turbopack loader kısmi desteğini raporlar; gerçek build/runtime sonucu ayrıca
doğrulandı. Secret self-test ve 326 repo dosyası + Git geçmişi taraması temiz.

`test:observability:platform-urls` yine başarısız: path görüldü, query görülmedi.
Bu yerel Wrangler kanıtıdır; uzak ayar sonrası kabul yerine geçmez. Bu tur dört
`tests/workers/auth-runtime.spec.ts` testi ve gerçek SDK Auth/ürün senaryoları
yeniden çalıştırılmadı; `test:workers:runtime` ve `test:observability:product`
komutlarının tam geçtiği iddia edilmez. Uzak HTTPS Auth, sentetik veri oluşturma,
kalıcı log kaydı/canary, yeni canlı tail veya deployment yapılmadı. Önceki
Auth kanıtları tarihsel olarak korunur, güncel staging kabulüne dönüştürülmez.

## Yeniden doğrulama ve C tasarımı — 2026-10-19

Güncel kaynak ve çalışma ağacı yeniden incelendi; önceki ESM portları/installer ve
kullanıcı değişiklikleri korundu. Request ID/logger üretim kodu, `plan.md`,
dependency lockfile ve güvenlik kapıları değiştirilmedi. Yeni uygulama değişikliği
yerine URL-canary harness'i sertleştirildi: audit public API'nin güvenli 404 zarfını,
header/body requestId eşleşmesini ve **aynı isteğin** ingress/operation/response
loglarını görmeden karar vermez. Parse/bağlantı/sıfır event başarısızlığı gizlilik
başarısı olamaz. HTTP cevabında doğal URL varlığı log sızıntısı sayılmadı.

- Format, kök lint, typecheck, 93 unit, 20 integration, 79 CI/politika,
  actionlint/workflow, native ve Workers build'leri yeniden geçti. Native browser
  40; gerçek workerd browser **44**, önceki turda atlanan dört Auth testi dahil.
  `test:workers:runtime` tam çalıştı; ayrıca native
  `test:observability:product` altı gerçek SDK ürün/Auth kontrolünü geçti.
  Workerd ürün koşusu da altı kontrolü ve sahip olunan sentetik hesabın temizliğini
  başarıyla raporladı. Bu sayılar önceki turdan devralınmadı.
- Gerçek SDK testleri için yeni açık onay alındı. Docker ve mevcut yerel Supabase
  reset yapılmadan başlatıldı; host portları 127.0.0.1 olarak doğrulandı. Kayıt,
  profil/müşteri/teklif, yalnız koşunun cookie'sinde expiry zorlaması ile refresh,
  Set-Cookie, logout/redirect ve requestId kontrolleri yapıldı. Yalnız oluşturulan
  sentetik hesap/bağlı kayıtlar temizlendi; mevcut veriye/reset'e/gerçek e-postaya
  dokunulmadı. Supabase geliştirme için çalışır bırakıldı; test sunucuları kapandı.
- `test:observability:platform-urls` yine **başarısız**:
  `positiveControlObserved=true`, `pathExposed=true`, `queryExposed=false`,
  `wranglerOutput=true`. İlgili event'in görüldüğü kanıtlandı; ham canary/log
  yazılmadı. Bu yerel access-log kanıtıdır, uzak platform sonucu değildir.
- Yeni salt-okunur uzak onayla aynı staging deployment/version yeniden görüldü:
  `134ed9d3-7393-4060-9b12-7044bc01969e` / `1bdc7d4a-6dcd-4755-bbc7-1a324a332ad0`,
  9 Ekim, yüzde 100; güncel HEAD annotation'ı yok. Uzak kaynak–yerel artefakt
  birebir eşleşmesi ve doğru sürümde HTTPS E2E hâlâ kanıtlanmadı.
- Endpoint ayrımı güncel resmî API ile düzeltildi: `/settings` yanıtında
  observability alanı yok; belgelenen script-level `/script-settings` yanıtında
  **alan var, değer null**. Logpush false; önceki endpoint consumer sayısı sıfır.
  Null/missing değer enablement/invocation/persist/sampling/redaksiyon/destinations
  için true/false/default sayılmadı. Account modeli standard; subscriptions tekrar
  HTTP 403. Member metadata yine bir Super Administrator rolü; kimlikler yazılmadı,
  tam token/group erişim envanteri kabulü verilmedi. Secret içerebilen destination
  configuration endpoint'i okunmadı; export/retention/ücret belirsizliği sürer.
  [Script-level settings API](https://developers.cloudflare.com/api/resources/workers/subresources/scripts/subresources/settings/methods/get/)
- Güncel resmî belgeler ve kurulu Wrangler 4.149.0 şeması tekrar incelendi.
  `redact_query_string` logs/traces query'si için belgelenir; path ve tüm canlı
  tail/framework yüzeylerine garanti oluşturmaz. TailRequest heuristikleri ve
  getUnredacted ayrımı sürer. Tüm yüzeylere uygulanmış path sanitizer doğrulanmadı.
  Yeni canlı tail, uzak HTTP testi, kalıcı log sorgusu, deployment veya platform
  ayar değişikliği yapılmadı; staging diagnostic fixture'ları açılmadı.

Kullanıcı C seçeneğinin **yalnız tasarımını** istedi.
[INGRESS_RELAY_DESIGN.md](INGRESS_RELAY_DESIGN.md) haricî denetlenebilir HTTPS
gateway → sabit safe transport URL → doğrulanan Worker relay sınırını, mevcut
public link/Auth/SSR, JS gereksinimi, cookie/stream/cache, eski workers.dev linkleri,
masraf/operasyon ve rollback etkilerini açıklar. Orijinal secret URL'nin framework'e
yeniden verilmesi veya Cloudflare Worker'ını öne koymak çözüm kabul edilmez.
Canonical domain, gateway hosting/bütçe ve eski link politikası belirlenmeden yerel
PoC/uygulama yapılmadı. C seçimi deployment, kaynak kurma veya token modeli onayı
değildir; TASK-005 `[ ] — Kısmi` kalır.

## Yeni onaylarla uygulama ve güncel kabul — 2026-10-19

Önceki bölüm tarihsel koşuyu anlatır. Bu tur yeni salt-okunur metadata, yerel
sentetik SDK testleri ve **yalnız localhost C PoC** için ayrı onay alındı.
[Kabul matrisi ve komut günlüğü](TASK_005_ACCEPTANCE.md) tüm zorunlu kriterleri,
kanıtları ve eksik yetkileri ayrı izler. [PoC kullanımı](scripts/relay-poc/README.md)
gerçek workerd üzerinde sabit URL/AES-GCM zarfı, doğrulanmış ID, replay/SSRF
sınırları, iki cookie, redirect/stream ve log-canary için dokuz test içerir.
Gerçek SDK callback veya ürün/Server Action relay entegrasyonu değildir.

Bu tur 93 unit, 20 integration, PoC dahil 88 CI/politika, 40 native ve 44 workerd
browser (dört Auth dahil), iki runtime'da altışar gerçek SDK/ürün kontrolü geçti.
Mevcut yerel Supabase çalışıyordu; reset/servis başlatma gerekmedi. Yalnız koşunun
ürettiği veri temizlendi. Gateway/workerd dispose edildi; uzak tail açılmadı.
Asıl uygulamanın URL audit'i pozitif event'e rağmen yine path-canary ile başarısız;
PoC bu başarısızlığı veya uzak kabulü kapatmaz. Request/logger üretim kodu korunur.

Kullanıcı Free plan/kullanım 0, 3 gün log ve 7 gün trace saklama bildirdi.
[Workers Logs](https://developers.cloudflare.com/workers/observability/logs/workers-logs/)
Free için 200.000 event/gün ve 3 gün saklamayı;
[traces](https://developers.cloudflare.com/workers/observability/traces/) 7 gün
saklamayı doğrular. Belgeler 1 Aralık 2026 fiyat değişikliği bildirir.
Sampling/persist için bildirilen varsayılanlar, destination türleri ve izin adları
**etkin staging ayarları/atanmış roller değildir**. Persist=false tek başına export
oluşturmaz. Script-settings yine observability:null; subscription 403; logpush
false ve tail consumer sayısı sıfır. Enablement/invocation/sample/persist/query
redaksiyonu, OTLP hedefleri ve token/grup kapsamları hâlâ bilinmiyor.
Kalıcı event/trace okunmadı; kullanıcı verisi veya secret incelenmedi.

`plan.md` §27 staging için satın alınmış domain istemez; doğrulanmış HTTPS/Auth
adresleri ister. [workers.dev](https://developers.cloudflare.com/workers/configuration/routing/workers-dev/)
özel domain olmadan Worker yayınlamaya izin verir. Mevcut hassas URL modeliyle
Workers.dev ilk hop kalırsa gizlilik sorunu çözülmez. Custom domain'i aynı Worker'a
bağlamak yeterli değildir. C gateway için denetlenebilir haricî HTTPS hostname'i
gerekir; satın alınmış domain veya uygun sağlayıcı hostname'i ayrı değerlendirilmeli.
Workers.dev güvenli sabit upstream kalabilir. Hosting/bütçe/entegrasyon, hedef log
politikası, yayın/rollback ve staging test izinleri verilmeden uzak değişiklik yok.
Rollback version kadar gateway/config/secret/DNS/Auth allowlist'i de kapsamalıdır.

## Son politika bilgisi — 2026-10-19

Kullanıcı ek bütçeyi **0; yalnız ücretsiz seçenekler** olarak belirledi ve hesap/Worker
OTLP destinations, tail consumers, metrics export ve saved queries olmadığını
bildirdi. Bu, kullanıcı kaynaklı metadata teyididir; bu yanıttan sonra yeni uzak
okuma yapılmadı. Observability:null hâlâ etkin logs/traces/invocation/sample/persist
ve query redaksiyonunu kanıtlamaz; tüm varsayılanlar uygulanıyor sonucu çıkarılmaz.
Saved query olmaması log tutulmadığı anlamına gelmez. Traces veya OTLP destination
eklenmedi; gizlilik açığını bunları ekleyerek çözmüş saymayız.

Resmî settings API'de `redact_query_string` vardır; logs/traces query'si için
belgelenir, path-token ve tüm yüzey garantisi değildir. Ücretsiz gateway adayları ve
kanıt boşlukları [kabul matrisinde](TASK_005_ACCEPTANCE.md) kaydedildi. Render inbound
trafiğinde Cloudflare kullanır; Koyeb'in ücretsiz staging seçeneğinde ise ilk hop
log gizliliği doğrulanmadı. Henüz güvenli sağlayıcı seçimi veya yeni yayın yok.

## Koyeb araştırma yanıtı — 2026-10-19

Sonraki Koyeb araştırma yanıtı (2026-10-19): kullanıcı ücretsiz tek servis sınırlarını
teyit etti; edge path/query loglama/redaksiyon/retention hâlâ bilinmiyor. Pro/build
log süreleri ve DPA rol bilgisi ücretsiz edge gizliliği garantisi sayılmadı. TLS URL
görünürlüğü tek başına sızıntı, eksik doküman da gizlilik başarısı değildir. Koyeb
seçilmedi; yeni hesap, kaynak, destek mesajı, ayar değişikliği veya deployment yok.
Sağlayıcının yazılı teyidi ve ardından ayrıca onaylı gerçek sentetik kabul gerekiyor.

Resmî fiyat SSS'sinde kayıt sırasında kart provizyonu ve seçili ücretli plan için
orantılı ücret riski de var; ücretsiz instance, ücretsiz kayıt garantisi sayılmadı.
0 bütçeyle kayıt/ödeme adımı başlatılmaz.

## Yerel kabul kanıtı — 2026-10-15

- Native Next.js ve gerçek workerd: eşzamanlı bağımsız ID'ler; ingress → operation → log → header/JSON; Server Action ve server-render hata ekranı; sentetik header/form/Error canary gizliliği; iki Set-Cookie, redirect, streaming, public API 404 ve statik asset cache sınırı doğrulandı.
- Yerel ürün/Auth: kayıt → onboarding → müşteri → teklif; yalnız sahip olunan sentetik cookie'nin expires_at alanı değiştirilerek gerçek SDK refresh/Set-Cookie; logout redirect ve cookie temizliği iki runtime'da geçti. SDK cookie base64/chunk biçimi ve expiry eşiği kurulu kaynaklardan doğrulandı. Gerçek token fixture dosyasına veya loga yazılmadı; mevcut kullanıcılar korunarak yalnız bu koşunun ürettiği sentetik hesaplar temizlendi, DB reset yapılmadı.
- 93 Vitest, 20 node:test integration, 70 CI/politika, 40 native ve 44 Workers Playwright/axe testi; format/typecheck/build, actionlint, uygulama kaynak lint'i ve secret scan/self-test geçti. Workers compatibility check mevcut Turbopack kısmi desteğini raporlar; gerçek runtime testi ayrıca geçti.
- Kök `npm run lint` mevcut, Git'te izlenmeyen `.cursor/skills` CommonJS betiklerinde 15 hata/1 uyarıyla başarısız; lint kuralı/ignore/CI kapısı gevşetilmedi. Yerel otomatik URL log kontrolü path canary nedeniyle başarısızdır. Bu iki sonuç ve uzak staging/platform kabulü kapanmadan TASK-005 tamamlanmış sayılmaz.
- Kaynak CI'ya native correlation kapısı eklendi; workerd harness'i de aynı kabulü çalıştırır. Workflow politika testi bu native kapının kaldırılmasını reddeder. Uzak PR/CI, deployment ve platform ayar doğrulaması yapılmadı.
