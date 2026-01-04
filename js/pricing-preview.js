if (!localStorage.getItem("accessToken")) {
    location.href = "index.html";
}

function getToken() {
    return "Bearer " + (localStorage.getItem("accessToken") || "");
}

btnLogout.onclick = () => {
    localStorage.removeItem("accessToken");
    location.href = "index.html";
};

const PRICING_PREVIEW_URL = API.pricing.preview;
const PARTNER_LOOKUP_URL  = API.lookups.partners;
const GROUP_LOOKUP_URL    = API.lookups.groups;
const JOURNEY_LOOKUP_URL  = API.lookups.journeys;

const allowedJourneyCodes = new Set(["1", "2", "3"]);

const appliedOnMap = {0: "0", 1: "Total", 2: "Base"};
const typeMap = {0: "0", 1: "Percentage", 2: "Flat"};

const $ = (id) => document.getElementById(id);

function setHealth(state, text) {
    const dot = $("healthDot");
    dot.className = "dot" + (state ? (" " + state) : "");
    $("healthText").textContent = text || "Ready";
}

function setSubmitting(on) {
    $("submitState").style.display = on ? "" : "none";
    $("btnSubmit").disabled = on;
    $("btnReset").disabled = on;
}

function setHint(id, msg) {
    const el = $(id);
    if (!msg) {
        el.textContent = "";
        el.classList.remove("show");
        return;
    }
    el.textContent = msg;
    el.classList.add("show");
}

function setPill(id, variant, text) {
    const el = $(id);
    el.className = "pill" + (variant ? (" " + variant) : "");
    el.textContent = text || "";
}

function showResults(show) {
    $("cardsRow").style.display = show ? "" : "none";
    $("empty").style.display = show ? "none" : "";
}

function toast(kind, title, message, timeout = 3200) {
    const host = $("toastHost");
    const t = document.createElement("div");
    t.className = "toast";

    const icon = document.createElement("div");
    icon.className = "toastIcon " + (kind || "");
    icon.innerHTML = (kind === "ok")
        ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="#166534" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`
        : (kind === "bad")
            ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18" stroke="#7f1d1d" stroke-width="2" stroke-linecap="round"/><path d="M6 6l12 12" stroke="#7f1d1d" stroke-width="2" stroke-linecap="round"/></svg>`
            : `<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 9v4" stroke="#7c2d12" stroke-width="2" stroke-linecap="round"/><path d="M12 17h.01" stroke="#7c2d12" stroke-width="2" stroke-linecap="round"/><path d="M10.3 4.3l-7.6 13.2A2 2 0 0 0 4.4 20h15.2a2 2 0 0 0 1.7-2.5L13.7 4.3a2 2 0 0 0-3.4 0z" stroke="#7c2d12" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

    const text = document.createElement("div");
    text.className = "toastText";
    text.innerHTML = `<p class="toastTitle">${escapeHtml(title || "")}</p><p class="toastMsg">${escapeHtml(message || "")}</p>`;

    const close = document.createElement("button");
    close.className = "toastClose";
    close.type = "button";
    close.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18" stroke="#5b677a" stroke-width="2" stroke-linecap="round"/><path d="M6 6l12 12" stroke="#5b677a" stroke-width="2" stroke-linecap="round"/></svg>`;
    close.onclick = () => t.remove();

    t.appendChild(icon);
    t.appendChild(text);
    t.appendChild(close);
    host.appendChild(t);

    if (timeout > 0) setTimeout(() => {
        try {
            t.remove();
        } catch {
        }
    }, timeout);
}

function escapeHtml(s) {
    return String(s ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function omitEmpty(obj) {
    const out = {};
    for (const [k, v] of Object.entries(obj)) {
        if (v === undefined || v === null) continue;
        if (typeof v === "string" && v.trim() === "") continue;

        if (Array.isArray(v)) {
            const cleaned = v
                .map(x => (x && typeof x === "object" && !Array.isArray(x)) ? omitEmpty(x) : x)
                .filter(x => {
                    if (x === undefined || x === null) return false;
                    if (typeof x === "string" && x.trim() === "") return false;
                    if (typeof x === "object" && !Array.isArray(x) && Object.keys(x).length === 0) return false;
                    return true;
                });
            if (cleaned.length === 0) continue;
            out[k] = cleaned;
            continue;
        }

        if (typeof v === "object") {
            const cleaned = omitEmpty(v);
            if (Object.keys(cleaned).length === 0) continue;
            out[k] = cleaned;
            continue;
        }

        out[k] = v;
    }
    return out;
}

function buildPayload() {
    const origin = $("segOrigin").value.trim().toUpperCase();
    const destination = $("segDestination").value.trim().toUpperCase();
    const departureDate = $("segDate").value;

    const segment = omitEmpty({origin, destination, departureDate});

    const base = {
        partnerId: $("partnerId").value.trim(),
        groupId: $("groupId").value.trim(),
        journeyType: Number($("journeyType").value),
        segments: Object.keys(segment).length ? [segment] : [],
        airline: $("airline").value.trim().toUpperCase()
    };
    return omitEmpty(base);
}

async function safeJsonFetch(url) {
    const res = await fetch(url, {
        method: "GET",
        headers: {
            "accept": "*/*",
            "Authorization": getToken()
        }
    });
    const text = await res.text();
    try {
        return JSON.parse(text);
    } catch {
        return null;
    }
}

function fillSelect(selectEl, placeholderText, items) {
    selectEl.innerHTML = "";
    const ph = document.createElement("option");
    ph.value = "";
    ph.textContent = placeholderText;
    ph.selected = true;
    selectEl.appendChild(ph);

    for (const it of items) {
        const opt = document.createElement("option");
        opt.value = it.id;
        opt.textContent = it.name;
        selectEl.appendChild(opt);
    }
}

async function loadPartners() {
    const select = $("partnerId");
    fillSelect(select, "Loading partners…", []);
    setHint("partnerHint", "");

    try {
        const json = await safeJsonFetch(PARTNER_LOOKUP_URL);
        if (!json?.isSuccess || !Array.isArray(json?.data)) {
            fillSelect(select, "Select a partner (optional)", []);
            setHint("partnerHint", json?.message || "Unable to load partners.");
            return;
        }

        const items = json.data
            .map(p => ({id: String(p.partnerId || "").toUpperCase(), name: p.companyName || ""}))
            .filter(x => x.id && x.name)
            .sort((a, b) => a.name.localeCompare(b.name));

        fillSelect(select, "Select a partner (optional)", items);
    } catch {
        fillSelect(select, "Select a partner (optional)", []);
        setHint("partnerHint", "Unable to load partners.");
    }
}

async function loadGroups() {
    const select = $("groupId");
    fillSelect(select, "Loading groups…", []);
    setHint("groupHint", "");

    try {
        const json = await safeJsonFetch(GROUP_LOOKUP_URL);
        if (!json?.isSuccess || !Array.isArray(json?.data)) {
            fillSelect(select, "Select a group (optional)", []);
            setHint("groupHint", json?.message || "Unable to load groups.");
            return;
        }

        const items = json.data
            .map(g => ({id: String(g.id || "").toUpperCase(), name: g.name || g.code || ""}))
            .filter(x => x.id && x.name)
            .sort((a, b) => a.name.localeCompare(b.name));

        fillSelect(select, "Select a group (optional)", items);
    } catch {
        fillSelect(select, "Select a group (optional)", []);
        setHint("groupHint", "Unable to load groups.");
    }
}

async function loadJourneyTypes() {
    const select = $("journeyType");
    fillSelect(select, "Loading journey types…", []);
    setHint("journeyHint", "");

    try {
        const json = await safeJsonFetch(JOURNEY_LOOKUP_URL);
        if (!json?.isSuccess || !Array.isArray(json?.data)) {
            fillSelect(select, "Select journey type", []);
            setHint("journeyHint", json?.message || "Unable to load journey types.");
            return;
        }

        const items = json.data
            .filter(j => allowedJourneyCodes.has(String(j.code)))
            .map(j => ({id: String(j.code), name: j.name || ""}))
            .filter(x => x.id && x.name);

        fillSelect(select, "Select journey type", items);
        if (items.some(x => x.id === "1")) select.value = "1";
    } catch {
        fillSelect(select, "Select journey type", []);
        setHint("journeyHint", "Unable to load journey types.");
    }
}

async function callPreview(payload) {
    const res = await fetch(PRICING_PREVIEW_URL, {
        method: "POST",
        headers: {
            "accept": "*/*",
            "Content-Type": "application/json",
            "Authorization": getToken()
        },
        body: JSON.stringify(payload)
    });

    const text = await res.text();
    try {
        return JSON.parse(text);
    } catch {
        return {isSuccess: false, statusCode: String(res.status), message: "Non-JSON response"};
    }
}

function mapEnum(value, map) {
    if (value === null || value === undefined) return "";
    const n = Number(value);
    return (map[n] !== undefined) ? map[n] : String(value);
}

function formatValue(typeLabel, rawValue) {
    if (rawValue === null || rawValue === undefined) return "";
    const n = Number(rawValue);
    const printable = Number.isFinite(n) ? String(n) : String(rawValue);
    return (typeLabel === "Percentage") ? (printable + "%") : printable;
}

function setValue(id, v) {
    $(id).textContent = (v === null || v === undefined) ? "" : String(v);
}

function onOff(enabled) {
    if (enabled === true) return {variant: "ok", text: "Yes"};
    if (enabled === false) return {variant: "bad", text: "No"};
    return {variant: "", text: ""};
}

function normalize(data) {
    if (!data || typeof data !== "object") return null;

    const mkType = mapEnum(data.markupType, typeMap);
    const dsType = mapEnum(data.discountType, typeMap);
    const cmType = mapEnum(data.commissionType, typeMap);

    return {
        supplierName: data.supplierName ?? "",
        supplierCode: data.supplierShortCode ?? "",
        supplierCurrency: data.supplierCurrency ?? "",

        isMarkupApply: data.isMarkupApply,
        markupType: mkType,
        markupValue: formatValue(mkType, data.markupValue),
        markupAppliedOn: mapEnum(data.markupAppliedOn, appliedOnMap),

        isDiscountApply: data.isDiscountApply,
        discountType: dsType,
        discountValue: formatValue(dsType, data.discountValue),
        discountAppliedOn: mapEnum(data.discountAppliedOn, appliedOnMap),

        isCommissionApply: data.isCommissionApply,
        commissionSource: data.commissionSource ?? "",
        commissionAirlineCode: data.commissionAirlineCode,
        commissionType: cmType,
        commissionValue: formatValue(cmType, data.commissionValue),
        commissionAppliedOn: mapEnum(data.commissionAppliedOn, appliedOnMap)
    };
}

function toggleAirlineCodeRow(value) {
    const row = $("airlineCodeRow");
    const hasValue = value !== null && value !== undefined && String(value).trim() !== "";
    row.classList.toggle("hiddenRow", !hasValue);
}

function renderCards(data) {
    if (!data) {
        showResults(false);
        setPill("resultPill", "", "No data");
        $("commissionSourceInline").textContent = "";
        toggleAirlineCodeRow(null);
        setValue("commissionAirlineCode", "");
        return;
    }

    const d = normalize(data);
    showResults(true);
    setPill("resultPill", "ok", "Loaded");

    setValue("supplierName", d.supplierName);
    setValue("supplierCode", d.supplierCode);
    setValue("supplierCurrency", d.supplierCurrency);
    setPill("supplierPill", "ok", (d.supplierName || d.supplierCode) ? "Ready" : "");

    const mk = onOff(d.isMarkupApply);
    setPill("markupPill", mk.variant, mk.text);
    setValue("markupEnabled", d.isMarkupApply === true ? "Yes" : d.isMarkupApply === false ? "No" : "");
    setValue("markupAppliedOn", d.markupAppliedOn);
    setValue("markupType", d.markupType);
    setValue("markupValue", d.markupValue);

    const ds = onOff(d.isDiscountApply);
    setPill("discountPill", ds.variant, ds.text);
    setValue("discountEnabled", d.isDiscountApply === true ? "Yes" : d.isDiscountApply === false ? "No" : "");
    setValue("discountAppliedOn", d.discountAppliedOn);
    setValue("discountType", d.discountType);
    setValue("discountValue", d.discountValue);

    const cm = onOff(d.isCommissionApply);
    setPill("commissionPill", cm.variant, cm.text);
    setValue("commissionEnabled", d.isCommissionApply === true ? "Yes" : d.isCommissionApply === false ? "No" : "");
    setValue("commissionAppliedOn", d.commissionAppliedOn);
    setValue("commissionType", d.commissionType);
    setValue("commissionValue", d.commissionValue);

    const src = (d.commissionSource && String(d.commissionSource).trim()) ? String(d.commissionSource).trim() : "";
    $("commissionSourceInline").textContent = src ? `(${src})` : "";

    toggleAirlineCodeRow(d.commissionAirlineCode);
    setValue("commissionAirlineCode", d.commissionAirlineCode ?? "");
}

function resetDefaultsUiOnly() {
    $("airline").value = "BG";
    $("segOrigin").value = "DAC";
    $("segDestination").value = "CXB";
    $("segDate").value = "2025-12-30";

    $("empty").textContent = "No preview loaded.";
    setPill("resultPill", "", "No data");
    $("commissionSourceInline").textContent = "";
    renderCards(null);
}

async function resetAll() {
    resetDefaultsUiOnly();
    await Promise.all([loadPartners(), loadGroups(), loadJourneyTypes()]);
}

$("btnReset").addEventListener("click", () => {
    toast("warn", "Reset", "Filters restored to defaults.");
    resetAll();
});

$("btnSubmit").addEventListener("click", async () => {
    setSubmitting(true);
    setPill("resultPill", "warn", "Loading…");

    const payload = buildPayload();

    try {
        const response = await callPreview(payload);
        if (response?.isSuccess) {
            renderCards(response.data);
            toast("ok", "Preview loaded", "Pricing preview retrieved successfully.");
        } else {
            renderCards(null);
            setPill("resultPill", "bad", "Failed");
            $("empty").textContent = response?.message || "Request failed.";
            toast("bad", "Request failed", response?.message || "Unable to load preview.");
        }
    } catch (err) {
        renderCards(null);
        setPill("resultPill", "bad", "Error");
        $("empty").textContent = "Error: " + (err?.message || "Unknown");
        toast("bad", "Error", err?.message || "Unknown error.");
    } finally {
        setSubmitting(false);
    }
});

resetAll();