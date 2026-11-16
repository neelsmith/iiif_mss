// Menus and manuscript lists: a port of src/biblissima/browse.py in the
// biblissima repository. Everything works on arrays of plain row objects as
// returned by Cex.parseBlock.
const Browse = (function () {
  "use strict";

  const VIEWER = "https://neelsmith.github.io/iiif-cite/iiif-cite.html#manifest=";
  const PORTAL = "https://portail.biblissima.fr/";
  const NO_COLLECTION = "(none recorded)";
  const ALL = "*all*";

  // Percent-encode, leaving URL punctuation alone (as Python's quote() with
  // the same safe set; encodeURI also leaves letters, digits and -_.~ alone).
  function encodeUrl(s) {
    return encodeURI(s.trim()).replace(/%25/g, "%").replace(/%5B/g, "[").replace(/%5D/g, "]");
  }
  function viewerUrl(manifest) { return VIEWER + encodeUrl(manifest); }
  function portalUrl(ark) { return PORTAL + encodeUrl(ark); }

  function cmp(a, b) { return a < b ? -1 : a > b ? 1 : 0; }
  function fold(s) { return s.toLowerCase(); }
  function plural(n, one, many) { return n + " " + (n === 1 ? one : many); }

  function esc(s) {
    return String(s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#x27;");
  }

  // {work URN: number of distinct manuscripts}
  function manuscriptCounts(textindex) {
    const found = new Map();
    for (const row of textindex) {
      let set = found.get(row.text);
      if (!set) found.set(row.text, (set = new Set()));
      set.add(row.mss);
    }
    const counts = new Map();
    for (const [urn, set] of found) counts.set(urn, set.size);
    return counts;
  }

  // Menus are arrays of {label, value}.

  function groupOptions(texts) {
    const counts = new Map();
    for (const row of texts) counts.set(row.group, (counts.get(row.group) || 0) + 1);
    return [...counts.entries()]
      .sort((a, b) => cmp(fold(a[0]), fold(b[0])) || cmp(a[0], b[0]))
      .map(([name, n]) => ({ label: name + " (" + plural(n, "work", "works") + ")", value: name }));
  }

  function workOptions(texts, group, counts) {
    const rows = texts
      .filter((r) => r.group === group)
      .sort((a, b) => cmp(fold(a.work), fold(b.work)) || cmp(a.urn, b.urn));
    const seen = new Set();
    const options = [];
    for (const row of rows) {
      const n = counts.get(row.urn) || 0;
      let label = row.work + " (" + n + " MS" + (n === 1 ? "" : "S") + ")";
      if (seen.has(label)) label += " [" + row.urn + "]";
      seen.add(label);
      options.push({ label, value: row.urn });
    }
    return options;
  }

  function addManifest(entry, row) {
    const url = row.manifest.trim();
    if (url && !entry.manifests.includes(url)) entry.manifests.push(url);
  }

  // Manuscripts containing a work, sorted by collection then label.
  function manuscriptsForWork(urn, textindex, mss) {
    const locations = new Map();
    for (const row of textindex) {
      if (row.text !== urn) continue;
      let locs = locations.get(row.mss);
      if (!locs) locations.set(row.mss, (locs = []));
      if (row.location && !locs.includes(row.location)) locs.push(row.location);
    }
    const entries = new Map();
    for (const row of mss) {
      const ark = row.biblissima;
      if (!locations.has(ark)) continue;
      let entry = entries.get(ark);
      if (!entry) {
        entry = { ark, label: row.label, collection: row.collection || "",
                  locations: locations.get(ark), manifests: [] };
        entries.set(ark, entry);
      }
      addManifest(entry, row);
    }
    return [...entries.values()].sort(
      (a, b) => cmp(fold(a.collection), fold(b.collection)) || cmp(fold(a.label), fold(b.label)));
  }

  // {manuscript ark: collection}; a blank collection becomes NO_COLLECTION.
  function manuscriptCollections(mss) {
    const found = new Map();
    for (const row of mss) {
      if (!found.has(row.biblissima)) found.set(row.biblissima, row.collection || NO_COLLECTION);
    }
    return found;
  }

  // {work URN: "group - work"}
  function textNames(texts) {
    const names = new Map();
    for (const row of texts) {
      if (!names.has(row.urn)) names.set(row.urn, row.group + " - " + row.work);
    }
    return names;
  }

  // Collections that hold manuscripts with indexed texts.
  function collectionOptions(textindex, holders) {
    const arks = new Map();
    for (const row of textindex) {
      const collection = holders.get(row.mss);
      if (collection === undefined) continue;
      let set = arks.get(collection);
      if (!set) arks.set(collection, (set = new Set()));
      set.add(row.mss);
    }
    return [...arks.entries()]
      .sort((a, b) => cmp(fold(a[0]), fold(b[0])) || cmp(a[0], b[0]))
      .map(([name, set]) => ({ label: name + " (" + plural(set.size, "MS", "MSS") + ")", value: name }));
  }

  // Works found in a collection; the first entry is "All".
  function collectionWorkOptions(collection, textindex, texts, holders) {
    const names = textNames(texts);
    const perWork = new Map();
    for (const row of textindex) {
      if (holders.get(row.mss) !== collection) continue;
      let set = perWork.get(row.text);
      if (!set) perWork.set(row.text, (set = new Set()));
      set.add(row.mss);
    }
    const allArks = new Set();
    for (const set of perWork.values()) for (const a of set) allArks.add(a);
    const options = [{
      label: "All (" + plural(perWork.size, "work", "works") + " in " +
        plural(allArks.size, "manuscript", "manuscripts") + ")",
      value: ALL,
    }];
    const seen = new Set([options[0].label]);
    const name = (u) => names.get(u) || u;
    const sorted = [...perWork.entries()].sort(
      (a, b) => cmp(fold(name(a[0])), fold(name(b[0]))) || cmp(a[0], b[0]));
    for (const [urn, set] of sorted) {
      let label = name(urn) + " (" + plural(set.size, "MS", "MSS") + ")";
      if (seen.has(label)) label += " [" + urn + "]";
      seen.add(label);
      options.push({ label, value: urn });
    }
    return options;
  }

  // Manuscripts of a collection with one work, or with every work (ALL).
  function entriesForCollection(collection, selection, textindex, texts, mss) {
    const holders = manuscriptCollections(mss);
    const names = textNames(texts);
    const found = new Map(); // ark -> Map(urn -> locations)
    for (const row of textindex) {
      const ark = row.mss;
      if (holders.get(ark) !== collection) continue;
      if (selection !== ALL && row.text !== selection) continue;
      let per = found.get(ark);
      if (!per) found.set(ark, (per = new Map()));
      let locs = per.get(row.text);
      if (!locs) per.set(row.text, (locs = []));
      if (row.location && !locs.includes(row.location)) locs.push(row.location);
    }
    const entries = new Map();
    for (const row of mss) {
      const ark = row.biblissima;
      if (!found.has(ark)) continue;
      let entry = entries.get(ark);
      if (!entry) {
        const per = found.get(ark);
        entry = { ark, label: row.label, collection: "", manifests: [] };
        if (selection === ALL) {
          entry.works = [...per.entries()]
            .map(([u, locs]) => [names.get(u) || u, locs])
            .sort((a, b) => cmp(fold(a[0]), fold(b[0])));
        } else {
          entry.locations = per.get(selection);
        }
        entries.set(ark, entry);
      }
      addManifest(entry, row);
    }
    return [...entries.values()].sort((a, b) => cmp(fold(a.label), fold(b.label)));
  }

  // HTML list of manuscripts (classes are styled by the page stylesheet).
  function renderManuscriptsHtml(entries) {
    const items = entries.map((e) => {
      const many = e.manifests.length > 1;
      const portal = '<a class="btn" href="' + esc(portalUrl(e.ark)) +
        '" target="_blank" rel="noopener">View Biblissima &#9656;</a>';
      const links = e.manifests.map((m, i) =>
        '<a class="btn" href="' + esc(viewerUrl(m)) + '" target="_blank" rel="noopener">' +
        "View images" + (many ? " " + (i + 1) : "") + " &#9656;</a>").join("");
      const details = [];
      if (e.collection) details.push(esc(e.collection));
      if (e.locations && e.locations.length) details.push("location: " + esc(e.locations.join("; ")));
      let meta = details.length ? "<div>" + details.join(" &middot; ") + "</div>" : "";
      for (const [name, locs] of e.works || []) {
        meta += "<div>" + esc(name) + (locs.length ? " &mdash; " + esc(locs.join("; ")) : "") + "</div>";
      }
      return "<li><strong>" + esc(e.label) + "</strong>" + meta + "<div>" + portal + links + "</div></li>";
    });
    return "<ul>" + items.join("") + "</ul>";
  }

  return {
    VIEWER, PORTAL, NO_COLLECTION, ALL, viewerUrl, portalUrl, esc,
    manuscriptCounts, groupOptions, workOptions, manuscriptsForWork,
    manuscriptCollections, textNames, collectionOptions, collectionWorkOptions,
    entriesForCollection, renderManuscriptsHtml,
  };
})();
if (typeof module !== "undefined") module.exports = Browse;
