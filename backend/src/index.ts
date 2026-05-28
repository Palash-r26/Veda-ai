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

// Load env vars
dotenv.config();

// ─── Environment Validation ──────────────────────────────────────────────────
const EnvSchema = z.object({
  GEMINI_API_KEY: z.string().min(1, "GEMINI_API_KEY is missing"),
  MONGODB_URI: z.string().url("MONGODB_URI must be a valid URL").optional(),
  REDIS_URL: z.string().url("REDIS_URL must be a valid URL").optional(),
  PORT: z.string().optional(),
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
app.use('/api/assignments', assignmentRoutes);
app.use('/api/papers', paperRoutes);

const PORT = process.env.PORT || 5000;
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/vedaai';

mongoose.connect(mongoUri)
  .then(() => {
    console.log('✅ Connected to MongoDB');
    
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

