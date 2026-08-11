import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { access, readFile } from "node:fs/promises";
import { createServer } from "node:net";
import { after, before, test } from "node:test";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath } from "node:url";

const HOST = "127.0.0.1";
const appDirectory = fileURLToPath(new URL("..", import.meta.url));
const nextCli = fileURLToPath(
  new URL("../node_modules/next/dist/bin/next", import.meta.url),
);

let nextServer;
let serverLog = "";
let serverPort;

before(async () => {
  serverPort = await findAvailablePort();
  nextServer = spawn(
    process.execPath,
    [nextCli, "start", "--hostname", HOST, "--port", String(serverPort)],
    {
      cwd: appDirectory,
      env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );

  nextServer.stdout.on("data", appendServerLog);
  nextServer.stderr.on("data", appendServerLog);
  await waitForServer();
}, { timeout: 30_000 });

after(async () => {
  if (!nextServer || nextServer.exitCode !== null) return;

  nextServer.kill("SIGTERM");
  await Promise.race([once(nextServer, "exit"), delay(5_000)]);
  if (nextServer.exitCode === null) nextServer.kill("SIGKILL");
});

async function render(pathname = "/") {
  return fetch(`http://${HOST}:${serverPort}${pathname}`, {
    headers: { accept: "text/html" },
  });
}

function appendServerLog(chunk) {
  serverLog = (serverLog + chunk.toString()).slice(-20_000);
}

async function findAvailablePort() {
  const server = createServer();
  server.unref();
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, HOST, resolve);
  });

  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const { port } = address;
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
  return port;
}

async function waitForServer() {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    if (nextServer.exitCode !== null) {
      throw new Error(`Next.js server exited early.\n${serverLog}`);
    }

    try {
      const response = await render();
      if (response.ok) return;
    } catch {
      // The server may still be binding its port.
    }

    await delay(100);
  }

  throw new Error(`Next.js server did not become ready.\n${serverLog}`);
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
    readFile(new URL("../components/demo/demo-app.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/marketing/landing-page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/demo/prototype-app.tsx", import.meta.url), "utf8"),
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
  assert.doesNotMatch(packageJson, /vinext/i);

  await assert.rejects(access(new URL("../app/_sites-preview", import.meta.url)));
});
