import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { GoogleGenAI } from '@google/genai';
import Redis from 'ioredis';
import { connection } from '../queue/queue'; // Redis connection
import { requireAuth, AuthRequest } from '../middleware/auth';
import { logger } from '../utils/logger';
import dotenv from 'dotenv';

dotenv.config();

const router = Router();
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const redisClient = new Redis(connection);

// ─── GET /api/health ─────────────────────────────────────────────────────────
// General health check for DB and Redis (No auth required, public monitoring)
router.get('/', async (req: Request, res: Response) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  const redisStatus = redisClient.status === 'ready' ? 'connected' : redisClient.status;

  const isHealthy = dbStatus === 'connected' && redisStatus === 'connected';

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'ok' : 'degraded',
    services: {
      database: dbStatus,
      redis: redisStatus,
    },
    timestamp: new Date().toISOString()
  });
});

// ─── GET /api/health/ai ──────────────────────────────────────────────────────
// Specifically tests Gemini connectivity and token validity (SECURED: requires auth)
router.get('/ai', requireAuth, async (req: AuthRequest, res: Response) => {
  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({
      status: 'error',
      message: 'GEMINI_API_KEY is not configured in the environment'
    });
  }

  try {
    const startTime = Date.now();
    // Do a tiny fast request to check connectivity
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: 'Respond with exactly one word: "OK"',
    });
    const durationMs = Date.now() - startTime;

    res.status(200).json({
      status: 'ok',
      message: 'AI provider is reachable and API key is valid',
      provider: 'Google Gemini',
      latencyMs: durationMs,
      response: response.text?.trim()
    });
  } catch (error: any) {
    logger.error('[Health] AI health check failed:', error);
    res.status(502).json({
      status: 'error',
      message: 'Failed to connect to AI provider',
      details: error.message
    });
  }
});

export default router;
