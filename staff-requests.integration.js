if (getRole() !== "staff") {
  window.location.href = "login.html";
}

navActive("staff-requests.html");

const currentUser = getCurrentUser();
document.getElementById("userName").textContent = currentUser.name || "User";
document.getElementById("roleName").textContent = formatStatus(currentUser.role);

const dateSelect = document.getElementById("dateSelect");
const shiftSelect = document.getElementById("shiftSelect");
const reqBody = document.getElementById("reqBody");

let myShifts = [];
let myRequests = [];
let availableDates = [];

function populateDateInput() {
  availableDates = [...new Set(myShifts.map((s) => s.date))].sort();

  if (!availableDates.length) {
    dateSelect.value = "";
    dateSelect.disabled = true;
    shiftSelect.innerHTML = `<option disabled selected>No shifts available</option>`;
    return;
  }

  dateSelect.disabled = false;
  dateSelect.value = availableDates[0];
  populateShiftDropdown();
}

function populateShiftDropdown() {
  const selectedDate = dateSelect.value;
  const filtered = myShifts.filter((s) => s.date === selectedDate);

  shiftSelect.innerHTML = "";

  if (!filtered.length) {
    shiftSelect.innerHTML = `<option disabled selected>No shifts available for this date</option>`;
    return;
  }

  filtered.forEach((s) => {
    const option = document.createElement("option");
    option.value = s.assignment_id;
    option.textContent = `${s.start_time}-${s.end_time} | Assignment ${s.assignment_id}`;
    shiftSelect.appendChild(option);
  });
}

function applyPreselectedShiftIfAny() {
  const preselectedAssignmentId = localStorage.getItem("selected_assignment_id");
  const preselectedDate = localStorage.getItem("selected_shift_date");

  if (!preselectedAssignmentId) return;

  if (preselectedDate) {
    dateSelect.value = preselectedDate;
    populateShiftDropdown();
  }

  const matchingShift = myShifts.find(
    (s) => String(s.assignment_id) === String(preselectedAssignmentId)
  );

  if (matchingShift) {
    dateSelect.value = matchingShift.date;
    populateShiftDropdown();
    shiftSelect.value = String(matchingShift.assignment_id);
  }

  localStorage.removeItem("selected_assignment_id");
  localStorage.removeItem("selected_shift_date");
}

function renderRequests() {
  reqBody.innerHTML = "";

  if (!myRequests.length) {
    reqBody.innerHTML = `<tr><td colspan="5">No requests submitted yet.</td></tr>`;
    return;
  }

  myRequests.forEach((r) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${r.request_id}</td>
      <td>${r.assignment_id}</td>
      <td>${formatStatus(r.type)}</td>
      <td><span class="status ${r.status}">${formatStatus(r.status)}</span></td>
      <td>${formatDateTime(r.created_at)}</td>
    `;
    reqBody.appendChild(tr);
  });
}

async function loadStaffRequestsPage() {
  try {
    const [shifts, requests] = await Promise.all([fetchShifts(), fetchRequests()]);

    myShifts = shifts.filter(
      (s) =>
        s.assigned_user_name === currentUser.name ||
        String(s.user_id || "") === String(currentUser.user_id)
    );

    myRequests = requests.filter(
      (r) =>
        r.requester_name === currentUser.name ||
        String(r.requester_id || "") === String(currentUser.user_id)
    );

    populateDateInput();
    applyPreselectedShiftIfAny();
    renderRequests();
  } catch (error) {
    reqBody.innerHTML = `<tr><td colspan="5">Failed to load requests.</td></tr>`;
  }
}

dateSelect.addEventListener("change", () => {
  if (!availableDates.includes(dateSelect.value)) {
    shiftSelect.innerHTML = `<option disabled selected>No shifts available for this date</option>`;
    return;
  }
  populateShiftDropdown();
});

document.getElementById("submitRequest").addEventListener("click", async () => {
  const assignmentId = shiftSelect.value;
  const type = document.getElementById("requestType").value;
  const reason = document.getElementById("reasonInput").value.trim();

  if (!dateSelect.value || !assignmentId || !reason) {
    alert("Please select a date, shift, and enter a reason.");
    return;
  }

  try {
    const payload = {
      assignment_id: Number(assignmentId),
      requester_id: currentUser.user_id,
      requester_name: currentUser.name,
      type,
      reason
    };

    await createRequest(payload);
    document.getElementById("reasonInput").value = "";
    await loadStaffRequestsPage();
    showToast("Request submitted");
  } catch (error) {
    alert(error.message || "Failed to submit request.");
  }
});

loadStaffRequestsPage();
