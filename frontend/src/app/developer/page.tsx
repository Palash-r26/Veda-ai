'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Code, 
  Mail, 
  Globe, 
  GraduationCap, 
  ExternalLink,
  Award, 
  Heart,
  Sun,
  Moon
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function DeveloperPage() {
  const router = useRouter();
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [imageError, setImageError] = useState(false);

  // Load and apply theme (defaults to dark mode)
  useEffect(() => {
    const savedTheme = localStorage.getItem('veda-theme') as 'light' | 'dark' || 'dark';
    setTheme(savedTheme);
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  // Sync theme changes
  useEffect(() => {
    const handleThemeChange = (e: Event) => {
      const customEvent = e as CustomEvent<'light' | 'dark'>;
      if (customEvent.detail) {
        setTheme(customEvent.detail);
      }
    };
    window.addEventListener('veda-theme-changed', handleThemeChange as EventListener);
    return () => {
      window.removeEventListener('veda-theme-changed', handleThemeChange as EventListener);
    };
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    localStorage.setItem('veda-theme', nextTheme);
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    window.dispatchEvent(new CustomEvent('veda-theme-changed', { detail: nextTheme }));
    toast.success(`${nextTheme === 'light' ? 'Light' : 'Dark'} mode activated!`);
  };

  return (
    <div className={theme === 'dark' ? 'dark' : ''}>
      <main className="min-h-screen bg-[#F4F6FA] dark:bg-[#0B0F19] text-slate-800 dark:text-slate-200 flex flex-col font-sans theme-transition relative overflow-hidden pb-12">
        
        {/* Decorative Background Glows */}
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#F57B36]/5 rounded-full blur-[120px] pointer-events-none z-0" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none z-0" />

        {/* ─── HEADER NAVBAR ─── */}
        <header className="w-full px-6 py-4 md:px-12 flex justify-between items-center bg-white/80 dark:bg-[#131B2E]/85 backdrop-blur-md border-b border-slate-200/60 dark:border-slate-800/60 z-40 sticky top-0 theme-transition">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => router.push('/')}
              className="w-9 h-9 rounded-full border border-slate-200 dark:border-slate-800 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-slate-600 dark:text-slate-400 focus:outline-none cursor-pointer"
              title="Return to Home"
            >
              <ArrowLeft size={16} />
            </button>
            <div className="flex items-center gap-2">
              <span className="text-sm font-extrabold tracking-wider uppercase text-slate-400">Developer Profile</span>
            </div>
          </div>
          
          <button 
            onClick={toggleTheme}
            className="w-10 h-10 rounded-full border border-slate-200 dark:border-slate-800 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-slate-650 dark:text-slate-400 focus:outline-none cursor-pointer"
            aria-label="Toggle theme"
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
        </header>

        {/* ─── MAIN PORTFOLIO BODY ─── */}
        <div className="max-w-5xl w-full mx-auto px-6 pt-12 md:pt-16 relative z-10 flex-1 flex flex-col justify-center gap-10">
          
          {/* Header Title Section */}
          <div className="text-center space-y-3">
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight relative inline-block">
              Meet the Developer
              <div className="absolute bottom-[-6px] left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-[#F57B36] rounded-full" />
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-xs md:text-sm font-medium max-w-xl mx-auto leading-relaxed pt-2">
              Passionate about crafting intelligent web solutions and leveraging AI technologies to solve real-world challenges with innovation.
            </p>
          </div>

          {/* 1. Main Profile Card */}
          <div className="bg-white dark:bg-[#131B2E] border border-slate-200/40 dark:border-slate-800/60 rounded-[32px] p-6 md:p-8 shadow-md theme-transition flex flex-col md:flex-row gap-6 md:gap-8 items-center">
            
            {/* Left: Avatar container */}
            <div className="w-full md:w-56 h-64 md:h-60 rounded-3xl overflow-hidden bg-slate-100 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800/80 shrink-0 shadow-inner">
              {!imageError ? (
                <img 
                  src="/Profile - Phtoto.jpg" 
                  alt="Palash Rai" 
                  className="w-full h-full object-cover" 
                  onError={() => setImageError(true)} 
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
                  <span className="text-6xl">👨‍💻</span>
                  <span className="text-xs font-black uppercase mt-2 tracking-wider">PR</span>
                </div>
              )}
            </div>

            {/* Right: Info */}
            <div className="flex-1 space-y-4 text-center md:text-left w-full">
              <div>
                <h2 className="text-3xl font-black text-blue-600 dark:text-blue-400 tracking-tight">
                  Palash Rai
                </h2>
                <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 mt-2 text-xs font-bold text-slate-500 dark:text-slate-400 justify-center md:justify-start">
                  <span className="flex items-center gap-1.5">
                    <Code size={14} className="text-slate-400" />
                    Software Developer
                  </span>
                  <span className="hidden sm:inline text-slate-300 dark:text-slate-700">|</span>
                  <span className="flex items-center gap-1.5">
                    <GraduationCap size={14} className="text-slate-400" />
                    Computer Science and Engineering
                  </span>
                </div>
              </div>

              {/* Social actions row */}
              <div className="flex flex-wrap gap-2.5 justify-center md:justify-start pt-2">
                <a 
                  href="https://github.com/Palash-r26" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-[#F8FAFC] dark:bg-[#1E293B] hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 font-extrabold text-[11px] py-2.5 px-4 rounded-xl shadow-sm transition-all focus:outline-none"
                >
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.137 20.162 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
                  </svg>
                  <span>GitHub</span>
                  <ExternalLink size={10} className="opacity-55" />
                </a>
                <a 
                  href="https://www.linkedin.com/in/palash-rai2612" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/10 hover:bg-blue-100 dark:hover:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 text-blue-600 dark:text-blue-400 font-extrabold text-[11px] py-2.5 px-4 rounded-xl shadow-sm transition-all focus:outline-none"
                >
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                  </svg>
                  <span>LinkedIn</span>
                  <ExternalLink size={10} className="opacity-55" />
                </a>
                <a 
                  href="mailto:palashr2612@gmail.com"
                  className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/10 hover:bg-emerald-100 dark:hover:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-400 font-extrabold text-[11px] py-2.5 px-4 rounded-xl shadow-sm transition-all focus:outline-none"
                >
                  <Mail size={14} />
                  <span>Email</span>
                </a>
              </div>
            </div>

          </div>

          {/* 2. Grid (Education on left, Achievements on right) */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
            
            {/* Education Card */}
            <div className="md:col-span-6 bg-white dark:bg-[#131B2E] border border-slate-200/40 dark:border-slate-800/60 rounded-3xl p-6 shadow-md theme-transition flex flex-col">
              <h3 className="text-sm font-black text-slate-900 dark:text-white tracking-wider uppercase border-b border-slate-100 dark:border-slate-800/60 pb-3 mb-4 flex items-center gap-2">
                <span>🎓</span> Education
              </h3>

              {/* Institution Row */}
              <div className="flex items-center gap-3.5 mb-5">

                <div>
                  <h4 className="font-extrabold text-xs text-slate-900 dark:text-white leading-snug">
                    Madhav Institute of Technology & Science
                  </h4>
                  <p className="text-[10px] text-slate-400 font-bold">Gwalior, Madhya Pradesh</p>
                </div>
              </div>

              {/* Education Grid */}
              <div className="bg-slate-50 dark:bg-slate-950/40 rounded-2xl p-4 space-y-3.5 border border-slate-200/20 text-xs font-bold flex-1 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-200/30 dark:border-slate-800/30">
                    <span className="text-slate-400 font-medium text-[11px]">Degree</span>
                    <span className="text-slate-900 dark:text-slate-200">B.Tech</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-200/30 dark:border-slate-800/30">
                    <span className="text-slate-400 font-medium text-[11px]">Duration</span>
                    <span className="text-slate-900 dark:text-slate-200">2024 - 2028</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-200/30 dark:border-slate-800/30">
                    <span className="text-slate-400 font-medium text-[11px]">Branch</span>
                    <span className="text-blue-500 dark:text-blue-400">Computer Science & Design</span>
                  </div>
                </div>

                {/* Badges */}
                <div className="pt-3">
                  <div className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-950/30 rounded-xl p-2.5 text-center">
                    <p className="text-[8px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-bold">CGPA</p>
                    <p className="text-sm font-black mt-0.5">8.88</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Achievements Card */}
            <div className="md:col-span-6 bg-white dark:bg-[#131B2E] border border-slate-200/40 dark:border-slate-800/60 rounded-3xl p-6 shadow-md theme-transition flex flex-col">
              <h3 className="text-sm font-black text-slate-900 dark:text-white tracking-wider uppercase border-b border-slate-100 dark:border-slate-800/60 pb-3 mb-4 flex items-center gap-2">
                <span>🏅</span> Key Achievements & Contributions
              </h3>

              <ul className="space-y-3.5 text-xs font-bold text-slate-600 dark:text-slate-350 flex-1 flex flex-col justify-center">
                <li className="flex items-start gap-2.5">
                  <span className="text-blue-500 shrink-0 mt-0.5">⭐</span>
                  <p className="leading-relaxed">
                    Solely created the core dynamic exam swapper engine and RAG assessment interface from scratch.
                  </p>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-amber-500 shrink-0 mt-0.5">⭐</span>
                  <p className="leading-relaxed">
                    Maintained outstanding academic performance with a consistent 8.88 CGPA in engineering.
                  </p>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-violet-500 shrink-0 mt-0.5">⭐</span>
                  <p className="leading-relaxed">
                    Architected the real-time telemetry dashboard monitoring host CPU, memory, and MongoDB latencies.
                  </p>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-500 shrink-0 mt-0.5">⭐</span>
                  <p className="leading-relaxed">
                    Integrated production-grade theme synchronization, layout state middleware, and sidebar controls.
                  </p>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-red-500 shrink-0 mt-0.5">⭐</span>
                  <p className="leading-relaxed">
                    Built fully-secured JWT session workflows and Google OAuth role-selection forms.
                  </p>
                </li>
              </ul>
            </div>

          </div>

          {/* 3. Bottom Explore Card */}
          <div className="bg-white dark:bg-[#131B2E] border border-slate-200/40 dark:border-slate-800/60 rounded-[28px] p-6 md:p-8 shadow-md theme-transition text-center space-y-4 max-w-2xl mx-auto w-full">
            <div className="w-12 h-12 rounded-2xl bg-slate-900 dark:bg-slate-800 border border-slate-800 dark:border-slate-700 flex items-center justify-center text-white mx-auto shadow-md">
              <Globe size={22} className="text-blue-400" />
            </div>
            
            <div className="space-y-1.5">
              <h3 className="text-base font-black text-slate-950 dark:text-white tracking-tight">
                Explore My Portfolio
              </h3>
              <p className="text-xs text-slate-450 dark:text-slate-400 max-w-md mx-auto leading-relaxed font-semibold">
                Beyond the highlighted projects, my portfolio showcases case studies, technical insights, core skills, tech stacks, and my professional journey.
              </p>
            </div>

            <a 
              href="https://www.palashrai.me/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#1E293B] hover:bg-slate-800 text-white dark:bg-slate-200 dark:hover:bg-white dark:text-slate-950 font-black text-xs py-3 px-6 rounded-2xl transition-all shadow-md focus:outline-none cursor-pointer"
            >
              <Globe size={14} />
              <span>Visit Portfolio</span>
              <ExternalLink size={11} className="opacity-70" />
            </a>
          </div>

        </div>

        {/* ─── FOOTER ─── */}
        <footer className="w-full pt-16 text-center text-[10px] text-slate-400 dark:text-slate-500 font-medium relative z-20 theme-transition mt-auto">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <span>Made with</span>
            <Heart size={10} className="text-red-500 animate-pulse fill-red-500" />
            <span>by Palash Rai for VedaAI Academy</span>
          </div>
          <span>&copy; {new Date().getFullYear()} VedaAI Academy. All rights reserved.</span>
        </footer>

      </main>
    </div>
  );
}
