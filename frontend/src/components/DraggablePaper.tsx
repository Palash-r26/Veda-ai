'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent, DragOverlay, defaultDropAnimationSideEffects } from '@dnd-kit/core';
import { SortableContext, arrayMove, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import RegenerateButton from './RegenerateButton';
import { useAuthStore } from '@/store/useAuthStore';

// ─── Sortable Question Component ──────────────────────────────────────────────
function SortableQuestion({ 
  id, question, qIdx, globalQNum, paperId, sectionIdx, onRegenerateSuccess, onRegenerateError 
}: any) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.4 : 1,
  };

  const getDifficultyStyle = (diff: string) => {
    if (diff === 'Easy') return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
    if (diff === 'Moderate') return 'bg-amber-50 text-amber-700 border border-amber-200';
    return 'bg-red-50 text-red-700 border border-red-200';
  };

  return (
    <div ref={setNodeRef} style={style} className="flex gap-3 p-4 rounded-xl bg-gray-50 border border-gray-100 hover:border-gray-200 transition-colors group relative">
      <div 
        {...attributes} 
        {...listeners}
        className="mt-0.5 cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-600 transition-colors shrink-0"
      >
        <GripVertical size={20} />
      </div>
      
      <span className="font-bold text-gray-900 shrink-0 text-sm pt-0.5 w-6">
        Q{globalQNum}.
      </span>
      
      <div className="flex-1 min-w-0 pr-8">
        <p className="text-gray-800 text-[15px] leading-relaxed font-medium">
          {question.text}
        </p>
        <div className="flex items-center justify-between mt-2.5 flex-wrap gap-2">
          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider ${getDifficultyStyle(question.difficulty)}`}>
            {question.difficulty}
          </span>
          <span className="text-sm font-bold text-gray-600">
            [{question.marks} {question.marks === 1 ? 'mark' : 'marks'}]
          </span>
        </div>
      </div>

      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
        <RegenerateButton
          paperId={paperId}
          sectionIndex={sectionIdx}
          questionIndex={qIdx}
          onSuccess={onRegenerateSuccess}
          onError={onRegenerateError}
        />
      </div>
    </div>
  );
}

// ─── Main Draggable Paper Component ───────────────────────────────────────────
interface DraggablePaperProps {
  paper: any;
  setPaper: (paper: any) => void;
  assignment?: any;
  onError: (msg: string) => void;
}

export default function DraggablePaper({ paper, setPaper, assignment, onError }: DraggablePaperProps) {
  // We need stable IDs for dnd-kit. We'll generate a unique ID for each question on mount
  // and maintain a flattened state for easy DnD across sections.
  
  // Format: "secIdx-qIdx-random"
  const [items, setItems] = useState<any[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const { token } = useAuthStore();

  useEffect(() => {
    if (!paper) return;
    // Map paper to items with IDs if they don't have them yet
    const newItems = paper.sections.map((sec: any, sIdx: number) => ({
      ...sec,
      id: sec._id || `sec-${sIdx}`,
      questions: sec.questions.map((q: any, qIdx: number) => ({
        ...q,
        id: q.id || `q-${sIdx}-${qIdx}-${Math.random().toString(36).substr(2, 9)}`,
      }))
    }));
    setItems(newItems);
  }, [paper]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id);
  };

  const handleDragOver = (event: any) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    // Find containers (sections)
    const activeSectionIdx = items.findIndex(s => s.questions.some((q: any) => q.id === activeId));
    
    // Check if dragging over a section container directly, or over a question in a section
    let overSectionIdx = items.findIndex(s => s.id === overId);
    if (overSectionIdx === -1) {
      overSectionIdx = items.findIndex(s => s.questions.some((q: any) => q.id === overId));
    }

    if (activeSectionIdx === -1 || overSectionIdx === -1) return;

    // Move between sections
    if (activeSectionIdx !== overSectionIdx) {
      setItems((prev) => {
        const newItems = JSON.parse(JSON.stringify(prev));
        const activeItems = newItems[activeSectionIdx].questions;
        const overItems = newItems[overSectionIdx].questions;
        
        const activeItemIdx = activeItems.findIndex((q: any) => q.id === activeId);
        const [movedItem] = activeItems.splice(activeItemIdx, 1);
        
        const overItemIdx = overItems.findIndex((q: any) => q.id === overId);
        // if over is a section itself, push to end, else insert at over index
        const insertIdx = overItemIdx >= 0 ? overItemIdx : overItems.length;
        overItems.splice(insertIdx, 0, movedItem);
        
        return newItems;
      });
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    const activeSectionIdx = items.findIndex(s => s.questions.some((q: any) => q.id === activeId));
    let overSectionIdx = items.findIndex(s => s.id === overId);
    if (overSectionIdx === -1) {
      overSectionIdx = items.findIndex(s => s.questions.some((q: any) => q.id === overId));
    }

    if (activeSectionIdx === -1 || overSectionIdx === -1) return;

    let finalItems = items;

    // If in same section, just arrayMove
    if (activeSectionIdx === overSectionIdx) {
      const section = items[activeSectionIdx];
      const activeItemIdx = section.questions.findIndex((q: any) => q.id === activeId);
      const overItemIdx = section.questions.findIndex((q: any) => q.id === overId);

      if (activeItemIdx !== overItemIdx) {
        setItems((prev) => {
          const newItems = JSON.parse(JSON.stringify(prev));
          newItems[activeSectionIdx].questions = arrayMove(newItems[activeSectionIdx].questions, activeItemIdx, overItemIdx);
          finalItems = newItems;
          return newItems;
        });
      }
    }

    // Now persist to backend
    try {
      const payload = {
        sections: finalItems.map(sec => ({
          title: sec.title,
          instructions: sec.instructions,
          questions: sec.questions.map((q: any) => ({
            text: q.text,
            difficulty: q.difficulty,
            marks: q.marks
          }))
        }))
      };

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const res = await fetch(`${API_URL}/api/papers/${paper._id}/reorder`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save reorder');
      
      // Update parent paper state to keep it in sync
      setPaper(data.paper);
    } catch (err: any) {
      console.error('Reorder save failed:', err);
      onError(err.message || 'Failed to save question order');
    }
  };

  const onRegenerateSuccess = (sIdx: number, qIdx: number, newQuestion: any) => {
    // Update local state and parent state
    setItems((prev) => {
      const newItems = JSON.parse(JSON.stringify(prev));
      // preserve the unique id so dnd doesn't break
      const existingId = newItems[sIdx].questions[qIdx].id;
      newItems[sIdx].questions[qIdx] = { ...newQuestion, id: existingId };
      return newItems;
    });

    const newPaper = JSON.parse(JSON.stringify(paper));
    newPaper.sections[sIdx].questions[qIdx] = newQuestion;
    setPaper(newPaper);
  };

  let globalCounter = 0;

  return (
    <div className="w-full">
      <DndContext 
        sensors={sensors} 
        collisionDetection={closestCenter} 
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        {/* ── Standard Paper Header ── */}
        <div className="mb-10 text-center border-b-2 border-gray-900 pb-8 pt-4">
          <h1 className="text-2xl font-extrabold text-gray-900 mb-6 tracking-tight">
            {assignment?.schoolName || 'Delhi Public School'}
          </h1>
          
          <div className="text-[15px] font-bold text-gray-800 space-y-1">
            <p>Subject: {assignment?.subject || 'English'}</p>
            <p>Class: {assignment?.grade || 'Class 10'}</p>
          </div>
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mt-8 text-[14px] font-bold text-gray-800 gap-2">
            <p>Time Allowed: {assignment?.timeAllowed || '3 Hours'}</p>
            <p>Maximum Marks: {assignment?.totalMarks || 100}</p>
          </div>
          
          <p className="text-left mt-8 text-[14px] font-bold text-gray-800">
            All questions are compulsory unless stated otherwise.
          </p>
          
          <div className="text-left mt-8 space-y-4 text-[14px] font-bold text-gray-800 flex flex-col items-start w-full max-w-sm">
            <div className="flex items-end w-full">
              <span className="w-20 shrink-0">Name:</span> 
              <div className="border-b-2 border-gray-900 flex-1 ml-2 h-4"></div>
            </div>
            <div className="flex items-end w-full">
              <span className="w-28 shrink-0">Roll Number:</span> 
              <div className="border-b-2 border-gray-900 flex-1 ml-2 h-4"></div>
            </div>
            <div className="flex items-end w-full">
              <span className="shrink-0">Class: {assignment?.grade || 'Class 10'} Section:</span> 
              <div className="border-b-2 border-gray-900 flex-1 ml-2 h-4"></div>
            </div>
          </div>
        </div>

        <div className="space-y-10">
          {items.map((section, sIdx) => {
            const sectionMarks = section.questions.reduce((s: number, q: any) => s + q.marks, 0);
            return (
              <div key={section.id} id={section.id} className="space-y-5">
                {/* Section Header */}
                <div className="flex items-start justify-between gap-4 pb-2 border-b-2 border-gray-900">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">{section.title}</h2>
                    <p className="text-sm text-gray-500 italic mt-0.5">{section.instructions}</p>
                  </div>
                  <span className="shrink-0 text-sm font-bold text-gray-700">
                    [{sectionMarks} Marks]
                  </span>
                </div>

                <SortableContext 
                  items={section.questions.map((q: any) => q.id)} 
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-3 min-h-[50px]">
                    {section.questions.map((q: any, qIdx: number) => {
                      globalCounter++;
                      return (
                        <SortableQuestion
                          key={q.id}
                          id={q.id}
                          question={q}
                          qIdx={qIdx}
                          globalQNum={globalCounter}
                          paperId={paper._id}
                          sectionIdx={sIdx}
                          onRegenerateSuccess={onRegenerateSuccess}
                          onRegenerateError={onError}
                        />
                      );
                    })}
                  </div>
                </SortableContext>
              </div>
            );
          })}
        </div>

        {/* ── End of Paper ── */}
        <div className="mt-12 text-[14px] font-bold text-gray-900 border-t-2 border-gray-900 pt-8 text-center">
          <p>End of Question Paper</p>
        </div>

        <DragOverlay dropAnimation={{ sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.4' } } }) }}>
          {/* A simple overlay indicating dragging */}
          {activeId ? (
            <div className="p-4 rounded-xl bg-gray-900 text-white shadow-xl opacity-90 border border-gray-700 flex items-center gap-3">
              <GripVertical size={20} className="text-gray-400" />
              <span className="font-medium text-sm">Moving question...</span>
            </div>
          ) : null}
        </DragOverlay>

      </DndContext>
    </div>
  );
}
