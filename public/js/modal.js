/* 
util functions for customized templates
*/
export function loadModal(model_container_name, leftmodal_msg="OK", rightmodal_msg="Cancel") {
    const container = document.getElementById(model_container_name);
    container.innerHTML = `
      <div id="modal" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; 
          background:rgba(0,0,0,0.4); z-index:10000; display:none; align-items:center; justify-content:center;">
        <div style="background:white; padding:20px 30px; border-radius:10px; min-width:280px; max-width:400px; text-align:center; box-shadow:0 4px 20px rgba(0,0,0,0.3);">
          <p id="modal-message" style="font-size:16px; margin-bottom:1.2rem;"></p>
          <div style="display:flex; justify-content:center; gap:1rem;">
            <button id="modal-ok" style="padding:0.6rem 1.2rem; background:#409EFF; color:white; border:none; border-radius:6px; cursor:pointer;">` + leftmodal_msg + `</button>
            <button id="modal-cancel" style="padding:0.6rem 1.2rem; background:#e0e0e0; color:#333; border:none; border-radius:6px; cursor:pointer;">` + rightmodal_msg + `</button>
          </div>
        </div>
      </div>
    `;

    const modal = document.getElementById("modal");
    const model_load = new bootstrap.Modal(modal);
    const okBtn = document.getElementById("modal-ok");
    const cancelBtn = document.getElementById("modal-cancel");

    okBtn.onclick = () => {
        if (modal.okCallback) modal.okCallback();
        model_load.hide();
        modal.style.display = "none";
    };

    cancelBtn.onclick = () => {
        if (modal.cancelCallback) modal.cancelCallback();
        model_load.hide();
        modal.style.display = "none";
    };
}

export function showModal(message, onOk = null, onCancel = null) {
    const modal = document.getElementById("modal");
    document.getElementById("modal-message").innerText = message;
    modal.okCallback = onOk;
    modal.cancelCallback = onCancel;
    modal.style.display = "flex";
}