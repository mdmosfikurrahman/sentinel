const LOGIN_URL = API.auth.login;

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const msg = document.getElementById("msg");
const loginBtn = document.getElementById("loginBtn");

const togglePassword = document.getElementById("togglePassword");
const eyeOpen = document.getElementById("eyeOpen");
const eyeClosed = document.getElementById("eyeClosed");

const warn = document.getElementById("devWarn");

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
   CAPS LOCK
=========================== */
passwordInput.addEventListener("keyup", e=>{
    if(e.getModifierState("CapsLock"))
        msg.textContent = "Caps Lock is ON";
});


/* ===========================
   ENTER TRIGGER
=========================== */
passwordInput.addEventListener("keydown", e=>{
    if(e.key === "Enter") loginBtn.click();
});


/* ===========================
   PASSWORD TOGGLE
=========================== */
togglePassword.addEventListener("click", ()=>{
    const isPass = passwordInput.type === "password";
    passwordInput.type = isPass ? "text" : "password";
    eyeOpen.style.display = isPass ? "none" : "";
    eyeClosed.style.display = isPass ? "" : "none";
});


/* ===========================
   LOGIN
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
   SECURITY — ALERT
=========================== */

function showDevWarning(){
    warn.style.display = "flex";
    setTimeout(()=>warn.style.display="none",2500);
}


/* Desktop Tools */
document.addEventListener("contextmenu",e=>{
    e.preventDefault();
    showDevWarning();
});

document.addEventListener("keydown",e=>{
    if(
        e.key==="F12" ||
        (e.ctrlKey && e.shiftKey && ["I","J","C"].includes(e.key)) ||
        (e.ctrlKey && e.key==="U")
    ){
        e.preventDefault();
        showDevWarning();
    }
});

/* DevTools size detect */
setInterval(()=>{
    const t=160;
    if(
        window.outerWidth-window.innerWidth>t ||
        window.outerHeight-window.innerHeight>t
    ){
        showDevWarning();
    }
},600);


/* ===========================
   MOBILE SECURITY
=========================== */

let t0=0;

document.addEventListener("touchstart",()=> t0=Date.now());
document.addEventListener("touchend",()=>{
    if(Date.now()-t0>600) showDevWarning(); // long press
});

document.addEventListener("selectionchange",()=>{
    const s = window.getSelection()?.toString();
    if(s && s.length>2) showDevWarning();
});

let taps=0;
document.addEventListener("touchend",()=>{
    taps++;
    setTimeout(()=>taps=0,400);
    if(taps>=3) showDevWarning();
});

document.addEventListener("gesturestart",e=>{
    e.preventDefault();
    showDevWarning();
});

document.addEventListener("dblclick",e=>{
    e.preventDefault();
    showDevWarning();
});


/* ===========================
   INIT
=========================== */
reevaluateButton();
