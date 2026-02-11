const request = indexedDB.open("attendanceDB", 1);

request.onupgradeneeded = function (event) {
  const db = event.target.result;

  if (!db.objectStoreNames.contains("attendance")) {
    db.createObjectStore("attendance", {
      keyPath: "id",
      autoIncrement: true
    });
  }
};

request.onsuccess = function (event) {
  window.db = event.target.result;
  console.log("DB ready");

  loadStudents();


  loadTodayAttendance();   // now this WILL exist
};

request.onerror = function () {
  console.error("DB failed");
};

// ============================
// REQUIRED FUNCTIONS
// ============================

function saveOffline(record) {
  const tx = db.transaction("attendance", "readwrite");
  const store = tx.objectStore("attendance");
  store.add(record);
}

function getPendingAttendance(callback) {
  const tx = db.transaction("attendance", "readonly");
  const store = tx.objectStore("attendance");
  const req = store.getAll();

  req.onsuccess = () => {
    const pending = req.result.filter(r => r.synced === false);
    callback(pending);
  };
}

function loadTodayAttendance() {
  const tx = db.transaction("attendance", "readonly");
  const store = tx.objectStore("attendance");
  const req = store.getAll();

  req.onsuccess = () => {
    req.result.forEach(r => {
      if (!r.synced) {
        updateUI(r.student, "pending");
      }
    });
  };
}
function clearSynced(ids) {
  const tx = db.transaction("attendance", "readwrite");
  const store = tx.objectStore("attendance");

  ids.forEach(id => store.delete(id));
}


