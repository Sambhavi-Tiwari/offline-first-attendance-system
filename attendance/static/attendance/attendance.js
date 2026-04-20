/*async function loadStudents() {
  try {
    const res = await fetch("/api/students/");
    if (!res.ok) {
      console.error("Failed to load students", res.status);
      return;
    }

    const students = await res.json();
    const container = document.getElementById("students");
    container.innerHTML = "";

    students.forEach(s => {
      const div = document.createElement("div");
      div.className = "student";
      div.innerHTML = `
        <span>${s.name}</span>
        <span>
          <button onclick="markAttendance(${s.id}, 'P')">P</button>
          <button onclick="markAttendance(${s.id}, 'A')">A</button>
        </span>
      `;
      container.appendChild(div);
    });
  } catch (err) {
    console.error("Student load error", err);
  }
}
function markAttendance(studentId, status) {
  const record = {
    student: studentId,
    teacher: 1,
    date: new Date().toLocaleDateString("en-CA"),
    status: status,
    synced: false,
    timestamp: Date.now()
  };

  /*if (!window.db) {
    console.warn("DB not ready yet");
    return;
  }*/

  /*saveOffline(record);
  updateUI(studentId, "pending");
}
document.addEventListener("DOMContentLoaded", () => {
  loadStudents();
});*/
console.log("attendance.js LOADED");
async function loadStudents() {
  const container = document.getElementById("students");
  container.innerHTML = "";

  try {
    const res = await fetch("/api/students/");
    const students = await res.json();

    // ✅ Save to localStorage for offline use
    localStorage.setItem("students", JSON.stringify(students));

    renderStudents(students);

  } catch (error) {
    console.log("Offline: loading from localStorage");

    const students = JSON.parse(localStorage.getItem("students")) || [];
    renderStudents(students);
  }
}

function renderStudents(students) {
  const container = document.getElementById("students");
  container.innerHTML = "";

  students.forEach(s => {
    const div = document.createElement("div");
    div.className = "student";

    div.innerHTML = `
      <span>${s.name} <small id="status-${s.id}"></small></span>
      <span>
        <button onclick="markAttendance(${s.id}, 'P')">P</button>
        <button onclick="markAttendance(${s.id}, 'A')">A</button>
      </span>
    `;

    container.appendChild(div);
  });
}


function markAttendance(studentId, status) {
  const record = {
    student: studentId,
    teacher: localStorage.getItem("teacher_id") || 1,
    date: new Date().toLocaleDateString("en-CA"),
    status: status,
    synced: false,
    timestamp: Date.now()
  };

  saveOffline(record);
  updateUI(studentId, "pending");

  console.log("Saved offline:", record);
}
function updateUI(studentId, state) {
  const badge = document.getElementById(`status-${studentId}`);
  if (!badge) return;

  if (state === "pending") {
    badge.textContent = "Pending";
    badge.className = "pending";
  } else if (state === "synced") {
    badge.textContent = "Synced";
    badge.className = "synced";
  }
}

async function syncIfOnline() {
  if (!navigator.onLine || !window.db) return;

  getPendingAttendance(async (records) => {
    if (!records || records.length === 0) return;

    const payload = records.map(r => ({
      student: r.student,
      teacher: r.teacher,
      date: r.date,
      status: r.status
    }));

    try {
      const res = await fetch("/api/sync/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        clearSynced(records.map(r => r.id));
        records.forEach(r => updateUI(r.student, "synced"));
        console.log("SYNCED TO SERVER");
      }
    } catch (e) {
      console.log("Still offline");
    }
  });
}


window.addEventListener("online", syncIfOnline);
setInterval(syncIfOnline, 10000);

loadStudents();
document.addEventListener("DOMContentLoaded", () => {
  setTimeout(syncIfOnline, 1000);
});

async function addStudents() {
  const text = document.getElementById("studentList").value;
  const names = text.split("\n").map(n => n.trim()).filter(n => n);

  await fetch("/api/add-students/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ students: names })
  });

  alert("Students added successfully");
  loadStudents();
}

async function loadTeachers() {
  const res = await fetch("/api/teachers/");
  const teachers = await res.json();

  const select = document.getElementById("teacherSelect");
  select.innerHTML = "";

  teachers.forEach(t => {
    const option = document.createElement("option");
    option.value = t.id;
    option.textContent = t.name;
    select.appendChild(option);
  });
}
function setTeacher() {
  const teacherId = document.getElementById("teacherSelect").value;
  localStorage.setItem("teacher_id", teacherId);
  alert("Teacher selected!");
}
