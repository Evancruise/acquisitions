import { loadModal, showModal } from "./modal.js";

loadModal("modal-container");

const professor_div = document.getElementById("professor");
const patient_div = document.getElementById("patient");
const professorForm = document.getElementById("professor-tab");
const patientForm = document.getElementById("patient-tab");

console.log("professorForm:", professorForm);
console.log("patientForm:", patientForm);

const canvas = document.getElementById("snapshot");
const ctx = canvas.getContext("2d");

/*
const video = document.getElementById("camera");
const canvas = document.getElementById("snapshot");
const ctx = canvas.getContext("2d");
const resultDiv = document.getElementById("scan-result");
const resetBtn = document.getElementById("reset-scan");
const patient_tab = document.getElementById("patient-tab");
const professor_tab = document.getElementById("professor-tab");

let stream = null;
let scanning = false;
let scannedContent = null;
*/

/*
async function startCamera() {
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
    video.srcObject = stream;
    video.setAttribute("playsinline", true); // iOS fix
    scanning = true;
    video.play();
    requestAnimationFrame(scanQRCode);
  } catch (err) {
    console.error("Error accessing camera:", err);
  }
}
*/

/*
function scanQRCode() {
    if (!scanning) return;

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "dontInvert",
        });

        if (code) {
            scannedContent = code.data;
            console.log("✅ QR Code Detected:", scannedContent);
            resultDiv.innerText = `掃描成功，驗證中...`;

            stopCamera();

            fetch('/api/auth/scan_result', {
                method: 'POST',
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ qrContent: scannedContent }),
            })
            .then(res => res.json())
            .then(data => {
                console.log("伺服器回應:", data);
                resultDiv.innerText = `✅ ${data.message}`;
                // 如果要自動導向，可以這樣做：
                // if (data.success) window.location.href = "/dashboard";
            })
            .catch(err => {
                console.error("驗證失敗:", err);
                resultDiv.innerText = "❌ QR Code 驗證失敗，請重試";
            });

            return;
        }
    }

    requestAnimationFrame(scanQRCode);
}
*/

/*
function stopCamera() {
  scanning = false;
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
    stream = null;
  }
}
*/

async function loadQRCode() {
    const res = await fetch("/api/auth/generate_qr");
    const data = await res.json();
    document.getElementById("qrImage").src = data.qrImage;
    // 這裡 data.token 就是病患要掃的內容
}

document.addEventListener("DOMContentLoaded", () => {

    // let close_msg = null;
    // let open_msg = null;

    // fetch("/api/auth/lang/zh")
    // .then(res => res.json())
    // .then(dict => {
    //     close_msg = dict.close_msg;
    //     open_msg = dict.open_msg;
    //});

    /*
    if (resetBtn) {
        resetBtn.addEventListener("click", () => {
            scannedContent = null;
            resultDiv.innerText = "";
            startCamera();
        });
    }
    */

    /*
    if (patient_tab) {
        patient_tab.addEventListener("click", () => {
            resultDiv.innerText = "";
            scannedContent = null;
            startCamera();
        });
    }
    */

        console.log(`patient_div.classList: ${patient_div.classList}`);
        console.log(`professor_div.classList: ${professor_div.classList}`);

        if (patient_div && !patient_div.classList.contains("hidden")) {
            console.log(`patientForm event`);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height);
            
            loadQRCode();

            if (code) {
                const scannedToken = code.data;
            
                fetch("/api/auth/scan_result", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ qrContent: scannedToken })
                })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        window.location.href = "/api/auth/dashboard";
                    } else {
                        alert(data.message);
                    }
                });
            }
        }

        if (professor_div && !professor_div.classList.contains("hidden")) {
            professorForm.addEventListener("submit", async (e) => {
                console.log(`professorForm event`);
                e.preventDefault();

                const formData = new FormData(professorForm);
                const body = Object.fromEntries(formData.entries());

                try {
                    const res = await fetch("/api/auth/sign-in", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(body),
                    });

                    const data = await res.json();

                    if (!data.success) {
                        showModal(`登入失敗: ${data.message}`);
                        return;
                    }

                    window.location.href = "/api/auth/dashboard"; // 如何引入data.user.name
                } catch (err) {
                    showModal(`伺服器錯誤: ${err.message}`);
                }
            });
        }
});