"use strict";
// Drives the built pages in a real browser, once opened as a local file and
// once served over HTTP. Data comes from the fixture through ?data=.
// Skipped when Playwright is not installed. Run `node src/build.js` first.
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");

let chromium = null;
try { ({ chromium } = require("playwright")); } catch (e) { /* skipped below */ }

const ROOT = path.resolve(__dirname, "..", "..");
const FIXTURE = path.join(__dirname, "fixtures", "sample.cex");

function startServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const url = req.url.split("?")[0];
      let file = null;
      if (url === "/sample.cex") file = FIXTURE;
      else if (/^\/browse(texts|collections)\.html$/.test(url)) file = path.join(ROOT, url);
      if (!file) { res.writeHead(404); res.end(); return; }
      res.writeHead(200, {
        "Content-Type": file.endsWith(".html") ? "text/html; charset=utf-8" : "text/plain; charset=utf-8",
        "Access-Control-Allow-Origin": "*",
      });
      res.end(fs.readFileSync(file));
    });
    server.listen(0, "127.0.0.1", () => resolve(server));
  });
}

async function labels(page, selector) {
  return page.$$eval(selector + " option", (os) => os.map((o) => o.textContent));
}

const skip = chromium ? false : "playwright is not installed";

test("pages work from a local file and from a server", { skip }, async (t) => {
  const server = await startServer();
  const base = "http://127.0.0.1:" + server.address().port;
  const browser = await chromium.launch();
  t.after(async () => { await browser.close(); server.close(); });
  const data = encodeURIComponent(base + "/sample.cex");

  const modes = {
    "file://": (name) => "file://" + path.join(ROOT, name) + "?data=" + data,
    "http://": (name) => base + "/" + name + "?data=" + data,
  };

  for (const [mode, urlFor] of Object.entries(modes)) {
    await t.test("browsetexts.html via " + mode, async () => {
      const page = await browser.newPage();
      const errors = [];
      page.on("pageerror", (e) => errors.push(String(e)));
      await page.goto(urlFor("browsetexts.html"));
      await page.waitForSelector("#controls select");
      assert.deepEqual(await labels(page, "#controls select"),
        ["Choose a text group…", "cicero (1 work)", "Homerus (2 works)", "Vergilius (2 works)"]);
      await page.selectOption("#controls select", { label: "Homerus (2 works)" });
      const selects = page.locator("#controls select");
      assert.equal(await selects.count(), 2);
      assert.deepEqual(await labels(page, "#controls label:nth-of-type(1) ~ div select"),
        ["Choose a work…", "Ilias (4 MSS)", "Odyssea (1 MS)"]);
      assert.match(await page.textContent("#results"), /Choose a work/);
      await selects.nth(1).selectOption({ label: "Ilias (4 MSS)" });
      assert.match(await page.textContent("#results h3"), /^4 manuscripts containing urn:cts:greekLit:tlg0012\.tlg001:$/);
      assert.match(await page.textContent("#results"), /location: 1r-20v; 30/);
      const hrefs = await page.$$eval("#results a", (as) => as.map((a) => a.href));
      assert.ok(hrefs.includes("https://neelsmith.github.io/iiif-cite/iiif-cite.html#manifest=https://example.org/a1-second/manifest.json"));
      assert.ok(hrefs.includes("https://portail.biblissima.fr/ark:/1"));
      // Changing the group clears the work and the results.
      await page.selectOption("#controls select", { label: "Vergilius (2 works)" });
      assert.match(await page.textContent("#results"), /Choose a work/);
      assert.deepEqual(errors, []);
      await page.close();
    });

    await t.test("browsecollections.html via " + mode, async () => {
      const page = await browser.newPage();
      const errors = [];
      page.on("pageerror", (e) => errors.push(String(e)));
      await page.goto(urlFor("browsecollections.html"));
      await page.waitForSelector("#controls select");
      assert.match(await page.textContent("#results"), /Choose a collection/);
      await page.selectOption("#controls select", { label: "Lib A (3 MSS)" });
      const selects = page.locator("#controls select");
      assert.equal(await selects.count(), 2);
      await selects.nth(1).selectOption({ label: "All (3 works in 3 manuscripts)" });
      assert.match(await page.textContent("#results h3"), /^3 manuscripts in Lib A$/);
      const text = await page.textContent("#results");
      assert.match(text, /Homerus - Ilias — 1r-20v; 30/);
      assert.match(text, /Lib A, MS 6 <b>/); // shown as text, not as markup
      assert.equal(await page.locator("#results b").count(), 0);
      assert.deepEqual(errors, []);
      await page.close();
    });

    await t.test("a failed load shows an error via " + mode, async () => {
      const page = await browser.newPage();
      const bad = encodeURIComponent(base + "/missing.cex");
      const url = mode === "file://"
        ? "file://" + path.join(ROOT, "browsetexts.html") + "?data=" + bad
        : base + "/browsetexts.html?data=" + bad;
      await page.goto(url);
      await page.waitForSelector("#status.error");
      assert.match(await page.textContent("#status"), /Could not load the data/);
      await page.close();
    });
  }
});
