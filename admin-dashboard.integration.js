if (getRole() !== "admin") {
  window.location.href = "login.html";
}

navActive("admin-dashboard.html");

const currentUser = getCurrentUser();
document.getElementById("userName").textContent = currentUser.name || "User";
document.getElementById("roleName").textContent = formatStatus(currentUser.role);

async function renderAdminDashboard() {
  try {
    const [shifts, requests] = await Promise.all([fetchShifts(), fetchRequests()]);

    const pending = requests.filter((r) => r.status === "pending").length;

    document.getElementById("pendingCount").textContent = pending;
    document.getElementById("totalShiftCount").textContent = shifts.length;

    const sched = document.getElementById("adminSchedStatus");
    sched.textContent = "Published";
    sched.className = "status published";
  } catch (error) {
    document.getElementById("pendingCount").textContent = "-";
    document.getElementById("totalShiftCount").textContent = "-";
  }
}

renderAdminDashboard();