'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, RefreshCw, AlertCircle } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { useAssignmentStore } from '@/store/useAssignmentStore';
import { useAuthStore } from '@/store/useAuthStore';
import PaperAnalytics from '@/components/PaperAnalytics';
import DraggablePaper from '@/components/DraggablePaper';
import PdfExport from '@/components/PdfExport';

interface Question {
  text: string;
  difficulty: 'Easy' | 'Moderate' | 'Hard';
  marks: number;
}

interface Section {
  title: string;
  instructions: string;
  questions: Question[];
}

interface PaperData {
  _id: string;
  sections: Section[];
  assignmentId: string;
  createdAt: string;
  promptTokens?: number;
  completionTokens?: number;
  generationDurationMs?: number;
}

interface AssignmentMeta {
  dueDate: string;
  questionTypes: string[];
  numberOfQuestions: number;
  totalMarks: number;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function OutputPage() {
  const params = useParams();
  const router = useRouter();
  const { reset } = useAssignmentStore();
  const [paper, setPaper] = useState<PaperData | null>(null);
  const [assignment, setAssignment] = useState<AssignmentMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuthStore();

  const fetchPaper = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/papers/${params.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to load paper');
      setPaper(data.paper);
      setAssignment(data.assignment);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (params.id && token) fetchPaper();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id, token]);

  // ── Loading State ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
          <p className="text-gray-600 font-medium">Loading question paper…</p>
        </div>
      </main>
    );
  }

  // ── Error State ────────────────────────────────────────────────────────────
  if (error || !paper) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-50">
        <div className="flex flex-col items-center gap-4 text-center max-w-sm">
          <AlertCircle className="text-red-500" size={40} />
          <h2 className="text-xl font-bold text-gray-900">Could not load paper</h2>
          <p className="text-gray-500 text-sm">{error || 'Unknown error'}</p>
          <div className="flex gap-3 mt-2">
            <button
              onClick={fetchPaper}
              className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-black transition-colors"
            >
              <RefreshCw size={15} /> Retry
            </button>
            <button
              onClick={() => { reset(); router.push('/dashboard'); }}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </main>
    );
  }

  const tokens = (paper.promptTokens || 0) + (paper.completionTokens || 0);

  // ── Rendered Paper ─────────────────────────────────────────────────────────
  return (
    <main className="flex min-h-screen flex-col items-center bg-gray-50 p-4 pb-20">

      {/* ── Action Bar ── */}
      <div className="w-full max-w-3xl flex items-center justify-between py-4 px-2 mb-2">
        <button
          onClick={() => { reset(); router.push('/dashboard'); }}
          className="flex items-center gap-2 text-gray-700 hover:text-gray-900 font-medium transition-colors"
        >
          <ArrowLeft size={20} />
          <span className="text-sm">Back to Dashboard</span>
        </button>

        <div className="flex gap-2">
          <button
            onClick={() => { reset(); router.push('/dashboard'); }}
            title="Dashboard"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
          >
            <RefreshCw size={15} />
            Dashboard
          </button>
          
          <PdfExport paper={paper} assignment={assignment} />
        </div>
      </div>

      {/* ── Analytics Dashboard ── */}
      <div className="w-full max-w-3xl">
        <PaperAnalytics 
          sections={paper.sections} 
          tokens={tokens > 0 ? tokens : undefined} 
          durationMs={paper.generationDurationMs || undefined} 
        />
      </div>

      {/* ── Paper Content (Draggable) ── */}
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-md overflow-hidden p-6 md:p-10 border border-gray-100">
        <DraggablePaper 
          paper={paper} 
          setPaper={setPaper} 
          onError={(msg) => alert(msg)} 
        />
      </div>

    </main>
  );
}
