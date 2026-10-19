# Yerel ingress/relay PoC

Onay kapsamı: yalnız localhost, sentetik context, gerçek workerd. Ürün entegrasyonu,
TLS gateway, uzak deployment, gerçek Auth exchange veya staging kabulü değildir.

Kökten `npm run test:relay:poc` çalıştırılır. Mevcut kilitli Miniflare/workerd
paketleri kullanılır; yeni bağımlılık veya hizmet gerekmez. Testler ayrıca
`npm run test:ci` içinde ve kök lint kapsamındadır.

`gateway.mjs` yalnız 127.0.0.1 üzerinde dinler. İlk sentetik URL'yi route enum'u ve
secret context'e ayırır; yalnız sabit localhost upstream `POST /_relay/v1` yoluna
AES-GCM zarfı yollar. Süre, audience, nonce, route ve requestId authenticated
metadata'dır. Dış request ID kabul edilmez. URL veya header'a secret eklenmez.
`worker.mjs` doğrulanmış context ile yalnız sentetik fixture dispatch yapar;
ürün framework'üne gizli URL yeniden verilmez. Şifreleme HTTPS yerine geçmez.

Dokuz test; zarf bozma/expiry/replay/kapasite, SSRF sınırı, logger allowlist'i,
12 paralel gerçek HTTP isteğinde ID izolasyonu ve beş eşleşen log aşaması,
güvenli hata, sentetik callback redirect'i, iki Set-Cookie, stream ve no-store
kontrollerini kapsar. Callback fixture'ı SDK/Auth kabulü değildir. Tek isolate
içindeki sınırlı nonce Map'i üretim/distributed replay koruması değildir.

Runtime stdout/stderr structured log kanalı ve verbose Miniflare logları test
süresince bellekte yakalanır; log seviyesi düşürülmez. Canary yokluğu ancak ilgili
pozitif event'ler gözlendiğinde kabul edilir. Harness ham log/canary fixture dosyası
yazmaz; bu, makinedeki bütün üçüncü taraf geçici dosyaların tarandığı iddiası
değildir. Haricî egress reddedilir. `after`/`finally` gateway'i kapatır ve workerd'ı
dispose eder; cleanup sonucu değer içermeyen özetle raporlanır.

Gerçek uygulamanın `test:observability:platform-urls` testi korunur ve mevcut
path-canary başarısızlığı bu PoC ile kapanmaz. Üretim gateway sağlayıcısının access,
error, crash, WAF ve export logları, TLS/host/CSRF/cookie/Server Action uyumu ve
kalıcı platform kayıtları ayrıca kanıtlanmalıdır. Yeni domain/hosting/maliyet,
mimari entegrasyon ve uzak testler için ayrı karar/onay gerekir.
