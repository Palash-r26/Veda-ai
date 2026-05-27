import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { ZodError } from 'zod';
import { GoogleGenAI } from '@google/genai';
import { QuestionPaper } from '../models/QuestionPaper';
import { Assignment } from '../models/Assignment';
import { SingleQuestionSchema, ReorderPayloadSchema } from '../schemas/paperSchema';
import { selectRelevantChunks, buildRagContext } from '../utils/textChunker';
import { buildSingleQuestionPrompt } from '../queue/worker';
import dotenv from 'dotenv';

dotenv.config();

const router = Router();
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// ─── GET /api/papers/:id ───────────────────────────────────────────────────────
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: 'Invalid paper ID' });
    }

    const paper = await QuestionPaper.findById(id);
    if (!paper) return res.status(404).json({ success: false, error: 'Paper not found' });

    const assignment = await Assignment.findById(paper.assignmentId);
    res.json({ success: true, paper, assignment });
  } catch (error) {
    console.error('Failed to fetch paper:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch paper' });
  }
});

// ─── POST /api/papers/:id/regenerate-question ──────────────────────────────────
// Micro-regenerate: swap out one question without re-running the full paper
router.post('/:id/regenerate-question', async (req: Request, res: Response) => {
  try {
    const paperId = req.params.id as string;
    if (!mongoose.Types.ObjectId.isValid(paperId)) {
      return res.status(400).json({ success: false, error: 'Invalid paper ID' });
    }

    const { sectionIndex, questionIndex } = req.body as {
      sectionIndex: number;
      questionIndex: number;
    };

    if (sectionIndex == null || questionIndex == null) {
      return res.status(400).json({ success: false, error: 'sectionIndex and questionIndex are required' });
    }

    const paper = await QuestionPaper.findById(paperId);
    if (!paper) return res.status(404).json({ success: false, error: 'Paper not found' });

    const section = paper.sections[sectionIndex];
    if (!section) return res.status(400).json({ success: false, error: `Section ${sectionIndex} does not exist` });

    const existingQuestion = section.questions[questionIndex];
    if (!existingQuestion) return res.status(400).json({ success: false, error: `Question ${questionIndex} does not exist` });

    // Load assignment for RAG context + question types
    const assignment = await Assignment.findById(paper.assignmentId);

    // Build RAG context for this specific section
    let ragContext = '';
    if (assignment?.sourceChunks?.length) {
      const query = `${section.title} ${assignment.questionTypes.join(' ')}`;
      const chunks = selectRelevantChunks(assignment.sourceChunks, query, 3);
      ragContext = buildRagContext(chunks);
    }

    const prompt = buildSingleQuestionPrompt(
      section.title,
      assignment?.questionTypes ?? ['General'],
      existingQuestion.marks,
      ragContext
    );

    // Call Gemini
    let response;
    try {
      response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
        config: { responseMimeType: 'application/json' },
      });
    } catch (aiErr: any) {
      return res.status(502).json({ success: false, error: `AI generation failed: ${aiErr.message}` });
    }

    // Parse + validate with Zod
    let newQuestion;
    try {
      const raw = (response.text ?? '{}').trim().replace(/^```json\s*|^```\s*|```$/gm, '');
      newQuestion = SingleQuestionSchema.parse(JSON.parse(raw));
    } catch (err) {
      if (err instanceof ZodError) {
        return res.status(422).json({ success: false, error: `AI response invalid: ${err.issues.map(i => i.message).join(', ')}` });
      }
      return res.status(422).json({ success: false, error: 'AI returned malformed JSON' });
    }

    // Patch the paper in-place
    paper.sections[sectionIndex].questions[questionIndex] = newQuestion;
    paper.markModified('sections');
    await paper.save();

    res.json({ success: true, question: newQuestion, sectionIndex, questionIndex });
  } catch (error) {
    console.error('Micro-regenerate failed:', error);
    res.status(500).json({ success: false, error: 'Failed to regenerate question' });
  }
});

// ─── PATCH /api/papers/:id/reorder ────────────────────────────────────────────
// Persist DnD reorder: accepts the full sections array with questions in new order
router.patch('/:id/reorder', async (req: Request, res: Response) => {
  try {
    const paperId = req.params.id as string;
    if (!mongoose.Types.ObjectId.isValid(paperId)) {
      return res.status(400).json({ success: false, error: 'Invalid paper ID' });
    }

    // Validate payload shape
    let payload;
    try {
      payload = ReorderPayloadSchema.parse(req.body);
    } catch (err) {
      if (err instanceof ZodError) {
        return res.status(400).json({ success: false, error: err.issues.map(i => i.message).join(', ') });
      }
      throw err;
    }

    const paper = await QuestionPaper.findById(paperId);
    if (!paper) return res.status(404).json({ success: false, error: 'Paper not found' });

    // Replace sections with reordered content
    paper.sections = payload.sections as any;
    paper.markModified('sections');
    await paper.save();

    res.json({ success: true, paper });
  } catch (error) {
    console.error('Reorder failed:', error);
    res.status(500).json({ success: false, error: 'Failed to save reorder' });
  }
});

export default router;
