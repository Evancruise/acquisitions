import { showModal } from "./modal.js";

let logoutTimer;

function startLogoutTimer(minutes) {
    clearTimeout(logoutTimer);
    logoutTimer = setTimeout(() => {
        showModal("登入已過期，請重新登入！");
        window.location.href = "/api/auth/loginPage";  // 或呼叫登出 API
    }, minutes * 60 * 1000);
};

["click", "mousemove", "keydown"].forEach(evt => {
    document.addEventListener(evt, () => startLogoutTimer(30));
});