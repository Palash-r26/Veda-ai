import { Worker, Job } from 'bullmq';
import { GoogleGenAI } from '@google/genai';
import { ZodError } from 'zod';
import { Assignment } from '../models/Assignment';
import { QuestionPaper } from '../models/QuestionPaper';
import { PaperSchema } from '../schemas/paperSchema';
import { selectRelevantChunks, buildRagContext } from '../utils/textChunker';
import { buildPrompt } from '../ai/prompts';
import { io } from '../index';
import { connection, deadLetterQueue } from './queue';
import { logger } from '../utils/logger';
import dotenv from 'dotenv';

dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// ─── Progress step definitions ────────────────────────────────────────────────
/** Emits a human-readable progress update to the connected frontend */
function emitProgress(jobId: string | undefined, assignmentId: string, message: string, step: number) {
  io.emit('job-progress', { jobId, assignmentId, message, step });
}

// Prompt builders have been extracted to ai/prompts.ts
// ─── Validate + parse LLM JSON output ────────────────────────────────────────
function parseAndValidate(raw: string) {
  const cleaned = raw.trim().replace(/^```json\s*|^```\s*|```$/gm, '');
  const parsed = JSON.parse(cleaned);
  return PaperSchema.parse(parsed); // throws ZodError if invalid
}

// ─── Main Worker ──────────────────────────────────────────────────────────────
export const generationWorker = new Worker(
  'paper-generation',
  async (job: Job) => {
    const { assignmentId } = job.data;
    const startTime = Date.now();
    logger.info(`[Worker] Starting job ${job.id} for assignment ${assignmentId}`);

    // ── Step 1: Load assignment ───────────────────────────────────────────────
    emitProgress(job.id, assignmentId, 'Loading assignment details…', 5);
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) throw new Error('Assignment not found in database');

    assignment.status = 'processing';
    await assignment.save();

    // ── Step 2: Build RAG context ─────────────────────────────────────────────
    let ragContext = '';
    if (assignment.sourceChunks && assignment.sourceChunks.length > 0) {
      emitProgress(job.id, assignmentId, 'Analyzing uploaded material…', 15);
      const query = `${assignment.questionTypes.join(' ')} ${assignment.instructions}`;
      const relevantChunks = selectRelevantChunks(assignment.sourceChunks, query, 5);
      ragContext = buildRagContext(relevantChunks);
      logger.info(`[Worker] RAG: selected ${relevantChunks.length} of ${assignment.sourceChunks.length} chunks`);
    }

    // ── Step 3: Call Gemini ───────────────────────────────────────────────────
    emitProgress(job.id, assignmentId, 'Generating questions with AI…', 30);
    const prompt = buildPrompt(assignment, ragContext);

    let response;
    try {
      response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' },
      });
    } catch (aiErr: any) {
      throw new Error(`Gemini API error: ${aiErr.message}`);
    }

    const rawText = response.text ?? '{}';

    // ── Step 4: Zod validation ────────────────────────────────────────────────
    emitProgress(job.id, assignmentId, 'Validating AI output…', 70);

    let validatedData;
    try {
      validatedData = parseAndValidate(rawText);
    } catch (err) {
      if (err instanceof ZodError) {
        logger.error(`[Worker] Zod validation failed (attempt ${job.attemptsMade + 1}):`, err.flatten());
        throw new Error(`LLM output failed schema validation: ${err.issues.map(i => i.message).join('; ')}`);
      }
      if (err instanceof SyntaxError) {
        logger.error('[Worker] JSON parse failed:', rawText.slice(0, 200));
        throw new Error('LLM returned malformed JSON');
      }
      throw err;
    }

    // ── Step 5: Token tracking ────────────────────────────────────────────────
    emitProgress(job.id, assignmentId, 'Saving paper to database…', 85);

    const usage = response.usageMetadata ?? {};
    const promptTokens = (usage as any).promptTokenCount ?? 0;
    const completionTokens = (usage as any).candidatesTokenCount ?? 0;
    const durationMs = Date.now() - startTime;

    // ── Step 6: Save to DB ────────────────────────────────────────────────────
    const paper = new QuestionPaper({
      assignmentId,
      userId: assignment.userId,
      sections: validatedData.sections,
      promptTokens,
      completionTokens,
      generationDurationMs: durationMs,
    });
    await paper.save();

    assignment.status = 'completed';
    await assignment.save();

    // ── Step 7: Notify frontend ───────────────────────────────────────────────
    emitProgress(job.id, assignmentId, 'Done! Paper ready.', 100);
    io.emit('job-complete', {
      jobId: job.id,
      status: 'completed',
      assignmentId,
      paperId: paper._id,
      tokens: promptTokens + completionTokens,
      durationMs,
    });

    logger.info(`[Worker] Job ${job.id} complete in ${durationMs}ms | tokens: ${promptTokens + completionTokens}`);
    return { success: true, paperId: paper._id };
  },
  {
    connection,
    // Retry strategy: 3 total attempts, exponential backoff (1s, 2s, 4s)
    // This handles Gemini API rate limits gracefully
    settings: {
      backoffStrategy: (attemptsMade: number) => Math.pow(2, attemptsMade - 1) * 1000,
    },
  }
);

// ─── Failure handler — DLQ + user-facing error socket event ──────────────────
generationWorker.on('failed', async (job, err) => {
  if (!job) return;
  const { assignmentId } = job.data;
  const isExhausted = job.attemptsMade >= (job.opts.attempts ?? 1);

  logger.error(`[Worker] Job ${job.id} failed (attempt ${job.attemptsMade}):`, err);

  if (isExhausted) {
    logger.error(`[Worker] Job ${job.id} exhausted all retries — moving to DLQ`);

    // Move to Dead Letter Queue for inspection / manual replay
    await deadLetterQueue.add('failed-job', {
      originalJobId: job.id,
      assignmentId,
      error: err.message,
      attemptsMade: job.attemptsMade,
      failedAt: new Date().toISOString(),
    });

    // Update assignment status
    try {
      await Assignment.findByIdAndUpdate(assignmentId, { status: 'failed' });
    } catch (_) { /* ignore DB error on cleanup */ }

    // Emit user-facing error event for the frontend toast
    io.emit('job-error', {
      jobId: job.id,
      assignmentId,
      message: `Generation failed after ${job.attemptsMade} attempt${job.attemptsMade > 1 ? 's' : ''}. ${err.message}`,
    });
  }
});

generationWorker.on('error', (err) => {
  logger.error('[Worker] Worker-level error:', err);
});
