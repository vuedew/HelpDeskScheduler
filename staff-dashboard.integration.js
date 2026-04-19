if (getRole() !== "staff") {
  window.location.href = "login.html";
}

navActive("staff-dashboard.html");

const currentUser = getCurrentUser();
document.getElementById("userName").textContent = currentUser.name || "User";
document.getElementById("roleName").textContent = formatStatus(currentUser.role);

const weekStartEl = document.getElementById("weekStart");
const schedStatusEl = document.getElementById("schedStatus");
const shiftCountEl = document.getElementById("myShiftCount");
const tbody = document.querySelector("#shiftTable tbody");
const datePicker = document.getElementById("datePicker");

function getWeekStartFromDate(dateStr) {
  const date = new Date(dateStr + "T00:00:00");
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  return date.toISOString().slice(0, 10);
}

function getWeekDatesFor(dateStr) {
  const startStr = getWeekStartFromDate(dateStr);
  const start = new Date(startStr + "T00:00:00");
  const dates = [];
  for (let i = 0; i < 5; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

async function renderStaffDashboard() {
  try {
    const shifts = await fetchShifts();
    const myShifts = shifts.filter(
      (s) =>
        s.assigned_user_name === currentUser.name ||
        String(s.user_id || "") === String(currentUser.user_id)
    );

    const sorted = [...myShifts].sort((a, b) => new Date(a.date) - new Date(b.date));
    const selectedDate = datePicker.value || sorted[0]?.date || "";
    if (!datePicker.value && selectedDate) datePicker.value = selectedDate;

    const weekStart = getWeekStartFromDate(selectedDate);
    const weekDates = getWeekDatesFor(selectedDate);

    weekStartEl.textContent = "Week of " + formatWeekRange(weekStart);
    schedStatusEl.textContent = "Published";
    schedStatusEl.className = "status published";

    const weeklyShifts = myShifts.filter((s) => weekDates.includes(s.date));
    shiftCountEl.textContent = weeklyShifts.length;

    tbody.innerHTML = "";

    if (!weeklyShifts.length) {
      tbody.innerHTML = `<tr><td colspan="4">No shifts assigned to you this week.</td></tr>`;
      return;
    }

    weeklyShifts
      .sort((a, b) => (a.date + a.start_time).localeCompare(b.date + b.start_time))
      .forEach((s) => {
        const tr = document.createElement("tr");
        tr.className = "my-shift-row";
        tr.innerHTML = `
          <td>${formatDateMDY(s.date)}</td>
          <td>${s.start_time}</td>
          <td>${s.end_time}</td>
          <td>
            <button class="btn btn-inline request-btn" style="color:#fff;">Request Trade/Coverage</button>
          </td>
        `;
        tr.querySelector(".request-btn").onclick = () => {
          localStorage.setItem("selected_assignment_id", String(s.assignment_id));
          localStorage.setItem("selected_shift_date", s.date);
          window.location.href = "staff-requests.html";
        };
        tbody.appendChild(tr);
      });
  } catch (error) {
    tbody.innerHTML = `<tr><td colspan="4">Failed to load schedule.</td></tr>`;
  }
}

datePicker.addEventListener("change", renderStaffDashboard);
renderStaffDashboard();
