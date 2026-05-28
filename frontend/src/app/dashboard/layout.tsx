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
  Home
} from 'lucide-react';
import ProtectedRoute from '../../components/ProtectedRoute';
import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [assignmentsCount, setAssignmentsCount] = useState(0);
  const [schoolInfo, setSchoolInfo] = useState({ name: 'Delhi Public School', city: 'Bokaro Steel City' });
  const { token, user, logout } = useAuthStore();

  useEffect(() => {
    if (!token) return;
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    fetch(`${API_URL}/api/assignments`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.assignments) {
          setAssignmentsCount(data.assignments.length);
          const latestWithSchool = data.assignments.find((a: any) => a.schoolName);
          if (latestWithSchool) {
            setSchoolInfo({
              name: latestWithSchool.schoolName,
              city: latestWithSchool.grade || 'Academic Division'
            });
          }
        }
      })
      .catch(console.error);
  }, [token]);

  // Basic determination of active routes for sidebar highlighting
  const isOutputRoute = pathname?.includes('/output/');
  const isDashboardHome = pathname === '/dashboard';

  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-[#EBECEF] p-2 md:p-4 gap-4 overflow-hidden font-sans relative">
        
        {/* ─── LEFT SIDEBAR (Desktop Only) ────────────────────────────────────── */}
        <aside className="hidden md:flex w-[280px] bg-white rounded-3xl shadow-sm flex-col overflow-hidden shrink-0 z-30">
          
          {/* Logo Area */}
          <div className="px-6 py-8 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#2A2B32] flex items-center justify-center text-white font-bold text-xl shadow-md">
              V
            </div>
            <span className="text-xl font-extrabold text-gray-900 tracking-tight">VedaAI</span>
          </div>

          {/* Create Button (AI Teacher's Toolkit from mockup) */}
          <div className="px-5 mb-8">
            <button
              onClick={() => toast.success('Assessment creation starts from the Assignments page')}
              className="w-full bg-[#2A2B32] hover:bg-black text-white rounded-2xl py-3.5 px-4 flex items-center justify-center gap-2 font-bold text-sm shadow-[0_0_0_2px_rgba(255,255,255,1),0_0_0_4px_rgba(42,43,50,0.3)] transition-all"
            >
              <Sparkles size={16} className="text-white" />
              Create Assessment
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 space-y-1">
            <NavItem icon={<LayoutGrid size={18} />} label="Home" active={!isOutputRoute} href="/dashboard" />
            <NavItem icon={<Users size={18} />} label="My Groups" onClick={() => toast('My Groups is coming soon')} />
            <NavItem icon={<FileText size={18} />} label="Assignments" active={isOutputRoute} badge={assignmentsCount} href="/dashboard" />
            <NavItem icon={<Smartphone size={18} />} label="AI Toolkit" onClick={() => toast('AI Toolkit is coming soon')} />
            <NavItem icon={<Library size={18} />} label="My Library" onClick={() => toast('My Library is coming soon')} />
          </nav>

          {/* Footer Area */}
          <div className="px-3 pb-5">
            <div className="mb-2">
              <NavItem icon={<Settings size={18} />} label="Settings" onClick={() => toast('Settings is coming soon')} />
            </div>
            <div className="p-4 bg-[#F5F6F8] rounded-2xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-xl overflow-hidden border border-green-200">
                🏫
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate">{schoolInfo.name}</p>
                <p className="text-xs text-gray-500 truncate">{schoolInfo.city}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                logout();
                toast.success('Signed out');
                router.push('/login');
              }}
              className="mt-3 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-50 hover:text-gray-900"
            >
              Sign out{user?.name ? `, ${user.name}` : ''}
            </button>
          </div>
        </aside>

        {/* ─── MAIN CONTENT AREA ────────────────────────────────────────────── */}
        {children}

        {/* ─── MOBILE BOTTOM NAV ────────────────────────────────────────────── */}
        <div className="md:hidden fixed bottom-0 left-0 w-full px-4 pb-6 pt-2 z-50 pointer-events-none">
          <div className="flex flex-col items-end gap-4 w-full">
            <nav className="w-full bg-[#1C1D21] rounded-[32px] px-6 py-4 flex items-center justify-between shadow-xl pointer-events-auto">
              <MobileNavItem icon={<Home size={20} />} label="Home" href="/dashboard" active={!isOutputRoute} />
              <MobileNavItem icon={<Users size={20} />} label="My Groups" onClick={() => toast('My Groups is coming soon')} />
              <MobileNavItem icon={<Library size={20} />} label="Library" onClick={() => toast('My Library is coming soon')} />
              <MobileNavItem icon={<Sparkles size={20} />} label="AI Toolkit" onClick={() => toast('AI Toolkit is coming soon')} />
            </nav>
          </div>
        </div>

      </div>
    </ProtectedRoute>
  );
}

// ─── HELPER COMPONENTS ────────────────────────────────────────────────────────

function NavItem({ icon, label, active = false, badge, href, onClick }: { icon: React.ReactNode; label: string; active?: boolean; badge?: number; href?: string; onClick?: () => void }) {
  const className = `w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all ${
    active 
      ? 'bg-[#F2F3F5] text-gray-900 font-bold' 
      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900 font-semibold'
  }`;

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={className}>
        <div className="flex items-center gap-3">
          <div className={`${active ? 'text-gray-900' : 'text-gray-400'}`}>
            {icon}
          </div>
          <span className="text-[14px]">{label}</span>
        </div>
        {badge !== undefined && badge > 0 && (
          <span className="bg-red-500 text-white text-[11px] font-bold px-2 py-0.5 rounded-full">
            {badge}
          </span>
        )}
      </button>
    );
  }

  return (
    <Link href={href || '/dashboard'} className={className}>
      <div className="flex items-center gap-3">
        <div className={`${active ? 'text-gray-900' : 'text-gray-400'}`}>
          {icon}
        </div>
        <span className="text-[14px]">{label}</span>
      </div>
      {badge !== undefined && badge > 0 && (
        <span className="bg-red-500 text-white text-[11px] font-bold px-2 py-0.5 rounded-full">
          {badge}
        </span>
      )}
    </Link>
  );
}

function MobileNavItem({ icon, label, active = false, href, onClick }: { icon: React.ReactNode; label: string; active?: boolean; href?: string; onClick?: () => void }) {
  const className = `flex flex-col items-center gap-1.5 transition-colors ${
    active ? 'text-white' : 'text-gray-500 hover:text-gray-300'
  }`;

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={className}>
        {icon}
        <span className="text-[10px] font-medium">{label}</span>
      </button>
    );
  }

  return (
    <Link href={href || '/dashboard'} className={className}>
      {icon}
      <span className="text-[10px] font-medium">{label}</span>
    </Link>
  );
}
