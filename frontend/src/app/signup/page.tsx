'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '../../store/useAuthStore';
import { API_URL } from '@/lib/api';
import toast from 'react-hot-toast';

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { setAuth } = useAuthStore();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (data.success) {
        setAuth(data.user, data.token);
        toast.success('Account created successfully!');
        router.push('/dashboard');
      } else {
        toast.error(data.error || 'Failed to create account');
      }
    } catch (err) {
      toast.error('Network error. Is the server running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Create an Account</h1>
        <p className="text-gray-500 mb-8 text-sm">Join VedaAI to generate intelligent assessments.</p>
        
        <form onSubmit={handleSignup} className="flex flex-col gap-5">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1.5">Full Name</label>
            <input 
              type="text" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              className="w-full border border-gray-200 rounded-full px-5 py-3 focus:outline-none focus:border-[#4BC36D] transition-colors"
              required 
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1.5">Email Address</label>
            <input 
              type="email" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              className="w-full border border-gray-200 rounded-full px-5 py-3 focus:outline-none focus:border-[#4BC36D] transition-colors"
              required 
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1.5">Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              className="w-full border border-gray-200 rounded-full px-5 py-3 focus:outline-none focus:border-[#4BC36D] transition-colors"
              required 
              minLength={6}
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-[#4BC36D] text-white py-3.5 rounded-full font-bold mt-2 shadow-[0_4px_14px_rgba(75,195,109,0.4)] hover:bg-[#3ea85c] disabled:opacity-50 transition-all"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-gray-500">
          Already have an account? <Link href="/login" className="text-[#4BC36D] font-bold hover:underline">Sign in</Link>
        </p>
      </div>
    </main>
  );
}
