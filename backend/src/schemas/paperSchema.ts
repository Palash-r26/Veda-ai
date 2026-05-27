import { z } from 'zod';

// ─── Core schemas ─────────────────────────────────────────────────────────────

export const QuestionSchema = z.object({
  text: z.string().min(5, 'Question text must be at least 5 characters'),
  difficulty: z.enum(['Easy', 'Moderate', 'Hard']),
  marks: z.number().int().positive('Marks must be a positive integer'),
});

export const SectionSchema = z.object({
  title: z.string().min(2, 'Section title must be at least 2 characters'),
  instructions: z.string(),
  questions: z.array(QuestionSchema).min(1, 'Each section must have at least one question'),
});

/**
 * Full paper schema — validates the entire LLM response.
 * Used in the worker before the result is written to MongoDB.
 */
export const PaperSchema = z.object({
  sections: z.array(SectionSchema).min(1, 'Paper must have at least one section'),
});

/**
 * Schema for a single regenerated question — used by the
 * micro-regenerate endpoint to validate a single LLM response.
 */
export const SingleQuestionSchema = z.object({
  text: z.string().min(5),
  difficulty: z.enum(['Easy', 'Moderate', 'Hard']),
  marks: z.number().int().positive(),
});

/**
 * Schema for the DnD reorder payload from the frontend.
 * Accepts a partial update of sections (structure only, no question content change).
 */
export const ReorderPayloadSchema = z.object({
  sections: z.array(
    z.object({
      title: z.string(),
      instructions: z.string(),
      questions: z.array(
        z.object({
          text: z.string(),
          difficulty: z.enum(['Easy', 'Moderate', 'Hard']),
          marks: z.number().int().positive(),
        })
      ),
    })
  ).min(1),
});

// Inferred TypeScript types (single source of truth — no duplication with model)
export type TPaper = z.infer<typeof PaperSchema>;
export type TSection = z.infer<typeof SectionSchema>;
export type TQuestion = z.infer<typeof QuestionSchema>;
