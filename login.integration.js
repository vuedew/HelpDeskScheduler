const err = document.getElementById("err");

function showErr(msg) {
  err.style.display = "block";
  err.textContent = msg;
}

async function handleLogin() {
  err.style.display = "none";

  const email = document.getElementById("email").value.trim().toLowerCase();
  const password = document.getElementById("pw").value.trim();

  if (!email || !password) {
    showErr("Email and password are required.");
    return;
  }

  try {
    const user = await loginUser(email, password);

    if (!user || !user.role) {
      throw new Error("Invalid login response");
    }

    saveSession(user);

    window.location.href =
      user.role === "admin"
        ? "admin-dashboard.html"
        : "staff-dashboard.html";
  } catch (error) {
    showErr(error.message || "Login failed.");
  }
}

document.getElementById("loginBtn").addEventListener("click", handleLogin);
document.addEventListener("keydown", (e) => { if (e.key === "Enter") handleLogin(); });
