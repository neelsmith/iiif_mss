// browsetexts.html: choose a text group, then a work; list the manuscripts.
(function () {
  "use strict";

  function start(data) {
    const counts = Browse.manuscriptCounts(data.textindex);
    const groups = Browse.groupOptions(data.texts);
    const controls = document.getElementById("controls");

    const groupMenu = Ui.makeSelect("Text group (release " + data.version + ")", "Choose a text group…", groups);
    controls.appendChild(groupMenu.wrapper);
    const workSlot = document.createElement("div");
    workSlot.style.flex = "1 1 18rem";
    controls.appendChild(workSlot);

    let workOptions = [];
    let workMenu = null;

    function showWork() {
      const group = Ui.chosen(groupMenu.select, groups);
      const work = workMenu && Ui.chosen(workMenu.select, workOptions);
      if (!group) { Ui.clearResults(); return; }
      if (!work) { Ui.showMessage("Choose a work."); return; }
      const entries = Browse.manuscriptsForWork(work.value, data.textindex, data.mss);
      if (entries.length === 0) {
        Ui.showMessage("No manuscripts with IIIF manifests are recorded for " + work.value + ".");
        return;
      }
      Ui.showResults(entries.length + " manuscript" + (entries.length === 1 ? "" : "s") +
        " containing " + work.value, entries);
    }

    groupMenu.select.addEventListener("change", function () {
      workSlot.textContent = "";
      workMenu = null;
      workOptions = [];
      const group = Ui.chosen(groupMenu.select, groups);
      if (group) {
        workOptions = Browse.workOptions(data.texts, group.value, counts);
        workMenu = Ui.makeSelect("Work in " + group.value, "Choose a work…", workOptions);
        workMenu.select.addEventListener("change", showWork);
        workSlot.appendChild(workMenu.wrapper);
      }
      showWork();
    });
  }

  Loader.loadRelease(Loader.dataUrl(location.search), Ui.setStatus)
    .then(function (data) { Ui.setStatus(""); start(data); })
    .catch(function (err) {
      Ui.setStatus("Could not load the data: " + err.message, true);
    });
})();
