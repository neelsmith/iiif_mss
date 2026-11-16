# Build and tests (session 2026-11-16)

## Layout
- `src/cex.js` release parser (quoted fields may contain `|`, as with Python's csv)
- `src/browse.js` menus, manuscript lists, HTML rendering (port of biblissima `browse.py`)
- `src/loader.js` fetch with progress; data URL overridable with `?data=<url>` (used by tests)
- `src/pages/{ui,texts,collections}.js`, `src/template.html`, `src/style.css`
- `src/build.js` inlines the above into `browsetexts.html` and `browsecollections.html`
  at the repo root. Those two files are GENERATED: edit `src/`, then rebuild.
- `src/tests/` unit tests (`node:test`), fixture `fixtures/sample.cex`, and `ui.test.js`
  (Playwright; skipped if Playwright is not installed).

## Commands
    npm run build     # or: node src/build.js
    npm test          # rebuilds, then runs node --test src/tests/*.test.js
(Node 22 needs the glob; `node --test src/tests` does not work.)

## Verified
- 27 tests pass, incl. both pages in Chromium opened as file:// and over http://.
- JS output equals the Python functions' output on the real 2026a data (71 comparisons:
  menus, manuscript lists, collection lists, All view).
- Real data: parse about 0.5 s in Node; texts page ready in about 0.7 s from a local server.

## Not verified
- fetch() of the real raw.githubusercontent.com URL (no network access from the session).
  Check in a browser, from file:// and from a server, and note how long the 67 MB takes.
- Page needs a downloaded-bytes measurement with GitHub's gzip.

## Ideas, not done
- Cache the release in IndexedDB so repeat visits skip the 67 MB download.
- entriesForCollection recomputes the holder map on each call (about 70 ms): cache if it matters.
