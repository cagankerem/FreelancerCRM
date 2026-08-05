import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

async function render(pathname = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", String(process.pid) + "-" + String(Date.now()));
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${pathname}`, {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the Kapsam landing experience", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  assert.equal(response.headers.get("referrer-policy"), "no-referrer");
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.equal(response.headers.get("x-frame-options"), "DENY");

  const html = await response.text();
  assert.match(html, /<html lang="tr">/i);
  assert.match(html, /Hızlı teklif bağlantısı ve tek pencere yönetimi/i);
  assert.match(html, /Hızlı teklif bağlantısı, tüm tekliflerini tek pencerede görüntüleme\./i);
  assert.match(html, /Alpha sürümüne katıl/i);
  assert.match(html, /Nasıl çalışır\?/i);
  assert.match(html, /AI fiyat belirlemez; taslak kullanıcı onayıyla uygulanır\./i);
  assert.match(html, /Fiyat yükleniyor/i);
  assert.match(html, /66\.000 TL/);
  assert.match(html, /name="email"/i);
  assert.match(html, /name="persona"/i);
  assert.match(html, /name="consent"/i);
  assert.match(html, /Aydınlatma ve gizlilik özeti/i);
  assert.match(html, /Kart bilgisi istenmez/i);
  assert.match(html, /CANLI ÜRÜN TURU/i);
  assert.match(html, /Tekliflerinin nabzı/i);
  assert.doesNotMatch(html, /name="robots" content="noindex/i);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape|react-loading-skeleton/i);
});

test("keeps the guided product tour available at demo", async () => {
  const response = await render("/demo");
  assert.equal(response.status, 200);

  const html = await response.text();
  assert.match(html, /name="robots" content="noindex, nofollow, nocache"/i);
  assert.match(html, /CANLI ÜRÜN TURU/);
  assert.match(html, /ÜRÜN DEMOSU/);
  assert.match(html, /Örnek verilerle çalışır; yaptığın değişiklikler kaydedilmez/);
  assert.match(html, /Tekliflerinin nabzı/);
  assert.doesNotMatch(html, /Seni tekliflerine doğru biçimde yansıtalım/);
  assert.match(html, /NovaWorks/i);
});

test("keeps the landing and clickable prototype contracts explicit", async () => {
  const [page, demoPage, demoApp, landing, layout, prototype, css, packageJson] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/demo/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/demo-app.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/landing-page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/prototype-app.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  assert.match(page, /<LandingPage \/>/);
  assert.match(demoPage, /<DemoApp \/>/);
  assert.match(demoPage, /index:\s*false/);
  assert.match(demoApp, /layout\?: "page" \| "embedded"/);
  assert.match(demoApp, /<PrototypeApp mode="demo" layout=\{layout\} \/>/);
  assert.match(landing, /kapsam-alpha-price-v1/);
  assert.match(landing, /kapsam-alpha-waitlist-v1/);
  assert.match(landing, /kapsam-alpha-events-v1/);
  assert.match(landing, /invalid-email/);
  assert.match(landing, /storage-error/);
  assert.match(landing, /waitlist_submit_duplicate/);
  assert.match(landing, /pricing_view/);
  assert.match(landing, /useSyncExternalStore/);
  assert.match(landing, /<DemoApp layout="embedded" \/>/);
  assert.doesNotMatch(landing, /<iframe/i);
  assert.ok(landing.indexOf('className="lp-hero lp-section"') < landing.indexOf('className="lp-preview lp-section"'));
  assert.ok(landing.indexOf('className="lp-preview lp-section"') < landing.indexOf('className="lp-transformation lp-section"'));
  const navSource = landing.slice(landing.indexOf('<nav aria-label="Ana navigasyon">'), landing.indexOf("</nav>"));
  assert.match(navSource, /href="#urun">Ürün/);
  assert.match(navSource, /href="#problem-cozumu">Problem Çözümü/);
  assert.match(navSource, /href="#nasil-calisir">Nasıl Çalışır\?/);
  assert.match(navSource, /href="#fiyatlandirma">Fiyatlandırma/);
  assert.doesNotMatch(navSource, />Güven</);
  assert.match(landing, /id="urun"/);
  assert.match(landing, /id="problem-cozumu"/);
  assert.match(landing, /FieldGroup/);
  assert.match(landing, /NativeSelect/);
  assert.match(landing, /Checkbox/);
  assert.match(landing, /Görüntülenme verileri yaklaşık sinyaldir/);
  assert.match(layout, /<html lang="tr">/);
  assert.match(prototype, /"onboarding"/);
  assert.match(prototype, /"dashboard"/);
  assert.match(prototype, /"editor"/);
  assert.match(prototype, /"detail"/);
  assert.match(prototype, /"public"/);
  assert.match(prototype, /AI fiyat belirlemez/);
  assert.match(prototype, /3 alan için taslak hazır/);
  assert.match(prototype, /followUpScenarioCopy/);
  assert.match(prototype, /kapsam-prototype-state-v1/);
  assert.match(prototype, /CANLI ÜRÜN TURU/);
  assert.match(prototype, /demo-experience--embedded/);
  assert.match(prototype, /!isEmbedded && window\.location\.hash/);
  assert.match(prototype, /isDemo \|\| !hydrated/);
  assert.match(prototype, /#musteri-teklifi/);
  assert.match(prototype, /Düzenlediğin mesaj değiştirilsin mi/);
  assert.match(prototype, /Bu belge fatura yerine geçmez/);
  assert.match(prototype, /Görüntülenme verileri.*yaklaşık olabilir/s);
  assert.match(prototype, /elektronik imza veya hukuki kimlik doğrulaması değildir/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(css, /env\(safe-area-inset-bottom\)/);
  assert.match(css, /max-height:\s*calc\(100dvh - 32px\)/);
  assert.match(css, /@media \(max-width:\s*560px\)/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);

  await assert.rejects(access(new URL("../app/_sites-preview", import.meta.url)));
});
