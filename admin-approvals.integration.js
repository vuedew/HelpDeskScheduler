if (getRole() !== "admin") {
  window.location.href = "login.html";
}

navActive("admin-approvals.html");

const currentUser = getCurrentUser();
document.getElementById("userName").textContent = currentUser.name || "User";
document.getElementById("roleName").textContent = formatStatus(currentUser.role);

const body = document.getElementById("apBody");
const countEl = document.getElementById("count");

function formatShiftSummary(summary) {
  if (!summary) return "";

  const parts = summary.split(" ");
  const datePart = parts[0];
  const timePart = parts[1] || "";

  return `${formatDateMDY(datePart)} · ${timePart}`;
}

async function renderApprovals() {
  try {
    const requests = await fetchRequests();
    const pending = requests.filter((r) => r.status === "pending");

    countEl.textContent = pending.length;
    body.innerHTML = "";

    if (!pending.length) {
      body.innerHTML = `
        <tr>
          <td colspan="6">No pending approvals. You're all caught up.</td>
        </tr>
      `;
      return;
    }

    pending.forEach((p) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${p.request_id}</td>
        <td>${p.requester_name || p.requester_id}</td>
<td>${p.shift_summary ? formatShiftSummary(p.shift_summary) : `Assignment ${p.assignment_id}`}</td>
        <td>${formatStatus(p.type)}</td>
        <td>${p.reason || ""}</td>
        <td style="text-align:right;">
          <div style="display:flex; flex-direction:column; align-items:flex-end; gap:6px;">
            <button class="btn ok approve-btn" style="min-width:90px;">Approve</button>
            <button class="btn danger deny-btn" style="min-width:90px;">Deny</button>
          </div>
        </td>
      `;

      tr.querySelector(".approve-btn").onclick = async () => {
        try {
          await updateRequestStatus(p.request_id, "approved");
          showToast("Approval completed");
          renderApprovals();
        } catch (error) {
          alert(error.message || "Failed to approve request.");
        }
      };

      tr.querySelector(".deny-btn").onclick = async () => {
        try {
          await updateRequestStatus(p.request_id, "denied");
          showToast("Request denied");
          renderApprovals();
        } catch (error) {
          alert(error.message || "Failed to deny request.");
        }
      };

      body.appendChild(tr);
    });
  } catch (error) {
    countEl.textContent = "0";
    body.innerHTML = `
      <tr>
        <td colspan="6">Failed to load approvals.</td>
      </tr>
    `;
  }
}

renderApprovals();
