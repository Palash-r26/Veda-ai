'use client';

import { useState, useEffect } from 'react';
import AssignmentForm from '../../components/AssignmentForm';
import ProtectedRoute from '../../components/ProtectedRoute';
import { useAuthStore } from '../../store/useAuthStore';
import { Plus, FileText, Clock, LogOut } from 'lucide-react';
import Link from 'next/link';

interface Assignment {
  _id: string;
  dueDate: string;
  questionTypes: string[];
  numberOfQuestions: number;
  totalMarks: number;
  status: string;
}

export default function DashboardPage() {
  const [showForm, setShowForm] = useState(false);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const { user, logout, token } = useAuthStore();

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
  }, [token, showForm]); // refetch when returning from form

  return (
    <ProtectedRoute>
      <main className="relative flex min-h-screen flex-col items-center justify-center p-4 md:p-8 bg-[#F8FAFC] text-gray-900 overflow-hidden">
        
        {/* ── Background Decoration ── */}
        <div className="absolute top-[-10%] left-[-5%] w-[400px] md:w-[600px] h-[400px] md:h-[600px] bg-[#4BC36D]/20 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[400px] md:w-[600px] h-[400px] md:h-[600px] bg-blue-400/20 blur-[120px] rounded-full pointer-events-none" />
        
        {/* ── Main Responsive Card ── */}
        <div className="w-full max-w-[1103px] bg-white rounded-3xl shadow-xl overflow-hidden min-h-[700px] relative z-10 border border-gray-100 flex flex-col">
          
          {showForm ? (
            <AssignmentForm onCancel={() => setShowForm(false)} />
          ) : (
            <div className="flex flex-col h-full">
              {/* Dashboard Header */}
              <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-white/50 backdrop-blur-sm">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Welcome, {user?.name}</h1>
                  <p className="text-gray-500 text-sm">Manage your AI assessments</p>
                </div>
                <div className="flex gap-4">
                  <button
                    onClick={() => setShowForm(true)}
                    className="bg-[#4BC36D] text-white px-6 py-2.5 rounded-full flex items-center gap-2 font-bold text-[14px] shadow-sm hover:bg-[#3ea85c] transition-colors"
                  >
                    <Plus size={18} strokeWidth={2.5} />
                    New Assignment
                  </button>
                  <button
                    onClick={logout}
                    className="p-2.5 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <LogOut size={20} />
                  </button>
                </div>
              </div>

              {/* Assignment List */}
              <div className="flex-1 p-8 overflow-y-auto">
                {assignments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full mt-10">
                    <div className="w-48 h-48 bg-slate-50 rounded-full mb-8 flex items-center justify-center border border-slate-100">
                      <div className="w-24 h-24 bg-white rounded-2xl rotate-12 flex items-center justify-center shadow-lg border border-gray-50">
                        <span className="text-4xl -rotate-12">📝</span>
                      </div>
                    </div>
                    <h2 className="text-xl font-bold mb-2 text-gray-800">No Assignments Yet</h2>
                    <p className="text-gray-500 mb-6">Create your first AI-generated question paper.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {assignments.map(assignment => (
                      <Link 
                        href={`/output/${assignment._id}`} 
                        key={assignment._id}
                        className="border border-gray-100 rounded-2xl p-6 hover:shadow-lg transition-shadow bg-white flex flex-col group cursor-pointer"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div className={`px-3 py-1 text-xs font-bold rounded-full ${
                            assignment.status === 'completed' ? 'bg-green-100 text-green-700' :
                            assignment.status === 'failed' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                          }`}>
                            {assignment.status.toUpperCase()}
                          </div>
                          <FileText size={20} className="text-gray-300 group-hover:text-[#4BC36D] transition-colors" />
                        </div>
                        <h3 className="font-bold text-gray-900 text-lg mb-1 truncate">
                          {assignment.totalMarks} Marks Assignment
                        </h3>
                        <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                          {assignment.questionTypes.join(', ')}
                        </p>
                        <div className="mt-auto flex items-center gap-2 text-xs text-gray-400 font-medium pt-4 border-t border-gray-50">
                          <Clock size={14} />
                          Due: {new Date(assignment.dueDate).toLocaleDateString()}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </ProtectedRoute>
  );
}
