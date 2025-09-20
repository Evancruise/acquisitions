import { loadModal, showModal } from "./modal.js";

loadModal('modal-container');

const form = document.getElementById("signup_form");

console.log("form:", form);

if (form) {
    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const formData = new FormData(form);
        const body = Object.fromEntries(formData.entries());
        console.log("body:", JSON.stringify(body));

        const res = await fetch("/api/auth/sign-up", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });

        const data = await res.json();
        console.log(data);
    
        if (!data.success) {
            showModal(`註冊失敗:${data.error}`);
            return;
        }

        showModal("註冊成功！請設定密碼", () => {
            setTimeout(() => {
                window.location.href = "/api/auth/loginPage";
            }, 1500);
        }, () => {
            setTimeout(() => {
                window.location.href = "/api/auth/changepwd";
            }, 1500);
        });
    });
}

