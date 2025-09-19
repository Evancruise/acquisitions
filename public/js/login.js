import { loadModal, showModal } from "./modal.js";

loadModal("modal-container");
const form = document.getElementById("login_form");

if (form) {
    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const formData = new FormData(form);
        const body = Object.fromEntries(formData.entries());

        try {
            const res = await fetch("/api/auth/sign-in", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            if (!res.ok) {
                const data = await res.json();
                showModal("登入失敗", data.error || "請稍後再試");
                return;
            }

            window.location.href = "/api/auth/dashboard"; // 如何引入data.user.name
        } catch (err) {
            showModal("伺服器錯誤", "請稍後再試");
        }
    });
}