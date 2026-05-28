'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, RefreshCw, AlertCircle, CloudDownload, LayoutGrid, Bell, ChevronDown, Menu } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { useAssignmentStore } from '@/store/useAssignmentStore';
import { useAuthStore } from '@/store/useAuthStore';
import DraggablePaper from '@/components/DraggablePaper';
import PdfExport from '@/components/PdfExport';
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

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function OutputPage() {
  const params = useParams();
  const router = useRouter();
  const { reset } = useAssignmentStore();
  const [paper, setPaper] = useState<PaperData | null>(null);
  const [assignment, setAssignment] = useState<AssignmentMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, token } = useAuthStore();

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
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
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
      <main className="flex-1 flex flex-col min-w-0 h-full pb-20 md:pb-0 relative z-10 items-center justify-center">
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
      <main className="flex-1 flex flex-col min-w-0 h-full pb-20 md:pb-0 relative z-10 items-center justify-center">
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

  // ── Rendered Paper ─────────────────────────────────────────────────────────
  return (
    <main className="flex-1 flex flex-col min-w-0 h-full pb-20 md:pb-0 relative z-10">
      
      {/* ── Top Navbar ── */}
      <header className="bg-white rounded-[24px] h-[72px] shadow-sm flex items-center justify-between px-4 md:px-6 mb-4 shrink-0">
        {/* Desktop Left side */}
        <div className="hidden md:flex items-center gap-4">
          <button 
            onClick={() => { reset(); router.push('/dashboard'); }}
            className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors text-gray-600 bg-gray-100"
          >
            <ArrowLeft size={18} strokeWidth={2.5} className="text-gray-900" />
          </button>
          <span className="text-gray-400 font-medium text-sm flex items-center gap-2">
            <span className="text-[20px] font-bold text-gray-300">✨</span> Create New
          </span>
        </div>

        {/* Mobile Left side (Logo) */}
        <div className="flex md:hidden items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#2A2B32] flex items-center justify-center text-white font-bold text-sm shadow-md">
            V
          </div>
          <span className="text-lg font-extrabold text-gray-900 tracking-tight">VedaAI</span>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2 md:gap-4">
          <button className="relative w-10 h-10 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors text-gray-600 bg-gray-50">
            <Bell size={20} />
            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-orange-500 rounded-full border border-white"></span>
          </button>
          
          <div className="flex items-center gap-2 pl-1 md:pl-2">
            <div className="w-8 h-8 bg-gray-200 rounded-full overflow-hidden flex items-center justify-center text-xl">
              👨‍🏫
            </div>
            <span className="hidden md:block text-sm font-bold text-gray-900">{user?.name || 'John Doe'}</span>
            <ChevronDown size={16} className="hidden md:block text-gray-500" />
            <button className="md:hidden w-10 h-10 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors text-gray-600 ml-1">
              <Menu size={24} />
            </button>
          </div>
        </div>
      </header>

      {/* ── Content Area ── */}
      <div className="flex-1 overflow-y-auto no-scrollbar pb-10">
        
        {/* Dark Container */}
        <div className="bg-[#2A2B32] rounded-[32px] p-4 md:p-8 w-full max-w-5xl mx-auto flex flex-col gap-5 md:gap-6 min-h-full">
          
          {/* Header Text & Download Button */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-2">
            <h2 className="text-white text-[13px] md:text-[18px] font-bold leading-relaxed max-w-2xl text-center md:text-left">
              Certainly, {user?.name?.split(' ')[0] || 'Teacher'}! Here are customized Question Paper for your classes on the requested topics:
            </h2>
            
            <div className="shrink-0 relative z-20 flex justify-center md:justify-start">
              {/* PdfExport is normally a button, we will wrap it or style it to match the pill.
                  Our existing PdfExport renders its own button, but we can intercept or let it be.
                  Wait, PdfExport component renders a button. Let's make sure it matches the design. */}
              <PdfExport paper={paper} assignment={assignment} />
            </div>
          </div>

          {/* Paper Content Wrapper */}
          <div className="flex-1 bg-white rounded-[24px] overflow-hidden">
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
