'use client';

import { useState } from 'react';
import AssignmentForm from '../components/AssignmentForm';
import { Plus } from 'lucide-react';

export default function Home() {
  const [showForm, setShowForm] = useState(false);

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center p-4 md:p-8 bg-[#F8FAFC] text-gray-900 overflow-hidden">
      
      {/* ── Background Decoration ── */}
      <div className="absolute top-[-10%] left-[-5%] w-[400px] md:w-[600px] h-[400px] md:h-[600px] bg-[#4BC36D]/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[400px] md:w-[600px] h-[400px] md:h-[600px] bg-blue-400/20 blur-[120px] rounded-full pointer-events-none" />
      
      {/* ── Main Responsive Card (Max 1103px) ── */}
      <div className="w-full max-w-[1103px] bg-white rounded-3xl shadow-xl overflow-hidden min-h-[700px] relative z-10 border border-gray-100 flex flex-col">
        
        {showForm ? (
          <AssignmentForm onCancel={() => setShowForm(false)} />
        ) : (
          <div className="flex flex-col items-center justify-center flex-1 p-8">
            <div className="w-64 h-64 bg-slate-50 rounded-full mb-10 flex items-center justify-center border border-slate-100">
               {/* Placeholder for illustration */}
               <div className="w-40 h-40 bg-white rounded-2xl rotate-12 flex items-center justify-center shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-gray-50">
                  <span className="text-5xl -rotate-12">📝</span>
               </div>
            </div>
            
            <h2 className="text-[28px] md:text-[32px] font-bold mb-4 text-center leading-tight tracking-tight text-gray-800">
              Your AI Assessments
            </h2>
            <p className="text-gray-500 mb-10 text-center max-w-sm">
              Create, manage, and export high-quality question papers in seconds.
            </p>
            
            <button
              onClick={() => setShowForm(true)}
              className="bg-[#111827] text-white px-8 py-4 rounded-full flex items-center justify-center gap-3 font-semibold text-[16px] active:scale-[0.98] hover:bg-[#1f2937] transition-all shadow-md hover:shadow-lg"
            >
              <Plus size={20} strokeWidth={2.5} />
              Create New Assignment
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
