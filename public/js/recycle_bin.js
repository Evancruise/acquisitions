import { loadModal, showModal } from "./modal.js";

loadModal('modal-container');

const recycle_form = document.getElementById("recycle_form");
const viewModal = document.getElementById("viewRecordModal");

document.addEventListener("DOMContentLoaded", () => {
    
    if (recycle_form) {
        recycle_form.addEventListener("submit", async (e) => {
            e.preventDefault();

            const formData = new FormData(recycle_form);

            // 把觸發的按鈕補進 formData
            if (e.submitter) {
                formData.append(e.submitter.name, e.submitter.value);
            }

            const res = await fetch("/api/auth/recycle_record", {
                method: "POST",
                body: formData,
            });

            const data = await res.json();
            console.log(data);

            if (!data.success) {
                showModal(`還原/刪除病例失敗: ${data.message}`);
                return;
            }

            showModal(`${data.message}`, () => {
                setTimeout(() => {
                    window.location.href = data.redirect; // 怎麼引入 data.name?
                }, 1500);
            }, () => {
                setTimeout(() => {
                    window.location.href = data.redirect; // 怎麼引入 data.name?
                }, 1500);
            });
        });
    }

    if (viewModal) {
        viewModal.addEventListener("show.bs.modal", (e) => {
            // Trigger modal=record-link element
            const link = e.relatedTarget;

            // fetch data-* attributes' value
            const name = link.getAttribute("data-name");
            const gender = link.getAttribute("data-gender");
            const age = link.getAttribute("data-age");
            const patient_id = link.getAttribute("data-patient_id");
            const notes = link.getAttribute("data-notes");
            const record_id = link.getAttribute("data-record_id");

            // filling the form
            viewModal.querySelector("input[name='name']").value = name;
            viewModal.querySelector("select[name='gender']").value = gender;
            viewModal.querySelector("input[name='age']").value = age;
            viewModal.querySelector("textarea[name='notes']").value = notes;

            let hiddenId = viewModal.querySelector("input[name='record_id']");
            if (!hiddenId) {
                hiddenId = document.createElement("input");
                hiddenId.type = "hidden";
                hiddenId.name = "record_id";
                viewModal.querySelector("form").appendChild(hiddenId);
            }
            hiddenId.value = record_id;

            // 口腔圖片
            for (let i = 1; i <= 8; i++) {
                const picVal = link.getAttribute(`data-pic${i}`);  // 原本的檔案路徑
                const img = viewModal.querySelector(`#preview_${i}`);  // 預覽 <img>

                if (img) {
                    img.src = picVal.split('/')[3] !== "undefined" ? picVal : `/static/images/${i}.png`; // 如果沒有就顯示預設圖
                }

                console.log("img.src:", img.src);
            }
        });
    }
});