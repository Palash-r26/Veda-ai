'use client';

import Link from 'next/link';
import { useAuthStore } from '../store/useAuthStore';
import { ArrowRight, Brain, Zap, ShieldCheck } from 'lucide-react';

export default function LandingPage() {
  const { isAuthenticated } = useAuthStore();

  return (
    <main className="min-h-screen bg-[#F8FAFC] text-gray-900 overflow-hidden font-sans">
      
      {/* ── Navbar ── */}
      <nav className="absolute top-0 left-0 w-full p-6 flex justify-between items-center z-50">
        <div className="flex items-center gap-2 font-black text-2xl tracking-tight text-gray-900">
          <div className="w-8 h-8 bg-[#4BC36D] rounded-lg shadow-sm" />
          VedaAI
        </div>
        <div className="flex gap-4">
          {isAuthenticated ? (
            <Link href="/dashboard" className="px-6 py-2.5 bg-gray-900 text-white font-bold rounded-full hover:bg-black transition-colors">
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link href="/login" className="px-6 py-2.5 font-bold text-gray-600 hover:text-gray-900 transition-colors">
                Log In
              </Link>
              <Link href="/signup" className="px-6 py-2.5 bg-[#4BC36D] text-white font-bold rounded-full hover:bg-[#3ea85c] transition-colors shadow-sm">
                Get Started
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* ── Background Decoration ── */}
      <div className="absolute top-[-10%] right-[-10%] w-[800px] h-[800px] bg-[#4BC36D]/10 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-blue-400/10 blur-[120px] rounded-full pointer-events-none" />

      {/* ── Hero Section ── */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 pt-20 text-center max-w-5xl mx-auto">
        <div className="inline-block px-4 py-1.5 mb-6 text-sm font-bold text-[#4BC36D] bg-[#4BC36D]/10 rounded-full">
          ✨ VedaAI 2.0 is here
        </div>
        <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[1.1] mb-6 text-gray-900">
          Craft perfect assessments in <span className="text-[#4BC36D]">seconds.</span>
        </h1>
        <p className="text-lg md:text-xl text-gray-500 mb-10 max-w-2xl font-medium">
          Upload your syllabus or study material, and let our advanced AI instantly generate structured, balanced, and ready-to-export question papers.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mb-20">
          {isAuthenticated ? (
             <Link href="/dashboard" className="bg-gray-900 text-white px-8 py-4 rounded-full font-bold text-lg flex items-center gap-3 hover:bg-black transition-all hover:scale-105 shadow-xl">
               Enter Dashboard <ArrowRight size={20} />
             </Link>
          ) : (
             <Link href="/signup" className="bg-[#4BC36D] text-white px-8 py-4 rounded-full font-bold text-lg flex items-center gap-3 hover:bg-[#3ea85c] transition-all hover:scale-105 shadow-[0_8px_20px_rgba(75,195,109,0.3)]">
               Start Creating for Free <ArrowRight size={20} />
             </Link>
          )}
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 text-left">
            <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center mb-4">
              <Brain size={24} />
            </div>
            <h3 className="text-xl font-bold mb-2">Context-Aware RAG</h3>
            <p className="text-gray-500 text-sm leading-relaxed">Upload PDFs. Our RAG engine extracts context to generate hyper-relevant questions.</p>
          </div>
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 text-left">
            <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center mb-4">
              <Zap size={24} />
            </div>
            <h3 className="text-xl font-bold mb-2">Micro-Regeneration</h3>
            <p className="text-gray-500 text-sm leading-relaxed">Swap out individual questions instantly without regenerating the entire paper.</p>
          </div>
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 text-left">
            <div className="w-12 h-12 bg-purple-50 text-purple-500 rounded-2xl flex items-center justify-center mb-4">
              <ShieldCheck size={24} />
            </div>
            <h3 className="text-xl font-bold mb-2">Enterprise Robustness</h3>
            <p className="text-gray-500 text-sm leading-relaxed">Built on BullMQ with exponential backoff and strict Zod output validation.</p>
          </div>
        </div>
      </div>
    </main>
  );
}
