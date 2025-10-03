import { loadModal, showModal } from "./modal.js";

loadModal('modal-container');

const add_form = document.getElementById("add_form");
const newModal = document.getElementById("newRecordModal");
const edit_form = document.getElementById("edit_form");
const editModal = document.getElementById("editRecordModal");
const resultModal = document.getElementById("resultRecordModal");
const goBackBtn = document.getElementById("btnGoBack");

document.addEventListener("DOMContentLoaded", () => {
    // 定義 parts（和 EJS 一樣要有 1~8 的代碼）
    let uploaded_msg = null;

    fetch("/api/auth/lang/zh")
    .then(res => res.json())
    .then(dict => {
        uploaded_msg = dict.uploaded;
    });

    const parts = ["1","2","3","4","5","6","7","8"];

    parts.forEach(code => {
      const btn = document.getElementById(`SelectBtn_${code}`);
      const input = document.getElementById(`upload_${code}`);
      const input2 = document.getElementById(`upload2_${code}`);
      const preview = document.getElementById(`preview_${code}`);

      if (btn && input) {
        // 點擊「選擇圖片」按鈕 → 觸發隱藏的 input file
        btn.addEventListener("click", () => {
          input.click();
        });

        // 當使用者選擇圖片後，更新預覽圖
        input.addEventListener("change", (event) => {
          const file = event.target.files[0];
          const patient_id = newModal.querySelector("input[name='patient_id']").value;

          console.log("file:", file.name);
          if (file) {
            const reader = new FileReader();
            reader.onload = e => {
              preview.src = e.target.result;
              console.log(`preview.src=${preview.src}`);
            };
            reader.readAsDataURL(file);
            btn.innerText = uploaded_msg;
            input2.value = `static/uploads/${patient_id}/${file.name}`;
          }
        });
      }
    });

    // 綁定編輯 Modal
    parts.forEach(code => {
      const btn = document.getElementById(`SelectBtn_edit_${code}`);
      const input = document.getElementById(`upload_edit_${code}`);
      const input2 = document.getElementById(`upload2_edit_${code}`);
      const preview = document.getElementById(`preview_edit_${code}`);

      if (btn && input) {
        // 點擊「選擇圖片」按鈕 → 觸發隱藏的 input file
        btn.addEventListener("click", () => {
          input.click();
        });

        input.addEventListener("change", (event) => {
          const file = event.target.files[0];
          if (file) {
            const reader = new FileReader();
            const patient_id = editModal.querySelector("input[name='patient_id']").value;

            reader.onload = e => {
              preview.src = e.target.result;
              console.log(`preview.src=${preview.src}`);
            };
            reader.readAsDataURL(file);
            btn.innerText = uploaded_msg;
            console.log(`btn.innerText: ${btn.innerText}`);
            input2.value = `static/uploads/${patient_id}/${file.name}`;
          }
        });
      }
    });

    if (add_form) {
        add_form.addEventListener("submit", async (e) => {
            e.preventDefault();

            const formData = new FormData(add_form);

            // 把觸發的按鈕補進 formData
            if (e.submitter) {
                formData.append(e.submitter.name, e.submitter.value);
            }

            const res = await fetch("/api/auth/new_record", {
                method: "POST",
                body: formData,
            });

            const data = await res.json();
            console.log(data);
        
            if (!data.success) {
                showModal(`新增病例失敗: ${data.message}`);
                return;
            }

            showModal("新增病例成功", () => {
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

    if (edit_form) {
        edit_form.addEventListener("submit", async (e) => {
            e.preventDefault();

            const formData = new FormData(edit_form);

            // 把觸發的按鈕補進 formData
            if (e.submitter) {
                formData.append(e.submitter.name, e.submitter.value);
            }

            console.log("formData:", formData.entries());

            const res = await fetch("/api/auth/edit_record", {
                method: "POST",
                body: formData,
            });

            const data = await res.json();
            console.log(data);
        
            if (!data.success) {
                showModal(`編輯病例失敗: ${data.message}`);
                return;
            }

            showModal(data.message, () => {
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

    /*
    if (newModal) {
        newModal.addEventListener("show.bs.modal", (e) => {
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
            newModal.querySelector("input[name='name']").value = name;
            newModal.querySelector("select[name='gender']").value = gender;
            newModal.querySelector("input[name='age']").value = age;
            newModal.querySelector("textarea[name='notes']").value = notes;

            let hiddenId = newModal.querySelector("input[name='record_id']");
            if (!hiddenId) {
                hiddenId = document.createElement("input");
                hiddenId.type = "hidden";
                hiddenId.name = "record_id";
                newModal.querySelector("form").appendChild(hiddenId);
            }
            hiddenId.value = record_id;

            // 口腔圖片
            for (let i = 1; i <= 8; i++) {
                const picVal = link.getAttribute(`data-pic${i}`);  // 原本的檔案路徑
                const input = newModal.querySelector(`#upload2_edit_${i}`); // hidden input
                const img = newModal.querySelector(`#preview_edit_${i}`);  // 預覽 <img>

                console.log("picVal:", picVal);

                if (input && img) {
                    input.value = picVal || "";
                    img.src = picVal ? picVal : `/static/images/${i}.png`; // 如果沒有就顯示預設圖
                }
            }
        });
    }
    */

    if (editModal) {
        editModal.addEventListener("show.bs.modal", (e) => {
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
            editModal.querySelector("input[name='name']").value = name;
            editModal.querySelector("select[name='gender']").value = gender;
            editModal.querySelector("input[name='age']").value = age;
            editModal.querySelector("textarea[name='notes']").value = notes;

            let hiddenId = editModal.querySelector("input[name='record_id']");
            if (!hiddenId) {
                hiddenId = document.createElement("input");
                hiddenId.type = "hidden";
                hiddenId.name = "record_id";
                editModal.querySelector("form").appendChild(hiddenId);
            }
            hiddenId.value = record_id;

            // 口腔圖片
            for (let i = 1; i <= 8; i++) {
                const picVal = link.getAttribute(`data-pic${i}`);  // 原本的檔案路徑
                const input = editModal.querySelector(`#upload2_edit_${i}`); // hidden input
                const img = editModal.querySelector(`#preview_edit_${i}`);  // 預覽 <img>

                console.log("picVal.length:", picVal.length);

                if (input && img) {
                    input.value = picVal || "";
                    img.src = (picVal && picVal.split('/')[3] !== "undefined") ? picVal : `/static/images/${i}.png`; // 如果沒有就顯示預設圖
                }
            }
        });
    }

    if (resultModal) {
        resultModal.addEventListener("show.bs.modal", (event) => {
            // 觸發 modal 的按鈕
            const button = event.relatedTarget;

            console.log("這個 modal 是由以下按鈕觸發的:", button.id);
            
            // 你可以把它記錄到 modal 裡
            resultModal.setAttribute("data-trigger-id", button.id);
        });
    }
    
    if (goBackBtn) {
        goBackBtn.addEventListener("click", () => {
            const resultModal = document.getElementById("resultRecordModal");
            const triggerId = resultModal.getAttribute("data-trigger-id");

            console.log(`triggerId: ${triggerId}`);

            const bsResultModal = bootstrap.Modal.getInstance(resultModal);
            bsResultModal.hide();

            if (triggerId === "check_result_add") {
              bootstrap.Modal.getOrCreateInstance(document.getElementById("newRecordModal")).show();
            } else if (triggerId === "check_result_edit") {
              bootstrap.Modal.getOrCreateInstance(document.getElementById("editRecordModal")).show();
            }
        });
    }
});