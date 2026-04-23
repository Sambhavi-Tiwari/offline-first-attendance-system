console.log("NEW JS LOADED");

// ---------- LOAD STUDENTS ----------
async function loadStudents() {
  const container = document.getElementById("students");

  try {
    const res = await fetch("/api/students/");
    const students = await res.json();

    localStorage.setItem("students", JSON.stringify(students));
    renderStudents(students);

  } catch {
    const students = JSON.parse(localStorage.getItem("students")) || [];
    renderStudents(students);
  }
}

function renderStudents(students) {
  const container = document.getElementById("students");
  container.innerHTML = "";

  students.forEach(s => {
    container.innerHTML += `
      <div>
        ${s.name}
        <button onclick="markAttendance(${s.id}, 'P')">P</button>
        <button onclick="markAttendance(${s.id}, 'A')">A</button>
        <span id="status-${s.id}"></span>
      </div>
    `;
  });
}

// ---------- TEACHER ----------
async function loadTeachers() {
  const res = await fetch("/api/teachers/");
  const teachers = await res.json();

  const select = document.getElementById("teacherSelect");
  select.innerHTML = "";

  teachers.forEach(t => {
    select.innerHTML += `<option value="${t.id}">${t.name}</option>`;
  });
}

function setTeacher() {
  const id = document.getElementById("teacherSelect").value;
  localStorage.setItem("teacher_id", id);
  alert("Teacher selected");
}

// ---------- ATTENDANCE ----------
function markAttendance(studentId, status) {
  const record = {
    student: studentId,
    teacher: localStorage.getItem("teacher_id") || 1,
    date: new Date().toLocaleDateString("en-CA"),
    status: status,
    synced: false,
    timestamp: Date.now()
  };

  saveOffline(record);   // ✅ save locally
  updateUI(studentId, "pending");  // ✅ show pending

  console.log("Saved offline:", record);
}

// ---------- INIT ----------
document.addEventListener("DOMContentLoaded", () => {
  loadStudents();
  loadTeachers();
});

async function login() {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  const res = await fetch("/api/login/", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ username, password })
  });

  if (res.ok) {
    alert("Login successful");
    localStorage.setItem("logged_in", "true");
  } else {
    alert("Invalid credentials");
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
function updateUI(studentId, state) {
  const badge = document.getElementById(`status-${studentId}`);
  if (!badge) return;

  if (state === "pending") {
    badge.textContent = "Pending";
    badge.style.color = "orange";
  } else if (state === "synced") {
    badge.textContent = "Synced";
    badge.style.color = "green";
  }
}