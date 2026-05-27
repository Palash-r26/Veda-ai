import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
// pdf-parse needs require() — its CJS export doesn't have a default property
// eslint-disable-next-line @typescript-eslint/no-var-requires
const pdfParse = require('pdf-parse') as (buffer: Buffer) => Promise<{ text: string; numpages: number }>;
import { Assignment } from '../models/Assignment';
import { QuestionPaper } from '../models/QuestionPaper';
import { generationQueue } from '../queue/queue';
import { chunkText } from '../utils/textChunker';

const router = Router();

// ─── Multer config ─────────────────────────────────────────────────────────────
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['.pdf', '.txt', '.png', '.jpg', '.jpeg'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) return cb(null, true);
    cb(new Error('Only PDF, TXT, PNG, or JPG files are allowed'));
  },
});

// ─── PDF / text extraction helper ─────────────────────────────────────────────
async function extractTextFromFile(filePath: string, originalName: string): Promise<{ text: string; chunks: string[] }> {
  const ext = path.extname(originalName).toLowerCase();

  if (ext === '.pdf') {
    const buffer = fs.readFileSync(filePath);
    const parsed = await pdfParse(buffer);
    const text = parsed.text.slice(0, 12000); // cap at 12k chars
    const chunks = chunkText(text);
    return { text, chunks };
  }

  if (ext === '.txt') {
    const text = fs.readFileSync(filePath, 'utf-8').slice(0, 12000);
    const chunks = chunkText(text);
    return { text, chunks };
  }

  // Image — describe the upload to the AI via the prompt text
  return {
    text: `[Image file uploaded: ${originalName} — teacher provided visual source material]`,
    chunks: [`[Image file uploaded: ${originalName}]`],
  };
}

// ─── POST /api/assignments ─────────────────────────────────────────────────────
router.post('/', upload.single('file'), async (req: Request, res: Response) => {
  try {
    const { dueDate, questionTypes, numberOfQuestions, totalMarks, instructions } = req.body;

    // Parse questionTypes from FormData (comes as a JSON string)
    let parsedTypes: string[] = [];
    try {
      parsedTypes = typeof questionTypes === 'string'
        ? JSON.parse(questionTypes)
        : questionTypes;
    } catch {
      parsedTypes = Array.isArray(questionTypes) ? questionTypes : [questionTypes];
    }

    // Validate numeric inputs
    const numQ = Number(numberOfQuestions);
    const numM = Number(totalMarks);
    if (!dueDate) return res.status(400).json({ success: false, error: 'dueDate is required' });
    if (!parsedTypes.length) return res.status(400).json({ success: false, error: 'At least one question type is required' });
    if (numQ < 1) return res.status(400).json({ success: false, error: 'numberOfQuestions must be >= 1' });
    if (numM < 1) return res.status(400).json({ success: false, error: 'totalMarks must be >= 1' });

    // Extract text + RAG chunks from uploaded file
    let sourceText = '';
    let sourceChunks: string[] = [];

    if (req.file) {
      try {
        const extracted = await extractTextFromFile(req.file.path, req.file.originalname);
        sourceText = extracted.text;
        sourceChunks = extracted.chunks;
        console.log(`[Upload] Extracted ${sourceText.length} chars, ${sourceChunks.length} RAG chunks from ${req.file.originalname}`);
      } catch (parseErr) {
        console.warn('[Upload] Failed to extract text from file:', parseErr);
        // Non-fatal: continue without source material
      }
    }

    const assignment = new Assignment({
      dueDate,
      questionTypes: parsedTypes,
      numberOfQuestions: numQ,
      totalMarks: numM,
      instructions: instructions || '',
      sourceText,
      sourceChunks,
      status: 'pending',
    });

    await assignment.save();

    // Add to BullMQ with retry config (Phase 2 worker will read these)
    const job = await generationQueue.add('generate-paper', {
      assignmentId: assignment._id.toString(),
    }, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 },
    });

    assignment.jobId = job.id;
    await assignment.save();

    res.status(201).json({ success: true, assignment, jobId: job.id });
  } catch (error) {
    console.error('Failed to create assignment:', error);
    res.status(500).json({ success: false, error: 'Failed to create assignment' });
  }
});

// ─── GET /api/assignments ──────────────────────────────────────────────────────
router.get('/', async (_req: Request, res: Response) => {
  try {
    const assignments = await Assignment.find().sort({ createdAt: -1 });
    res.json({ success: true, assignments });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch assignments' });
  }
});

// ─── GET /api/assignments/:id ──────────────────────────────────────────────────
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const assignment = await Assignment.findById(req.params.id as string);
    if (!assignment) return res.status(404).json({ success: false, error: 'Not found' });
    const paper = await QuestionPaper.findOne({ assignmentId: assignment._id });
    res.json({ success: true, assignment, paper });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch assignment' });
  }
});

export default router;
