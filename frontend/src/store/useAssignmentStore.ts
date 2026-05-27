import { create } from 'zustand';

interface AssignmentState {
  currentJobId: string | null;
  status: 'idle' | 'pending' | 'processing' | 'completed' | 'failed';
  assignmentId: string | null;
  paperId: string | null;
  progressMessage: string | null;
  progressStep: number;
  errorMessage: string | null;
  setJobStatus: (status: 'idle' | 'pending' | 'processing' | 'completed' | 'failed', jobId: string, assignmentId: string) => void;
  setCompleted: (paperId: string) => void;
  setProgress: (message: string, step: number) => void;
  setError: (message: string) => void;
  reset: () => void;
}

export const useAssignmentStore = create<AssignmentState>((set) => ({
  currentJobId: null,
  status: 'idle',
  assignmentId: null,
  paperId: null,
  progressMessage: null,
  progressStep: 0,
  errorMessage: null,
  setJobStatus: (status, jobId, assignmentId) => set({ status, currentJobId: jobId, assignmentId, errorMessage: null }),
  setCompleted: (paperId) => set({ status: 'completed', paperId }),
  setProgress: (message, step) => set({ progressMessage: message, progressStep: step }),
  setError: (message) => set({ status: 'failed', errorMessage: message }),
  reset: () => set({ currentJobId: null, status: 'idle', assignmentId: null, paperId: null, progressMessage: null, progressStep: 0, errorMessage: null }),
}));
