import mongoose, { Schema, Document } from 'mongoose';

export interface IAssignment extends Document {
  dueDate: Date;
  questionTypes: string[];
  numberOfQuestions: number;
  totalMarks: number;
  instructions: string;
  sourceText?: string;
  /** RAG chunks extracted from the uploaded PDF — stored for reuse in micro-regenerate */
  sourceChunks?: string[];
  status: 'pending' | 'processing' | 'completed' | 'failed';
  jobId?: string;
  createdAt: Date;
}

const AssignmentSchema: Schema = new Schema({
  dueDate: { type: Date, required: true },
  questionTypes: { type: [String], required: true },
  numberOfQuestions: { type: Number, required: true },
  totalMarks: { type: Number, required: true },
  instructions: { type: String, default: '' },
  sourceText: { type: String, default: '' },
  sourceChunks: { type: [String], default: [] },
  status: { 
    type: String, 
    enum: ['pending', 'processing', 'completed', 'failed'], 
    default: 'pending' 
  },
  jobId: { type: String },
  createdAt: { type: Date, default: Date.now }
});

export const Assignment = mongoose.model<IAssignment>('Assignment', AssignmentSchema);
