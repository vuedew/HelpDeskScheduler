function setRole(role) {
  localStorage.setItem("role", role);
}

function getRole() {
  return localStorage.getItem("role") || "";
}

function logout() {
  localStorage.clear(); // cleaner + future-proof
  window.location.href = "login.html";
}

function navActive(current) {
  document.querySelectorAll("[data-nav]").forEach((a) => {
    if (a.getAttribute("href") === current) {
      a.classList.add("active");
    }
  });
}

function formatStatus(value) {
  if (!value) return "";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatDateTime(dateStr) {
  if (!dateStr) return "";

  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr; // fallback if bad format

  const datePart = d.toLocaleDateString();
  const timePart = d.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit"
  });

  return `${datePart} ${timePart}`;
}

function showToast(message) {
  const toast = document.getElementById("toast");
  if (!toast) return;

  toast.textContent = message;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 2000);
}

/* limits (future use) */
const MAX_ADMIN_WEEKS = 4;
const MAX_STAFF_WEEKS = 2;

function formatDateMDY(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

function formatWeekRange(startDateStr) {
  const start = new Date(startDateStr + "T00:00:00");
  const end = new Date(start);
  end.setDate(start.getDate() + 4);
  const options = { month: "short", day: "numeric" };
  const startStr = start.toLocaleDateString([], options);
  const endStr = end.toLocaleDateString([], options);
  const year = start.getFullYear();
  return `${startStr} – ${endStr}, ${year}`;
}
