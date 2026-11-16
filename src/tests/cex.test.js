"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Cex = require("../cex.js");

test("splitLine: plain fields", () => {
  assert.deepEqual(Cex.splitLine("a|b|c"), ["a", "b", "c"]);
  assert.deepEqual(Cex.splitLine("a||c|"), ["a", "", "c", ""]);
});

test("splitLine: quoted field may contain the delimiter", () => {
  assert.deepEqual(Cex.splitLine('x|"A | B"|y'), ["x", "A | B", "y"]);
});

test("splitLine: doubled quote is a literal quote; mid-field quote is literal", () => {
  assert.deepEqual(Cex.splitLine('"say ""hi"""|z'), ['say "hi"', "z"]);
  assert.deepEqual(Cex.splitLine('5" pipe|z'), ['5" pipe', "z"]);
});

test("splitLine: quoted field at end of line", () => {
  assert.deepEqual(Cex.splitLine('a|"b|c"'), ["a", "b|c"]);
});

test("parseBlock: rows keyed by header; extra fields ignored, missing ones empty", () => {
  const rows = Cex.parseBlock(["a|b|c", "1|2|3", "4|5|6|7|8", "9"]);
  assert.deepEqual(rows, [
    { a: "1", b: "2", c: "3" },
    { a: "4", b: "5", c: "6" },
    { a: "9", b: "", c: "" },
  ]);
  assert.deepEqual(Cex.parseBlock([]), []);
});

test("readBlocks: splits on #! labels, handles CRLF, rejects leading data", () => {
  const b = Cex.readBlocks("#!one\r\nx\r\n#!two\r\ny\r\nz\r\n");
  assert.deepEqual(b, { one: ["x"], two: ["y", "z", ""] });
  assert.throws(() => Cex.readBlocks("oops\n#!a\n"), /before the first/);
});

test("parseRelease: reads the fixture", () => {
  const text = fs.readFileSync(path.join(__dirname, "fixtures", "sample.cex"), "utf8");
  const rel = Cex.parseRelease(text);
  assert.equal(rel.version, "2026t");
  assert.equal(rel.mss.length, 8);
  assert.equal(rel.mss[4].label, "Lib C, MS 4 | Lib C, MS 5");
  assert.equal(rel.mss[4].collection, "Lib C");
  assert.equal(rel.texts.length, 5);
  assert.equal(rel.textindex.length, 10);
});

test("parseRelease: missing block is an error", () => {
  assert.throws(() => Cex.parseRelease("#!version\n1\n"), /no #!mss block/);
});
