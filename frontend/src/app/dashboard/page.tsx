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
  ChevronDown,
  Sparkles,
  Menu,
  Home,
  MoreVertical,
  Search,
  Filter,
  Trash2,
  Plus
} from 'lucide-react';
import Link from 'next/link';

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

  useEffect(() => {
    if (!token) return;
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/assignments`, {
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

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    if (!confirm('Are you sure you want to delete this assignment?')) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/assignments/${id}`, {
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

  return (
    <main className="flex-1 flex flex-col min-w-0 h-full pb-20 md:pb-0 relative z-10">
          
          {/* Top Navbar */}
          <header className="bg-white rounded-[24px] h-[72px] shadow-sm flex items-center justify-between px-4 md:px-6 mb-4 shrink-0">
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
              <button className="relative w-10 h-10 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors text-gray-600">
                <Bell size={20} />
                <span className="absolute top-2 right-2.5 w-2 h-2 bg-orange-500 rounded-full border border-white"></span>
              </button>
              
              <div className="flex items-center gap-2 pl-1 md:pl-2">
                <div className="w-8 h-8 bg-gray-200 rounded-full overflow-hidden flex items-center justify-center text-xl">
                  👨‍🏫
                </div>
                <span className="hidden md:block text-sm font-bold text-gray-900">{user?.name || 'John Doe'}</span>
                <ChevronDown size={16} className="hidden md:block text-gray-500" />
                <button className="md:hidden w-10 h-10 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors text-gray-600 ml-1">
                  <Menu size={24} />
                </button>
              </div>
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
                <h2 className="text-[22px] font-bold text-gray-900 mb-3 mt-8">No assignments yet</h2>
                <p className="text-gray-500 text-[14px] text-center max-w-[460px] leading-relaxed mb-8">
                  Create your first assessment to generate a structured question paper.
                  Add source material, define the question mix, and let AI assemble the paper for you.
                </p>
                <button 
                  onClick={() => setShowForm(true)}
                  className="bg-[#1C1D21] hover:bg-black text-white px-6 py-3.5 rounded-full flex items-center gap-2 font-bold text-[14px] shadow-sm transition-colors"
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
                    <button className="w-10 h-10 bg-gray-200/80 rounded-full flex items-center justify-center text-gray-800 absolute left-2 hover:bg-gray-300 transition-colors">
                      <ArrowLeft size={20} />
                    </button>
                    <h2 className="text-[18px] font-extrabold text-gray-900 tracking-tight w-full text-center">Assignments</h2>
                  </div>
                </div>
                
                {/* Desktop Filter Bar */}
                <div className="hidden md:flex flex-none bg-white rounded-2xl px-5 py-3 shadow-sm border border-gray-100 mb-6 items-center justify-between">
                  <div className="flex items-center gap-2 text-gray-400">
                    <Filter size={18} />
                    <span className="text-[14px] font-medium text-gray-500">Filter By</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-400 pl-4 w-80 border border-gray-200 rounded-full px-4 py-2">
                    <Search size={16} />
                    <input type="text" placeholder="Search Assignment" className="bg-transparent border-none outline-none text-[13px] font-medium w-full text-gray-700 placeholder-gray-400" />
                  </div>
                </div>

                {/* Mobile Filter Bar */}
                <div className="md:hidden flex-none bg-white rounded-3xl px-2 py-2 shadow-sm border border-gray-100 mb-6 flex items-center gap-2 mx-2">
                  <div className="flex items-center gap-1.5 text-gray-400 border-r border-gray-100 pr-3 pl-2 whitespace-nowrap">
                    <Filter size={16} />
                    <span className="text-[13px] font-medium text-gray-400">Filter</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-400 flex-1 border border-gray-200 rounded-full px-4 py-2">
                    <Search size={16} />
                    <input type="text" placeholder="Search Name" className="bg-transparent border-none outline-none text-[13px] font-medium w-full text-gray-700 placeholder-gray-400" />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto pb-32 no-scrollbar px-2 md:px-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6 content-start">
                    {assignments.map(assignment => (
                      <div key={assignment._id} className="relative border border-gray-100 rounded-[28px] p-5 md:p-6 bg-white flex flex-col group h-[140px] md:h-[210px] shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-2 md:mb-4">
                          <h3 className="font-extrabold text-gray-900 text-[18px] md:text-[20px] tracking-tight truncate pr-8 mt-1">
                            {assignment.title || 'Quiz on Electricity'}
                          </h3>
                          
                          <div className="absolute top-6 right-4 group/menu">
                            <button className="text-gray-400 hover:text-gray-900 p-1 transition-colors">
                              <MoreVertical size={20} />
                            </button>
                            <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-2xl shadow-xl border border-gray-100 opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all z-10 flex flex-col py-3">
                              <Link href={`/dashboard/output/${assignment._id}`} className="px-5 py-2.5 text-[13px] text-gray-900 hover:bg-gray-50 font-bold">
                                View Assignment
                              </Link>
                              <button onClick={(e) => handleDelete(e, assignment._id)} className="px-5 py-2.5 text-[13px] text-red-500 hover:bg-red-50 text-left font-bold transition-colors">
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                        
                        <div className="mt-auto flex items-center justify-between md:justify-between text-[11px] md:text-[12px] font-extrabold text-gray-900 pb-1 flex-row">
                          <div>
                            <span className="text-gray-500 font-semibold mr-1">Assigned on :</span>
                            {new Date(assignment.createdAt || new Date()).toLocaleDateString('en-GB').replace(/\//g, '-')}
                          </div>
                          <div>
                            <span className="text-gray-500 font-semibold md:ml-0 ml-2 mr-1">Due :</span>
                            {new Date(assignment.dueDate).toLocaleDateString('en-GB').replace(/\//g, '-')}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Floating Bottom CTA (Desktop) */}
                <div className="hidden md:flex absolute bottom-0 left-0 w-full h-40 bg-gradient-to-t from-[#EBECEF] via-[#EBECEF] to-transparent pointer-events-none items-end justify-center pb-6 z-20">
                  <button 
                    onClick={() => setShowForm(true)}
                    className="bg-[#1C1D21] hover:bg-black text-white px-8 py-4 rounded-full flex items-center gap-2 font-bold text-[14px] shadow-xl pointer-events-auto transition-transform hover:scale-105"
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
      <div className="absolute w-56 h-56 bg-white rounded-full opacity-80 shadow-sm" />
      
      {/* Decorative squiggles (SVG) */}
      <svg className="absolute w-full h-full" viewBox="0 0 256 256" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M40 100 C 20 120, 70 140, 50 160" stroke="#1C1D21" strokeWidth="3" strokeLinecap="round" />
        <circle cx="200" cy="120" r="4" fill="#3B82F6" />
        <path d="M80 140 L 90 145 L 85 155 Z" fill="#3B82F6" />
      </svg>
      
      {/* Document Icon */}
      <div className="relative z-10 w-28 h-36 bg-white rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.05)] border border-gray-100 flex flex-col p-4 mr-8 mt-4">
        <div className="w-12 h-3 bg-[#1C1D21] rounded-full mb-4" />
        <div className="w-20 h-2 bg-gray-200 rounded-full mb-3" />
        <div className="w-16 h-2 bg-gray-200 rounded-full mb-3" />
        <div className="w-20 h-2 bg-gray-200 rounded-full mb-3" />
        <div className="w-10 h-2 bg-gray-200 rounded-full" />
        
        {/* Floating card */}
        <div className="absolute -top-4 -right-12 w-16 h-10 bg-white rounded-lg shadow-sm border border-gray-100 flex items-center px-2 gap-2">
          <div className="w-3 h-3 bg-gray-300 rounded-full" />
          <div className="w-6 h-2 bg-gray-200 rounded-full" />
        </div>
      </div>
      
      {/* Magnifying Glass */}
      <div className="absolute z-20 top-1/2 left-1/2 transform -translate-x-1/4 -translate-y-1/4">
        <div className="relative w-24 h-24">
          {/* Glass Circle */}
          <div className="absolute w-20 h-20 rounded-full border-8 border-[#E5E7EB] bg-white/50 backdrop-blur-sm flex items-center justify-center shadow-sm">
            {/* Red X inside */}
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </div>
          {/* Handle */}
          <div className="absolute bottom-[-15px] right-[2px] w-12 h-5 bg-[#E5E7EB] rounded-full transform rotate-45 shadow-sm" />
        </div>
      </div>
    </div>
  );
}
