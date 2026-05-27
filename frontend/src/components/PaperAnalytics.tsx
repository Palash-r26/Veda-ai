'use client';

import React from 'react';
import { Clock, Zap } from 'lucide-react';

interface PaperAnalyticsProps {
  sections: any[];
  tokens?: number;
  durationMs?: number;
}

export default function PaperAnalytics({ sections, tokens, durationMs }: PaperAnalyticsProps) {
  // Aggregate stats
  let totalMarks = 0;
  let easyMarks = 0;
  let moderateMarks = 0;
  let hardMarks = 0;
  let totalQuestions = 0;

  sections.forEach((section) => {
    section.questions.forEach((q: any) => {
      totalQuestions += 1;
      totalMarks += q.marks;
      if (q.difficulty === 'Easy') easyMarks += q.marks;
      else if (q.difficulty === 'Moderate') moderateMarks += q.marks;
      else if (q.difficulty === 'Hard') hardMarks += q.marks;
    });
  });

  // Calculate percentages
  const easyPct = totalMarks > 0 ? (easyMarks / totalMarks) * 100 : 0;
  const modPct = totalMarks > 0 ? (moderateMarks / totalMarks) * 100 : 0;
  const hardPct = totalMarks > 0 ? (hardMarks / totalMarks) * 100 : 0;

  // Estimate completion time
  // Easy: 1.5 min/mark, Moderate: 2.5 min/mark, Hard: 4 min/mark
  const estTimeMinutes = Math.round(easyMarks * 1.5 + moderateMarks * 2.5 + hardMarks * 4.0);

  return (
    <div className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6 no-print">
      <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
        
        {/* Left: Difficulty Distribution */}
        <div className="flex-1 w-full max-w-md">
          <div className="flex justify-between items-end mb-2">
            <span className="text-sm font-semibold text-gray-700">Difficulty Distribution</span>
            <span className="text-xs text-gray-500 font-medium">{totalQuestions} questions</span>
          </div>
          
          <div className="w-full flex h-3 bg-gray-100 rounded-full overflow-hidden">
            {easyPct > 0 && <div className="bg-emerald-400 h-full transition-all" style={{ width: `${easyPct}%` }} title={`Easy: ${easyPct.toFixed(0)}%`} />}
            {modPct > 0 && <div className="bg-amber-400 h-full transition-all" style={{ width: `${modPct}%` }} title={`Moderate: ${modPct.toFixed(0)}%`} />}
            {hardPct > 0 && <div className="bg-red-400 h-full transition-all" style={{ width: `${hardPct}%` }} title={`Hard: ${hardPct.toFixed(0)}%`} />}
          </div>
          
          <div className="flex gap-4 mt-2.5">
            <div className="flex items-center gap-1.5 text-xs font-medium text-gray-600">
              <span className="w-2 h-2 rounded-full bg-emerald-400" /> Easy ({easyPct.toFixed(0)}%)
            </div>
            <div className="flex items-center gap-1.5 text-xs font-medium text-gray-600">
              <span className="w-2 h-2 rounded-full bg-amber-400" /> Med ({modPct.toFixed(0)}%)
            </div>
            <div className="flex items-center gap-1.5 text-xs font-medium text-gray-600">
              <span className="w-2 h-2 rounded-full bg-red-400" /> Hard ({hardPct.toFixed(0)}%)
            </div>
          </div>
        </div>

        {/* Right: Meta Info */}
        <div className="flex flex-col md:items-end gap-3 w-full md:w-auto shrink-0 border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-6">
          <div className="flex items-center gap-2 text-gray-800 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
            <Clock size={16} className="text-blue-500" />
            <span className="text-sm font-semibold">Est. Time: {estTimeMinutes} mins</span>
          </div>
          
          {tokens !== undefined && durationMs !== undefined && (
            <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 bg-gray-50/80 px-2.5 py-1 rounded-md border border-gray-100/50">
              <Zap size={13} className="text-purple-500 fill-purple-100" />
              Generated in {(durationMs / 1000).toFixed(1)}s • Used {tokens.toLocaleString()} tokens
            </div>
          )}
        </div>
        
      </div>
    </div>
  );
}
