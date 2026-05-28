'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { 
  LayoutGrid, 
  Users, 
  FileText, 
  Smartphone, 
  Library, 
  Settings,
  Sparkles,
  Home,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Shield,
  Activity,
  Moon,
  Sun,
  Bell
} from 'lucide-react';
import ProtectedRoute from '../../components/ProtectedRoute';
import { ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { API_URL } from '../../lib/api';
import { socket } from '../../lib/socket';


export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [assignmentsCount, setAssignmentsCount] = useState(0);
  const [schoolInfo, setSchoolInfo] = useState({ name: 'VedaAI Academy', city: 'Academic Division' });
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  
  const { token, user, logout } = useAuthStore();

  // Load sidebar collapse preference & theme preference
  useEffect(() => {
    const savedCollapse = localStorage.getItem('sidebar-collapsed') === 'true';
    setIsCollapsed(savedCollapse);

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

  // Fetch notifications and update badge count
  const fetchNotifications = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && data.notifications) {
        const saved = typeof window !== 'undefined' ? localStorage.getItem('veda-read-notifications') : null;
        const readIds: string[] = saved ? JSON.parse(saved) : [];
        const unread = data.notifications.filter((n: any) => !readIds.includes(n._id)).length;
        setAssignmentsCount(unread);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Setup socket listeners for real-time updates
    socket.on('notificationCreated', fetchNotifications);
    socket.on('notificationUpdated', fetchNotifications);
    socket.on('notificationDeleted', fetchNotifications);
    return () => {
      socket.off('notificationCreated', fetchNotifications);
      socket.off('notificationUpdated', fetchNotifications);
      socket.off('notificationDeleted', fetchNotifications);
    };
  }, [token]);

  useEffect(() => {
    if (user) {
      if (user.role === 'admin') {
        setSchoolInfo({
          name: 'VedaAI Academy',
          city: 'System Administrator'
        });
      } else {
        setSchoolInfo({
          name: 'VedaAI Academy',
          city: 'Educator Portal'
        });
      }
    }
  }, [user]);

  const toggleSidebar = () => {
    const nextState = !isCollapsed;
    setIsCollapsed(nextState);
    localStorage.setItem('sidebar-collapsed', String(nextState));
  };

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
  };

  const isAdmin = user?.role === 'admin';

  return (
    <ProtectedRoute>
      <div className="flex min-h-[100dvh] md:h-screen bg-[#EBECEF] dark:bg-[#0B0F19] p-2 md:p-4 gap-3 md:gap-4 overflow-hidden overflow-x-hidden font-sans relative theme-transition">
        
        {/* ─── LEFT SIDEBAR (Desktop Only) ────────────────────────────────────── */}
        <aside 
          className={`hidden md:flex bg-white dark:bg-[#131B2E] border border-slate-200/40 dark:border-slate-800/40 rounded-3xl shadow-sm flex-col overflow-hidden shrink-0 z-30 transition-all duration-300 ease-in-out ${
            isCollapsed ? 'w-[85px]' : 'w-[280px]'
          }`}
        >
          
          {/* Logo Area */}
          <div className={`px-5 py-6 flex ${isCollapsed ? 'flex-col gap-4 items-center justify-center' : 'items-center justify-between'} border-b border-slate-100 dark:border-slate-800/40`}>
            <Link href="/dashboard" className="flex items-center justify-center group cursor-pointer shrink-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#F57B36] via-[#D13636] to-[#3B0E0E] flex items-center justify-center text-white font-extrabold text-xl shadow-lg shadow-red-500/20 transition-transform duration-250 group-hover:scale-105 shrink-0">
                V
              </div>
              {!isCollapsed && (
                <span className="ml-3 text-lg font-black text-slate-900 dark:text-white tracking-tight transition-colors duration-250 group-hover:text-[#F57B36]">VedaAI</span>
              )}
            </Link>
            
            {/* Collapse Trigger Button */}
            <button 
              onClick={toggleSidebar}
              className="text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 p-1.5 rounded-lg transition-colors focus:outline-none shrink-0"
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
          </div>

          {/* Create Button (AI Teacher's Toolkit) */}
          <div className="px-4 py-4 border-b border-slate-100 dark:border-slate-800/40">
          <button
              onClick={() => {
                if (isAdmin) {
                  router.push('/dashboard/admin/users');
                } else {
                  router.push('/dashboard?create=1');
                }
              }}
              className={`w-full bg-[#1C1D21] hover:bg-black dark:bg-[#1E293B] dark:hover:bg-slate-800 text-white rounded-2xl py-3 px-3 flex items-center justify-center gap-2 font-bold text-xs shadow-sm transition-all focus:outline-none ${
                isCollapsed ? 'h-10 w-10 p-0 rounded-full mx-auto justify-center' : ''
              }`}
              title="Create Assessment"
            >
              <Sparkles size={14} className="text-white" />
              {!isCollapsed && (isAdmin ? 'Manage Users' : 'Create Assessment')}
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto no-scrollbar">
            
            {/* Admin: Home goes to admin overview */}
            {isAdmin && (
              <NavItem 
                icon={<Home size={18} />} 
                label="Home" 
                active={pathname === '/dashboard'} 
                href="/dashboard" 
                collapsed={isCollapsed} 
              />
            )}

            {/* Assignments: teacher → /dashboard, admin → /dashboard/admin/assignments */}
            <NavItem 
              icon={<FileText size={18} />} 
              label="Assignments" 
              active={isAdmin ? pathname === '/dashboard/admin/assignments' : pathname === '/dashboard'} 
              href={isAdmin ? '/dashboard/admin/assignments' : '/dashboard'} 
              collapsed={isCollapsed} 
            />




            <NavItem 
              icon={<Bell size={18} />} 
              label="Alerts / Notifications" 
              active={pathname === '/dashboard/notifications'} 
              href="/dashboard/notifications" 
              badge={assignmentsCount} 
              collapsed={isCollapsed} 
            />

            <NavItem 
              icon={<Settings size={18} />} 
              label="Settings" 
              active={pathname === '/dashboard/settings'} 
              href="/dashboard/settings" 
              collapsed={isCollapsed} 
            />

            {/* ─── ADMIN PANELS ─── */}
            {isAdmin && (
              <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800/40 space-y-1">
                {!isCollapsed && (
                  <p className="px-4 text-[9px] font-black text-slate-400 tracking-wider uppercase mb-2">
                    Admin Tools
                  </p>
                )}
                <NavItem 
                  icon={<Users size={18} />} 
                  label="Users Management" 
                  active={pathname === '/dashboard/admin/users'} 
                  href="/dashboard/admin/users" 
                  collapsed={isCollapsed} 
                />
                <NavItem 
                  icon={<FileText size={18} />} 
                  label="All Assignments" 
                  active={pathname === '/dashboard/admin/assignments'} 
                  href="/dashboard/admin/assignments" 
                  collapsed={isCollapsed} 
                />
                <NavItem 
                  icon={<Activity size={18} />} 
                  label="Live Analytics" 
                  active={pathname === '/dashboard/admin/analytics'} 
                  href="/dashboard/admin/analytics" 
                  collapsed={isCollapsed} 
                />
              </div>
            )}

          </nav>

          {/* Footer Area */}
          <div className="px-3 pb-5 pt-2 border-t border-slate-100 dark:border-slate-800/40 space-y-2">
            
            {/* Dark/Light mode in collapsed/normal view */}
            <button
              onClick={toggleTheme}
              className={`w-full flex items-center rounded-2xl text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white font-semibold text-xs transition-colors focus:outline-none ${
                isCollapsed ? 'justify-center px-0 py-3.5' : 'px-4 py-3.5 gap-3'
              }`}
              title="Toggle Theme"
            >
              <div className="shrink-0">
                {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
              </div>
              {!isCollapsed && <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>}
            </button>

            {/* School Info Bubble */}
            <div className={`bg-slate-50 dark:bg-slate-800/40 rounded-2xl flex items-center ${isCollapsed ? 'justify-center p-2.5' : 'p-3 gap-3'}`}>
              <div className="w-8 h-8 rounded-full bg-orange-50 dark:bg-slate-800 flex items-center justify-center text-base overflow-hidden border border-orange-100 dark:border-slate-700 shrink-0">
                🏫
              </div>
              {!isCollapsed && (
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-xs font-black text-slate-900 dark:text-white truncate">{schoolInfo.name}</p>
                  <p className="text-[10px] text-slate-400 truncate">{schoolInfo.city}</p>
                </div>
              )}
            </div>

            {/* Sign Out Button */}
            <button
              type="button"
              onClick={() => {
                logout();
                toast.success('Signed out successfully');
                router.push('/');
              }}
              className={`w-full border border-red-200 dark:border-red-500/30 bg-white dark:bg-[#1E293B] hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-700 dark:hover:text-red-300 transition-colors flex items-center justify-center focus:outline-none ${
                isCollapsed ? 'px-0 h-10 w-10 rounded-full mx-auto' : 'px-4 py-3 text-xs font-extrabold text-red-600 dark:text-red-300 gap-2'
              }`}
              title="Sign out"
            >
              <LogOut size={15} className="shrink-0" />
              {!isCollapsed && <span>Sign out</span>}
            </button>
          </div>

        </aside>

        {/* ─── MAIN CONTENT AREA ────────────────────────────────────────────── */}
        {children}

        {/* ─── MOBILE BOTTOM NAV ────────────────────────────────────────────── */}
        <div className="md:hidden fixed bottom-0 left-0 w-full px-4 pb-6 pt-2 z-50 pointer-events-none">
          <div className="flex flex-col items-end gap-4 w-full">
            <nav className="w-full bg-[#1C1D21] dark:bg-[#131B2E] rounded-[32px] px-6 py-4 flex items-center justify-between shadow-2xl border border-slate-800/40 pointer-events-auto">
              <MobileNavItem icon={<Home size={20} />} label="Home" href="/dashboard" active={pathname === '/dashboard'} />
              <MobileNavItem icon={<Bell size={20} />} label="Alerts" href="/dashboard/notifications" active={pathname === '/dashboard/notifications'} />
              <MobileNavItem icon={<Settings size={20} />} label="Settings" href="/dashboard/settings" active={pathname === '/dashboard/settings'} />
              
              {isAdmin && (
                <MobileNavItem icon={<Shield size={20} />} label="Admin" href="/dashboard/admin/users" active={pathname?.includes('/admin/')} />
              )}
            </nav>
          </div>
        </div>

      </div>
    </ProtectedRoute>
  );
}

// ─── HELPER COMPONENTS ────────────────────────────────────────────────────────

function NavItem({ 
  icon, 
  label, 
  active = false, 
  badge, 
  href, 
  collapsed = false 
}: { 
  icon: React.ReactNode; 
  label: string; 
  active?: boolean; 
  badge?: number; 
  href: string; 
  collapsed?: boolean;
}) {
  const className = `w-full flex items-center justify-between rounded-2xl transition-all relative ${
    collapsed ? 'px-0 py-3.5 justify-center' : 'px-4 py-3.5'
  } ${
    active 
      ? 'bg-[#F2F3F5] dark:bg-[#1E293B] text-[#F57B36] font-extrabold shadow-sm' 
      : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white font-semibold'
  }`;

  return (
    <Link href={href} className={className} title={collapsed ? label : undefined}>
      {collapsed ? (
        <div className={`shrink-0 ${active ? 'text-[#F57B36]' : 'text-slate-400 dark:text-slate-500'} flex items-center justify-center`}>
          {icon}
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <div className={`shrink-0 ${active ? 'text-[#F57B36]' : 'text-slate-400 dark:text-slate-500'}`}>
            {icon}
          </div>
          <span className="text-[13px]">{label}</span>
        </div>
      )}
      {!collapsed && badge !== undefined && badge > 0 && (
        <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm">
          {badge}
        </span>
      )}
      {collapsed && badge !== undefined && badge > 0 && (
        <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-white dark:border-[#131B2E]" />
      )}
    </Link>
  );
}

function MobileNavItem({ 
  icon, 
  label, 
  active = false, 
  href 
}: { 
  icon: React.ReactNode; 
  label: string; 
  active?: boolean; 
  href: string; 
}) {
  const className = `flex flex-col items-center gap-1.5 transition-colors ${
    active ? 'text-[#F57B36]' : 'text-slate-400 hover:text-slate-300'
  }`;

  return (
    <Link href={href} className={className}>
      {icon}
      <span className="text-[9px] font-bold">{label}</span>
    </Link>
  );
}
