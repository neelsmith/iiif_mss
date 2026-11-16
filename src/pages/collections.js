// browsecollections.html: choose a collection, then a work or "All".
(function () {
  "use strict";

  function start(data) {
    const holders = Browse.manuscriptCollections(data.mss);
    const collections = Browse.collectionOptions(data.textindex, holders);
    const controls = document.getElementById("controls");

    const collMenu = Ui.makeSelect("Collection (release " + data.version + ")", "Choose a collection…", collections);
    controls.appendChild(collMenu.wrapper);
    const workSlot = document.createElement("div");
    workSlot.style.flex = "1 1 18rem";
    controls.appendChild(workSlot);

    let workOptions = [];
    let workMenu = null;

    function showWork() {
      const coll = Ui.chosen(collMenu.select, collections);
      const work = workMenu && Ui.chosen(workMenu.select, workOptions);
      if (!coll) { Ui.showMessage("Choose a collection."); return; }
      if (!work) { Ui.showMessage("Choose a work, or All."); return; }
      const entries = Browse.entriesForCollection(coll.value, work.value, data.textindex, data.texts, data.mss);
      if (entries.length === 0) {
        Ui.showMessage("No manuscripts with IIIF manifests are recorded for this choice.");
        return;
      }
      Ui.showResults(entries.length + " manuscript" + (entries.length === 1 ? "" : "s") +
        " in " + coll.value, entries);
    }

    Ui.showMessage("Choose a collection.");
    collMenu.select.addEventListener("change", function () {
      workSlot.textContent = "";
      workMenu = null;
      workOptions = [];
      const coll = Ui.chosen(collMenu.select, collections);
      if (coll) {
        workOptions = Browse.collectionWorkOptions(coll.value, data.textindex, data.texts, holders);
        workMenu = Ui.makeSelect("Works in " + coll.value, "Choose a work, or All…", workOptions);
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
