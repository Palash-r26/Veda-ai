'use client';

import React, { useState } from 'react';
import { RefreshCw } from 'lucide-react';

interface RegenerateButtonProps {
  paperId: string;
  sectionIndex: number;
  questionIndex: number;
  onSuccess: (sectionIdx: number, questionIdx: number, newQuestion: any) => void;
  onError: (msg: string) => void;
}

export default function RegenerateButton({ paperId, sectionIndex, questionIndex, onSuccess, onError }: RegenerateButtonProps) {
  const [isRegenerating, setIsRegenerating] = useState(false);

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const res = await fetch(`${API_URL}/api/papers/${paperId}/regenerate-question`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sectionIndex, questionIndex }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to regenerate question');
      }

      onSuccess(sectionIndex, questionIndex, data.question);
    } catch (err: any) {
      console.error('Regenerate error:', err);
      onError(err.message || 'Network error');
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <button
      onClick={handleRegenerate}
      disabled={isRegenerating}
      title="Regenerate this question"
      className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-200 rounded-md transition-colors disabled:opacity-50 group"
    >
      <RefreshCw size={16} className={isRegenerating ? 'animate-spin text-gray-900' : 'group-hover:scale-110 transition-transform'} />
    </button>
  );
}
