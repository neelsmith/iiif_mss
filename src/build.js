#!/usr/bin/env node
// Build the two standalone pages from the sources in src/.
//
//   node src/build.js
//
// Each page is one self-contained HTML file (inline CSS and JavaScript, no
// imports), so it works when served from a web server and when opened from a
// local file. Output goes to the repository root.
"use strict";
const fs = require("node:fs");
const path = require("node:path");

const SRC = __dirname;
const OUT = path.resolve(SRC, "..");
const read = (p) => fs.readFileSync(path.join(SRC, p), "utf8");

const SHARED = ["cex.js", "browse.js", "loader.js", "pages/ui.js"];

const PAGES = [
  {
    out: "browsetexts.html",
    script: "pages/texts.js",
    title: "Browse illustrated manuscripts by text",
    intro: "Choose a text group (an author, for example), then a work, to list the manuscripts " +
      "with IIIF manifests that contain it. Each manifest links to the IIIF viewer.",
  },
  {
    out: "browsecollections.html",
    script: "pages/collections.js",
    title: "Browse illustrated manuscripts by collection",
    intro: "Choose a collection (a library or archive), then a work or “All”, to list " +
      "the manuscripts with IIIF manifests that hold it. Each manifest links to the IIIF viewer.",
  },
];

function build() {
  const template = read("template.html");
  const style = read("style.css");
  const written = [];
  for (const page of PAGES) {
    const scripts = [...SHARED, page.script].map((f) => "// ---- " + f + "\n" + read(f)).join("\n");
    if (/<\/script/i.test(scripts)) throw new Error("A script contains </script>");
    // Functions as replacements, so "$" in the sources is never special.
    const html = template
      .replace(/\{\{TITLE\}\}/g, () => page.title)
      .replace("{{INTRO}}", () => page.intro)
      .replace("{{STYLE}}", () => style)
      .replace("{{SCRIPTS}}", () => scripts);
    const file = path.join(OUT, page.out);
    fs.writeFileSync(file, html);
    written.push(file);
  }
  return written;
}

if (require.main === module) {
  for (const f of build()) console.log("wrote " + path.relative(process.cwd(), f));
}
module.exports = { build };
