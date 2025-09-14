import express from "express";

const app = express();

const PORT = process.env.PORT || 8080;

// 對應指令: node --watch index.js: 輸出 Listening on 3000 ...
app.listen(PORT, () => {
    console.log(`Listening on ${PORT} ...`);
});
