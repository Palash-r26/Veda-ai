'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '../../../../store/useAuthStore';
import toast from 'react-hot-toast';
import { API_URL } from '../../../../lib/api';
import { 
  Activity, 
  Users, 
  FileText, 
  Cpu, 
  Database, 
  RefreshCw, 
  Loader2, 
  ArrowLeft,
  Server,
  Zap
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface AnalyticsData {
  users: {
    total: number;
    teachers: number;
    admins: number;
  };
  assignments: {
    total: number;
    pending: number;
    processing: number;
    completed: number;
    failed: number;
  };
  papers: {
    total: number;
  };
  system: {
    cpuLoad: number;
    memoryUsedMB: number;
    memoryTotalMB: number;
    dbLatencyMs: number;
    dbConnection: string;
    redisConnection: string;
    queueStatus: string;
    uptime: number;
  };
}

export default function AdminAnalyticsPage() {
  const router = useRouter();
  const { token } = useAuthStore();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);



  useEffect(() => {
    fetchAnalytics();
  }, [token]);

  const fetchAnalytics = async (silent = false) => {
    if (!token) return;
    if (!silent) setLoading(true);
    else setRefreshing(true);

    try {
      const res = await fetch(`${API_URL}/api/admin/analytics`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const resData = await res.json();
      if (resData.success) {
        setData(resData.data);
      } else {
        toast.error(resData.error || 'Failed to fetch analytics');
      }
    } catch (err) {
      toast.error('Error connecting to performance logging tools');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getUptimeString = (uptimeInSeconds: number) => {
    const hours = Math.floor(uptimeInSeconds / 3600);
    const minutes = Math.floor((uptimeInSeconds % 3600) / 60);
    const seconds = uptimeInSeconds % 60;
    return `${hours}h ${minutes}m ${seconds}s`;
  };

  return (
    <main className="flex-1 flex flex-col min-w-0 h-full pb-20 md:pb-0 relative z-10 text-slate-800 dark:text-slate-200 px-2 sm:px-3 md:px-0">
      
      {/* Top Navbar */}
      <header className="bg-white dark:bg-[#131B2E] border border-slate-200/40 dark:border-slate-800/40 rounded-[24px] min-h-[72px] h-auto py-3 md:py-0 shadow-sm flex items-center justify-between px-4 md:px-6 mb-4 shrink-0 theme-transition gap-3 flex-wrap">
        <div className="flex items-center gap-3 md:gap-4 min-w-0">
          <button 
            onClick={() => router.push('/dashboard')}
            className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-600 dark:text-slate-400 focus:outline-none"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex items-center gap-2 text-slate-400">
            <Activity size={16} />
            <span className="text-slate-500 dark:text-slate-400 font-extrabold text-xs tracking-wider uppercase">Live Analytics</span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <button
            onClick={() => fetchAnalytics(true)}
            disabled={loading || refreshing}
            className="px-3.5 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-650 dark:text-slate-300 rounded-full font-bold text-xs flex items-center gap-1.5 transition-colors focus:outline-none disabled:opacity-50"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin text-emerald-500' : ''} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </header>

      {/* Main Grid */}
      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center">
          <Loader2 className="animate-spin text-emerald-500 mb-2" size={32} />
          <span className="text-xs font-bold text-slate-400">Aggregating system diagnostics...</span>
        </div>
      ) : !data ? (
        <div className="flex-1 flex flex-col items-center justify-center py-20 text-center">
          <span className="text-3xl mb-3">⚠️</span>
          <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">Failed to build analytics panel</h3>
          <button onClick={() => fetchAnalytics()} className="mt-4 px-4 py-2 bg-emerald-500 text-white rounded-xl text-xs font-bold">
            Retry Connection
          </button>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto pb-32 no-scrollbar space-y-6">
          
          {/* Title */}
          <div>
            <h2 className="text-[22px] font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              System Dashboard Live Monitor
            </h2>
            <p className="text-[13px] text-slate-400 dark:text-slate-400 font-medium">
              Real-time resource utilization, MongoDB server states, BullMQ queues, and user/paper statistics.
            </p>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <StatWidget 
              icon={<Users className="text-emerald-500" size={20} />}
              label="Active Teachers" 
              value={data.users.teachers} 
              sub={`Total: ${data.users.total} users`}
            />
            <StatWidget 
              icon={<Users className="text-blue-500" size={20} />}
              label="Admin Accounts" 
              value={data.users.admins} 
              sub={`Teachers: ${data.users.teachers}`}
            />
            <StatWidget 
              icon={<FileText className="text-violet-500" size={20} />}
              label="Question Papers" 
              value={data.papers.total} 
              sub={`Assignments: ${data.assignments.total}`}
            />
            <StatWidget 
              icon={<Zap className="text-amber-500" size={20} />}
              label="Active Queue Jobs" 
              value={data.assignments.pending + data.assignments.processing} 
              sub={`Failed: ${data.assignments.failed} papers`}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* System Resources (Left Card) */}
            <div className="lg:col-span-8 bg-white dark:bg-[#131B2E] border border-slate-200/40 dark:border-slate-800/40 rounded-3xl p-6 shadow-sm theme-transition">
              <h3 className="text-base font-extrabold text-slate-950 dark:text-white mb-5 flex items-center gap-2.5">
                <Cpu size={18} className="text-emerald-500" />
                <span>Diagnostics & Server Load</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                {/* CPU usage bar */}
                <div>
                  <div className="flex justify-between text-xs font-bold mb-2">
                    <span className="text-slate-500 dark:text-slate-400">Node Process CPU Load</span>
                    <span className="text-emerald-500">{data.system.cpuLoad}%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                    <div className="bg-emerald-500 h-2 rounded-full transition-all duration-500" style={{ width: `${data.system.cpuLoad}%` }} />
                  </div>
                </div>

                {/* Memory usage bar */}
                <div>
                  <div className="flex justify-between text-xs font-bold mb-2">
                    <span className="text-slate-500 dark:text-slate-400">Heap Utilization</span>
                    <span className="text-blue-500">{data.system.memoryUsedMB} MB / {data.system.memoryTotalMB} MB</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-500" 
                      style={{ width: `${Math.min(100, (data.system.memoryUsedMB / data.system.memoryTotalMB) * 100)}%` }} 
                    />
                  </div>
                </div>
              </div>

              {/* Diagnostic table */}
              <div className="border border-slate-100 dark:border-slate-800/60 rounded-2xl overflow-hidden bg-slate-50/50 dark:bg-slate-800/10 text-xs font-bold">
                <div className="grid grid-cols-2 py-3.5 px-4 border-b border-slate-100 dark:border-slate-800/40">
                  <span className="text-slate-400 font-medium">Server Uptime</span>
                  <span className="text-slate-900 dark:text-white text-right">{getUptimeString(data.system.uptime)}</span>
                </div>
                <div className="grid grid-cols-2 py-3.5 px-4 border-b border-slate-100 dark:border-slate-800/40">
                  <span className="text-slate-400 font-medium">MongoDB Connection Latency</span>
                  <span className="text-slate-900 dark:text-white text-right">{data.system.dbLatencyMs} ms</span>
                </div>
                <div className="grid grid-cols-2 py-3.5 px-4">
                  <span className="text-slate-400 font-medium">Node Environment</span>
                  <span className="text-emerald-500 text-right uppercase">Production (Simulated)</span>
                </div>
              </div>

            </div>

            {/* Service connections status (Right Card) */}
            <div className="lg:col-span-4 bg-white dark:bg-[#131B2E] border border-slate-200/40 dark:border-slate-800/40 rounded-3xl p-6 shadow-sm theme-transition">
              <h3 className="text-base font-extrabold text-slate-950 dark:text-white mb-5 flex items-center gap-2.5">
                <Server size={18} className="text-emerald-500" />
                <span>Service Connections</span>
              </h3>

              <div className="space-y-4">
                <StatusItem label="Local MongoDB Cluster" value={data.system.dbConnection} success />
                <StatusItem label="Upstash Redis Cache" value={data.system.redisConnection} success />
                <StatusItem label="BullMQ Queue Manager" value={data.system.queueStatus} success />
              </div>
            </div>

          </div>

        </div>
      )}

    </main>
  );
}

// ─── HELPERS ───
function StatWidget({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: number | string; sub: string }) {
  return (
    <div className="bg-white dark:bg-[#131B2E] border border-slate-200/40 dark:border-slate-800/40 rounded-3xl p-5 shadow-sm theme-transition flex items-start gap-4">
      <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center shrink-0 border border-slate-100 dark:border-slate-700/30">
        {icon}
      </div>
      <div>
        <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-0.5">{label}</h4>
        <p className="text-2xl font-black text-slate-950 dark:text-white tracking-tight leading-none mb-1">{value}</p>
        <span className="text-[9px] text-slate-400 font-bold">{sub}</span>
      </div>
    </div>
  );
}

function StatusItem({ label, value, success }: { label: string; value: string; success: boolean }) {
  return (
    <div className="flex justify-between items-center py-3 border-b border-slate-100 dark:border-slate-800/60 last:border-b-0">
      <span className="text-slate-400 font-bold text-[11px]">{label}</span>
      <span className={`text-[9px] px-2.5 py-0.5 rounded-full font-black ${
        success ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200/25' : 'bg-red-100 dark:bg-red-500/10 text-red-600'
      }`}>
        {value}
      </span>
    </div>
  );
}
