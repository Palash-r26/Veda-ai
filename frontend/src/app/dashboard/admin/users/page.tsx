'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '../../../../store/useAuthStore';
import toast from 'react-hot-toast';
import { API_URL } from '../../../../lib/api';
import { 
  Users, 
  Search, 
  Filter, 
  Edit2, 
  Trash2, 
  ShieldAlert, 
  Loader2, 
  X, 
  Check, 
  ArrowLeft,
  Calendar
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface UserRecord {
  _id: string;
  name: string;
  email: string;
  role: 'teacher' | 'admin';
  createdAt: string;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const { token, user: currentUser } = useAuthStore();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filter States
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'teacher' | 'admin'>('all');

  // Edit Modal States
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState<'teacher' | 'admin'>('teacher');
  const [saveLoading, setSaveLoading] = useState(false);



  useEffect(() => {
    fetchUsers();
  }, [token]);

  const fetchUsers = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setUsers(data.users);
      } else {
        toast.error(data.error || 'Failed to fetch users');
      }
    } catch (err) {
      toast.error('Error connecting to authentication server');
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (user: UserRecord) => {
    setEditingUser(user);
    setEditName(user.name);
    setEditEmail(user.email);
    setEditRole(user.role);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setSaveLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/admin/users/${editingUser._id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: editName,
          email: editEmail,
          role: editRole
        })
      });
      const data = await res.json();

      if (data.success) {
        toast.success(`Updated ${editName}'s account details!`);
        setEditingUser(null);
        fetchUsers(); // Refresh grid
      } else {
        toast.error(data.error || 'Failed to update user');
      }
    } catch (err) {
      toast.error('Network error while updating user details');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDeleteClick = async (userToDelete: UserRecord) => {
    if (userToDelete._id === currentUser?.id) {
      toast.error('You cannot delete your own admin account!');
      return;
    }
    if (!confirm(`Are you absolutely sure you want to delete user "${userToDelete.name}"?\nThis will clean up all their assignments and generated papers.`)) {
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/admin/users/${userToDelete._id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();

      if (data.success) {
        toast.success(`User "${userToDelete.name}" deleted successfully`);
        setUsers(users.filter(u => u._id !== userToDelete._id));
      } else {
        toast.error(data.error || 'Failed to delete user');
      }
    } catch (err) {
      toast.error('Error connecting to server to delete user');
    }
  };

  // Filter users
  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(search.toLowerCase()) || 
                          u.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
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
            <Users size={16} />
            <span className="text-slate-500 dark:text-slate-400 font-extrabold text-xs tracking-wider uppercase">User Management</span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs font-bold bg-amber-100 dark:bg-amber-500/10 text-amber-600 px-3.5 py-1.5 rounded-full uppercase tracking-wider shrink-0">
          🛠️ Admin View
        </div>
      </header>

      {/* Main Grid */}
      <div className="flex-1 overflow-hidden flex flex-col">
        
        {/* Title */}
        <div className="mb-6 mt-1">
          <h2 className="text-[22px] font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            User Accounts Portal
          </h2>
          <p className="text-[13px] text-slate-400 dark:text-slate-400 font-medium">
            Monitor, modify roles, or delete users within the VedaAI ecosystem.
          </p>
        </div>

        {/* Filter bar */}
        <div className="bg-white dark:bg-[#131B2E] border border-slate-200/40 dark:border-slate-800/40 rounded-2xl p-4 shadow-sm mb-6 flex flex-col md:flex-row items-center justify-between gap-4 theme-transition">
          
          {/* Search bar */}
          <div className="flex items-center gap-3 text-slate-400 border border-slate-200 dark:border-slate-800 rounded-full px-4 py-2.5 w-full md:w-80 bg-slate-50 dark:bg-slate-800/50">
            <Search size={16} />
            <input 
              type="text" 
              placeholder="Search by name or email..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-transparent border-none outline-none text-xs font-medium w-full text-slate-700 dark:text-slate-200 placeholder-slate-400"
            />
          </div>

          {/* Role filter segmented control */}
          <div className="flex gap-1.5 bg-slate-100 dark:bg-slate-800/60 p-1 rounded-xl w-full md:w-auto border border-slate-200/10">
            {(['all', 'teacher', 'admin'] as const).map(r => (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold capitalize transition-all focus:outline-none ${
                  roleFilter === r 
                    ? 'bg-white dark:bg-[#131B2E] text-slate-900 dark:text-white shadow-sm' 
                    : 'text-slate-400 dark:text-slate-500 hover:text-slate-650'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

        </div>

        {/* Users list table */}
        <div className="flex-1 overflow-y-auto pb-32 no-scrollbar rounded-2xl border border-slate-200/40 dark:border-slate-800/40 bg-white dark:bg-[#131B2E] shadow-sm theme-transition">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="animate-spin text-emerald-500 mb-2" size={32} />
              <span className="text-xs font-bold text-slate-400">Loading user roster...</span>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <span className="text-3xl mb-3">🔍</span>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">No accounts match search</h3>
              <p className="text-xs text-slate-400 max-w-xs leading-relaxed font-medium mt-1">
                Try modifying your query or selecting a different role filter check.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider bg-slate-50/50 dark:bg-slate-800/20">
                    <th className="py-4 px-6">User Detail</th>
                    <th className="py-4 px-6">Access Level</th>
                    <th className="py-4 px-6">Registered On</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs font-bold">
                  {filteredUsers.map((item) => (
                    <tr key={item._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                      <td className="py-4 px-6 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/30 flex items-center justify-center text-lg shrink-0">
                          {item.role === 'admin' ? '🛡️' : '👨‍🏫'}
                        </div>
                        <div className="min-w-0">
                          <p className="text-slate-950 dark:text-slate-100 font-extrabold truncate">{item.name}</p>
                          <p className="text-[10px] text-slate-400 truncate">{item.email}</p>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider ${
                          item.role === 'admin' 
                            ? 'bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-200/20' 
                            : 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200/20'
                        }`}>
                          {item.role}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-slate-400 dark:text-slate-500 font-medium">
                        <div className="flex items-center gap-1.5">
                          <Calendar size={13} className="text-slate-300" />
                          <span>{new Date(item.createdAt || new Date()).toLocaleDateString('en-GB').replace(/\//g, '-')}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleEditClick(item)}
                            className="p-2.5 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg text-blue-500 hover:text-blue-600 transition-colors focus:outline-none"
                            title="Edit details"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(item)}
                            className="p-2.5 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg text-red-500 hover:text-red-600 transition-colors focus:outline-none"
                            title="Delete user"
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

      {/* ─── EDIT DETAILS MODAL ─── */}
      {editingUser && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-50 flex items-center justify-center p-4 veda-modal-overlay">
          <div className="bg-white dark:bg-[#111827] border border-white/60 dark:border-slate-700/80 rounded-[28px] w-full max-w-md shadow-[0_30px_80px_rgba(15,23,42,0.35)] relative overflow-hidden text-slate-800 dark:text-slate-200 veda-modal-panel">
            <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-emerald-400 via-[#F57B36] to-rose-500" />
            <div className="absolute -top-24 -right-16 w-40 h-40 rounded-full bg-emerald-400/15 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -left-16 w-40 h-40 rounded-full bg-[#F57B36]/15 blur-3xl pointer-events-none" />

            <div className="px-6 pt-6 pb-5 border-b border-slate-100 dark:border-slate-800/70 flex justify-between items-start gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.24em] font-black text-emerald-500 mb-2">Edit User</p>
                <h3 className="font-black text-slate-950 dark:text-white text-lg">Update account details</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Change name, email, or role with a clean, focused form.</p>
              </div>
              <button 
                onClick={() => setEditingUser(null)}
                className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800/70 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors focus:outline-none flex items-center justify-center"
              >
                <X size={18} />
              </button>
            </div>

            <div className="px-6 pb-6 pt-5">

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">Display Name</label>
                <input 
                  type="text" 
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 text-xs focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-500 font-bold transition-all text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">Email Address</label>
                <input 
                  type="email" 
                  value={editEmail}
                  onChange={e => setEditEmail(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 text-xs focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-500 font-bold transition-all text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">Access Role</label>
                <select 
                  value={editRole}
                  onChange={e => setEditRole(e.target.value as any)}
                  className="w-full bg-slate-50 dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 text-xs focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-500 font-bold transition-all text-slate-900 dark:text-white cursor-pointer"
                >
                  <option value="teacher">Teacher</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800/50 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors focus:outline-none"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saveLoading}
                  className="px-4 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all disabled:opacity-50 focus:outline-none"
                >
                  {saveLoading ? (
                    <>
                      <Loader2 className="animate-spin" size={14} />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Check size={14} />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>

            </form>

              </div>

          </div>
        </div>
      )}

    </main>
  );
}
