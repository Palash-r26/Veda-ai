'use client';

import { useState, useRef, useMemo } from 'react';
import { useAssignmentStore } from '../store/useAssignmentStore';
import { ArrowLeft, Loader2, Paperclip, X, UploadCloud, Plus, Minus, Calendar, Mic, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/useAuthStore';

const QUESTION_TYPE_OPTIONS = ['Multiple Choice Questions', 'Short Questions', 'Long Questions', 'Diagram/Graph-Based Questions', 'Numerical Problems', 'True/False'];
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface QuestionConfig {
  id: string;
  type: string;
  count: number;
  marks: number;
}

export default function AssignmentForm({ onCancel }: { onCancel: () => void }) {
  const { status, setJobStatus, progressMessage, progressStep, errorMessage } = useAssignmentStore();
  const { token } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    title: '',
    dueDate: '',
    instructions: '',
    schoolName: '',
    subject: '',
    grade: '',
    timeAllowed: '',
  });

  const [questionsConfig, setQuestionsConfig] = useState<QuestionConfig[]>([
    { id: '1', type: 'Multiple Choice Questions', count: 4, marks: 1 },
    { id: '2', type: 'Short Questions', count: 3, marks: 2 },
    { id: '3', type: 'Diagram/Graph-Based Questions', count: 5, marks: 5 },
    { id: '4', type: 'Numerical Problems', count: 5, marks: 5 },
  ]);

  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);

  // Compute totals automatically
  const totalQuestions = useMemo(() => questionsConfig.reduce((acc, q) => acc + q.count, 0), [questionsConfig]);
  const totalMarks = useMemo(() => questionsConfig.reduce((acc, q) => acc + (q.count * q.marks), 0), [questionsConfig]);

  // ── File handling ──────────────────────────────────────────────────────────
  const acceptFile = (file: File) => {
    const allowed = ['application/pdf', 'text/plain', 'image/png', 'image/jpeg', 'image/jpg'];
    if (!allowed.includes(file.type)) {
      toast.error('Only PDF, TXT, PNG, or JPG files are allowed.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File must be under 10 MB.');
      return;
    }
    setUploadedFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) acceptFile(file);
  };

  // ── Dynamic Question Handlers ──────────────────────────────────────────────
  const handleAddQuestionType = () => {
    setQuestionsConfig([...questionsConfig, { id: Math.random().toString(36).substring(7), type: 'Short Questions', count: 1, marks: 1 }]);
  };

  const handleRemoveQuestionType = (id: string) => {
    setQuestionsConfig(questionsConfig.filter(q => q.id !== id));
  };

  const updateQuestionConfig = (id: string, field: keyof QuestionConfig, value: any) => {
    setQuestionsConfig(questionsConfig.map(q => q.id === id ? { ...q, [field]: value } : q));
  };

  const incrementCount = (id: string) => {
    const q = questionsConfig.find(q => q.id === id);
    if (q && q.count < 50) updateQuestionConfig(id, 'count', q.count + 1);
  };

  const decrementCount = (id: string) => {
    const q = questionsConfig.find(q => q.id === id);
    if (q && q.count > 1) updateQuestionConfig(id, 'count', q.count - 1);
  };

  const incrementMarks = (id: string) => {
    const q = questionsConfig.find(q => q.id === id);
    if (q && q.marks < 50) updateQuestionConfig(id, 'marks', q.marks + 1);
  };

  const decrementMarks = (id: string) => {
    const q = questionsConfig.find(q => q.id === id);
    if (q && q.marks > 1) updateQuestionConfig(id, 'marks', q.marks - 1);
  };

  // ── Form submission ────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    // Validation
    if (!formData.title.trim()) { toast.error('Please enter an assignment title.'); return; }
    if (!formData.dueDate) { toast.error('Please select a due date.'); return; }
    if (questionsConfig.length === 0) { toast.error('Add at least one question type.'); return; }

    if (!token) { toast.error('Authentication required.'); return; }

    try {
      setJobStatus('pending', '', '');

      const body = new FormData();
      body.append('title', formData.title);
      body.append('dueDate', formData.dueDate);
      body.append('questionsConfig', JSON.stringify(questionsConfig.map(q => ({ type: q.type, count: q.count, marks: q.marks }))));
      body.append('instructions', formData.instructions);
      body.append('schoolName', formData.schoolName);
      body.append('subject', formData.subject);
      body.append('grade', formData.grade);
      body.append('timeAllowed', formData.timeAllowed);
      if (uploadedFile) body.append('file', uploadedFile);

      const res = await fetch(`${API_URL}/api/assignments`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body,
      });

      const data = await res.json();
      if (data.success) {
        setJobStatus('processing', data.jobId, data.assignment._id);
        toast.success('Assignment created. Generating paper...');
      } else {
        setJobStatus('failed', '', '');
        toast.error(data.error || 'Failed to generate assignment.');
      }
    } catch (err) {
      console.error(err);
      setJobStatus('failed', '', '');
      toast.error('Network error — is the backend running?');
    }
  };

  // ── Loading/Processing state ───────────────────────────────────────────────
  if (status === 'pending' || status === 'processing') {
    return (
      <div className="flex flex-col items-center justify-center h-full p-12 text-center bg-white rounded-3xl w-full">
        <Loader2 className="animate-spin mb-6 text-green-500" size={56} strokeWidth={2.5} />
        <h2 className="text-[26px] font-bold text-gray-900 mb-2">Crafting your Assessment</h2>
        
        <div className="w-full max-w-sm bg-gray-100 rounded-full h-2 mt-8 mb-4 overflow-hidden">
          <div 
            className="bg-green-500 h-2 rounded-full transition-all duration-500 ease-out" 
            style={{ width: `${progressStep}%` }}
          />
        </div>
        
        <p className="text-gray-500 font-medium text-[15px] animate-pulse">
          {progressMessage || 'Initializing AI engine...'}
        </p>
      </div>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────────
  if (status === 'failed') {
    return (
      <div className="flex flex-col items-center justify-center h-full p-12 text-center bg-white rounded-3xl w-full">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6">
          <X size={32} strokeWidth={2.5} />
        </div>
        <h2 className="text-[26px] font-bold text-gray-900 mb-3">Generation Failed</h2>
        <p className="text-gray-500 text-[16px] leading-relaxed max-w-md mb-8">
          {errorMessage || 'Something went wrong while generating the paper. Please try again.'}
        </p>
        <button 
          onClick={() => setJobStatus('idle', '', '')} 
          className="bg-gray-100 text-gray-900 px-8 py-3.5 rounded-full font-semibold hover:bg-gray-200 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#EBECEF] relative overflow-hidden">
      
      {/* ── Topbar (Desktop Only, matches dashboard style) ── */}
      <header className="hidden md:flex flex-none bg-[#EBECEF] h-[72px] items-center justify-between px-6 shrink-0">
        <button onClick={onCancel} className="flex items-center gap-3 text-gray-500 hover:text-gray-900 transition-colors">
          <ArrowLeft size={20} />
          <span className="font-semibold text-[15px]">Assignment</span>
        </button>
      </header>

      {/* ── Main Scrollable Area ── */}
      <div className="flex-1 overflow-y-auto px-2 md:px-6 pb-32 no-scrollbar relative">
        <div className="max-w-4xl mx-auto pt-2 md:pt-4">
          
          {/* Header */}
          <div className="mb-6">
            {/* Desktop Header */}
            <div className="hidden md:block">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-3 h-3 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                <h2 className="text-[24px] font-extrabold text-gray-900 tracking-tight">Create Assignment</h2>
              </div>
              <p className="text-[13px] text-gray-500 font-medium ml-6">Set up a new assignment for your students</p>
            </div>
            
            {/* Mobile Header */}
            <div className="md:hidden flex items-center justify-between relative h-10 px-2 mt-2">
              <button onClick={onCancel} className="w-10 h-10 bg-gray-200/80 rounded-full flex items-center justify-center text-gray-800 absolute left-2 hover:bg-gray-300 transition-colors">
                <ArrowLeft size={20} />
              </button>
              <h2 className="text-[16px] font-extrabold text-gray-900 tracking-tight w-full text-center">Create Assignment</h2>
            </div>
          </div>

          {/* Progress Bar (half filled) */}
          <div className="flex items-center w-full max-w-2xl mx-auto mb-6 md:mb-10 mt-4 md:mt-6 gap-2 px-4 md:px-0">
            <div className="h-1 flex-1 bg-gray-500 rounded-full"></div>
            <div className="h-1 flex-1 bg-gray-200 rounded-full"></div>
          </div>

          {/* ── Main Form Card ── */}
          <div className="bg-[#F5F5F5] rounded-[32px] p-5 md:p-10 shadow-sm border border-gray-100/50">
            
            <div className="mb-6 md:mb-8">
              <h3 className="text-[18px] font-extrabold text-gray-900 mb-1">Assignment Details</h3>
              <p className="text-[13px] text-gray-500 font-medium">Basic information about your assignment</p>
            </div>

            {/* Assignment Title */}
            <div className="mb-6">
              <input
                type="text"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                placeholder="Assignment Title (e.g. Quiz on Electricity)"
                className="w-full bg-transparent border-b-2 border-gray-200 px-2 py-3 text-[16px] focus:outline-none focus:border-gray-900 transition-all font-bold text-gray-900 placeholder-gray-400"
              />
            </div>

            {/* Academic Details Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div>
                <label className="block text-[13px] font-bold text-gray-900 mb-2">School Name</label>
                <input
                  type="text"
                  value={formData.schoolName}
                  onChange={e => setFormData({ ...formData, schoolName: e.target.value })}
                  placeholder="Delhi Public School (Default)"
                  className="w-full bg-white border border-gray-200 rounded-full px-5 py-3.5 text-[14px] font-semibold text-gray-800 placeholder-gray-400 focus:outline-none focus:border-gray-400 transition-all"
                />
              </div>
              <div>
                <label className="block text-[13px] font-bold text-gray-900 mb-2">Subject</label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={e => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="English (Default)"
                  className="w-full bg-white border border-gray-200 rounded-full px-5 py-3.5 text-[14px] font-semibold text-gray-800 placeholder-gray-400 focus:outline-none focus:border-gray-400 transition-all"
                />
              </div>
              <div>
                <label className="block text-[13px] font-bold text-gray-900 mb-2">Class / Grade</label>
                <input
                  type="text"
                  value={formData.grade}
                  onChange={e => setFormData({ ...formData, grade: e.target.value })}
                  placeholder="Class 10 (Default)"
                  className="w-full bg-white border border-gray-200 rounded-full px-5 py-3.5 text-[14px] font-semibold text-gray-800 placeholder-gray-400 focus:outline-none focus:border-gray-400 transition-all"
                />
              </div>
              <div>
                <label className="block text-[13px] font-bold text-gray-900 mb-2">Time Allowed</label>
                <input
                  type="text"
                  value={formData.timeAllowed}
                  onChange={e => setFormData({ ...formData, timeAllowed: e.target.value })}
                  placeholder="3 Hours (Default)"
                  className="w-full bg-white border border-gray-200 rounded-full px-5 py-3.5 text-[14px] font-semibold text-gray-800 placeholder-gray-400 focus:outline-none focus:border-gray-400 transition-all"
                />
              </div>
            </div>

            {/* Upload Area */}
            <div className="mb-8">
              <div
                onDrop={handleDrop}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                className={`flex flex-col items-center justify-center py-8 md:py-12 border-2 border-dashed rounded-[28px] bg-white transition-all
                  ${dragOver ? 'border-gray-400 bg-gray-50' : 'border-gray-200 hover:border-gray-300'}`}
              >
                {uploadedFile ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                      <Paperclip size={20} className="text-gray-900" />
                    </div>
                    <span className="font-bold text-gray-900 text-center px-4 break-all">{uploadedFile.name}</span>
                    <button type="button" onClick={() => setUploadedFile(null)} className="text-red-500 text-sm font-semibold hover:underline">Remove</button>
                  </div>
                ) : (
                  <>
                    <UploadCloud size={32} className="text-gray-900 mb-3 md:mb-4" />
                    <p className="text-[14px] md:text-[15px] font-bold text-gray-900 mb-1">
                      Choose a file or drag & drop it here
                    </p>
                    <p className="text-[12px] text-gray-400 mb-5 md:mb-6 font-medium">
                      JPEG, PNG, upto 10MB
                    </p>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-gray-50 hover:bg-gray-100 text-gray-900 px-6 py-2.5 rounded-full text-[13px] font-bold border border-gray-200 transition-colors"
                    >
                      Browse Files
                    </button>
                  </>
                )}
              </div>
              <p className="text-center text-[12px] md:text-[13px] text-gray-500 mt-3 font-medium">Upload images of your preferred document/image</p>
              
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.txt,.png,.jpg,.jpeg"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) acceptFile(file);
                }}
              />
            </div>

            {/* Due Date */}
            <div className="mb-10">
              <label className="block text-[14px] font-bold text-gray-900 mb-3">Due Date</label>
              <div className="relative">
                <input
                  type="date"
                  value={formData.dueDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                  className="w-full border border-gray-200 bg-transparent rounded-full px-5 py-3.5 text-[14px] focus:outline-none focus:border-gray-400 transition-all font-medium text-gray-800"
                />
                {!formData.dueDate && <Calendar size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />}
              </div>
            </div>

            {/* Questions Configuration */}
            <div className="mb-10">
              <div className="hidden md:flex items-center justify-between mb-4 px-2">
                <span className="text-[14px] font-bold text-gray-900">Question Type</span>
                <div className="flex items-center gap-16 mr-2">
                  <span className="text-[14px] font-bold text-gray-900 text-center w-24">No. of Questions</span>
                  <span className="text-[14px] font-bold text-gray-900 text-center w-24">Marks</span>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                {questionsConfig.map((q) => (
                  <div key={q.id} className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4 bg-white md:bg-transparent p-4 md:p-0 rounded-[28px] md:rounded-none shadow-sm md:shadow-none border border-gray-100 md:border-none">
                    
                    {/* Dropdown Container */}
                    <div className="flex items-center gap-3 flex-1">
                      <div className="relative flex-1">
                        <select
                          value={q.type}
                          onChange={(e) => updateQuestionConfig(q.id, 'type', e.target.value)}
                          className="w-full appearance-none bg-transparent md:bg-white border-none md:border border-gray-100 rounded-full px-2 md:px-6 py-2 md:py-3.5 text-[14px] font-semibold md:font-bold text-gray-800 focus:outline-none md:shadow-sm cursor-pointer"
                        >
                          {QUESTION_TYPE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                        <ChevronDown size={16} className="absolute right-2 md:right-5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      </div>
                      <button type="button" onClick={() => handleRemoveQuestionType(q.id)} className="text-gray-400 hover:text-red-500 p-1 md:p-2 shrink-0 transition-colors">
                        <X size={18} />
                      </button>
                    </div>

                    {/* Steppers Container */}
                    <div className="flex items-center justify-between md:justify-start gap-4 md:gap-16 bg-gray-50 md:bg-transparent rounded-2xl md:rounded-none p-3 md:p-0">
                      
                      {/* Count Stepper */}
                      <div className="flex flex-col items-center gap-2 flex-1 md:flex-none">
                        <span className="md:hidden text-[11px] font-semibold text-gray-500">No. of Questions</span>
                        <div className="flex items-center justify-between bg-white border border-gray-100 rounded-full px-4 py-2 w-full md:w-28 shadow-sm">
                          <button type="button" onClick={() => decrementCount(q.id)} className="text-gray-400 hover:text-gray-900"><Minus size={14} strokeWidth={3} /></button>
                          <span className="text-[14px] font-bold text-gray-900">{q.count}</span>
                          <button type="button" onClick={() => incrementCount(q.id)} className="text-gray-400 hover:text-gray-900"><Plus size={14} strokeWidth={3} /></button>
                        </div>
                      </div>

                      {/* Marks Stepper */}
                      <div className="flex flex-col items-center gap-2 flex-1 md:flex-none">
                        <span className="md:hidden text-[11px] font-semibold text-gray-500">Marks</span>
                        <div className="flex items-center justify-between bg-white border border-gray-100 rounded-full px-4 py-2 w-full md:w-28 shadow-sm">
                          <button type="button" onClick={() => decrementMarks(q.id)} className="text-gray-400 hover:text-gray-900"><Minus size={14} strokeWidth={3} /></button>
                          <span className="text-[14px] font-bold text-gray-900">{q.marks}</span>
                          <button type="button" onClick={() => incrementMarks(q.id)} className="text-gray-400 hover:text-gray-900"><Plus size={14} strokeWidth={3} /></button>
                        </div>
                      </div>

                    </div>
                  </div>
                ))}
              </div>

              <button 
                type="button"
                onClick={handleAddQuestionType}
                className="mt-6 flex items-center gap-2 text-[13px] font-extrabold text-gray-900 hover:opacity-70 transition-opacity ml-2"
              >
                <div className="w-6 h-6 bg-gray-900 text-white rounded-full flex items-center justify-center">
                  <Plus size={14} strokeWidth={3} />
                </div>
                Add Question Type
              </button>

              {/* Totals Box */}
              <div className="mt-8 flex flex-col items-end gap-1 px-4">
                <div className="text-[14px] font-medium text-gray-900">Total Questions : <span className="font-bold">{totalQuestions}</span></div>
                <div className="text-[14px] font-medium text-gray-900">Total Marks : <span className="font-bold">{totalMarks}</span></div>
              </div>
            </div>

            {/* Additional Information Textarea */}
            <div>
              <label className="block text-[14px] font-bold text-gray-900 mb-3">Additional Information (For better output)</label>
              <div className="relative">
                <textarea
                  value={formData.instructions}
                  onChange={e => setFormData({ ...formData, instructions: e.target.value })}
                  className="w-full bg-white/60 border border-gray-200 border-dashed rounded-3xl p-5 md:p-6 text-[14px] h-32 resize-none focus:outline-none focus:border-gray-400 transition-all font-medium placeholder-gray-400 text-gray-800"
                  placeholder="e.g Generate a question paper for 3 hour exam duration..."
                />
                <button type="button" className="absolute bottom-6 right-6 text-gray-900 hover:opacity-70 p-1">
                  <Mic size={20} />
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ── Fixed Bottom Actions ── */}
      <div className="absolute bottom-[80px] md:bottom-0 left-0 w-full bg-gradient-to-t from-[#EBECEF] via-[#EBECEF] to-transparent pt-12 pb-6 px-4 md:px-12 flex items-center justify-center md:justify-between gap-4 z-10 pointer-events-none">
        <button
          type="button"
          onClick={onCancel}
          className="pointer-events-auto bg-white hover:bg-gray-50 text-gray-900 px-6 md:px-8 py-3.5 rounded-full font-bold text-[14px] shadow-sm flex items-center gap-2 transition-transform hover:scale-105 border border-gray-200"
        >
          <ArrowLeft size={16} strokeWidth={2.5} />
          Previous
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={['pending', 'processing'].includes(status)}
          className="pointer-events-auto bg-[#1C1D21] hover:bg-black text-white px-6 md:px-8 py-3.5 rounded-full font-bold text-[14px] shadow-xl flex items-center gap-2 transition-transform hover:scale-105 disabled:opacity-50"
        >
          Next
          <ArrowLeft size={16} strokeWidth={2.5} className="rotate-180" />
        </button>
      </div>

    </div>
  );
}
