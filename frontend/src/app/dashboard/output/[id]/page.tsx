'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, RefreshCw, AlertCircle, Bell, Shield } from 'lucide-react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useAssignmentStore } from '@/store/useAssignmentStore';
import { useAuthStore } from '@/store/useAuthStore';
import DraggablePaper from '@/components/DraggablePaper';
import PdfExport from '@/components/PdfExport';
import UserDropdown from '@/components/UserDropdown';
import { API_URL } from '@/lib/api';
import toast from 'react-hot-toast';

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
}

interface AssignmentMeta {
  title?: string;
  dueDate: string;
  questionTypes: string[];
  numberOfQuestions: number;
  totalMarks: number;
  schoolName?: string;
  subject?: string;
  grade?: string;
  timeAllowed?: string;
}

export default function OutputPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { reset } = useAssignmentStore();
  const [paper, setPaper] = useState<PaperData | null>(null);
  const [assignment, setAssignment] = useState<AssignmentMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, token } = useAuthStore();

  // Detect admin preview mode from query param
  const isAdminView = searchParams.get('admin') === '1';

  const fetchPaper = async () => {
    setLoading(true);
    setError(null);
    try {
      // Admin uses the admin endpoint which skips ownership check
      const endpoint = isAdminView
        ? `${API_URL}/api/admin/papers/${params.id}`
        : `${API_URL}/api/papers/${params.id}`;

      const res = await fetch(endpoint, {
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
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (params.id && token) fetchPaper();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id, token]);

  // Back navigation: admin goes back to admin assignments list
  const handleBack = () => {
    if (isAdminView) {
      router.push('/dashboard/admin/assignments');
    } else {
      reset();
      router.push('/dashboard');
    }
  };

  // ── Loading State ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <main className="flex-1 flex flex-col min-w-0 h-full pb-20 md:pb-0 relative z-10 items-center justify-center px-4 overflow-x-hidden">
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
      <main className="flex-1 flex flex-col min-w-0 h-full pb-20 md:pb-0 relative z-10 items-center justify-center px-4 overflow-x-hidden">
        <div className="flex flex-col items-center gap-4 text-center max-w-sm">
          <AlertCircle className="text-red-500" size={40} />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Could not load paper</h2>
          <p className="text-gray-500 text-sm">{error || 'Unknown error'}</p>
          <div className="flex gap-3 mt-2">
            <button
              onClick={fetchPaper}
              className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-black transition-colors"
            >
              <RefreshCw size={15} /> Retry
            </button>
            <button
              onClick={handleBack}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </main>
    );
  }

  // ── Rendered Paper ─────────────────────────────────────────────────────────
  return (
    <main className="flex-1 flex flex-col min-w-0 h-full pb-20 md:pb-0 relative z-10 px-2 sm:px-3 md:px-0 overflow-x-hidden">
      
      {/* ── Top Navbar ── */}
      <header className="bg-white dark:bg-[#131B2E] border border-slate-200/40 dark:border-slate-800/40 rounded-[24px] min-h-[72px] h-auto py-3 md:py-0 shadow-sm flex items-center justify-between px-4 md:px-6 mb-4 shrink-0 theme-transition gap-3 flex-wrap">
        {/* Left side */}
        <div className="flex items-center gap-3 min-w-0">
          <button 
            onClick={handleBack}
            className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors text-gray-600 dark:text-slate-400"
          >
            <ArrowLeft size={18} strokeWidth={2.5} />
          </button>

          {isAdminView ? (
            <div className="flex items-center gap-2 text-slate-400">
              <Shield size={15} className="text-[#F57B36]" />
              <span className="text-slate-500 dark:text-slate-400 font-extrabold text-xs tracking-wider uppercase">
                Admin Paper Preview
              </span>
              {assignment?.title && (
                <span className="hidden md:block text-[11px] text-slate-400 font-medium truncate max-w-[240px]">
                  — {assignment.title}
                </span>
              )}
            </div>
          ) : (
            <span className="text-gray-400 dark:text-slate-500 font-medium text-sm flex items-center gap-2">
              <span className="text-[20px] font-bold text-gray-300">✨</span> View Paper
            </span>
          )}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2 md:gap-3 flex-wrap justify-end">
          <button
            onClick={() => router.push('/dashboard/notifications')}
            className="relative w-10 h-10 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-600 dark:text-slate-400"
          >
            <Bell size={20} />
            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-orange-500 rounded-full border border-white dark:border-[#131B2E]" />
          </button>
          <UserDropdown />
        </div>
      </header>

      {/* ── Content Area ── */}
      <div className="flex-1 overflow-y-auto no-scrollbar pb-10">
        
        {/* Container */}
        <div className="w-full max-w-5xl mx-auto flex flex-col gap-5 md:gap-6 min-h-full px-2 sm:px-4 md:px-0">
          
          {/* Header Text & Download Button */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-2">
            <div>
              <h2 className="text-slate-900 dark:text-white text-[13px] md:text-[18px] font-bold leading-relaxed max-w-2xl text-center md:text-left">
                {isAdminView
                  ? `📋 Admin Preview — ${assignment?.title || 'Untitled Assignment'}`
                  : `Certainly, ${user?.name?.split(' ')[0] || 'Teacher'}! Here are customized Question Papers for your classes:`}
              </h2>
              {isAdminView && assignment && (
                <p className="text-slate-400 text-xs mt-1 font-medium">
                  Subject: {assignment.subject || 'N/A'} · Grade: {assignment.grade || 'N/A'} · {assignment.numberOfQuestions} Questions · {assignment.totalMarks} Marks
                </p>
              )}
            </div>
            
            <div className="shrink-0 relative z-20 flex justify-center md:justify-start">
              <PdfExport paper={paper} assignment={assignment} />
            </div>
          </div>

          {/* Paper Content Wrapper */}
          <div className="flex-1 w-full bg-white rounded-3xl p-6 md:p-12 shadow-sm border border-gray-200/60 dark:border-slate-800">
            <DraggablePaper 
              paper={paper} 
              setPaper={setPaper} 
              assignment={assignment}
              onError={(msg) => toast.error(msg)} 
            />
          </div>

        </div>

      </div>

    </main>
  );
}
