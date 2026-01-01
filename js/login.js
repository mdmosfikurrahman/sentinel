/* ================= CONFIG ================= */

const LOGIN_URL = "https://akijair.ibos.io/user-management/v1/auth/admin-login";

/* ================= ELEMENTS ================= */

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const msg = document.getElementById("msg");
const loginBtn = document.getElementById("loginBtn");

const togglePassword = document.getElementById("togglePassword");
const eyeOpen = document.getElementById("eyeOpen");
const eyeClosed = document.getElementById("eyeClosed");

/* ================= PASSWORD TOGGLE ================= */
passwordInput.addEventListener("keydown", e => {
    if (e.key === "Enter") {
        loginBtn.click();
    }
});
passwordInput.addEventListener("keyup", e => {
    if (e.getModifierState("CapsLock")) {
        msg.textContent = "Caps Lock is ON";
    }
});

document.addEventListener("contextmenu", e => e.preventDefault());
togglePassword.addEventListener("click", () => {
    const isPassword = passwordInput.type === "password";

    passwordInput.type = isPassword ? "text" : "password";
    eyeOpen.style.display = isPassword ? "none" : "";
    eyeClosed.style.display = isPassword ? "" : "none";
});

/* ================= LOGIN ================= */

loginBtn.addEventListener("click", async () => {
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    if (!email || !password) {
        msg.textContent = "Email & password are required";
        return;
    }

    msg.textContent = "Signing in…";

    try {
        const res = await fetch(LOGIN_URL, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({email, password})
        });

        const json = await res.json();

        if (json?.isSuccess) {
            localStorage.setItem("accessToken", json.data.accessToken);
            window.location.href = "pricing-preview.html";
        } else {
            msg.textContent = json?.message || "Login failed";
        }
    } catch (err) {
        msg.textContent = "Network error";
    }
});
