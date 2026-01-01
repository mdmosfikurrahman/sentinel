const LOGIN_URL = "https://akijair.ibos.io/user-management/v1/auth/admin-login";

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const msg = document.getElementById("msg");

document.getElementById("loginBtn").onclick = async () => {
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    if(!email || !password){
        msg.textContent = "Email & password are required";
        return;
    }

    msg.textContent = "Signing in…";

    try{
        const res = await fetch(LOGIN_URL,{
            method:"POST",
            headers:{ "Content-Type":"application/json" },
            body: JSON.stringify({ email,password })
        });

        const json = await res.json();

        if(json?.isSuccess){
            localStorage.setItem("accessToken", json.data.accessToken);
            window.location.href = "pricing-preview.html";
        } else {
            msg.textContent = json?.message || "Login failed";
        }
    } catch{
        msg.textContent = "Network error";
    }
};