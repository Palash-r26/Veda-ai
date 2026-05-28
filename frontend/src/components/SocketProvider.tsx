'use client';

import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAssignmentStore } from '../store/useAssignmentStore';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { API_URL } from '@/lib/api';

/**
 * SocketProvider — establishes ONE socket connection for the app lifetime.
 *
 * Bug fix: the original code created a new socket every time `currentJobId`
 * changed (because it was in useEffect's dep array). Now we:
 *  1. Create the socket once on mount using a ref.
 *  2. Use a separate effect (with currentJobId dep) only to re-register
 *     the event listeners so they always close over the latest jobId.
 */
export default function SocketProvider({ children }: { children: React.ReactNode }) {
  const socketRef = useRef<Socket | null>(null);
  const { currentJobId, setCompleted, setJobStatus, setProgress, setError } = useAssignmentStore();
  const router = useRouter();

  // ── Create socket once on mount ──────────────────────────────────────────
  useEffect(() => {
    const socket = io(API_URL, {
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
    socketRef.current = socket;

    socket.on('connect', () => console.log('[WS] Connected:', socket.id));
    socket.on('disconnect', (reason) => console.log('[WS] Disconnected:', reason));
    socket.on('connect_error', (err) => console.error('[WS] Connection error:', err.message));

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []); // intentionally empty — socket created once

  // ── Re-register job-specific listeners when currentJobId changes ─────────
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    // Remove previous listeners to avoid duplicates
    socket.off('job-progress');
    socket.off('job-complete');
    socket.off('job-error');

    if (!currentJobId) return; // no active job — don't register

    const handleProgress = (data: { jobId: string; message: string; step: number; assignmentId: string }) => {
      if (data.jobId === currentJobId) {
        setProgress(data.message, data.step);
      }
    };

    const handleComplete = (data: { jobId: string; paperId: string }) => {
      if (data.jobId === currentJobId) {
        setCompleted(data.paperId);
        toast.success('Paper generated successfully!');
        router.push(`/dashboard/output/${data.paperId}`);
      }
    };

    const handleError = (data: { jobId: string; message: string; assignmentId: string }) => {
      if (data.jobId === currentJobId) {
        setError(data.message);
        setJobStatus('failed', data.jobId, data.assignmentId);
        toast.error(`Generation failed: ${data.message}`);
      }
    };

    socket.on('job-progress', handleProgress);
    socket.on('job-complete', handleComplete);
    socket.on('job-error', handleError);

    // Cleanup listeners when jobId changes or component unmounts
    return () => {
      socket.off('job-progress', handleProgress);
      socket.off('job-complete', handleComplete);
      socket.off('job-error', handleError);
    };
  }, [currentJobId, setCompleted, setJobStatus, setProgress, setError, router]);

  return <>{children}</>;
}
