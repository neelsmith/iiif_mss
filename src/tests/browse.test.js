"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Cex = require("../cex.js");
const B = require("../browse.js");

const rel = Cex.parseRelease(fs.readFileSync(path.join(__dirname, "fixtures", "sample.cex"), "utf8"));
const { texts, textindex, mss } = rel;
const ILIAS = "urn:cts:greekLit:tlg0012.tlg001:";

test("viewerUrl and portalUrl encode only unsafe characters", () => {
  assert.equal(B.viewerUrl(" https://e.org/a b/m.json "), B.VIEWER + "https://e.org/a%20b/m.json");
  assert.equal(B.viewerUrl("https://e.org/m?x=[1]&y=é"), B.VIEWER + "https://e.org/m?x=[1]&y=%C3%A9");
  assert.equal(B.portalUrl("ark:/43093/mdata1"), "https://portail.biblissima.fr/ark:/43093/mdata1");
});

test("manuscriptCounts counts distinct manuscripts per work", () => {
  const c = B.manuscriptCounts(textindex);
  assert.equal(c.get(ILIAS), 4);
  assert.equal(c.get("urn:cts:greekLit:tlg0012.tlg002:"), 1);
});

test("groupOptions: sorted case-insensitively, with work counts", () => {
  assert.deepEqual(B.groupOptions(texts).map((o) => o.label),
    ["cicero (1 work)", "Homerus (2 works)", "Vergilius (2 works)"]);
  assert.equal(B.groupOptions(texts)[1].value, "Homerus");
});

test("workOptions: labels carry MS counts; duplicate labels get the URN", () => {
  const counts = B.manuscriptCounts(textindex);
  assert.deepEqual(B.workOptions(texts, "Homerus", counts).map((o) => o.label),
    ["Ilias (4 MSS)", "Odyssea (1 MS)"]);
  const verg = B.workOptions(texts, "Vergilius", counts);
  assert.deepEqual(verg.map((o) => o.value),
    ["urn:cts:latinLit:phi0690.phi001:", "urn:cts:latinLit:phi0690.phi003:"]);
  assert.deepEqual(verg.map((o) => o.label), ["Aeneis (2 MSS)", "Aeneis (1 MS)"]);
  // Identical labels are told apart by URN.
  const twins = [
    { urn: "u1", group: "G", work: "W" },
    { urn: "u2", group: "G", work: "W" },
  ];
  assert.deepEqual(B.workOptions(twins, "G", new Map()).map((o) => o.label),
    ["W (0 MSS)", "W (0 MSS) [u2]"]);
});

test("manuscriptsForWork: merges manifests and locations; skips manuscripts without manifests", () => {
  const e = B.manuscriptsForWork(ILIAS, textindex, mss);
  assert.deepEqual(e.map((x) => x.ark), ["ark:/5", "ark:/1", "ark:/2", "ark:/4"]);
  const first = e.find((x) => x.ark === "ark:/1");
  assert.deepEqual(first.locations, ["1r-20v", "30"]);
  assert.deepEqual(first.manifests, ["https://example.org/a1/manifest.json", "https://example.org/a1-second/manifest.json"]);
  // ark:/9 is in the index but not in mss: skipped
  assert.equal(B.manuscriptsForWork("urn:cts:latinLit:phi0690.phi001:", textindex, mss).length, 1);
});

test("manuscriptsForWork: sorted by collection then label; blank collection first", () => {
  const e = B.manuscriptsForWork(ILIAS, textindex, mss);
  assert.deepEqual(e.map((x) => x.collection), ["", "Lib A", "Lib A", "Lib C"]);
});

test("manuscriptCollections: blank collection becomes (none recorded)", () => {
  const h = B.manuscriptCollections(mss);
  assert.equal(h.get("ark:/5"), B.NO_COLLECTION);
  assert.equal(h.get("ark:/1"), "Lib A");
});

test("collectionOptions: only collections with indexed texts, with MS counts", () => {
  const h = B.manuscriptCollections(mss);
  assert.deepEqual(B.collectionOptions(textindex, h).map((o) => o.label),
    ["(none recorded) (1 MS)", "Lib A (3 MSS)", "Lib B (1 MS)", "Lib C (1 MS)"]);
});

test("collectionWorkOptions: first entry is All", () => {
  const h = B.manuscriptCollections(mss);
  const o = B.collectionWorkOptions("Lib A", textindex, texts, h);
  assert.equal(o[0].value, B.ALL);
  assert.equal(o[0].label, "All (3 works in 3 manuscripts)");
  assert.deepEqual(o.slice(1).map((x) => x.label),
    ["Homerus - Ilias (2 MSS)", "Homerus - Odyssea (1 MS)", "Vergilius - Aeneis (1 MS)"]);
});

test("entriesForCollection: one work gives locations; All gives per-work lines", () => {
  const one = B.entriesForCollection("Lib A", ILIAS, textindex, texts, mss);
  assert.deepEqual(one.map((e) => e.ark), ["ark:/1", "ark:/2"]);
  assert.deepEqual(one[0].locations, ["1r-20v", "30"]);
  assert.equal(one[0].collection, "");
  const all = B.entriesForCollection("Lib A", B.ALL, textindex, texts, mss);
  assert.deepEqual(all.map((e) => e.ark), ["ark:/1", "ark:/2", "ark:/6"]);
  assert.deepEqual(all[0].works, [["Homerus - Ilias", ["1r-20v", "30"]], ["Homerus - Odyssea", []]]);
});

test("renderManuscriptsHtml: escapes text, numbers several manifests, links to portal", () => {
  const e = B.entriesForCollection("Lib A", B.ALL, textindex, texts, mss);
  const html = B.renderManuscriptsHtml(e);
  assert.match(html, /Lib A, MS 6 &lt;b&gt;/);
  assert.doesNotMatch(html, /<b>/);
  assert.match(html, /View images 1 &#9656;/);
  assert.match(html, /View images 2 &#9656;/);
  assert.match(html, /href="https:\/\/portail\.biblissima\.fr\/ark:\/1"/);
  assert.match(html, /Homerus - Ilias &mdash; 1r-20v; 30/);
});

test("renderManuscriptsHtml: single manifest has an unnumbered button", () => {
  const e = B.manuscriptsForWork("urn:cts:latinLit:phi0690.phi003:", textindex, mss);
  const html = B.renderManuscriptsHtml(e);
  assert.match(html, /View images &#9656;/);
  assert.match(html, /manifest%20with%20space\.json/);
  assert.match(html, /location: 5-9/);
});
