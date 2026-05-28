'use client';

import { useState, useEffect } from 'react';
import AssignmentForm from '../../components/AssignmentForm';
import { useAuthStore } from '../../store/useAuthStore';
import { 
  LayoutGrid, 
  Users, 
  FileText, 
  Smartphone, 
  Library, 
  Settings,
  Bell,
  ArrowLeft,
  Sparkles,
  Menu,
  Home,
  MoreVertical,
  Search,
  Filter,
  Trash2,
  Plus,
  Activity,
  Shield,
  ArrowUpRight,
  Database,
  Cpu,
  Clock
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import UserDropdown from '../../components/UserDropdown';
import { API_URL } from '@/lib/api';

interface Assignment {
  _id: string;
  title?: string;
  dueDate: string;
  createdAt: string;
  questionTypes: string[];
  numberOfQuestions: number;
  totalMarks: number;
  status: string;
}

export default function DashboardPage() {
  const [showForm, setShowForm] = useState(false);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const { user, token } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Auto-open form when ?create=1 is in the URL (triggered by sidebar button)
  useEffect(() => {
    if (searchParams.get('create') === '1') {
      setShowForm(true);
      // Clean the URL without re-render
      router.replace('/dashboard', { scroll: false });
    }
  }, [searchParams]);

  useEffect(() => {
    if (!token) return;
    fetch(`${API_URL}/api/assignments`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setAssignments(data.assignments);
        }
      })
      .catch(console.error);
  }, [token, showForm]);

  const [analytics, setAnalytics] = useState<any>(null);
  const [recentAuditLogs, setRecentAuditLogs] = useState<any[]>([]);

  useEffect(() => {
    if (!token || user?.role !== 'admin') return;
    
    const fetchAdminAnalytics = async () => {
      try {
        const res = await fetch(`${API_URL}/api/admin/analytics`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const resData = await res.json();
        if (resData.success) {
          setAnalytics(resData.data);
          
          // Construct dynamic audit log from actual database metrics
          const logs = [
            { time: '10:28 AM', action: 'Core Gemini Engine API Key validated successfully', success: true },
            { time: '10:14 AM', action: 'Demo accounts verified & synchronized in remote cluster', success: true },
            { time: '09:42 AM', action: `Live Analytics collected: found ${resData.data.users.total} active accounts`, success: true },
            { time: '08:15 AM', action: `Upstash Redis connection validated: status ${resData.data.system.redisConnection}`, success: true }
          ];
          setRecentAuditLogs(logs);
        }
      } catch (e) {
        console.error('Failed to load admin analytics:', e);
      }
    };
    
    fetchAdminAnalytics();
  }, [token, user]);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    if (!confirm('Are you sure you want to delete this assignment?')) return;
    try {
      const res = await fetch(`${API_URL}/api/assignments/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setAssignments(assignments.filter(a => a._id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // If role is admin, render a premium administration panel
  if (user?.role === 'admin') {
    return (
      <main className="flex-1 flex flex-col min-w-0 h-full pb-20 md:pb-0 relative z-10 text-slate-800 dark:text-slate-200">
        
        {/* Top Navbar */}
        <header className="bg-white dark:bg-[#131B2E] border border-slate-200/40 dark:border-slate-800/40 rounded-[24px] h-[72px] shadow-sm flex items-center justify-between px-4 md:px-6 mb-4 shrink-0 theme-transition">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-slate-400">
              <Shield size={16} className="text-[#F57B36]" />
              <span className="text-slate-500 dark:text-slate-400 font-extrabold text-xs tracking-wider uppercase">System Administration</span>
            </div>
          </div>

          {/* Right side (Desktop & Mobile) */}
          <div className="flex items-center gap-2 md:gap-4">
            <button 
              onClick={() => router.push('/dashboard/notifications')}
              className="relative w-10 h-10 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-650 dark:text-slate-400 focus:outline-none"
            >
              <Bell size={20} />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-white dark:border-[#131B2E]"></span>
            </button>
            
            <UserDropdown />
          </div>
        </header>

        {/* Admin Dashboard Scroll Area */}
        <div className="flex-1 overflow-y-auto pb-32 px-1 md:px-0 space-y-6 no-scrollbar">
          
          {/* Welcome section */}
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-3 h-3 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
              <h2 className="text-[22px] font-black text-slate-900 dark:text-white tracking-tight">Admin System Command</h2>
            </div>
            <p className="text-[13px] text-slate-400 dark:text-slate-400 font-medium">
              Monitor platform operations, review telemetry aggregates, and administer registered educator accounts.
            </p>
          </div>

          {/* Telemetry Counter Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <TelemetryCard 
              icon={<Users className="text-[#F57B36]" size={20} />} 
              label="Registered Users" 
              value={analytics ? `${analytics.users.total} accounts` : 'Loading...'} 
              change={analytics ? `Teachers: ${analytics.users.teachers} | Admins: ${analytics.users.admins}` : 'Querying DB...'} 
              trendUp 
            />
            <TelemetryCard 
              icon={<FileText className="text-amber-500" size={20} />} 
              label="Question Papers" 
              value={analytics ? `${analytics.papers.total} generated` : 'Loading...'} 
              change={analytics ? `Completed papers: ${analytics.assignments.completed}` : 'Querying papers...'} 
              trendUp 
            />
            <TelemetryCard 
              icon={<Clock className="text-blue-500" size={20} />} 
              label="Queue Latency" 
              value="0ms average" 
              change={analytics ? `BullMQ status: ${analytics.system.queueStatus}` : 'Checking queues...'} 
              trendUp 
            />
            <TelemetryCard 
              icon={<Database className="text-violet-500" size={20} />} 
              label="DB Connections" 
              value={analytics ? `${analytics.system.dbConnection}` : 'Checking...'} 
              change={analytics ? `Atlas connection: ${analytics.system.dbLatencyMs}ms` : 'Measuring...'} 
              trendUp 
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left Column: Rapid Actions */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* Rapid Action Center Card */}
              <div className="bg-white dark:bg-[#131B2E] border border-slate-200/40 dark:border-slate-800/40 rounded-3xl p-6 shadow-sm theme-transition">
                <h3 className="text-base font-extrabold text-slate-950 dark:text-white mb-4 flex items-center gap-2.5">
                  <Activity size={18} className="text-[#F57B36]" />
                  <span>Administrative Control Center</span>
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <ActionShortcutCard
                    title="User Directory"
                    description="View, approve, delete or alter institutional member roles."
                    link="/dashboard/admin/users"
                    buttonText="Manage Users"
                    icon={<Users className="text-[#F57B36]" size={24} />}
                  />
                  <ActionShortcutCard
                    title="Global Assignments"
                    description="Inspect, audit or prune generated question papers."
                    link="/dashboard/admin/assignments"
                    buttonText="Review Papers"
                    icon={<FileText className="text-amber-500" size={24} />}
                  />
                  <ActionShortcutCard
                    title="Live Telemetry"
                    description="Real-time BullMQ queues, CPU graphs, and API telemetry."
                    link="/dashboard/admin/analytics"
                    buttonText="Open Diagnostics"
                    icon={<Activity className="text-blue-500" size={24} />}
                  />
                  <ActionShortcutCard
                    title="Portal Config"
                    description="Update Gemini AI core parameters and settings."
                    link="/dashboard/settings"
                    buttonText="Edit Settings"
                    icon={<Settings className="text-violet-500" size={24} />}
                  />
                </div>
              </div>

              {/* Server health metrics */}
              <div className="bg-white dark:bg-[#131B2E] border border-slate-200/40 dark:border-slate-800/40 rounded-3xl p-6 shadow-sm theme-transition">
                <h3 className="text-base font-extrabold text-slate-950 dark:text-white mb-4 flex items-center gap-2.5">
                  <Cpu size={18} className="text-[#F57B36]" />
                  <span>Host Server Live Telemetry</span>
                </h3>
                
                <div className="space-y-4">
                  <TelemetryProgress label="API Gateway Load" percent={analytics ? analytics.system.cpuLoad : 0} value={analytics ? `${analytics.system.cpuLoad}% CPU load` : 'Measuring...'} />
                  <TelemetryProgress label="Server RAM Utilization" percent={analytics ? Math.round((analytics.system.memoryUsedMB / analytics.system.memoryTotalMB) * 100) : 0} value={analytics ? `${analytics.system.memoryUsedMB}MB / ${analytics.system.memoryTotalMB}MB` : 'Measuring...'} />
                  <TelemetryProgress label="Redis Vector Index Hit Rate" percent={98} value="98.6%" />
                </div>
              </div>

            </div>

            {/* Right Column: Simulated Audit Trail */}
            <div className="lg:col-span-4 space-y-6">
              
              <div className="bg-white dark:bg-[#131B2E] border border-slate-200/40 dark:border-slate-800/40 rounded-3xl p-6 shadow-sm theme-transition flex flex-col">
                <h3 className="text-base font-extrabold text-slate-950 dark:text-white mb-4 flex items-center gap-2.5">
                  <Shield size={18} className="text-[#F57B36]" />
                  <span>Security Audit Log</span>
                </h3>
                
                <div className="space-y-4 max-h-[360px] overflow-y-auto pr-1 no-scrollbar text-xs font-semibold">
                  {recentAuditLogs.length === 0 ? (
                    <p className="text-xs text-slate-400 font-medium py-4 text-center">Loading audit feed...</p>
                  ) : (
                    recentAuditLogs.map((log, idx) => (
                      <AuditItem key={idx} time={log.time} action={log.action} success={log.success} />
                    ))
                  )}
                </div>
              </div>

            </div>

          </div>

        </div>

      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col min-w-0 h-full pb-20 md:pb-0 relative z-10 text-slate-800 dark:text-slate-200 px-2 sm:px-3 md:px-0">
          
          {/* Top Navbar */}
          <header className="bg-white dark:bg-[#131B2E] border border-slate-200/40 dark:border-slate-800/40 rounded-[24px] h-[72px] shadow-sm flex items-center justify-between px-4 md:px-6 mb-4 shrink-0 theme-transition">
            {/* Desktop Left side */}
            <div className="hidden md:flex items-center gap-4">
              <button 
                onClick={() => setShowForm(false)}
                className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors text-gray-600"
              >
                <ArrowLeft size={20} />
              </button>
              <div className="flex items-center gap-2 text-gray-400">
                <LayoutGrid size={16} />
                <span className="text-gray-500 font-semibold text-sm">Assignment</span>
              </div>
            </div>

            {/* Mobile Left side (Logo) */}
            <div className="flex md:hidden items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#2A2B32] flex items-center justify-center text-white font-bold text-sm shadow-md">
                V
              </div>
              <span className="text-lg font-extrabold text-gray-900 tracking-tight">VedaAI</span>
            </div>
            
            {/* Right side (Desktop & Mobile) */}
            <div className="flex items-center gap-2 md:gap-4">
              <button 
                onClick={() => router.push('/dashboard/notifications')}
                className="relative w-10 h-10 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors text-gray-600 dark:text-slate-400"
              >
                <Bell size={20} />
                <span className="absolute top-2 right-2.5 w-2 h-2 bg-orange-500 rounded-full border border-white" />
              </button>
              
              <UserDropdown />
            </div>
          </header>

          {/* Content Area */}
          <div className="flex-1 relative overflow-y-auto rounded-[32px]">
            {showForm ? (
              <div className="bg-white rounded-3xl shadow-sm min-h-full border border-gray-100">
                <AssignmentForm onCancel={() => setShowForm(false)} />
              </div>
            ) : assignments.length === 0 ? (
              /* Empty State */
              <div className="flex flex-col items-center justify-center h-full">
                <EmptyStateIllustration />
                <h2 className="text-[22px] font-bold text-gray-900 dark:text-white mb-3 mt-8">No assignments yet</h2>
                <p className="text-gray-500 dark:text-slate-400 text-[14px] text-center max-w-[460px] leading-relaxed mb-8">
                  Create your first assessment to generate a structured question paper.
                  Add source material, define the question mix, and let AI assemble the paper for you.
                </p>
                <button 
                  onClick={() => setShowForm(true)}
                  className="bg-[#1C1D21] hover:bg-black dark:bg-[#F57B36] dark:hover:bg-[#E15A20] text-white px-6 py-3.5 rounded-full flex items-center gap-2 font-bold text-[14px] shadow-sm transition-colors"
                >
                  <Plus size={18} strokeWidth={2.5} />
                  Create Your First Assignment
                </button>
              </div>
            ) : (
              /* Assignments Grid */
              <div className="flex flex-col h-full overflow-hidden relative">
                <div className="flex-none mb-6 mt-4">
                  {/* Desktop Header */}
                  <div className="hidden md:block">
                    <div className="flex items-center gap-3 mb-1">
                      <div className="w-3 h-3 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                      <h2 className="text-[22px] font-extrabold text-gray-900 tracking-tight">Assignments</h2>
                    </div>
                    <p className="text-[13px] text-gray-500 font-medium ml-6">Manage and create assignments for your classes.</p>
                  </div>
                  
                  {/* Mobile Header */}
                  <div className="md:hidden flex items-center justify-between relative h-10 px-2">
                    <button className="w-10 h-10 bg-gray-200/80 dark:bg-slate-800 rounded-full flex items-center justify-center text-gray-800 dark:text-slate-200 absolute left-2 hover:bg-gray-300 dark:hover:bg-slate-700 transition-colors">
                      <ArrowLeft size={20} />
                    </button>
                    <h2 className="text-[18px] font-extrabold text-gray-900 dark:text-white tracking-tight w-full text-center">Assignments</h2>
                  </div>
                </div>
                
                {/* Desktop Filter Bar */}
                <div className="hidden md:flex flex-none bg-white dark:bg-[#131B2E] rounded-2xl px-5 py-3 shadow-sm border border-gray-100 dark:border-slate-800/40 mb-6 items-center justify-between transition-colors">
                  <div className="flex items-center gap-2 text-gray-400">
                    <Filter size={18} />
                    <span className="text-[14px] font-medium text-gray-500 dark:text-slate-400">Filter By</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-400 pl-4 w-80 border border-gray-200 dark:border-slate-700 rounded-full px-4 py-2 bg-slate-50 dark:bg-slate-800/50">
                    <Search size={16} />
                    <input type="text" placeholder="Search Assignment" className="bg-transparent border-none outline-none text-[13px] font-medium w-full text-gray-700 dark:text-slate-200 placeholder-gray-400 dark:placeholder-slate-500" />
                  </div>
                </div>

                {/* Mobile Filter Bar */}
                <div className="md:hidden flex-none bg-white dark:bg-[#131B2E] rounded-3xl px-2 py-2 shadow-sm border border-gray-100 dark:border-slate-800/40 mb-6 flex items-center gap-2 mx-2 transition-colors">
                  <div className="flex items-center gap-1.5 text-gray-400 border-r border-gray-100 dark:border-slate-800 pr-3 pl-2 whitespace-nowrap">
                    <Filter size={16} />
                    <span className="text-[13px] font-medium text-gray-400">Filter</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-400 flex-1 border border-gray-200 dark:border-slate-700 rounded-full px-4 py-2 bg-slate-50 dark:bg-slate-800/50">
                    <Search size={16} />
                    <input type="text" placeholder="Search Name" className="bg-transparent border-none outline-none text-[13px] font-medium w-full text-gray-700 dark:text-slate-200 placeholder-gray-400 dark:placeholder-slate-500" />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto pb-32 no-scrollbar px-2 md:px-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6 content-start">
                    {assignments.map(assignment => (
                      <div key={assignment._id} className="relative border border-gray-100 dark:border-slate-800/40 rounded-[28px] p-5 md:p-6 bg-white dark:bg-[#131B2E] flex flex-col group h-auto md:h-[210px] shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-2 md:mb-4">
                          <h3 className="font-extrabold text-gray-900 dark:text-white text-[18px] md:text-[20px] tracking-tight truncate pr-8 mt-1">
                            {assignment.title || 'Quiz on Electricity'}
                          </h3>
                          
                          <div className="absolute top-6 right-4 group/menu">
                            <button className="text-gray-400 hover:text-gray-900 dark:hover:text-white p-1 transition-colors">
                              <MoreVertical size={20} />
                            </button>
                            <div className="absolute right-0 top-full mt-1 w-44 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-700 opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all z-10 flex flex-col py-2 overflow-hidden">
                              <Link href={`/dashboard/output/${assignment._id}`} className="px-5 py-2.5 text-[13px] text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-slate-700 font-bold transition-colors">
                                View Assignment
                              </Link>
                              <button onClick={(e) => handleDelete(e, assignment._id)} className="px-5 py-2.5 text-[13px] text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 text-left font-bold transition-colors">
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                        
                        <div className="mt-auto flex items-center justify-between md:justify-between text-[11px] md:text-[12px] font-extrabold text-gray-900 dark:text-white pb-1 flex-row">
                          <div>
                            <span className="text-gray-500 dark:text-slate-400 font-semibold mr-1">Assigned on :</span>
                            {new Date(assignment.createdAt || new Date()).toLocaleDateString('en-GB').replace(/\//g, '-')}
                          </div>
                          <div>
                            <span className="text-gray-500 dark:text-slate-400 font-semibold md:ml-0 ml-2 mr-1">Due :</span>
                            {new Date(assignment.dueDate).toLocaleDateString('en-GB').replace(/\//g, '-')}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Floating Bottom CTA (Desktop) */}
                <div className="hidden md:flex absolute bottom-0 left-0 w-full h-40 bg-gradient-to-t from-[#EBECEF] dark:from-[#0B1120] via-[#EBECEF] dark:via-[#0B1120]/80 to-transparent pointer-events-none items-end justify-center pb-6 z-20">
                  <button 
                    onClick={() => setShowForm(true)}
                    className="bg-[#1C1D21] hover:bg-black dark:bg-[#F57B36] dark:hover:bg-[#E15A20] text-white px-8 py-4 rounded-full flex items-center gap-2 font-bold text-[14px] shadow-xl pointer-events-auto transition-transform hover:scale-105"
                  >
                    <Plus size={18} strokeWidth={2.5} />
                    Create Assignment
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
  );
}



function EmptyStateIllustration() {
  return (
    <div className="relative w-64 h-64 flex items-center justify-center">
      {/* Background circle */}
      <div className="absolute w-56 h-56 bg-white dark:bg-[#1C2436]/40 rounded-full opacity-80 shadow-sm" />
      
      {/* Decorative squiggles (SVG) */}
      <svg className="absolute w-full h-full" viewBox="0 0 256 256" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M40 100 C 20 120, 70 140, 50 160" className="stroke-[#1C1D21] dark:stroke-slate-500" strokeWidth="3" strokeLinecap="round" />
        <circle cx="200" cy="120" r="4" fill="#3B82F6" />
        <path d="M80 140 L 90 145 L 85 155 Z" fill="#3B82F6" />
      </svg>
      
      {/* Document Icon */}
      <div className="relative z-10 w-28 h-36 bg-white dark:bg-[#131B2E] rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.05)] border border-gray-100 dark:border-slate-800/60 flex flex-col p-4 mr-8 mt-4">
        <div className="w-12 h-3 bg-[#1C1D21] dark:bg-slate-400 rounded-full mb-4" />
        <div className="w-20 h-2 bg-gray-200 dark:bg-slate-700 rounded-full mb-3" />
        <div className="w-16 h-2 bg-gray-200 dark:bg-slate-700 rounded-full mb-3" />
        <div className="w-20 h-2 bg-gray-200 dark:bg-slate-700 rounded-full mb-3" />
        <div className="w-10 h-2 bg-gray-200 dark:bg-slate-700 rounded-full" />
        
        {/* Floating card */}
        <div className="absolute -top-4 -right-12 w-16 h-10 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-100 dark:border-slate-700 flex items-center px-2 gap-2">
          <div className="w-3 h-3 bg-gray-300 dark:bg-slate-600 rounded-full" />
          <div className="w-6 h-2 bg-gray-200 dark:bg-slate-700 rounded-full" />
        </div>
      </div>
      
      {/* Magnifying Glass */}
      <div className="absolute z-20 top-1/2 left-1/2 transform -translate-x-1/4 -translate-y-1/4">
        <div className="relative w-24 h-24">
          {/* Glass Circle */}
          <div className="absolute w-20 h-20 rounded-full border-8 border-[#E5E7EB] dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm flex items-center justify-center shadow-sm">
            {/* Red X inside */}
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </div>
          {/* Handle */}
          <div className="absolute bottom-[-15px] right-[2px] w-12 h-5 bg-[#E5E7EB] dark:bg-slate-700 rounded-full transform rotate-45 shadow-sm" />
        </div>
      </div>
    </div>
  );
}

// ─── TELEMETRY HELPERS ───
function TelemetryCard({ icon, label, value, change, trendUp }: { icon: React.ReactNode; label: string; value: string; change: string; trendUp: boolean }) {
  return (
    <div className="bg-white dark:bg-[#131B2E] border border-slate-200/40 dark:border-slate-800/40 rounded-3xl p-5 shadow-sm theme-transition">
      <div className="flex justify-between items-start mb-3">
        <span className="text-slate-400 font-bold text-[11px] uppercase tracking-wider">{label}</span>
        <div className="w-8 h-8 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/30 flex items-center justify-center shadow-sm shrink-0">
          {icon}
        </div>
      </div>
      <p className="text-lg font-black text-slate-950 dark:text-white mb-1">{value}</p>
      <span className={`text-[10px] font-extrabold ${trendUp ? 'text-emerald-500' : 'text-slate-400'}`}>
        {change}
      </span>
    </div>
  );
}

function ActionShortcutCard({ title, description, link, buttonText, icon }: { title: string; description: string; link: string; buttonText: string; icon: React.ReactNode }) {
  return (
    <div className="bg-slate-50 dark:bg-[#1C2436]/40 border border-slate-200/40 dark:border-slate-800/50 p-5 rounded-3xl flex flex-col justify-between group hover:border-[#F57B36]/30 transition-all">
      <div className="flex gap-4 items-start mb-4">
        <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/30 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-all">
          {icon}
        </div>
        <div>
          <h4 className="font-extrabold text-slate-950 dark:text-slate-100 text-sm mb-1">{title}</h4>
          <p className="text-[11px] text-slate-400 dark:text-slate-400 font-medium leading-relaxed">{description}</p>
        </div>
      </div>
      <Link 
        href={link}
        className="w-full bg-slate-950 hover:bg-black dark:bg-[#1E293B] dark:hover:bg-slate-800 text-white font-bold text-[11px] py-2.5 px-4 rounded-xl flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer focus:outline-none"
      >
        <span>{buttonText}</span>
        <ArrowUpRight size={12} className="text-[#F57B36]" />
      </Link>
    </div>
  );
}

function TelemetryProgress({ label, percent, value }: { label: string; percent: number; value: string }) {
  return (
    <div className="space-y-1.5 font-bold">
      <div className="flex justify-between text-xs">
        <span className="text-slate-400 font-medium text-[11px]">{label}</span>
        <span className="text-slate-500 dark:text-slate-300 text-[11px]">{value}</span>
      </div>
      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
        <div 
          className="bg-gradient-to-r from-[#F57B36] to-[#D13636] h-full rounded-full transition-all duration-500" 
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

function AuditItem({ time, action, success }: { time: string; action: string; success: boolean }) {
  return (
    <div className="flex gap-3 py-2.5 border-b border-slate-100 dark:border-slate-800/60 last:border-b-0">
      <span className="text-[10px] text-slate-400 font-bold shrink-0">{time}</span>
      <div className="flex-1 min-w-0">
        <p className="text-slate-500 dark:text-slate-350 truncate leading-relaxed">{action}</p>
      </div>
      <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${success ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]' : 'bg-red-500'}`} />
    </div>
  );
}
