import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", String(process.pid) + "-" + String(Date.now()));
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
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

test("server-renders the Kapsam onboarding experience", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  assert.equal(response.headers.get("referrer-policy"), "no-referrer");
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.equal(response.headers.get("x-frame-options"), "DENY");

  const html = await response.text();
  assert.match(html, /<html lang="tr">/i);
  assert.match(html, /<title>Kapsam — Freelancer teklif deneyimi · Kapsam<\/title>/i);
  assert.match(html, /name="robots" content="noindex, nofollow, nocache"/i);
  assert.match(html, /Seni tekliflerine doğru biçimde yansıtalım/);
  assert.match(html, /Demo verileriyle geç/);
  assert.match(html, /NovaWorks/i);
  assert.match(html, /66\.000 TL/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape|react-loading-skeleton/i);
});

test("keeps the clickable prototype scope and safeguards explicit", async () => {
  const [page, layout, prototype, css, packageJson] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/prototype-app.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  assert.match(page, /<PrototypeApp \/>/);
  assert.match(page, /index:\s*false/);
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
