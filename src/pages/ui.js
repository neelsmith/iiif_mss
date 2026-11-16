// Small DOM helpers shared by both pages.
const Ui = (function () {
  "use strict";

  function setStatus(message, isError) {
    const el = document.getElementById("status");
    el.textContent = message || "";
    el.className = isError ? "error" : "";
  }

  // A labelled <select> with a placeholder first option; options are
  // [{label, value}]. Returns {wrapper, select}.
  function makeSelect(labelText, placeholder, options) {
    const wrapper = document.createElement("label");
    wrapper.appendChild(document.createTextNode(labelText));
    const select = document.createElement("select");
    const first = document.createElement("option");
    first.value = "";
    first.textContent = placeholder;
    select.appendChild(first);
    options.forEach(function (o, i) {
      const opt = document.createElement("option");
      opt.value = String(i);
      opt.textContent = o.label;
      select.appendChild(opt);
    });
    wrapper.appendChild(select);
    return { wrapper: wrapper, select: select };
  }

  // The option chosen in a select made by makeSelect, or null.
  function chosen(select, options) {
    return select.value === "" ? null : options[Number(select.value)];
  }

  function showResults(headingText, entries) {
    const el = document.getElementById("results");
    el.innerHTML = "<h3>" + Browse.esc(headingText) + "</h3>" + Browse.renderManuscriptsHtml(entries);
  }

  function showMessage(text) {
    const el = document.getElementById("results");
    el.innerHTML = "<p><em>" + Browse.esc(text) + "</em></p>";
  }

  function clearResults() { document.getElementById("results").innerHTML = ""; }

  return { setStatus, makeSelect, chosen, showResults, showMessage, clearResults };
})();
if (typeof module !== "undefined") module.exports = Ui;
