'use client';

import { useState, useRef } from 'react';
import { useAssignmentStore } from '../store/useAssignmentStore';
import { ArrowLeft, Loader2, Paperclip, X, UploadCloud, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/useAuthStore';

const QUESTION_TYPE_OPTIONS = ['Multiple Choice', 'Short Answer', 'Long Answer', 'True/False'];
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function AssignmentForm({ onCancel }: { onCancel: () => void }) {
  const { status, setJobStatus, progressMessage, progressStep, errorMessage } = useAssignmentStore();
  const { token } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Stepper state
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);

  const [formData, setFormData] = useState({
    dueDate: '',
    questionTypes: [] as string[],
    numberOfQuestions: 5,
    totalMarks: 50,
    instructions: '',
  });
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);

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

  // ── Form submission ────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.dueDate) { toast.error('Please select a due date.'); return; }
    if (formData.questionTypes.length === 0) { toast.error('Select at least one question type.'); return; }
    if (formData.numberOfQuestions < 1) { toast.error('Number of questions must be at least 1.'); return; }
    if (formData.totalMarks < 1) { toast.error('Total marks must be at least 1.'); return; }

    if (!token) { toast.error('Authentication required.'); return; }

    try {
      setJobStatus('pending', '', '');

      const body = new FormData();
      body.append('dueDate', formData.dueDate);
      body.append('questionTypes', JSON.stringify(formData.questionTypes));
      body.append('numberOfQuestions', String(formData.numberOfQuestions));
      body.append('totalMarks', String(formData.totalMarks));
      body.append('instructions', formData.instructions);
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
        <Loader2 className="animate-spin mb-6 text-[#4BC36D]" size={56} strokeWidth={2.5} />
        <h2 className="text-[26px] font-bold text-gray-900 mb-2">Crafting your Assessment</h2>
        
        <div className="w-full max-w-sm bg-gray-100 rounded-full h-2 mt-8 mb-4 overflow-hidden">
          <div 
            className="bg-[#4BC36D] h-2 rounded-full transition-all duration-500 ease-out" 
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

  // ── Stepper UI Component ───────────────────────────────────────────────────
  const renderStepper = () => (
    <div className="flex items-center gap-4 mb-8">
      <div className="flex items-center gap-2">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${currentStep === 1 ? 'bg-[#4BC36D] text-white' : 'bg-[#4BC36D]/20 text-[#4BC36D]'}`}>
          {currentStep > 1 ? <Check size={16} strokeWidth={3} /> : '1'}
        </div>
        <span className={`font-semibold text-sm ${currentStep === 1 ? 'text-gray-900' : 'text-gray-500'}`}>Upload</span>
      </div>
      
      <div className={`h-[2px] w-12 rounded-full ${currentStep > 1 ? 'bg-[#4BC36D]/50' : 'bg-gray-200'}`} />
      
      <div className="flex items-center gap-2">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${currentStep === 2 ? 'bg-[#4BC36D] text-white' : 'bg-gray-100 text-gray-400'}`}>
          2
        </div>
        <span className={`font-semibold text-sm ${currentStep === 2 ? 'text-gray-900' : 'text-gray-400'}`}>Configure</span>
      </div>
    </div>
  );

  // ── Form Steps ─────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full bg-white relative p-6 md:p-10 lg:p-12">
      {/* Header */}
      <div className="flex items-center mb-8 gap-4 border-b border-gray-100 pb-6">
        <button onClick={onCancel} className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors">
          <ArrowLeft size={24} className="text-gray-900" />
        </button>
        <div>
          <h1 className="text-[24px] md:text-[28px] font-bold text-gray-900 tracking-tight leading-tight">Create Assignment</h1>
          <p className="text-gray-500 text-sm mt-1">Configure your AI-powered question paper</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto w-full max-w-2xl mx-auto no-scrollbar">
        {renderStepper()}

        <form id="assignment-form" onSubmit={handleSubmit} className="flex flex-col gap-8 pb-10">
          
          {currentStep === 1 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300 ease-out flex flex-col h-full min-h-[350px]">
              <div className="flex flex-col gap-3 mb-6">
                <h3 className="text-xl font-bold text-gray-900">Upload Source Material</h3>
                <p className="text-gray-500 text-[15px]">The AI will strictly base the questions on the content of this file. If skipped, questions will be generated based on general knowledge.</p>
              </div>

              {uploadedFile ? (
                <div className="flex items-center gap-4 p-6 bg-gray-50 rounded-3xl border border-gray-200 mt-2">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm shrink-0">
                    <Paperclip size={20} className="text-[#4BC36D]" />
                  </div>
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="text-[15px] font-bold text-gray-900 truncate">
                      {uploadedFile.name}
                    </span>
                    <span className="text-sm text-gray-500">
                      {(uploadedFile.size / 1024).toFixed(0)} KB
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setUploadedFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                    className="p-2.5 rounded-full hover:bg-gray-200 text-gray-500 hover:text-red-500 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
              ) : (
                <div
                  onDrop={handleDrop}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onClick={() => fileInputRef.current?.click()}
                  className={`flex flex-col items-center justify-center gap-3 p-12 border-2 border-dashed rounded-[32px] cursor-pointer transition-all flex-1 min-h-[250px]
                    ${dragOver ? 'border-[#4BC36D] bg-[#4BC36D]/5' : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100'}`}
                >
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-2 ${dragOver ? 'bg-[#4BC36D]/10 text-[#4BC36D]' : 'bg-white text-gray-400 shadow-sm'}`}>
                    <UploadCloud size={28} />
                  </div>
                  <p className="text-[16px] font-semibold text-gray-700">
                    Drag & drop your file here
                  </p>
                  <p className="text-[14px] text-gray-500">
                    or <span className="text-[#4BC36D] font-medium hover:underline">browse files</span>
                  </p>
                  <p className="text-[12px] text-gray-400 mt-4 px-4 py-1.5 bg-white rounded-full border border-gray-100 shadow-sm">
                    PDF, TXT, PNG, JPG (Max 10MB)
                  </p>
                </div>
              )}

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

              <div className="mt-auto pt-8 flex justify-end">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-900 px-8 py-3.5 rounded-full font-bold text-[15px] transition-colors flex items-center gap-2"
                >
                  Continue to Configuration
                </button>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300 ease-out flex flex-col gap-7">
              {/* ── Due Date ── */}
              <div className="flex flex-col gap-2.5">
                <label className="font-semibold text-[15px] text-gray-900">Due Date <span className="text-red-500">*</span></label>
                <input
                  type="date"
                  value={formData.dueDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                  className="w-full border border-gray-200 bg-white rounded-full px-5 py-3.5 text-[15px] focus:outline-none focus:border-[#4BC36D] focus:ring-1 focus:ring-[#4BC36D] transition-all font-medium text-gray-800"
                  required
                />
              </div>

              {/* ── Question Types ── */}
              <div className="flex flex-col gap-2.5">
                <label className="font-semibold text-[15px] text-gray-900">Question Types <span className="text-red-500">*</span></label>
                <div className="flex flex-wrap gap-2.5">
                  {QUESTION_TYPE_OPTIONS.map(type => {
                    const isSelected = formData.questionTypes.includes(type);
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => {
                          const types = isSelected
                            ? formData.questionTypes.filter(t => t !== type)
                            : [...formData.questionTypes, type];
                          setFormData({ ...formData, questionTypes: types });
                        }}
                        className={`px-5 py-2.5 rounded-full text-[14px] font-semibold transition-all border ${
                          isSelected
                            ? 'bg-[#4BC36D]/10 text-[#4BC36D] border-[#4BC36D]'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {type}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ── Number of Questions + Total Marks ── */}
              <div className="flex flex-col sm:flex-row gap-5">
                <div className="flex flex-col gap-2.5 flex-1">
                  <label className="font-semibold text-[15px] text-gray-900">Total Questions <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={formData.numberOfQuestions}
                    onChange={e => setFormData({ ...formData, numberOfQuestions: parseInt(e.target.value) || 1 })}
                    className="w-full border border-gray-200 bg-white rounded-full px-5 py-3.5 text-[15px] focus:outline-none focus:border-[#4BC36D] focus:ring-1 focus:ring-[#4BC36D] transition-all font-medium text-gray-800"
                    required
                  />
                </div>
                <div className="flex flex-col gap-2.5 flex-1">
                  <label className="font-semibold text-[15px] text-gray-900">Total Marks <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    min="1"
                    max="500"
                    value={formData.totalMarks}
                    onChange={e => setFormData({ ...formData, totalMarks: parseInt(e.target.value) || 1 })}
                    className="w-full border border-gray-200 bg-white rounded-full px-5 py-3.5 text-[15px] focus:outline-none focus:border-[#4BC36D] focus:ring-1 focus:ring-[#4BC36D] transition-all font-medium text-gray-800"
                    required
                  />
                </div>
              </div>

              {/* ── Additional Instructions ── */}
              <div className="flex flex-col gap-2.5">
                <label className="font-semibold text-[15px] text-gray-900">Additional Instructions</label>
                <textarea
                  value={formData.instructions}
                  onChange={e => setFormData({ ...formData, instructions: e.target.value })}
                  className="w-full border border-gray-200 bg-white rounded-[24px] p-5 text-[15px] h-32 resize-none focus:outline-none focus:border-[#4BC36D] focus:ring-1 focus:ring-[#4BC36D] transition-all font-medium placeholder-gray-400 text-gray-800"
                  placeholder="e.g. Focus on chapter 4, include diagrams, avoid repetition…"
                />
              </div>

              {/* ── Actions ── */}
              <div className="mt-4 pt-6 border-t border-gray-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="text-gray-500 hover:text-gray-900 font-semibold text-[15px] px-2 py-2 transition-colors"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={['pending', 'processing'].includes(status)}
                  className="bg-[#4BC36D] disabled:opacity-50 text-white px-8 py-3.5 rounded-full font-bold text-[15px] shadow-[0_4px_14px_rgba(75,195,109,0.4)] hover:bg-[#3ea85c] active:scale-[0.98] transition-all"
                >
                  Generate Assignment
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
