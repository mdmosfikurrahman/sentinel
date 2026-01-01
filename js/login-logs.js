if (!localStorage.getItem("accessToken")) location.href = "index.html";

const BASE = "https://akijair.ibos.io/user-management/v1/auth/login-logs";

let page = 1;
let size = 10;
let type = "all";

function token() {
    return "Bearer " + localStorage.getItem("accessToken");
}

function $(id) {
    return document.getElementById(id);
}

async function loadPartners() {
    let url = BASE;
    if (type === "success") url += "/success";
    if (type === "failed") url += "/failed";
    url += `?pageNumber=${page}&pageSize=${size}`;

    const r = await fetch(url, {headers: {Authorization: token()}});
    const j = await r.json();
    if (!j?.isSuccess) return;

    const table = $("partnerTable");
    table.innerHTML = "";

    j.data.data.forEach(p => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
        <td>${p.fullName}</td>
        <td>${p.email}</td>
        <td>${p.roleName || "-"}</td>
        <td>${p.logs[0]?.loginTime || "-"}</td>
        <td>
          <button class="pageBtn"
            onclick="toggleDetails('${p.partnerId}', this)">
            Details
          </button>
        </td>`;
        table.appendChild(tr);

        const detail = document.createElement("tr");
        detail.className = "rowDetails";
        detail.style.display = "none";
        detail.innerHTML = `
        <td colspan="5">
          <div>Loading...</div>
        </td>`;
        table.appendChild(detail);
    });

    renderPartnerPagination(j.data.totalRecords);
}

async function toggleDetails(partnerId, btn) {
    const row = btn.parentElement.parentElement.nextElementSibling;
    row.style.display = row.style.display === "none" ? "table-row" : "none";
    if (row.dataset.loaded) return;
    await loadLogs(partnerId, 1, row);
    row.dataset.loaded = "1";
}

async function loadLogs(partnerId, logPage, containerRow) {
    let url = `${BASE}/${partnerId}/logs?pageNumber=${logPage}&pageSize=10`;
    if (type === "success") url += "&isSuccess=true";
    if (type === "failed") url += "&isSuccess=false";

    const r = await fetch(url, {headers: {Authorization: token()}});
    const j = await r.json();
    if (!j?.isSuccess) return;

    const logs = j.data.data || [];
    const showFailure = (type === "failed");

    let html = `
      <table style="width:100%">
        <thead>
          <tr>
            <th>Login</th>
            <th>IP</th>
            <th>Location</th>
            <th>Network</th>
            ${showFailure ? "<th>Reason</th>" : ""}
            <th>Logout</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>`;

    logs.forEach(l => {
        html += `
        <tr>
          <td>${l.loginTime}</td>
          <td>${l.clientIp || "-"}</td>
          <td>${l.location || "-"}</td>
          <td>${l.network || "-"}</td>
          ${showFailure ? `<td>${l.failureReason || "-"}</td>` : ""}
          <td>${l.logoutTime || "-"}</td>
          <td>
            <span class="badge ${l.isSuccess ? 'ok' : 'bad'}">
              ${l.isSuccess ? 'SUCCESS' : 'FAILED'}
            </span>
          </td>
        </tr>`;
    });

    html += `</tbody></table><div class="pagination">`;

    const pages = Math.ceil(j.data.totalRecords / j.data.pageSize);
    for (let i = 1; i <= pages; i++) {
        html += `
        <button class="pageBtn ${i === logPage ? 'active' : ''}"
          onclick="loadLogs('${partnerId}',${i},this.closest('tr'))">
          ${i}
        </button>`;
    }
    html += `</div>`;

    containerRow.querySelector("div").innerHTML = html;
}

function renderPartnerPagination(total) {
    const host = $("partnerPagination");
    host.innerHTML = "";
    const pages = Math.ceil(total / size);
    for (let i = 1; i <= pages; i++) {
        const b = document.createElement("button");
        b.className = "pageBtn" + (i === page ? " active" : "");
        b.textContent = i;
        b.onclick = () => {
            page = i;
            loadPartners();
        };
        host.appendChild(b);
    }
}

document.querySelectorAll(".tab").forEach(t => {
    t.onclick = () => {
        document.querySelectorAll(".tab").forEach(a => a.classList.remove("active"));
        t.classList.add("active");
        type = t.dataset.type;
        page = 1;
        loadPartners();
    };
});

document.getElementById("btnLogout").onclick = () => {
    localStorage.removeItem("accessToken");
    location.href = "index.html";
};

loadPartners();