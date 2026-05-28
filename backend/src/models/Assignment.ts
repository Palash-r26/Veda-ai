import mongoose, { Schema, Document } from 'mongoose';

export interface IAssignment extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  dueDate: Date;
  schoolName?: string;
  subject?: string;
  grade?: string;
  timeAllowed?: string;
  questionTypes: string[];
  questionsConfig?: { type: string; count: number; marks: number }[];
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
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, default: 'Untitled Assignment' },
  dueDate: { type: Date, required: true },
  schoolName: { type: String, default: 'Delhi Public School' },
  subject: { type: String, default: 'English' },
  grade: { type: String, default: 'Class 10' },
  timeAllowed: { type: String, default: '3 Hours' },
  questionTypes: { type: [String], required: true },
  questionsConfig: [{
    type: { type: String, required: true },
    count: { type: Number, required: true },
    marks: { type: Number, required: true }
  }],
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
