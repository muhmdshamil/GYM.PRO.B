import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import dashboardRoutes from './routes/dashboard.js';
import trainerRoutes from './routes/trainers.js';
import userRoutes from './routes/user.js';
import trainerAuthRoutes from './routes/trainerAuth.js';
import shopRoutes from './routes/shop.js';
import trainerPortalRoutes from './routes/trainerPortal.js';
import membershipRoutes from './routes/membership.js';
import contactRoutes from './routes/contact.js';
import { connectDB } from './connection/db.js';


dotenv.config();

const app = express();

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173'
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true
}))

app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/trainers', trainerRoutes);
app.use('/api/trainer/auth', trainerAuthRoutes);
app.use('/api/trainer', trainerPortalRoutes);
app.use('/api/users', userRoutes);
app.use('/api/shop', shopRoutes);
app.use('/api/membership', membershipRoutes);
app.use('/api/contact', contactRoutes);

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
});
