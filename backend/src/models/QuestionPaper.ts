import mongoose, { Schema, Document } from 'mongoose';

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface IQuestion {
  text: string;
  difficulty: 'Easy' | 'Moderate' | 'Hard';
  marks: number;
}

export interface ISection {
  title: string;
  instructions: string;
  questions: IQuestion[];
}

export interface IQuestionPaper extends Document {
  assignmentId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  sections: ISection[];
  // Token & performance tracking
  promptTokens: number;
  completionTokens: number;
  generationDurationMs: number;
  createdAt: Date;
}

// ─── Sub-schemas ──────────────────────────────────────────────────────────────

const QuestionSchema: Schema = new Schema(
  {
    text: { type: String, required: true },
    difficulty: { type: String, enum: ['Easy', 'Moderate', 'Hard'], required: true },
    marks: { type: Number, required: true },
  },
  { _id: false } // Questions don't need individual _ids for now
);

/**
 * Sections DO get _ids — needed for:
 * - DnD reorder endpoint to identify sections
 * - Micro-regenerate to locate the correct section
 */
const SectionSchema: Schema = new Schema(
  {
    title: { type: String, required: true },
    instructions: { type: String, required: true },
    questions: { type: [QuestionSchema], required: true },
  },
  { _id: true } // Enabled for stable section identity
);

const QuestionPaperSchema: Schema = new Schema({
  assignmentId: { type: Schema.Types.ObjectId, ref: 'Assignment', required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  sections: { type: [SectionSchema], required: true },

  // ── Cost & Token Tracking ─────────────────────────────────────────────────
  promptTokens: { type: Number, default: 0 },
  completionTokens: { type: Number, default: 0 },
  generationDurationMs: { type: Number, default: 0 },

  createdAt: { type: Date, default: Date.now },
});

export const QuestionPaper = mongoose.model<IQuestionPaper>('QuestionPaper', QuestionPaperSchema);
