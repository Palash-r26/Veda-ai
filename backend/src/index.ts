import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { z } from 'zod';
import assignmentRoutes from './routes/assignments';
import paperRoutes from './routes/papers';
import healthRoutes from './routes/health';
import authRoutes from './routes/auth';
import adminRoutes from './routes/admin';
import notificationRoutes from './routes/notifications';

// Load env vars
dotenv.config();

// ─── Environment Validation ──────────────────────────────────────────────────
const EnvSchema = z.object({
  GEMINI_API_KEY: z.string().min(1, "GEMINI_API_KEY is missing"),
  MONGODB_URI: z.string().url("MONGODB_URI must be a valid URL").optional(),
  REDIS_URL: z.string().url("REDIS_URL must be a valid URL").optional(),
  PORT: z.string().regex(/^\d+$/, "PORT is missing or invalid"),
  JWT_SECRET: z.string().min(1, "JWT_SECRET is missing"),
});

try {
  EnvSchema.parse(process.env);
} catch (err: any) {
  console.error("❌ CRITICAL ERROR: Environment validation failed:");
  err.errors?.forEach((e: any) => console.error(` - ${e.path.join('.')}: ${e.message}`));
  process.exit(1); // Fail fast
}

const app = express();
const httpServer = createServer(app);
export const io = new Server(httpServer, {
  cors: { origin: '*' }
});

app.use(cors());
app.use(express.json());

app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/papers', paperRoutes);

const PORT = Number(process.env.PORT);
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/vedaai';

mongoose.connect(mongoUri)
  .then(() => {
    console.log('✅ Connected to MongoDB');

    // Seed demo accounts if they don't exist
    const seedDemoAccounts = async () => {
      try {
        const { User } = require('./models/User');
        const bcrypt = require('bcryptjs');

        const demoUsers = [
          {
            name: 'Dr. Rajesh Verma',
            email: 'teacher@vedaai.edu',
            role: 'teacher',
            password: 'teacher123'
          },
          {
            name: 'System Administrator',
            email: 'admin@vedaai.edu',
            role: 'admin',
            password: 'admin123'
          }
        ];

        for (const u of demoUsers) {
          const exists = await User.findOne({ email: u.email });
          const salt = await bcrypt.genSalt(10);
          const passwordHash = await bcrypt.hash(u.password, salt);
          if (!exists) {
            const newUser = new User({
              name: u.name,
              email: u.email,
              role: u.role,
              passwordHash
            });
            await newUser.save();
            console.log(`🌱 Seeded demo ${u.role} account: ${u.email} / ${u.password}`);
          } else {
            exists.passwordHash = passwordHash;
            exists.role = u.role;
            await exists.save();
            console.log(`🌱 Synchronized demo ${u.role} account credentials: ${u.email} / ${u.password}`);
          }
        }
      } catch (err) {
        console.error('❌ Failed to seed demo accounts:', err);
      }
    };
    seedDemoAccounts();

    // Import worker only after DB connects so it can access DB properly
    require('./queue/worker');

    httpServer.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

