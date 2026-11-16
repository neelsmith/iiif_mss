# How the apps work

`browsetexts.html` and `browsecollections.html` are two standalone pages. They replicate the
marimo notebooks of the same names in the biblissima repository.

## Loading data
On open, each page fetches the release file
(https://shot.holycross.edu/iiif-mss/current.cex),
showing a running MB count. About 67 MB of text is parsed in the browser into four lists:
manuscript manifests (`mss`), texts, and the text index, plus the release version.
If the fetch fails, an error message replaces the menus. For testing, `?data=<url>` on the
page address points it at a different copy of the file.

## browsetexts.html
1. Pick a text group (an author, say). The menu shows how many works each group has.
2. Pick a work in that group. The menu shows how many manuscripts contain it.
3. The page lists those manuscripts, sorted by collection and then label. Each shows its
   collection and the location of the text in the manuscript, then buttons:
   "View Biblissima" (the portal page) and "View images" (the manifest in the iiif-cite viewer;
   numbered 1, 2, ... when a manuscript has several manifests).
Changing the group clears the work and the list.

## browsecollections.html
1. Pick a collection (a library or archive). Manuscripts with no recorded holder fall under
   "(none recorded)".
2. Pick a work in that collection, or "All".
3. The page lists the manuscripts, sorted by label. For one work each shows its location; for
   "All" each shows every work it contains with locations. Buttons are the same as above.

## Opening them
Open the HTML file directly from disk or serve it from any web server. Neither needs
anything installed. The pages are generated from `src/`; see `02-build-and-tests.md`.
