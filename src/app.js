import express from 'express';
import helmet from 'helmet';
import logger from '#config/logger.js';
import morgan from 'morgan';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from '#routes/auth.route.js'; // ✅ 引入 authRoutes
import usersRoutes from '#routes/users.route.js';
import securityMiddleWare from '#middleware/security.middleware.js';

const app = express();

app.use(cors())
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim())}}))
// app.use(securityMiddleWare);

app.get('/', (req, res) => {
    console.log("Hello from Acquisitions!");
    logger.info("Hello from Acquisitions!");    
    res.status(200).send('Hello from Acquisitions');
});

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', timestamp: new Date().toISOString(), uptime: process.uptime() });
});

app.get('/api', (req, res) => {
    res.status(200).json({ messaage: 'Acquisitions API is running!' });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);

app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

export default app;