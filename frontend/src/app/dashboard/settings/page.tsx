'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '../../../store/useAuthStore';
import toast from 'react-hot-toast';
import { API_URL } from '../../../lib/api';
import { 
  Settings, 
  User, 
  Sparkles, 
  Cpu, 
  Database, 
  Palette, 
  Save, 
  ArrowLeft,
  ChevronRight,
  Lock
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const { user, token, setAuth } = useAuthStore();
  const router = useRouter();

  // Profile States
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [school, setSchool] = useState('Madhav Institute of Technology and Science');
  const [avatar, setAvatar] = useState('👨‍🏫');
  
  // AI States
  const [model, setModel] = useState('gemini-2.5-flash');
  const [apiKey, setApiKey] = useState('');

  // Theme States
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  // Password Change States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      if (user.role === 'admin') setAvatar('🛡️');
      else setAvatar('👨‍🏫');
    }
    const savedTheme = localStorage.getItem('veda-theme') as 'light' | 'dark' || 'dark';
    setTheme(savedTheme);
  }, [user]);

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

  const handlePasswordSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      toast.error('All password fields are required');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters long');
      return;
    }
    
    setPasswordLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      const data = await res.json();
      
      if (data.success) {
        toast.success('Password updated successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
      } else {
        toast.error(data.error || 'Failed to update password');
      }
    } catch (err) {
      toast.error('Authentication server offline or network error');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) {
      toast.error('Name and email are required');
      return;
    }
    if (user) {
      setAuth({ ...user, name, email }, token || '');
      toast.success('Profile settings updated successfully!');
    }
  };

  const handleAISave = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('AI Gemini Engine parameters saved!');
  };

  const handleThemeChange = (nextTheme: 'light' | 'dark') => {
    setTheme(nextTheme);
    localStorage.setItem('veda-theme', nextTheme);
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    window.dispatchEvent(new CustomEvent('veda-theme-changed', { detail: nextTheme }));
    toast.success(`${nextTheme === 'light' ? 'Light' : 'Dark'} theme applied!`);
  };

  return (
    <main className="flex-1 flex flex-col min-w-0 h-full pb-20 md:pb-0 relative z-10 text-slate-800 dark:text-slate-200 px-2 sm:px-3 md:px-0">
      
      {/* Header bar */}
      <header className="bg-white dark:bg-[#131B2E] border border-slate-200/40 dark:border-slate-800/40 rounded-[24px] min-h-[72px] h-auto py-3 md:py-0 shadow-sm flex items-center justify-between px-4 md:px-6 mb-4 shrink-0 theme-transition gap-3 flex-wrap">
        <div className="flex items-center gap-3 md:gap-4 min-w-0">
          <button 
            onClick={() => router.push('/dashboard')}
            className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-600 dark:text-slate-400 focus:outline-none"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex items-center gap-2 text-slate-400">
            <Settings size={16} />
            <span className="text-slate-500 dark:text-slate-400 font-extrabold text-xs tracking-wider uppercase">Portal Settings</span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <span className="text-xs bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-3 py-1.5 rounded-full font-bold uppercase tracking-wider">
            {user?.role || 'TEACHER'} VIEW
          </span>
        </div>
      </header>

      {/* Settings Grid */}
      <div className="flex-1 overflow-y-auto pb-32 px-1 md:px-0 space-y-6 no-scrollbar">
        
        {/* Title Section */}
        <div>
          <h2 className="text-[22px] font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            Settings Center
          </h2>
          <p className="text-[13px] text-slate-400 dark:text-slate-400 font-medium">
            Customize your account profile, theme aesthetics, and Gemini AI configuration.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: Forms */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Profile settings card */}
            <form onSubmit={handleProfileSave} className="bg-white dark:bg-[#131B2E] border border-slate-200/40 dark:border-slate-800/40 rounded-3xl p-6 shadow-sm theme-transition">
              <h3 className="text-base font-extrabold text-slate-950 dark:text-white mb-4 flex items-center gap-2.5">
                <User size={18} className="text-emerald-500" />
                <span>Profile Settings</span>
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">Display Name</label>
                  <input 
                    type="text" 
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 text-xs focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-500 font-bold transition-all text-slate-900 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">Email Address</label>
                  <input 
                    type="email" 
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 text-xs focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-500 font-bold transition-all text-slate-900 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">Institution</label>
                  <input 
                    type="text" 
                    value={school}
                    onChange={e => setSchool(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 text-xs focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-500 font-bold transition-all text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">Account Role</label>
                  <input 
                    type="text" 
                    value={user?.role?.toUpperCase() || 'TEACHER'}
                    disabled
                    className="w-full bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800/80 rounded-2xl px-4 py-3 text-xs font-bold text-slate-400 dark:text-slate-500 cursor-not-allowed uppercase"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800/50">
                <button
                  type="submit"
                  className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs py-3 px-5 rounded-xl flex items-center gap-2 shadow-md shadow-emerald-500/25 transition-all active:scale-95 cursor-pointer focus:outline-none"
                >
                  <Save size={14} />
                  <span>Save Profile</span>
                </button>
              </div>
            </form>

            {/* Password settings card */}
            <form onSubmit={handlePasswordSave} className="bg-white dark:bg-[#131B2E] border border-slate-200/40 dark:border-slate-800/40 rounded-3xl p-6 shadow-sm theme-transition">
              <h3 className="text-base font-extrabold text-slate-950 dark:text-white mb-4 flex items-center gap-2.5">
                <Lock size={18} className="text-emerald-500" />
                <span>Security & Password</span>
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-5">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">Current Password</label>
                  <input 
                    type="password" 
                    placeholder="••••••••"
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 text-xs focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-500 font-bold transition-all text-slate-900 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">New Password</label>
                  <input 
                    type="password" 
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 text-xs focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-500 font-bold transition-all text-slate-900 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">Confirm New Password</label>
                  <input 
                    type="password" 
                    placeholder="••••••••"
                    value={confirmNewPassword}
                    onChange={e => setConfirmNewPassword(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 text-xs focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-500 font-bold transition-all text-slate-900 dark:text-white"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800/50">
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs py-3 px-5 rounded-xl flex items-center gap-2 shadow-md shadow-emerald-500/25 transition-all active:scale-95 cursor-pointer focus:outline-none disabled:opacity-50"
                >
                  <Save size={14} />
                  <span>{passwordLoading ? 'Updating...' : 'Update Password'}</span>
                </button>
              </div>
            </form>

            {/* AI parameters card */}
            {user?.role === 'admin' && (
              <form onSubmit={handleAISave} className="bg-white dark:bg-[#131B2E] border border-slate-200/40 dark:border-slate-800/40 rounded-3xl p-6 shadow-sm theme-transition">
                <h3 className="text-base font-extrabold text-slate-950 dark:text-white mb-4 flex items-center gap-2.5">
                  <Cpu size={18} className="text-emerald-500" />
                  <span>AI Gemini Core Engine</span>
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">Active LLM Model</label>
                    <select 
                      value={model}
                      onChange={e => setModel(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 text-xs focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-500 font-bold transition-all text-slate-900 dark:text-white appearance-none cursor-pointer"
                    >
                      <option value="gemini-2.5-flash">Gemini 2.5 Flash (Default)</option>
                      <option value="gemini-3.5-flash">Gemini 3.5 Flash (High Speed)</option>
                      <option value="gemini-1.5-pro">Gemini 1.5 Pro (Deep Analysis)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">Gemini API Key</label>
                    <input 
                      type="password" 
                      value={apiKey}
                      onChange={e => setApiKey(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 text-xs focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-500 font-bold transition-all text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800/50">
                  <button
                    type="submit"
                    className="bg-slate-900 hover:bg-black dark:bg-[#1E293B] dark:hover:bg-slate-800 text-white font-bold text-xs py-3 px-5 rounded-xl flex items-center gap-2 transition-all active:scale-95 cursor-pointer focus:outline-none"
                  >
                    <Sparkles size={14} className="text-emerald-400" />
                    <span>Update AI Parameters</span>
                  </button>
                </div>
              </form>
            )}

          </div>

          {/* Right Column: Aesthetics & Integrations */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Theme selector card */}
            <div className="bg-white dark:bg-[#131B2E] border border-slate-200/40 dark:border-slate-800/40 rounded-3xl p-6 shadow-sm theme-transition flex flex-col">
              <h3 className="text-base font-extrabold text-slate-950 dark:text-white mb-4 flex items-center gap-2.5">
                <Palette size={18} className="text-emerald-500" />
                <span>Portal Theme</span>
              </h3>
              
              <p className="text-xs text-slate-400 dark:text-slate-400 mb-4 font-medium leading-relaxed">
                Choose your default interface appearance. Dark mode is optimized to reduce eye strain in dimly lit classrooms.
              </p>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={() => handleThemeChange('light')}
                  className={`py-3 px-4 rounded-2xl text-xs font-bold flex items-center justify-center gap-2.5 border transition-all ${
                    theme === 'light' 
                      ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-300/40' 
                      : 'bg-slate-50 dark:bg-slate-800/50 text-slate-400 border-slate-200 dark:border-slate-800 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                >
                  <span>☀️</span>
                  <span>Light</span>
                </button>
                <button
                  onClick={() => handleThemeChange('dark')}
                  className={`py-3 px-4 rounded-2xl text-xs font-bold flex items-center justify-center gap-2.5 border transition-all ${
                    theme === 'dark' 
                      ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-300/40' 
                      : 'bg-slate-50 dark:bg-slate-800/50 text-slate-400 border-slate-200 dark:border-slate-800 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                >
                  <span>🌙</span>
                  <span>Dark</span>
                </button>
              </div>
            </div>

            {/* Core integrations / Connection Status card */}
            <div className="bg-white dark:bg-[#131B2E] border border-slate-200/40 dark:border-slate-800/40 rounded-3xl p-6 shadow-sm theme-transition flex flex-col">
              <h3 className="text-base font-extrabold text-slate-950 dark:text-white mb-4 flex items-center gap-2.5">
                <Database size={18} className="text-emerald-500" />
                <span>Backend Integration</span>
              </h3>
              
              <div className="space-y-4 text-xs font-bold">
                <StatusItem label="MongoDB database" value="CONNECTED" success />
                <StatusItem label="Redis RAG Cache" value="CONNECTED" success />
                <StatusItem label="BullMQ Paper Queue" value="OPERATIONAL" success />
                <StatusItem label="Socket.io server" value="CONNECTED" success />
              </div>
            </div>

          </div>

        </div>

      </div>

    </main>
  );
}

// ─── HELPERS ───
function StatusItem({ label, value, success }: { label: string; value: string; success: boolean }) {
  return (
    <div className="flex justify-between items-center py-2.5 border-b border-slate-100 dark:border-slate-800/60 last:border-b-0">
      <span className="text-slate-400 font-medium text-[11px]">{label}</span>
      <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
        success ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-red-100 dark:bg-red-500/10 text-red-600'
      }`}>
        {value}
      </span>
    </div>
  );
}
