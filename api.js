const API_BASE = "http://localhost:5050";

async function apiRequest(path, options = {}) {
  const config = {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options
  };

  const response = await fetch(`${API_BASE}${path}`, config);

  if (!response.ok) {
    let message = `Request failed: ${response.status}`;

    try {
      const errorData = await response.json();
      if (errorData?.message) {
        message = errorData.message;
      }
    } catch (_) {}

    throw new Error(message);
  }

  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  return null;
}

/* ---------------- SESSION ---------------- */

function saveSession(user) {
  localStorage.setItem("role", user.role || "");
  localStorage.setItem("user_name", user.name || "");
  localStorage.setItem("user_email", user.email || "");

  if (user.user_id != null) {
    localStorage.setItem("user_id", String(user.user_id));
  }
}

function getCurrentUser() {
  return {
    user_id: Number(localStorage.getItem("user_id") || 0),
    name: localStorage.getItem("user_name") || "",
    email: localStorage.getItem("user_email") || "",
    role: localStorage.getItem("role") || ""
  };
}

/* ---------------- AUTH ---------------- */

async function loginUser(email, password) {
  return apiRequest("/login", {
    method: "POST",
    body: JSON.stringify({ email, password })
  });
}

/* ---------------- DATA ---------------- */

async function fetchUsers() {
  return apiRequest("/users");
}

async function fetchShifts() {
  return apiRequest("/shifts");
}

async function fetchRequests() {
  return apiRequest("/requests");
}

/* ---------------- REQUESTS ---------------- */

async function createRequest(payload) {
  return apiRequest("/requests", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

async function updateRequestStatus(requestId, status) {
  const currentUser = getCurrentUser();

  return apiRequest(`/requests/${requestId}`, {
    method: "PATCH",
    body: JSON.stringify({
      status,
      approved_by: currentUser.user_id || 1
    })
  });
}