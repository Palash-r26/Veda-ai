'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, User, LogOut } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

interface UserDropdownProps {
  /** Force a specific emoji avatar; defaults to role-based auto selection */
  avatarEmoji?: string;
  /** Dark styled version (for admin panel) */
  dark?: boolean;
}

export default function UserDropdown({ avatarEmoji, dark = false }: UserDropdownProps) {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Role-based avatar
  const emoji = avatarEmoji ?? (user?.role === 'admin' ? '🛡️' : user?.role === 'teacher' ? '👨‍🏫' : '👨‍🎓');

  const handleLogout = () => {
    setOpen(false);
    logout();
    toast.success('Signed out successfully');
    router.push('/');
  };

  const handleProfile = () => {
    setOpen(false);
    router.push('/dashboard/settings');
  };

  return (
    <div ref={ref} className="relative flex items-center gap-2 pl-1 md:pl-2 select-none">
      {/* Trigger button */}
      <button
        id="user-dropdown-trigger"
        onClick={() => setOpen(prev => !prev)}
        className={`flex items-center gap-2 rounded-2xl px-2 py-1.5 transition-all focus:outline-none ${
          dark
            ? 'hover:bg-slate-800'
            : 'hover:bg-slate-100 dark:hover:bg-slate-800'
        }`}
        aria-haspopup="true"
        aria-expanded={open}
      >
        <div className={`w-8 h-8 rounded-full overflow-hidden flex items-center justify-center text-base shrink-0 ${
          dark ? 'bg-slate-700' : 'bg-slate-200 dark:bg-slate-700'
        }`}>
          {emoji}
        </div>
        <span className={`hidden md:block text-xs font-black uppercase tracking-wider ${
          dark ? 'text-white' : 'text-slate-900 dark:text-white'
        }`}>
          {user?.name || 'User'}
        </span>
        <ChevronDown
          size={14}
          className={`hidden md:block transition-transform duration-200 ${
            open ? 'rotate-180' : ''
          } ${dark ? 'text-slate-400' : 'text-slate-500'}`}
        />
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-[#1E293B] border border-slate-200/60 dark:border-slate-700/60 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150"
          role="menu"
        >
          {/* User info header */}
          <div className="px-4 py-3.5 border-b border-slate-100 dark:border-slate-800">
            <p className="text-xs font-black text-slate-900 dark:text-white truncate">{user?.name}</p>
            <p className="text-[11px] text-slate-400 font-medium truncate mt-0.5">{user?.email}</p>
            <span className={`mt-1.5 inline-block text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
              user?.role === 'admin'
                ? 'bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400'
                : user?.role === 'teacher'
                  ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : 'bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
            }`}>
              {user?.role}
            </span>
          </div>

          {/* Menu items */}
          <div className="py-1.5">
            <button
              id="dropdown-view-profile"
              onClick={handleProfile}
              role="menuitem"
              className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left focus:outline-none"
            >
              <User size={14} className="text-slate-400 shrink-0" />
              View Profile
            </button>

            <button
              id="dropdown-logout"
              onClick={handleLogout}
              role="menuitem"
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-extrabold text-red-600 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors text-left focus:outline-none"
            >
              <LogOut size={19} className="text-red-500 shrink-0" />
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
