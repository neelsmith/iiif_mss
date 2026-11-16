// Parsing of the composite release file (current.cex).
//
// A release is one text file made of blocks. Each block starts with a label
// line ("#!mss") and runs to the next label line. For data blocks the first
// line is a header. Fields are separated by "|"; a field that starts with a
// double quote is quoted (it may contain "|", and "" is a literal quote),
// matching Python's csv module as used by the biblissima notebooks.
const Cex = (function () {
  "use strict";

  // Split one line into fields.
  function splitLine(line) {
    if (line.indexOf('"') === -1) return line.split("|");
    const fields = [];
    let i = 0;
    const n = line.length;
    for (;;) {
      if (line.charCodeAt(i) === 34 /* " */) {
        let value = "";
        i++;
        for (;;) {
          const close = line.indexOf('"', i);
          if (close === -1) { value += line.slice(i); i = n; break; }
          value += line.slice(i, close);
          if (line.charCodeAt(close + 1) === 34) { value += '"'; i = close + 2; }
          else { i = close + 1; break; }
        }
        // Anything between the closing quote and the next delimiter is kept.
        const bar = line.indexOf("|", i);
        if (bar === -1) { fields.push(value + line.slice(i)); break; }
        fields.push(value + line.slice(i, bar));
        i = bar + 1;
      } else {
        const bar = line.indexOf("|", i);
        if (bar === -1) { fields.push(line.slice(i)); break; }
        fields.push(line.slice(i, bar));
        i = bar + 1;
      }
    }
    return fields;
  }

  // Turn the lines of a data block (header first) into an array of row objects.
  // Extra fields beyond the header are ignored; missing ones are "".
  function parseBlock(lines) {
    if (!lines || lines.length === 0) return [];
    const header = splitLine(lines[0]);
    const rows = [];
    for (let k = 1; k < lines.length; k++) {
      if (lines[k] === "") continue;
      const f = splitLine(lines[k]);
      const row = {};
      for (let c = 0; c < header.length; c++) row[header[c]] = c < f.length ? f[c] : "";
      rows.push(row);
    }
    return rows;
  }

  // Read release text into {block name: lines}.
  function readBlocks(text) {
    const blocks = {};
    let current = null;
    let start = 0;
    const n = text.length;
    while (start <= n) {
      let end = text.indexOf("\n", start);
      if (end === -1) end = n;
      let line = text.slice(start, end);
      if (line.endsWith("\r")) line = line.slice(0, -1);
      start = end + 1;
      if (line.startsWith("#!")) {
        const name = line.slice(2).trim();
        current = blocks[name] || (blocks[name] = []);
      } else if (current === null) {
        if (line.trim() !== "") throw new Error("Data before the first #! label");
      } else {
        current.push(line);
      }
    }
    return blocks;
  }

  // Parse a whole release into {version, mss, texts, textindex}.
  function parseRelease(text) {
    const blocks = readBlocks(text);
    for (const name of ["version", "mss", "texts", "textindex"]) {
      if (!blocks[name]) throw new Error("Release has no #!" + name + " block");
    }
    return {
      version: (blocks.version[0] || "").trim(),
      mss: parseBlock(blocks.mss),
      texts: parseBlock(blocks.texts),
      textindex: parseBlock(blocks.textindex),
    };
  }

  return { splitLine, parseBlock, readBlocks, parseRelease };
})();
if (typeof module !== "undefined") module.exports = Cex;
