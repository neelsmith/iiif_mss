// Fetching and loading the release file. Works from a web server or from a
// local file (file://): it needs no module imports and only fetch().
const Loader = (function () {
  "use strict";

  const DEFAULT_URL =
    "https://raw.githubusercontent.com/neelsmith/biblissima/refs/heads/main/datareleases/current.cex";

  // The data location can be overridden with ?data=<url> (used by tests).
  function dataUrl(search) {
    const value = new URLSearchParams(search || "").get("data");
    return value || DEFAULT_URL;
  }

  // Fetch a text file, reporting progress as the bytes arrive.
  async function fetchText(url, onProgress) {
    const resp = await fetch(url);
    if (!resp.ok) throw new Error("HTTP " + resp.status + " fetching " + url);
    if (!resp.body || !resp.body.getReader) return await resp.text();
    const reader = resp.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let text = "";
    let bytes = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.length;
      text += decoder.decode(value, { stream: true });
      if (onProgress) onProgress(bytes);
    }
    return text + decoder.decode();
  }

  // Fetch and parse the release. onStatus receives short progress messages.
  async function loadRelease(url, onStatus) {
    const say = onStatus || function () {};
    say("Loading data…");
    const text = await fetchText(url, function (bytes) {
      say("Loading data… " + (bytes / 1048576).toFixed(1) + " MB");
    });
    say("Reading data…");
    // Let the browser paint the message before the (synchronous) parse.
    await new Promise(function (r) { setTimeout(r, 0); });
    return Cex.parseRelease(text);
  }

  return { DEFAULT_URL, dataUrl, fetchText, loadRelease };
})();
if (typeof module !== "undefined") module.exports = Loader;
