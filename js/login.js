/* ===========================================================
   OTA ADMIN — LOGIN CONTROLLER
=========================================================== */

const LOGIN_URL = API.auth.login;

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const msg = document.getElementById("msg");
const loginBtn = document.getElementById("loginBtn");

const togglePassword = document.getElementById("togglePassword");
const eyeOpen = document.getElementById("eyeOpen");
const eyeClosed = document.getElementById("eyeClosed");


/* ===========================
   BUTTON VISIBILITY
=========================== */

loginBtn.style.opacity = "0";
loginBtn.style.pointerEvents = "none";
loginBtn.style.transition = "opacity .18s ease";

function isValidEmail(v){
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function reevaluateButton(){
    const ok =
        emailInput.value.trim() &&
        passwordInput.value.trim() &&
        isValidEmail(emailInput.value.trim());

    loginBtn.style.opacity = ok ? "1" : "0";
    loginBtn.style.pointerEvents = ok ? "auto" : "none";

    if(!ok) msg.textContent = "";
}

emailInput.addEventListener("input", reevaluateButton);
passwordInput.addEventListener("input", reevaluateButton);


/* ===========================
   CAPS LOCK NOTICE
=========================== */

passwordInput.addEventListener("keyup", e=>{
    if(e.getModifierState("CapsLock"))
        msg.textContent = "Caps Lock is ON";
});


/* ===========================
   ENTER = LOGIN
=========================== */

passwordInput.addEventListener("keydown", e=>{
    if(e.key === "Enter") loginBtn.click();
});


/* ===========================
   PASSWORD VISIBILITY TOGGLE
=========================== */

togglePassword.addEventListener("click", ()=>{
    const isPass = passwordInput.type === "password";

    passwordInput.type = isPass ? "text" : "password";
    eyeOpen.style.display = isPass ? "none" : "";
    eyeClosed.style.display = isPass ? "" : "none";
});


/* ===========================
   LOGIN REQUEST
=========================== */

loginBtn.addEventListener("click", async ()=>{

    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    if(!email || !password || !isValidEmail(email)) return;

    msg.textContent = "Establishing secure session…";

    try{
        const res = await fetch(LOGIN_URL,{
            method:"POST",
            headers:{"Content-Type":"application/json"},
            body:JSON.stringify({email,password})
        });

        const json = await res.json();

        if(json?.isSuccess){
            localStorage.setItem("accessToken", json.data.accessToken);
            location.href = "pricing-preview.html";
        }else{
            msg.textContent = json?.message || "Authentication failed";
        }

    }catch{
        msg.textContent = "Network channel unavailable";
    }
});


/* ===========================
   INIT
=========================== */
reevaluateButton();
