const img = document.getElementById("qr-image");
const reload_btn = document.getElementById("reload-btn");
const scan_btn = document.getElementById("btn-toggle-scanner");
const scanner_result = document.getElementById("send-scan-btn");
const video = document.getElementById("camera");
const canvas = document.getElementById("snapshot");
const captureBtn = document.getElementById("capture-btn");
const reset_btn = document.getElementById("send-scan-btn-recap");
let scannedContent = "user-binding-token-test";
let stream = null;

document.addEventListener("DOMContentLoaded", () => {
    if (reload_btn) {
        let count = 30;

        setInterval(() => {
            if (count <= 0) {
                img.src = "/api/auth/rebind-qr?ts=" + Date.now();
                count = 30;
            }
            count--;
            document.getElementById("countdown").innerText = count;
        }, 1000);

        reload_btn.addEventListener("click", () => {
            img.src = "/api/auth/rebind-qr?ts=" + Date.now(); // 防止快取
            count = 30;
        });
    }

    if (scan_btn) { // scanner button
        scan_btn.addEventListener("click", async (e) => {
            const container = document.getElementById("scanner-container");
            const btn = e.target;
            if (container.style.display === "none") {
                container.style.display = "block";
                btn.textContent = "關閉掃描器";

                stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
                video.srcObject = stream;

            } else {
                container.style.display = "none";
                btn.textContent = "打開相機掃描";
                
                if (stream) {
                    stream.getTracks().forEach(track => track.stop());
                    stream = null;
                }
            }
        });
    }

    if (reset_btn) {
        reset_btn.addEventListener("click", async (e) => {
            // const container = document.getElementById("scanner-container");
            stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
            video.srcObject = stream;
            video.style.display = "block";
            video.style.margin = "0 auto"; // 保證置中
            captureBtn.style.display = "block";
            reset_btn.style.display = "none";
            canvas.style.display = "none";
            scanner_result.style.display = "none";
        });
    }

    if (captureBtn) {
        captureBtn.addEventListener("click", () => {
            const ctx = canvas.getContext("2d");
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            video.style.display = "none";
            captureBtn.style.display = "none";
            reset_btn.style.display = "block";
            scanner_result.style.display = "block";

            if (stream) {
                stream.getTracks().forEach(track => track.stop());
                stream = null;
            }

            canvas.style.display = "block";

            const imageData = canvas.toDataURL("image/png");
            console.log("Base64 Image Data:", imageData);
        });
    }

    if (scanner_result) {
        scanner_result.addEventListener("click", async (e) => {
            e.preventDefault();

            const res = await fetch('/api/auth/scan_result', {
                method: 'POST',
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ qrContent: scannedContent }),
            });

            const data = await res.json();
            document.getElementById("scan-result").innerText = data.message;
        });
    }
});