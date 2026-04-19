if (getRole() !== "admin") {
  window.location.href = "login.html";
}

navActive("admin-schedule.html");

const currentUser = getCurrentUser();
document.getElementById("userName").textContent = currentUser.name || "User";
document.getElementById("roleName").textContent = formatStatus(currentUser.role);

const builderStatus = document.getElementById("builderStatus");
const board = document.getElementById("scheduleBoard");
const boardLeft = document.getElementById("boardLeft");
const boardWeekStart = document.getElementById("boardWeekStart");
const scheduleDate = document.getElementById("scheduleDate");

const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16];
const PIXELS_PER_HOUR = 120;

let allUsers = [];
let allShifts = [];
let selectedDate = "";

function timeToMinutes(timeStr) {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return (hours * 60) + minutes;
}

function formatHour(hour) {
  return `${String(hour).padStart(2, "0")}:00`;
}

let availableDates = [];

function populateDateInput() {
  availableDates = [...new Set(allShifts.map((s) => s.date))].sort();

  if (!availableDates.length) {
    scheduleDate.value = "";
    scheduleDate.disabled = true;
    selectedDate = "";
    return;
  }

  scheduleDate.disabled = false;
  selectedDate = availableDates[0];
  scheduleDate.value = selectedDate;
}
function renderScheduleBoard() {
  builderStatus.textContent = "Published";
  builderStatus.className = "status published";
const weekStart = selectedDate ? getWeekStartFromDate(selectedDate) : "";
boardWeekStart.textContent = weekStart ? formatWeekRange(weekStart) : "No shifts";

  boardLeft.innerHTML = "";
  board.innerHTML = "";

  const leftHead = document.createElement("div");
  leftHead.className = "board-left-head";
  leftHead.textContent = "Staff";
  boardLeft.appendChild(leftHead);

  const header = document.createElement("div");
  header.className = "board-header";

  const hours = document.createElement("div");
  hours.className = "board-hours";
  hours.style.width = `${(HOURS.length - 1) * PIXELS_PER_HOUR}px`;

  for (let i = 0; i < HOURS.length - 1; i++) {
    const hourCell = document.createElement("div");
    hourCell.className = "board-hour";
    hourCell.textContent = formatHour(HOURS[i]);
    hours.appendChild(hourCell);
  }

  header.appendChild(hours);
  board.appendChild(header);

  allUsers.forEach((user) => {
    const leftRow = document.createElement("div");
    leftRow.className = "board-left-row";
    leftRow.innerHTML = `<div class="board-staff-name">${user.name}</div>`;
    boardLeft.appendChild(leftRow);

    const row = document.createElement("div");
    row.className = "board-row";

    const timeline = document.createElement("div");
    timeline.className = "board-timeline";
    timeline.style.width = `${(HOURS.length - 1) * PIXELS_PER_HOUR}px`;

    const staffShifts = allShifts.filter(
      (s) =>
        s.date === selectedDate &&
        (s.assigned_user_name === user.name ||
          String(s.user_id || "") === String(user.user_id))
    );

    staffShifts.forEach((shift) => {
      const startMinutes = timeToMinutes(shift.start_time);
      const endMinutes = timeToMinutes(shift.end_time);
      const dayStartMinutes = HOURS[0] * 60;

      const left = ((startMinutes - dayStartMinutes) / 60) * PIXELS_PER_HOUR;
      const width = ((endMinutes - startMinutes) / 60) * PIXELS_PER_HOUR;

      const block = document.createElement("div");
      block.className = "shift-block";
      block.style.left = `${left}px`;
      block.style.width = `${width}px`;
      block.innerHTML = `
        <div class="shift-top">
          <span>${shift.start_time}–${shift.end_time}</span>
        </div>
        <div class="shift-meta">ID: ${shift.assignment_id}</div>
      `;

      timeline.appendChild(block);
    });

    row.appendChild(timeline);
    board.appendChild(row);
  });
}
function getWeekStartFromDate(dateStr) {
  const date = new Date(dateStr + "T00:00:00"); // important fix

  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day; // Monday start

  date.setDate(date.getDate() + diff);

  return date.toISOString().slice(0, 10);
}

scheduleDate.addEventListener("change", () => {
  if (!availableDates.includes(scheduleDate.value)) return;
  selectedDate = scheduleDate.value;
  renderScheduleBoard();
});

async function initScheduleBoard() {
  try {
    const [users, shifts] = await Promise.all([fetchUsers(), fetchShifts()]);
    allUsers = users;
    allShifts = [...shifts].sort((a, b) => new Date(a.date) - new Date(b.date));

populateDateInput();
    renderScheduleBoard();
  } catch (error) {
    board.innerHTML = `<div class="card">Failed to load schedule board.</div>`;
  }
}

initScheduleBoard();