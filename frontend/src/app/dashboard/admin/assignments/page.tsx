'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '../../../../store/useAuthStore';
import toast from 'react-hot-toast';
import { API_URL } from '../../../../lib/api';
import { 
  FileText, 
  Search, 
  Trash2, 
  Loader2, 
  ArrowLeft,
  Calendar,
  Layers,
  GraduationCap,
  BookOpen,
  Eye,
  Plus,
  X
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AssignmentForm from '../../../../components/AssignmentForm';

interface AssignmentRecord {
  _id: string;
  title: string;
  dueDate: string;
  createdAt: string;
  subject?: string;
  grade?: string;
  numberOfQuestions: number;
  totalMarks: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  creator: {
    name: string;
    email: string;
  };
}

export default function AdminAssignmentsPage() {
  const router = useRouter();
  const { token } = useAuthStore();
  const [assignments, setAssignments] = useState<AssignmentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Search & Filter States
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'processing' | 'completed' | 'failed'>('all');

  useEffect(() => {
    fetchAssignments();
  }, [token]);

  const fetchAssignments = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/assignments`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setAssignments(data.assignments);
      } else {
        toast.error(data.error || 'Failed to fetch assignments');
      }
    } catch (err) {
      toast.error('Error connecting to database servers');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAssignment = async (item: AssignmentRecord) => {
    if (!confirm(`Are you absolutely sure you want to delete assignment "${item.title || 'Untitled'}"?\nThis action cannot be undone.`)) {
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/assignments/${item._id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();

      if (data.success) {
        toast.success(`Deleted assignment "${item.title}"`);
        setAssignments(assignments.filter(a => a._id !== item._id));
      } else {
        toast.error(data.error || 'Failed to delete assignment');
      }
    } catch (err) {
      toast.error('Network error during deletion');
    }
  };

  // Filter list
  const filteredAssignments = assignments.filter(a => {
    const titleMatch = (a.title || '').toLowerCase().includes(search.toLowerCase());
    const creatorMatch = (a.creator?.name || '').toLowerCase().includes(search.toLowerCase()) || 
                         (a.creator?.email || '').toLowerCase().includes(search.toLowerCase());
    const matchesSearch = titleMatch || creatorMatch;
    
    const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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
            <FileText size={16} />
            <span className="text-slate-500 dark:text-slate-400 font-extrabold text-xs tracking-wider uppercase">Assignment Management</span>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap justify-end">
          <div className="flex items-center gap-2 text-xs font-bold bg-amber-100 dark:bg-amber-500/10 text-amber-600 px-3.5 py-1.5 rounded-full uppercase tracking-wider">
            🛠️ Admin View
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-[#1C1D21] hover:bg-black dark:bg-[#F57B36] dark:hover:bg-[#E15A20] text-white px-4 py-2 rounded-full text-xs font-bold transition-all shadow-sm focus:outline-none"
          >
            <Plus size={14} />
            <span className="hidden sm:inline">New Assignment</span>
          </button>
        </div>
      </header>

      {/* ── Create Assignment Modal Overlay ── */}
      {showForm && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-50 flex items-center justify-center p-4 veda-modal-overlay">
          <div className="bg-white dark:bg-[#111827] rounded-[28px] shadow-[0_30px_80px_rgba(15,23,42,0.35)] w-full max-w-3xl max-h-[90vh] overflow-y-auto relative border border-white/50 dark:border-slate-700/80 overflow-hidden veda-modal-panel">
            <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-[#F57B36] via-amber-400 to-rose-500" />
            <button
              onClick={() => setShowForm(false)}
              className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white/90 dark:bg-slate-900/70 shadow-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-300 transition-colors focus:outline-none"
              title="Close"
            >
              <X size={16} />
            </button>
            <AssignmentForm
              onCancel={() => setShowForm(false)}
              onSuccess={() => {
                setShowForm(false);
                fetchAssignments();
              }}
            />
          </div>
        </div>
      )}

      {/* Content Area */}
      <div className="flex-1 overflow-hidden flex flex-col">
        
        {/* Title */}
        <div className="mb-6 mt-1">
          <h2 className="text-[22px] font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            Global Assignments Registry
          </h2>
          <p className="text-[13px] text-slate-400 dark:text-slate-400 font-medium">
            Monitor, inspect, or remove any AI-generated question paper within the system.
          </p>
        </div>

        {/* Filter bar */}
        <div className="bg-white dark:bg-[#131B2E] border border-slate-200/40 dark:border-slate-800/40 rounded-2xl p-4 shadow-sm mb-6 flex flex-col md:flex-row items-center justify-between gap-4 theme-transition">
          
          {/* Search bar */}
          <div className="flex items-center gap-3 text-slate-400 border border-slate-200 dark:border-slate-800 rounded-full px-4 py-2.5 w-full md:w-80 bg-slate-50 dark:bg-slate-800/50">
            <Search size={16} />
            <input 
              type="text" 
              placeholder="Search by title or teacher..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-transparent border-none outline-none text-xs font-medium w-full text-slate-700 dark:text-slate-200 placeholder-slate-400"
            />
          </div>

          {/* Status filter segmented control */}
          <div className="flex gap-1 bg-slate-100 dark:bg-slate-800/60 p-1 rounded-xl w-full md:w-auto overflow-x-auto no-scrollbar border border-slate-200/10">
            {(['all', 'pending', 'processing', 'completed', 'failed'] as const).map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all focus:outline-none whitespace-nowrap ${
                  statusFilter === s 
                    ? 'bg-white dark:bg-[#131B2E] text-slate-900 dark:text-white shadow-sm' 
                    : 'text-slate-400 dark:text-slate-500 hover:text-slate-650'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

        </div>

        {/* Assignments Table Grid */}
        <div className="flex-1 overflow-y-auto pb-32 no-scrollbar rounded-2xl border border-slate-200/40 dark:border-slate-800/40 bg-white dark:bg-[#131B2E] shadow-sm theme-transition">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="animate-spin text-emerald-500 mb-2" size={32} />
              <span className="text-xs font-bold text-slate-400">Loading assignments registry...</span>
            </div>
          ) : filteredAssignments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <span className="text-3xl mb-3">📄</span>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">No assignments found</h3>
              <p className="text-xs text-slate-400 max-w-xs leading-relaxed font-medium mt-1">
                Try modifying your query or selecting a different status filter check.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider bg-slate-50/50 dark:bg-slate-800/20">
                    <th className="py-4 px-6">Assignment Info</th>
                    <th className="py-4 px-6">Created By</th>
                    <th className="py-4 px-6">Subject & Grade</th>
                    <th className="py-4 px-6">Details</th>
                    <th className="py-4 px-6">Status</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs font-bold">
                  {filteredAssignments.map((item) => (
                    <tr key={item._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                      
                      <td className="py-4 px-6 max-w-[200px]">
                        <p className="text-slate-950 dark:text-slate-100 font-extrabold truncate" title={item.title}>
                          {item.title || 'Untitled Assessment'}
                        </p>
                        <div className="flex items-center gap-1.5 text-[9px] text-slate-400 mt-1 font-medium">
                          <Calendar size={11} className="text-slate-300" />
                          <span>Due: {new Date(item.dueDate).toLocaleDateString('en-GB').replace(/\//g, '-')}</span>
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        <p className="text-slate-800 dark:text-slate-200">{item.creator?.name || 'Unknown'}</p>
                        <p className="text-[9px] text-slate-400 font-medium truncate max-w-[140px]">{item.creator?.email || 'N/A'}</p>
                      </td>

                      <td className="py-4 px-6">
                        <div className="flex items-center gap-1.5">
                          <BookOpen size={13} className="text-emerald-500/80" />
                          <span>{item.subject || 'English'}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[9px] text-slate-400 mt-1 font-medium">
                          <GraduationCap size={11} className="text-slate-300" />
                          <span>{item.grade || 'Class 10'}</span>
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                          <Layers size={13} className="text-slate-300" />
                          <span>{item.numberOfQuestions} Qs ({item.totalMarks} Marks)</span>
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider ${
                          item.status === 'completed' 
                            ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                            : item.status === 'failed' 
                              ? 'bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400'
                              : item.status === 'processing'
                                ? 'bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
                                : 'bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400'
                        }`}>
                          {item.status}
                        </span>
                      </td>

                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {item.status === 'completed' && (
                            <Link
                              href={`/dashboard/output/${item._id}?admin=1`}
                              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-450 hover:text-slate-900 dark:hover:text-white transition-colors"
                              title="Inspect Paper"
                            >
                              <Eye size={13} />
                            </Link>
                          )}
                          <button
                            onClick={() => handleDeleteAssignment(item)}
                            className="p-2.5 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg text-red-500 hover:text-red-600 transition-colors focus:outline-none font-extrabold"
                            title="Delete Assignment"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

    </main>
  );
}
