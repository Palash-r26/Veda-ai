'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../store/useAuthStore';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { API_URL } from '@/lib/api';
import { 
  Moon, 
  Sun, 
  Loader2, 
  Brain, 
  ArrowRight, 
  Zap, 
  Sparkles, 
  FileDown,
  Lock,
  Compass,
  Mail,
  User,
  Eye,
  EyeOff,
  Terminal
} from 'lucide-react';

export default function InstitutionalLoginPage() {
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [role, setRole] = useState<'teacher' | 'admin'>('teacher');
  
  // Traditional Credentials States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  
  // Visibility States
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark'); // Default to dark mode
  
  const router = useRouter();
  const { setAuth, isAuthenticated } = useAuthStore();

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

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

  // Sync theme changes from other components
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

  // Load Google Identity Services script on mount for real Chrome account picking
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);
    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
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

  // Traditional Email/Password Form Submit
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || (authMode === 'signup' && (!name || !confirmPassword))) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    // Sign-up Password matching check
    if (authMode === 'signup' && password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    setLoading(true);

    try {
      if (authMode === 'signup') {
        const res = await fetch(`${API_URL}/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password, role }),
        });
        const data = await res.json();
        if (data.success) {
          setAuth(data.user, data.token);
          toast.success('Registration successful! Welcome to VedaAI');
          router.push('/dashboard');
        } else {
          toast.error(data.error || 'Registration failed');
        }
      } else {
        const res = await fetch(`${API_URL}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (data.success) {
          setAuth(data.user, data.token);
          toast.success('Sign-in successful!');
          router.push('/dashboard');
        } else {
          toast.error(data.error || 'Invalid credentials');
        }
      }
    } catch (err) {
      toast.error('Authentication server offline. Connecting in fallback mode...');
      const fallbackUser = {
        id: `offline-${Date.now()}`,
        name: authMode === 'signup' ? name : 'VedaAI Academic Member',
        email,
        role
      };
      setAuth(fallbackUser, 'offline-token-veda-ai');
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  // Real Google Sign-In Identity Flow
  const handleRealGoogleLogin = () => {
    if (typeof window === 'undefined' || !(window as any).google) {
      toast.error('Google Sign-In is loading, please click again in a second...');
      return;
    }

    try {
      const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '58472951642-uil6t49b7qltli3g9ab7om7j5f2b8pc8.apps.googleusercontent.com';
      
      const tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
        client_id: googleClientId,
        scope: 'openid email profile',
        callback: async (tokenResponse: any) => {
          if (tokenResponse.error) {
            toast.error('Google Sign-In was cancelled or failed');
            return;
          }
          
          setLoading(true);
          try {
            const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
              headers: { 'Authorization': `Bearer ${tokenResponse.access_token}` }
            });
            const googleUser = await userInfoRes.json();
            
            if (googleUser.email) {
              await handleGoogleLogin(googleUser.email, googleUser.name || 'Google User');
            } else {
              toast.error('Failed to get email address from Google Account');
            }
          } catch (err) {
            toast.error('Failed to fetch user credentials from Google Session');
          } finally {
            setLoading(false);
          }
        },
      });

      tokenClient.requestAccessToken({ prompt: 'select_account' });
    } catch (err) {
      console.error('Google Auth Initialization Failed:', err);
      toast.error('Failed to configure Google client library');
    }
  };

  // Google Login session creation helper
  const handleGoogleLogin = async (emailAddr: string, accountName: string) => {
    setLoading(true);
    const defaultPwd = 'veda_ai_secure_default_2026';

    try {
      // Step 1: Check if user already exists
      const checkRes = await fetch(`${API_URL}/api/auth/check-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailAddr }),
      });
      const checkData = await checkRes.json();

      if (checkData.success && checkData.exists) {
        // User exists — just log them in
        const res = await fetch(`${API_URL}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: emailAddr, password: defaultPwd }),
        });
        const data = await res.json();
        if (data.success) {
          setAuth(data.user, data.token);
          toast.success(`Welcome back, ${data.user.name}!`);
          router.push('/dashboard');
        } else {
          toast.error(data.error || 'Failed to sign in');
        }
      } else {
        // User is new — create them as a teacher by default
        const res = await fetch(`${API_URL}/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: accountName,
            email: emailAddr,
            password: defaultPwd,
            role: 'teacher',
          }),
        });
        const data = await res.json();
        if (data.success) {
          setAuth(data.user, data.token);
          toast.success(`Account created as teacher! Welcome to VedaAI`);
          router.push('/dashboard');
        } else {
          toast.error(data.error || 'Registration failed');
        }
      }
    } catch (err) {
      // Offline fallback
      const offlineUser = {
        id: `offline-${Date.now()}`,
        name: accountName,
        email: emailAddr,
        role: 'teacher' as const
      };
      setAuth(offlineUser, 'offline-token-veda-ai');
      toast.success(`Google verified (Offline mode)`);
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={theme === 'dark' ? 'dark' : ''}>
      <main id="home" className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F19] text-slate-800 dark:text-slate-200 flex flex-col font-sans theme-transition scroll-smooth">
        
        {/* ─── HEADER NAVBAR ─── */}
        <header className="w-full px-6 py-4 md:px-12 flex justify-between items-center bg-white/80 dark:bg-[#131B2E]/85 backdrop-blur-md border-b border-slate-200/60 dark:border-slate-800/60 z-40 sticky top-0 theme-transition">
          <Link href="/" className="flex items-center gap-3 group cursor-pointer">
            {/* VedaAI Gradient Square Logo */}
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#F57B36] via-[#D13636] to-[#3B0E0E] flex items-center justify-center shadow-lg shadow-red-500/20 shrink-0 transition-transform duration-200 group-hover:scale-105">
              <span className="text-white font-extrabold text-xl tracking-tighter">V</span>
            </div>
            <span className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white transition-colors duration-200 group-hover:text-[#F57B36]">
              VedaAI
            </span>
          </Link>
          
          <div className="flex items-center gap-6">
            <nav className="hidden md:flex items-center gap-6">
              <a href="#home" className="text-sm font-semibold text-slate-500 hover:text-[#F57B36] transition-colors">Home</a>
              <a href="#guidelines" className="text-sm font-semibold text-slate-500 hover:text-[#F57B36] transition-colors">Guidelines</a>
              <Link href="/developer" className="text-sm font-semibold text-slate-500 hover:text-[#F57B36] transition-colors flex items-center gap-1.5">
                <Terminal size={14} />
                <span>Developers</span>
              </Link>
            </nav>

            {/* Theme Toggle Button */}
            <button 
              onClick={toggleTheme}
              className="w-10 h-10 rounded-full border border-slate-200 dark:border-slate-800 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-slate-650 dark:text-slate-400 focus:outline-none cursor-pointer"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>
          </div>
        </header>

        {/* ─── SPLIT MAIN CONTENT ─── */}
        <div className="max-w-7xl w-full mx-auto px-6 py-8 md:py-16 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
          
          {/* Left Side: VedaAI Identity & Feature Grid */}
          <div className="lg:col-span-7 space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-[#F57B36]/10 text-[#F57B36] dark:text-[#F57B36] border border-[#F57B36]/20">
                <Sparkles size={14} className="text-[#F57B36] animate-spin" />
                Advanced Assessment Engine
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] text-slate-900 dark:text-white">
                VedaAI Assessment <br />
                <span className="bg-gradient-to-r from-[#F57B36] to-[#E15A20] bg-clip-text text-transparent">
                  Platform
                </span>
              </h1>
              <p className="text-base md:text-lg text-slate-550 dark:text-slate-400 max-w-xl font-medium leading-relaxed">
                Upload your textbooks, syllabus PDFs, or study sheets. Our RAG engine extracts academic contexts to formulate publication-ready question papers.
              </p>
            </div>

            {/* VedaAI pillars */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <PillarCard 
                icon={<Brain className="text-[#F57B36]" size={20} />}
                title="Context-Aware RAG" 
                desc="Upload syllabus guides to extract precise study contexts." 
              />
              <PillarCard 
                icon={<Zap className="text-amber-500" size={20} />}
                title="Micro-Regeneration" 
                desc="Swap individual questions instantly without rebuilding papers." 
              />
              <PillarCard 
                icon={<Compass className="text-blue-500" size={20} />}
                title="AI Blueprints" 
                desc="Define question types, marks allocation, and weights." 
              />
              <PillarCard 
                icon={<FileDown className="text-violet-500" size={20} />}
                title="Multi-Format Export" 
                desc="Export professional PDFs and exam sheets instantly." 
              />
            </div>
          </div>

          {/* Right Side: Traditional Login + Google Card */}
          <div className="lg:col-span-5 flex justify-center w-full">
            <div className="w-full max-w-md bg-white dark:bg-[#131B2E] border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-8 shadow-xl theme-transition flex flex-col items-center">
              
              {/* VedaAI Logo Square */}
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#F57B36] via-[#D13636] to-[#3B0E0E] flex items-center justify-center shadow-lg shadow-red-500/20 mb-5 shrink-0">
                <span className="text-white font-extrabold text-3xl tracking-tighter">V</span>
              </div>

              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-1.5 tracking-tight">
                {authMode === 'signin' ? 'Welcome Back' : 'Create Account'}
              </h2>
              <p className="text-xs text-slate-400 dark:text-slate-400 text-center max-w-[280px] leading-relaxed mb-6">
                {authMode === 'signin' ? 'Sign in to access your VedaAI classroom portal.' : 'Register to start generating AI assessments.'}
              </p>

              {/* Custom Mode Segment Switcher (Sign In vs Sign Up) */}
              <div className="w-full bg-slate-100 dark:bg-slate-800/60 rounded-2xl p-1 flex gap-1 mb-6 border border-slate-200/20 dark:border-slate-700/30">
                <button
                  type="button"
                  onClick={() => setAuthMode('signin')}
                  className={`flex-1 py-2.5 text-xs font-bold rounded-xl capitalize transition-all focus:outline-none cursor-pointer ${
                    authMode === 'signin' 
                      ? 'bg-white dark:bg-[#131B2E] text-slate-900 dark:text-white shadow-sm border border-slate-200/20 dark:border-slate-700/20' 
                      : 'text-slate-400 dark:text-slate-500 hover:text-slate-650'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode('signup')}
                  className={`flex-1 py-2.5 text-xs font-bold rounded-xl capitalize transition-all focus:outline-none cursor-pointer ${
                    authMode === 'signup' 
                      ? 'bg-white dark:bg-[#131B2E] text-slate-900 dark:text-white shadow-sm border border-slate-200/20 dark:border-slate-700/20' 
                      : 'text-slate-400 dark:text-slate-500 hover:text-slate-650'
                  }`}
                >
                  Create Account
                </button>
              </div>

              {/* Traditional Email & Password Form */}
              <form onSubmit={handleAuthSubmit} className="w-full space-y-4">
                
                {authMode === 'signup' && (
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-4 top-3.5 text-slate-400" size={16} />
                      <input 
                        type="text" 
                        placeholder="Enter your name"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 rounded-2xl pl-12 pr-4 py-3.5 text-xs focus:outline-none focus:border-[#F57B36] font-bold transition-all text-slate-900 dark:text-white placeholder-slate-400"
                        required
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-3.5 text-slate-400" size={16} />
                    <input 
                      type="email" 
                      placeholder="you@vedaai.edu"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 rounded-2xl pl-12 pr-4 py-3.5 text-xs focus:outline-none focus:border-[#F57B36] font-bold transition-all text-slate-900 dark:text-white placeholder-slate-400"
                      required
                    />
                  </div>
                </div>

                {/* Password field with Eye Toggle Option */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-3.5 text-slate-400" size={16} />
                    <input 
                      type={showPassword ? "text" : "password"} 
                      placeholder="••••••••"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 rounded-2xl pl-12 pr-12 py-3.5 text-xs focus:outline-none focus:border-[#F57B36] font-bold transition-all text-slate-900 dark:text-white placeholder-slate-400"
                      required
                    />
                    {/* Eye Icon */}
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-650 dark:hover:text-white focus:outline-none cursor-pointer"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password field (Sign-up only, with Eye Toggle) */}
                {authMode === 'signup' && (
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">Confirm Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-3.5 text-slate-400" size={16} />
                      <input 
                        type={showConfirmPassword ? "text" : "password"} 
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 rounded-2xl pl-12 pr-12 py-3.5 text-xs focus:outline-none focus:border-[#F57B36] font-bold transition-all text-slate-900 dark:text-white placeholder-slate-400"
                        required
                      />
                      {/* Confirm Password Eye Icon */}
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-white focus:outline-none cursor-pointer"
                      >
                        {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                )}

                {/* Account Role Segment Select for Sign-in */}
                <div className="space-y-1.5 pt-1">
                  <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">Select Access Level</label>
                  <div className="grid grid-cols-2 gap-1 bg-slate-50 dark:bg-[#1E293B] p-1 rounded-2xl border border-slate-200 dark:border-slate-850">
                    {(['teacher', 'admin'] as const).map(r => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setRole(r)}
                        className={`py-2 text-[10px] font-extrabold rounded-xl capitalize transition-all focus:outline-none cursor-pointer ${
                          role === r 
                            ? 'bg-[#F57B36] text-white shadow-sm' 
                            : 'text-slate-400 dark:text-slate-405 hover:text-slate-900 dark:hover:text-slate-200'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#F57B36] hover:bg-[#E15A20] text-white py-3.5 rounded-full font-bold text-[13px] flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-orange-500/20 disabled:opacity-50 mt-4 cursor-pointer focus:outline-none"
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="animate-spin" size={16} />
                      <span>Processing...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <span>{authMode === 'signin' ? 'Sign In' : 'Create Account'}</span>
                      <ArrowRight size={16} />
                    </div>
                  )}
                </button>

              </form>

              {/* Divider */}
              <div className="relative flex py-5 items-center w-full">
                <div className="flex-grow border-t border-slate-200 dark:border-slate-800/80"></div>
                <span className="flex-shrink mx-4 text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Or continue with</span>
                <div className="flex-grow border-t border-slate-200 dark:border-slate-800/80"></div>
              </div>

              {/* Simple Google Login Button */}
              <button
                onClick={handleRealGoogleLogin}
                disabled={loading}
                className="w-full bg-slate-50 dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 py-3.5 px-4 rounded-full font-bold text-[13px] flex items-center justify-center gap-3 transition-all hover:bg-slate-100 dark:hover:bg-slate-800/85 active:scale-95 shadow-sm disabled:opacity-50 focus:outline-none cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                </svg>
                <span>{authMode === 'signin' ? 'Sign in with Google' : 'Sign up with Google'}</span>
              </button>

            </div>
          </div>

        </div>

        {/* ─── TEACHER WORKFLOW GUIDELINES ─── */}
        <section id="guidelines" className="max-w-7xl w-full mx-auto px-6 py-16 border-t border-slate-200 dark:border-slate-900 mt-8 relative z-10 theme-transition">
          
          <div className="text-center space-y-3 mb-12">
            <h2 className="text-2xl md:text-3xl font-black text-slate-950 dark:text-white tracking-tight flex items-center justify-center gap-2">
              <Sparkles size={24} className="text-[#F57B36] animate-pulse" />
              Teacher Assessment Workflow
            </h2>
            <p className="text-xs md:text-sm text-slate-400 dark:text-slate-400 max-w-xl mx-auto font-medium">
              Review the systematic process VedaAI uses to generate, calibrate, and export structured classroom papers.
            </p>
          </div>

          {/* 3D Tilt Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            <WorkflowCard 
              step="01" 
              title="Upload Study Material" 
              desc="Add textbooks, course manuals, or syllabi files. VedaAI's indexing system maps the full content structure automatically." 
            />
            <WorkflowCard 
              step="02" 
              title="Formulate Blueprints" 
              desc="Select question mix (MCQs, short/long answers), allocate marks, and set targeted difficulty levels." 
            />
            <WorkflowCard 
              step="03" 
              title="Micro-Regenerate" 
              desc="Swap out separate questions instantly, modify phrasing, or customize rubric sheets using sidebar filters." 
            />
            <WorkflowCard 
              step="04" 
              title="Premium PDF Export" 
              desc="Export publication-ready PDFs with custom school credentials, structured columns, and printable rubrics." 
            />

          </div>

        </section>

        {/* ─── FOOTER ─── */}
        <footer id="developers" className="w-full bg-white dark:bg-[#131B2E] border-t border-slate-200 dark:border-slate-900 py-12 px-6 md:px-12 theme-transition relative z-10 mt-auto">
          <div className="max-w-7xl w-full mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
            
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#F57B36] via-[#D13636] to-[#3B0E0E] flex items-center justify-center shrink-0">
                <span className="text-white font-black text-sm">V</span>
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-slate-900 dark:text-white tracking-tight leading-none mb-1">VedaAI Assessment System</span>
                <span className="text-[9px] font-bold text-slate-400">Developed by Palash Rai</span>
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-6 text-xs font-bold text-slate-400">
              <a href="#home" className="hover:text-[#F57B36] transition-colors">Home</a>
              <a href="#guidelines" className="hover:text-[#F57B36] transition-colors">Guidelines</a>
              <Link href="/developer" className="hover:text-[#F57B36] transition-colors">Developers</Link>
              <a href="#" className="hover:text-[#F57B36] transition-colors">Helpdesk Support</a>
            </div>

          </div>

          <div className="max-w-7xl w-full mx-auto border-t border-slate-200 dark:border-slate-800/80 pt-6 mt-8 flex flex-col sm:flex-row justify-between items-center text-[10px] text-slate-500 font-medium">
            <span>&copy; {new Date().getFullYear()} VedaAI Platform. All Rights Reserved. Fully Staged Deployment.</span>
            <span>v2.1.0 - Powered by Gemini AI</span>
          </div>
        </footer>

      </main>
    </div>
  );
}

// ─── CARD PILLAR COMPONENT ───
function PillarCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="bg-white dark:bg-[#131B2E] border border-slate-200/40 dark:border-slate-800/60 p-5 rounded-2xl shadow-sm hover:shadow-md hover:border-[#F57B36]/30 transition-all theme-transition group flex items-start gap-4">
      <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner border border-slate-100 dark:border-slate-700/30 shrink-0">
        {icon}
      </div>
      <div>
        <h3 className="font-extrabold text-slate-900 dark:text-slate-200 text-sm tracking-tight mb-0.5">{title}</h3>
        <p className="text-xs text-slate-400 dark:text-slate-400 font-medium leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

// ─── WORKFLOW CARD COMPONENT ───
function WorkflowCard({ step, title, desc }: { step: string; title: string; desc: string }) {
  return (
    <div className="tilt-card bg-white dark:bg-[#131B2E] border border-slate-200/50 dark:border-slate-800/80 p-6 rounded-3xl flex flex-col relative overflow-hidden group">
      {/* Background glowing number */}
      <span className="absolute -top-3 -right-3 text-7xl font-black text-slate-250 dark:text-slate-800/10 pointer-events-none group-hover:text-[#F57B36]/5 transition-colors">
        {step}
      </span>
      
      {/* Glowing step identifier */}
      <span className="text-[10px] font-black text-[#F57B36] tracking-wider uppercase bg-[#F57B36]/10 px-2 py-0.5 rounded-md inline-block w-fit mb-4">
        Step {step}
      </span>

      <h3 className="font-black text-slate-900 dark:text-white text-base tracking-tight mb-2 pr-6">
        {title}
      </h3>
      <p className="text-xs text-slate-455 dark:text-slate-400 font-medium leading-relaxed">
        {desc}
      </p>
    </div>
  );
}
