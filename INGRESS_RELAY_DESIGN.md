# TASK-005 — Sınırlı ingress/relay tasarımı

Tarih: 2026-10-19. İlk durum: **taslak, uygulanmadı**. Kullanıcı C seçeneğinin
tasarımını istedi; kaynak kurma, DNS/secret/ayar değiştirme, deployment, token
modeli değiştirme veya uzak test verisi oluşturma yetkisi vermedi. Normatif
`plan.md` değiştirilmedi. Bu belge bir güvenlik kabulü veya tamamlanma kanıtı değil.

## Güncel durum — yerel PoC onaylandı ve uygulandı

Sonraki açık onayla yalnız localhost prototipi geliştirildi:
[PoC kullanımı ve sınırları](scripts/relay-poc/README.md). Dokuz test gerçek workerd
üzerinde geçti; ürün rotaları, Auth SDK dispatcher'ı, uzak ayarlar ve DNS değişmedi.
Aşağıdaki önceki onay kapıları tarihsel tasarım bağlamıdır; yerel PoC izni artık
alınmıştır, üretim entegrasyonu/deployment izni alınmamıştır.

`plan.md` §27 staging için satın alınmış domain şartı koymaz; doğrulanmış HTTPS
Workers adresi ve Auth allowlist ister. `workers.dev` ile işlevsel staging mümkündür.
Ancak C topolojisinde public ilk hop mevcut workers.dev olamaz: ilk hassas URL yine
Cloudflare'a ulaşır. Workers.dev yalnız sabit güvenli upstream olarak kalabilir.
Özel domain'i aynı Worker'a bağlamak da sanitization değildir. Denetlenebilir haricî
gateway için kullanıcı domain'i veya uygun sağlayıcı HTTPS hostname'i araştırılabilir;
domain satın alma zorunluluğu ve ücretsiz hosting varsayılmaz. Sağlayıcı/bütçe ve eski
link kararı henüz yok; kullanıcının şu anda canonical domain'i yoktur.

## Sonuç ve önerilen sınır

Son kullanıcı kararı: ek bütçe **0**, yalnız ücretsiz seçenekler. Ücretsiz hizmet
oluşturma/hesap açma/otomatik ücretli yükseltme izni yok. Matrisin ücretsiz adaylar
bölümünde Render'ın Cloudflare ilk hop bağımlılığı ve Koyeb'de henüz kanıtlanmamış
edge log politikası kayıtlıdır; ikisi de tamamlanmış güvenli çözüm sayılmaz.

Hassas ilk HTTP URL'sini alan katman Cloudflare Workers olmamalı; bunun yerine
log davranışı denetlenebilen küçük bir HTTPS gateway olmalı. Gateway URL'deki
paylaşım verifier'ını ve Auth callback kodunu **Cloudflare'a gönderilen yeni HTTP
isteğinin URL'sine koymadan**, doğrulanmış bir relay zarfıyla uygulamaya aktarır.
Mevcut public route biçimleri korunabilir. Bu, Worker içinde gelen Request'in
URL'sini değiştirme önerisi değildir: Cloudflare'ın aldığı ilk URL zaten sabittir.

```text
Tarayıcı — mevcut /p/[shareToken] veya /auth/callback?code=…
   ↓ HTTPS; kullanıcının kontrolündeki canonical uygulama domain'i
Denetlenebilir gateway — orijinal URL'yi burada görür, güvenli route sınıflarını loglar
   ↓ yeni HTTPS POST /_relay/v1; hassas bağlam URL/header yerine korunan body'de
Uygulama Worker'ı — relay doğrulaması → safe-route dispatch → mevcut ürün işlemleri
   ↓ aynı requestId; status + bağımsız Set-Cookie + redirect veya response stream
Gateway → tarayıcı
```

Bu bir **tasarım çıkarımıdır**, Cloudflare'ın sunduğu hazır sanitizer değildir.
Gateway'in sağlayıcısı/load balancer'ı/WAF'ı/crash reporter'ı ham URL kaydediyorsa
sorun yalnız başka yere taşınmış olur; sağlayıcı seçimi ve kanıt olmadan çözüm yoktur.

## Neden basit bir reverse proxy yeterli değil?

- Bir Cloudflare Worker'ını diğerinin önüne koymak ilk Worker'ın orijinal URL
  metadata'sını temizlemez. Tail Worker export redaksiyonu da producer kayıtlarını
  geriye dönük değiştirmez.
- Gateway aynı secret path'i upstream'e proxy ederse Workers metadata riski sürer.
  Upstream URL'si sabit olmalı; Worker içinde de secret içeren URL yeniden
  oluşturulup framework'e verilmemeli. Aksi hâlde framework hata logları sızdırabilir.
- Public domain Cloudflare HTTP proxy'sinin arkasında kalırsa Cloudflare ilk URL'yi
  görmeye devam eder. DNS Cloudflare'da kalabilir; bu aday topolojide HTTP kaydı
  DNS-only veya eşdeğer doğrudan origin yönlendirmesi olmalı. Cloudflare'ın
  [DNS-only açıklaması](https://developers.cloudflare.com/dns/proxy-status/)
  HTTP trafiğinin origin'e doğrudan gittiğini, IP'nin açığa çıktığını ve o host için
  Cloudflare HTTP koruma/analitik avantajlarının kaybedildiğini belirtir.
- Mevcut `*.workers.dev` hostunu haricî gateway'e DNS ile taşıyamayız; domain
  Cloudflare tarafından yönetilir. Eski linkin redirect öncesi ilk isteği zaten o
  hosta gelir. Yeni canonical domain, eski link politikası ve callback allowlist'i
  ayrıca kararlaştırılmalı. [workers.dev](https://developers.cloudflare.com/workers/configuration/routing/workers-dev/)

## Bileşenler ve kapsam

| Bileşen | Sorumluluk | Yapmayacağı iş |
| --- | --- | --- |
| HTTPS gateway | TLS sonlandırma, host/route/method/body limitleri, güvenli olay logu, requestId üretimi, relay imzalama, streaming response aktarımı | Veritabanı/RLS/Auth yetkilendirmesi, token doğrulamasının yerine geçme, açık proxy olma |
| Worker relay kapısı | İmza/audience/süre/replay doğrulaması, yalnız izinli semantik route'lara dispatch, güvenilir requestId context'i | İnternetten gelen sıradan `X-Request-ID` veya `X-Forwarded-*` değerlerine güvenme |
| Mevcut ürün/Supabase katmanı | Aynı token verifier, yayın/expiry/revoke kontrolleri, Auth SDK ve sahiplik/RLS | Gateway imzasını kullanıcı yetkisi veya idempotency sayma |

En küçük aday: bir gateway + mevcut uygulama Worker'ında doğrulanan relay kapısı.
Bu Worker **network-private değildir**; yalnız relay sözleşmesiyle erişim kısıtlıdır.
Doğrudan public ürün yolu erişimi uygulama girişinde reddedilir; bu ret kendi
başına platform metadata sanitization sağlamaz. Ayrı receiver + network üzerinden
erişilemeyen app Worker'ı istenirse ek bileşen ve inceleme gerekir.
[Service binding](https://developers.cloudflare.com/workers/runtime-apis/bindings/service-bindings/)
Worker'lar arası bir mekanizmadır; haricî gateway'in doğrudan private service binding
çağırabildiği varsayılmaz.

## Relay sözleşmesi — uygulama öncesi taslak

- Sabit transport path'i `/_relay/v1`; kullanıcı URL'sinden upstream host/path
  seçilmez. Sürüm, audience, canonical public origin, safe operation/route enum'u,
  semantik method, requestId, timestamp, nonce ve payload digest'i doğrulanır.
- Gateway dış requestId ve relay/forwarded başlıklarını siler. UUID v4'ü üretir;
  Worker yalnız doğrulanmış gateway zarfından gelen ID'yi aynı logical request'in
  ALS context'ine alır. HTTP-hop sayısı değiştiğinden bu güvenilir aktarım mevcut
  ingress üretim kuralının açık genişlemesidir; `plan.md` kapsam uyumu onaylanmalı.
- Sahte imza/host, bozuk envelope, bilinmeyen route, aşırı body ve süre aşımı sabit
  güvenli kodlarla reddedilir. Sırlar, imza ve nonce değerleri loga yazılmaz.
- Hassas bağlam (verifier, callback code, cookie, form girdisi) URL ve query yerine
  body'de taşınır. Savunma katmanı olarak AEAD ile şifrelenmiş context düşünülebilir;
  TLS, anahtar yönetimi ve uygulama allowlist'inin yerini tutmaz. Şifreleme ve imza
  anahtarları birbirinden/ortamlar arasında ayrılır; bu taslakta anahtar üretilmedi.
- Timestamp tek başına replay koruması değildir; nonce kullanmak da nonce tüketimi
  atomik değilse yeterli değildir. Mutasyon açılmadan önce kısa ömürlü, atomik
  replay-store veya eşdeğer kanıtlanmış mekanizma seçilmeli. Global/in-memory Set
  çoklu instance'ta yeterli değildir. Yeni storage/ücret gerekiyorsa ayrı onay.
- İlk PoC yalnız mevcut küçük form limitleriyle bounded request buffering yapabilir.
  Büyük dosya/request streaming için çözüm hazır sayılmaz; gelecekteki upload
  görevlerine sessizce kapsam genişletilmez. Response/SSE/RSC stream'leri buffer
  edilmeden backpressure/cancel ile aktarılmalı; süre yalnız response-ready süresi.

## Route ve Auth/SSR uyumu

| Akış | İç aktarım | Public davranış ve kabul |
| --- | --- | --- |
| `/p/[shareToken]` | Token yalnız korunan context'te; safe internal SSR renderer mevcut `publicProposal(token)` resolver'ını çağırır | Server-side verifier kontrolü ve noindex korunabilir; JS zorunluluğu yok. Yeni public session cookie'si/fragment modeli getirilmez. |
| `/api/public/proposals/[shareToken]` | Safe route enum + context; aynı resolver ve API zarfı | Aynı data/error/null/requestId ve uniform 404; token backend path'inde bulunmaz. |
| `/auth/callback?code=…` | Query gateway'de ayrıştırılır; canonical origin ile dar callback işlemi; mevcut PKCE verifier cookie SDK'ya aktarılır | Code exchange server-side kalır. Cookie domain/path/Secure/SameSite, Site URL, exact redirect allowlist ve reuse/expiry yeniden sınanmalı. Paylaşım çözümü Auth kabulü yerine geçmez. |
| `/app`, onboarding ve Server Action | Safe route/method, allowlisted framework başlıkları ve değişmemiş form payload'ı | React action kimliği, multipart, RSC/router başlıkları, Origin/CSRF ve redirect semantiği gerçek browser/workerd ile kanıtlanmalı. |
| Statik hashed asset'ler | Secret taşımayan sabit asset namespace'i | Mevcut cache/ETag/Vary korunur; bütün uygulamaya no-store uygulanmaz. |

Sadece orijinal URL'yi Worker içinde tekrar oluşturup eski Next/Vinext router'ına
vermek bu tasarımın kabul edilen uygulaması değildir. Hassas iki route için küçük
internal adapter/renderer gerekir; dış route aynı kalırken internal mimari değişir.
Bu adapter'ın mümkün ve sınırlı olduğu henüz PoC ile kanıtlanmadı. Native Next.js
geliştirme girişi ayrıca test edilir; Workers kabulünün yerine geçmez.

## Cookie, redirect, cache ve hata sınırları

- Çoklu Set-Cookie tek string'e virgülle birleştirilmez; ayrı ayrı korunur. Cookie
  değerleri gateway loguna veya relay auth header'ına taşınmaz. Auth logout/refresh
  gerçek SDK ile iki hop üzerinden ayrıca kanıtlanır.
- Redirect host'u yalnız canonical public origin veya açıkça izinli hedeflerdir.
  Upstream host'unu kullanıcıya sızdıran Location değerleri allowlist ile ele
  alınır; response body üzerinde genel regex rewrite yapılmaz.
- Framework kontrol akışları (redirect/notFound), status/noindex, content-type,
  güvenlik başlıkları ve stream davranışı korunur. Exception nesnesi/stack/body
  gateway veya Worker logger'ına yazılmaz; güvenli code + aynı requestId kullanılır.
- Auth/public-token akışları private/no-store kalır. Generic relay POST altında
  tüm cevapların cache politikasını aynı sanmak veya kullanıcılar arasında context
  cache'lemek yasaktır; asset cache ayrı key/namespace ister.
- Doğrudan backend'e bir saldırganın kendi hassas değerini URL olarak göndermesini
  global olarak önleme garantisi verilmez. Kabul, uygulamanın meşru akışlarında
  secret'ın backend URL'sine hiç üretilmemesi ve gateway kayıtlarının güvenli olmasıdır.

## Log politikası ve maliyet

Gateway'in uygulama/access/error/crash logları, provider invocation logları ve varsa
WAF/export yüzeyleri envanterlenir. Tüm gerekli olaylar görünür kalır; path/query
yerine safe route enum'u, requestId, sabit code, sonuç ve sınırlı süre loglanır.
Ham URL/body/cookie/PII yazmama hem erişim hem hata yolunda pozitif event + negatif
canary ile kanıtlanmalıdır; sonradan çıktı filtrelemek kabul değildir.

Cloudflare tarafında sabit URL yaklaşımı persisted/tail/trace alanlarının gerçekte
ne tuttuğunu test etme gereğini kaldırmaz. `redact_query_string` yine desteklenen
yüzeyler için savunma katmanıdır; log/trace enablement, persist, destinations,
retention ve erişim ayrıca açık politika ister. Mevcut staging'deki null/eksik
ayarlar veya subscription 403 bu tasarım tarafından giderilmiş sayılmaz.

Ek TLS gateway, trafik/egress, olası replay storage, sertifika yenileme, DDoS/rate
limit, işletim güncellemeleri ve kesinti riski vardır. Cloudflare HTTP korumasından
çıkan public host için eşdeğer koruma tasarlanmalı. Sağlayıcı, bölge, bütçe, SLA,
saklama süresi veya yeni ücretli kaynak seçilmedi; tasarım bunları ücretsiz saymaz.

## Sıradaki onay kapısı ve rollback

1. Kullanıcı canonical domain'in sahipliğini/uygunluğunu, gateway hosting/bütçe
   sınırını ve eski workers.dev linklerinin politikasını belirler. Eski linkin
   redirect'i ilk hop gizliliğini çözmez; rotasyon/iptal ayrı veri işlemi onayıdır.
2. Bunlar netleşince önce **yalnız yerel, ağdan yalıtılmış PoC** için kapsam onayı
   alınır: gateway + safe relay dispatch; sentetik context; gerçek platform sırrı
   veya domain değişikliği yok. Uygulama şartlarını değiştirecek noktalar normatif
   planla uzlaştırılmadan uygulanmaz.
3. Yerel PoC mevcut link biçimi/JS'siz SSR, Auth/Server Action, replay/SSRF/CSRF,
   çoklu cookie, stream/cache ve tüm log yüzeylerini geçmeden staging yayını yok.
4. Staging onayı daha sonra kesin Worker, incelenmiş SHA/artefakt digest'i, gateway
   sürümü, non-versioned config/secret/DNS/callback snapshot'ları ve maliyetle istenir.
   Sahip olunan sentetik verinin temizliği ayrıca belirtilir; fixture kapıları açılmaz.
5. Rollback yalnız Worker version rollback değildir. Gateway binary/config, DNS,
   origin/allowlist ve imza anahtarları birlikte ele alınır. Mevcut null/eksik log
   politikasına dönüş veya eski public URL'nin açılması gizlilik riskini geri
   getirebilir; güvenli bakım/503 modu, sızıntılı bypass'tan önce tercih edilmelidir.

Bu kapılar açıkken TASK-005 `[ ] — Kısmi` kalır. C tasarımının seçilmesi
platform gizliliği/staging E2E kabulü veya mimarinin uygulama onayı değildir.
