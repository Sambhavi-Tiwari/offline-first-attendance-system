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
  if (!localStorage.getItem("logged_in")) {
  alert("Please login first");
  return;
}
  const teacher = localStorage.getItem("teacher_id");

  if (!teacher) {
    alert("Select teacher first!");
    return;
  }

  const record = {
    student: studentId,
    teacher: teacher,
    date: new Date().toISOString().split("T")[0],
    status: status
  };

  fetch("/api/attendance/", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify(record)
  });

  document.getElementById(`status-${studentId}`).innerText = "Saved";
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