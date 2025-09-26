import express from 'express';
import helmet from 'helmet';
import logger from '#config/logger.js';
import morgan from 'morgan';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from '#routes/auth.route.js'; // ✅ 引入 authRoutes
import usersRoutes from '#routes/users.route.js';
import registersRoutes from '#routes/registers.route.js';
import recordsRoutes from "#routes/records.route.js";

import bodyParser from "body-parser";
import expressLayouts from "express-ejs-layouts";
import session from "express-session";

// import securityMiddleWare from '#middleware/security.middleware.js';
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();

app.use(cors())
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(session({
    secret: process.env.SESSION_SECRET || 'default_secret',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 30 * 60 * 1000 } // 在生產環境中使用安全 cookie
}));

app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim())}}));
app.set("view engine", "ejs");
// app.use(securityMiddleWare);
app.use(express.static(path.join(__dirname, "../public")));
app.use("/bootstrap", express.static(path.join(process.cwd(), "node_modules/bootstrap/dist")));

app.use('/static', express.static('node_modules/bootstrap/dist'));
app.use("/static", express.static("public"));

app.set("views", path.join(__dirname, "views"));

app.use(expressLayouts);
app.set("layout", "layout"); // 預設母版 layout.ejs

app.get('/', (req, res) => {
    res.render("loginPage", { layout: false }); // render views/loginPage.ejs
});

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', timestamp: new Date().toISOString(), uptime: process.uptime() });
});

app.get('/api', (req, res) => {
    res.status(200).json({ message: 'Acquisitions API is running!' });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/registers', registersRoutes);
app.use('/api/records', recordsRoutes);

app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

export default app;