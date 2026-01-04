const ACCESS_BASE      = API.access.base;
const ACCESS_MODE      = API.access.mode;
const ACCESS_SWITCH    = API.access.switchMode;
const ACCESS_RULES     = API.access.rules;
const ACCESS_SINGLE    = API.access.single;

if (!localStorage.getItem("accessToken")) location.href = "index.html";

const $ = (id) => document.getElementById(id);
const token = () => "Bearer " + localStorage.getItem("accessToken");

btnLogout.onclick = () => {
    localStorage.removeItem("accessToken");
    location.href = "index.html";
};

function toast(title, msg){
    const t = document.createElement("div");
    t.className = "toast";
    t.innerHTML = `<strong>${title}</strong><br>${msg}`;
    toastHost.appendChild(t);
    setTimeout(() => t.remove(), 2500);
}

function setModeHint(mode, allowAll){
    if (mode === "BLACKLIST" && allowAll) {
        modeHint.innerHTML = `
            <strong>Blacklist Mode</strong><br>
            All users are allowed to access the system by default.
            Only users or IPs explicitly blocked by access rules will be denied access.
        `;
    } else {
        modeHint.innerHTML = `
            <strong>Whitelist Mode</strong><br>
            All users are blocked by default.
            Only users or IPs explicitly allowed by access rules will be permitted.
        `;
    }
}

async function loadMode(){
    const r = await fetch(ACCESS_MODE, { headers:{ Authorization: token() }});
    const j = await r.json();

    if (j?.isSuccess){
        const m = j.data.mode;
        const a = j.data.allowAll === true;
        modePill.className = "pill " + (m === "BLACKLIST" ? "bad" : "ok");
        modePill.textContent = m;
        setModeHint(m, a);
    }
}

async function loadRules(){
    const r = await fetch(ACCESS_RULES, { headers:{ Authorization: token() }});
    const j = await r.json();
    if (!j?.isSuccess) return;

    ruleTable.innerHTML = "";
    j.data.forEach(x => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${x.ruleType}</td>
            <td>${x.ruleValue}</td>
            <td>${x.description || ""}</td>
            <td>
                <span class="pill ${x.isAllow ? "ok" : "bad"}">
                    ${x.isAllow ? "ALLOW" : "BLOCK"}
                </span>
            </td>
            <td>
                <button class="btn"
                    onclick="toggleRule('${x.id}',${x.isAllow})">
                    ${x.isAllow ? "Block" : "Allow"}
                </button>
            </td>
        `;
        ruleTable.appendChild(tr);
    });

    ruleCount.textContent = j.data.length + " Rules";
}

window.toggleRule = async (id, isAllow) => {
    await fetch(`${ACCESS_SINGLE(id)}/${isAllow ? "block" : "allow"}`, {
        method:"PUT",
        headers:{ Authorization: token() }
    });

    loadRules();
    toast("Updated", "Rule updated successfully");
};

btnCreateRule.onclick = () => modalBackdrop.style.display = "flex";
btnCancel.onclick = () => modalBackdrop.style.display = "none";

btnSubmitRule.onclick = async () => {
    await fetch(ACCESS_BASE, {
        method:"POST",
        headers:{
            Authorization: token(),
            "Content-Type":"application/json"
        },
        body: JSON.stringify({
            ruleType: ruleType.value,
            ruleValue: ruleValue.value.trim(),
            isAllow: isAllow.value === "true",
            description: description.value.trim()
        })
    });

    modalBackdrop.style.display = "none";
    loadRules();
    toast("Created", "Rule added successfully");
};

btnSwitchMode.onclick = () => {
    const current = modePill.textContent.trim();
    const next = current === "BLACKLIST" ? "WHITELIST" : "BLACKLIST";

    if (next === "BLACKLIST") {
        modeConfirmMsg.innerHTML = `
            <strong>Switch to Blacklist Mode</strong><br><br>
            In Blacklist Mode, access is allowed for all users by default.
            Only users, emails, or IP addresses explicitly blocked by rules
            will be denied access.<br><br>
            <strong>Impact:</strong><br>
            • Existing users remain accessible<br>
            • Block rules take effect immediately<br>
            • No user is blocked unless explicitly denied
        `;
    } else {
        modeConfirmMsg.innerHTML = `
            <strong>Switch to Whitelist Mode</strong><br><br>
            In Whitelist Mode, all users are blocked by default.
            Only users, emails, or IP addresses explicitly allowed
            by rules will be able to access the system.<br><br>
            <strong>Impact:</strong><br>
            • All users will be blocked unless allowed<br>
            • Allow rules become mandatory<br>
            • Incorrect setup may lock out administrators
        `;
    }

    modeConfirmBackdrop.style.display = "flex";
};

btnCancelMode.onclick = () => {
    modeConfirmBackdrop.style.display = "none";
};

btnConfirmMode.onclick = async () => {
    modeConfirmBackdrop.style.display = "none";

    await fetch(ACCESS_SWITCH, {
        method:"PUT",
        headers:{ Authorization: token() }
    });

    loadMode();
    loadRules();
    toast("Mode Changed", "Global access mode updated");
};

loadMode();
loadRules();