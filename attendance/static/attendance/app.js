console.log("attendance.js LOADED");

// ==========================
// LOAD STUDENTS (ONLINE + OFFLINE)
// ==========================
async function loadStudents() {
  const container = document.getElementById("students");
  container.innerHTML = "";

  try {
    const res = await fetch("/api/students/");
    const students = await res.json();

    // Save for offline use
    localStorage.setItem("students", JSON.stringify(students));

    renderStudents(students);

  } catch (error) {
    console.log("Offline: loading from localStorage");

    const students = JSON.parse(localStorage.getItem("students")) || [];
    renderStudents(students);
  }
}

// ==========================
// RENDER STUDENTS UI
// ==========================
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

// ==========================
// MARK ATTENDANCE (OFFLINE FIRST)
// ==========================
function markAttendance(studentId, status) {
  const teacherId = localStorage.getItem("teacher_id");

  if (!teacherId) {
    alert("⚠️ Please select a teacher first!");
    return;
  }

  const record = {
    student: studentId,
    teacher: teacherId,
    date: new Date().toLocaleDateString("en-CA"),
    status: status,
    synced: false,
    timestamp: Date.now()
  };

  saveOffline(record);
  updateUI(studentId, "pending");

  console.log("Saved offline:", record);
}

// ==========================
// UPDATE UI STATUS
// ==========================
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

// ==========================
// SYNC WHEN ONLINE
// ==========================
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
        console.log("✅ SYNCED TO SERVER");
      } else {
        console.log("❌ Sync failed:", res.status);
      }

    } catch (e) {
      console.log("⚠️ Still offline");
    }
  });
}

// ==========================
// LOAD TEACHERS
// ==========================
async function loadTeachers() {
  try {
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

  } catch (err) {
    console.log("Failed to load teachers");
  }
}

// ==========================
// SET TEACHER
// ==========================
function setTeacher() {
  const teacherId = document.getElementById("teacherSelect").value;

  if (!teacherId) {
    alert("Select a teacher!");
    return;
  }

  localStorage.setItem("teacher_id", teacherId);
  alert("✅ Teacher selected!");
}

// ==========================
// ADD STUDENTS
// ==========================
async function addStudents() {
  const text = document.getElementById("studentList").value;
  const names = text.split("\n").map(n => n.trim()).filter(n => n);

  if (names.length === 0) {
    alert("Enter at least one student");
    return;
  }

  await fetch("/api/add-students/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ students: names })
  });

  alert("Students added successfully");
  loadStudents();
}

// ==========================
// EVENTS
// ==========================
window.addEventListener("online", syncIfOnline);
setInterval(syncIfOnline, 10000);

document.addEventListener("DOMContentLoaded", () => {
  loadStudents();
  loadTeachers();   // ⭐ FIXED
  setTimeout(syncIfOnline, 1000);
});