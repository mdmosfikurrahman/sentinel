/* ===========================================================
   GLOBAL SECURITY SHIELD — applies to every page
=========================================================== */

const warn = document.getElementById("devWarn");

function showDevWarning(){
    if(!warn) return;
    warn.style.display = "flex";
    setTimeout(()=>warn.style.display="none",2500);
}

/* ===========================
   DISABLE CONTEXT MENU
=========================== */

document.addEventListener("contextmenu", e=>{
    e.preventDefault();
    showDevWarning();
});


/* ===========================
   DISABLE DEVTOOLS KEYS
=========================== */

document.addEventListener("keydown", e=>{
    if(
        e.key === "F12" ||
        (e.ctrlKey && e.shiftKey && ["I","J","C"].includes(e.key)) ||
        (e.ctrlKey && e.key === "U")
    ){
        e.preventDefault();
        showDevWarning();
    }
});


/* ===========================
   DEVTOOLS SIZE DETECTION
=========================== */

setInterval(()=>{
    const t = 160;
    if(
        window.outerWidth - window.innerWidth > t ||
        window.outerHeight - window.innerHeight > t
    ){
        showDevWarning();
    }
},600);


/* ===========================
   MOBILE SECURITY LAYER
=========================== */

let touchStartTime = 0;

document.addEventListener("touchstart",()=>{
    touchStartTime = Date.now();
});

document.addEventListener("touchend",()=>{
    if(Date.now() - touchStartTime > 600){
        showDevWarning();   // long press
    }
});

document.addEventListener("selectionchange",()=>{
    const s = window.getSelection()?.toString();
    if(s && s.length > 2){
        showDevWarning();   // text select
    }
});

let tapCount = 0;
document.addEventListener("touchend",()=>{
    tapCount++;
    setTimeout(()=>tapCount = 0,400);
    if(tapCount >= 3){
        showDevWarning();   // triple-tap
    }
});

document.addEventListener("gesturestart", e=>{
    e.preventDefault();
    showDevWarning();
});

document.addEventListener("dblclick", e=>{
    e.preventDefault();
    showDevWarning();
});
