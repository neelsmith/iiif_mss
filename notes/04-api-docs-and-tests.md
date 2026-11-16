# Running the unit tests, and generating API documentation

## Unit tests
Requires Node 22 or later. From the repo root:

    npm test

This rebuilds the two HTML files and then runs every `src/tests/*.test.js`:
- `cex.test.js`: the release-file parser
- `browse.test.js`: menus, manuscript lists, HTML rendering
- `ui.test.js`: both pages in a real browser, opened as a local file and over HTTP.
  It needs Playwright (`npm install playwright`, then `npx playwright install chromium`);
  without it, those tests are skipped and the rest still run.

To run only the unit tests, without a browser or a rebuild:

    node --test src/tests/cex.test.js src/tests/browse.test.js

(Node 22 needs the file glob or names; `node --test src/tests` fails.)

## API documentation
Not set up yet, and I could not test the steps below (no package installs in my session).
The code has plain explanatory comments on each function but not JSDoc tags, so a generator
would currently show names and little else. Suggested route:

1. Install JSDoc as a development tool: `npm install --save-dev jsdoc`
2. Add `@param` and `@returns` tags to the functions in `src/cex.js`, `src/browse.js` and
   `src/loader.js` (I can do this next).
3. Generate:

       npx jsdoc src/cex.js src/browse.js src/loader.js -d apidocs

4. Open `apidocs/index.html`.

Put the output in `apidocs/`, not `docs/` (which you own), and add `apidocs/` and
`node_modules/` to `.gitignore` unless you want the generated pages committed.
