'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '../../../store/useAuthStore';
import { 
  Bell, 
  Check, 
  Trash2, 
  AlertCircle, 
  FileCheck, 
  ArrowLeft,
  Plus,
  Edit2,
  Save,
  X,
  Megaphone,
  AlertTriangle,
  Info,
  Calendar,
  Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { API_URL } from '../../../lib/api';
import { socket } from '../../../lib/socket';

interface NotificationItem {
  _id: string;
  title: string;
  message: string;
  category: 'info' | 'success' | 'warning' | 'error';
  createdAt: string;
}

export default function NotificationsPage() {
  const router = useRouter();
  const { token, user } = useAuthStore();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [readIds, setReadIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'feed' | 'manage'>('feed');

  // Form states for creating a new notification
  const [newTitle, setNewTitle] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [newCategory, setNewCategory] = useState<'info' | 'success' | 'warning' | 'error'>('info');
  const [createLoading, setCreateLoading] = useState(false);

  // States for editing an existing notification
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editMessage, setEditMessage] = useState('');
  const [editCategory, setEditCategory] = useState<'info' | 'success' | 'warning' | 'error'>('info');
  const [editLoading, setEditLoading] = useState(false);

  useEffect(() => {
    // Load read status from localStorage
    const saved = localStorage.getItem('veda-read-notifications');
    if (saved) {
      setReadIds(JSON.parse(saved));
    }
  }, []);

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (token) {
      fetchNotifications();
    }
  }, [token]);
useEffect(() => {
  if (!token) return;
  socket.on('notificationCreated', fetchNotifications);
  socket.on('notificationUpdated', fetchNotifications);
  socket.on('notificationDeleted', fetchNotifications);
  return () => {
    socket.off('notificationCreated', fetchNotifications);
    socket.off('notificationUpdated', fetchNotifications);
    socket.off('notificationDeleted', fetchNotifications);
  };
}, [token]);
  const fetchNotifications = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/notifications`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setNotifications(data.notifications);
      }
    } catch (e) {
      console.error('Error fetching notifications:', e);
    } finally {
      setLoading(false);
    }
  };

  const markAllRead = () => {
    const allIds = notifications.map(n => n._id);
    setReadIds(allIds);
    localStorage.setItem('veda-read-notifications', JSON.stringify(allIds));
    toast.success('All alerts marked as read');
  };

  const clearAll = async () => {
    if (confirm('Delete all notifications and clear the sidebar badge?')) {
      try {
        const res = await fetch(`${API_URL}/api/notifications/clear-all`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          setNotifications([]);
          setReadIds([]);
          localStorage.removeItem('veda-read-notifications');
          toast.success('All notifications cleared');
          return;
        }
        toast.error(data.error || 'Failed to clear notifications');
      } catch (error) {
        toast.error('Network error while clearing notifications');
      }
    }
  };

  const toggleRead = (id: string) => {
    let next;
    if (readIds.includes(id)) {
      next = readIds.filter(x => x !== id);
    } else {
      next = [...readIds, id];
    }
    setReadIds(next);
    localStorage.setItem('veda-read-notifications', JSON.stringify(next));
  };

  const handleCreateNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newMessage.trim()) {
      toast.error('Notification title and message are required');
      return;
    }

    setCreateLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/notifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: newTitle,
          message: newMessage,
          category: newCategory
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Alert broadcast successfully!');
        setNewTitle('');
        setNewMessage('');
        setNewCategory('info');
        fetchNotifications();
      } else {
        toast.error(data.error || 'Failed to broadcast alert');
      }
    } catch (err) {
      toast.error('Network error during broadcast');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleStartEdit = (item: NotificationItem) => {
    setEditingId(item._id);
    setEditTitle(item.title);
    setEditMessage(item.message);
    setEditCategory(item.category);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  const handleSaveEdit = async (id: string) => {
    if (!editTitle.trim() || !editMessage.trim()) {
      toast.error('Fields cannot be empty');
      return;
    }

    setEditLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/notifications/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: editTitle,
          message: editMessage,
          category: editCategory
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Notification updated!');
        setEditingId(null);
        fetchNotifications();
      } else {
        toast.error(data.error || 'Failed to update alert');
      }
    } catch (err) {
      toast.error('Network error during update');
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteNotification = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this broadcast notification from the database?')) {
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/notifications/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Broadcast permanently removed');
        fetchNotifications();
      } else {
        toast.error(data.error || 'Failed to delete alert');
      }
    } catch (err) {
      toast.error('Network error during deletion');
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'success':
        return <FileCheck className="text-emerald-500" size={18} />;
      case 'warning':
        return <AlertTriangle className="text-[#F57B36]" size={18} />;
      case 'error':
        return <AlertCircle className="text-red-500" size={18} />;
      default:
        return <Info className="text-blue-500" size={18} />;
    }
  };

  return (
    <main className="flex-1 flex flex-col min-w-0 h-full pb-20 md:pb-0 relative z-10 text-slate-800 dark:text-slate-200">
      
      {/* Header bar */}
      <header className="bg-white dark:bg-[#131B2E] border border-slate-200/40 dark:border-slate-800/40 rounded-[24px] h-[72px] shadow-sm flex items-center justify-between px-4 md:px-6 mb-4 shrink-0 theme-transition">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.push('/dashboard')}
            className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-650 dark:text-slate-400 focus:outline-none"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex items-center gap-2 text-slate-400">
            <Bell size={16} />
            <span className="text-slate-500 dark:text-slate-400 font-extrabold text-xs tracking-wider uppercase">Notifications Center</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {activeTab === 'feed' && notifications.some(n => !readIds.includes(n._id)) && (
            <button
              onClick={markAllRead}
              className="px-3.5 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-650 dark:text-slate-350 rounded-full font-bold text-xs flex items-center gap-1.5 transition-colors focus:outline-none"
            >
              <Check size={14} />
              <span className="hidden sm:inline">Mark all read</span>
            </button>
          )}
          {activeTab === 'feed' && notifications.length > 0 && (
            <button
              onClick={clearAll}
              className="px-3.5 py-2 hover:bg-red-50 dark:hover:bg-red-500/10 text-red-500 rounded-full font-extrabold text-xs flex items-center gap-1.5 transition-colors focus:outline-none"
            >
              <Trash2 size={15} />
              <span className="hidden sm:inline">Clear All</span>
            </button>
          )}
        </div>
      </header>

      {/* Notifications grid */}
      <div className="flex-1 overflow-y-auto pb-32 px-1 md:px-0 space-y-6 no-scrollbar">
        
        {/* Title & Segment Tabs for Admins */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-[22px] font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              Alerts & Notifications
            </h2>
            <p className="text-[13px] text-slate-400 dark:text-slate-400 font-medium">
              View real-time updates regarding assessment jobs, database syncs, and system activities.
            </p>
          </div>

          {/* Admin Tab Controls */}
          {isAdmin && (
            <div className="bg-white dark:bg-[#131B2E] border border-slate-200/40 dark:border-slate-800/40 p-1 rounded-2xl flex shadow-sm shrink-0 theme-transition">
              <button
                onClick={() => setActiveTab('feed')}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                  activeTab === 'feed'
                    ? 'bg-[#F57B36] text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                Notification Feed
              </button>
              <button
                onClick={() => setActiveTab('manage')}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                  activeTab === 'manage'
                    ? 'bg-[#F57B36] text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                Broadcast Manager
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 size={32} className="animate-spin text-[#F57B36]" />
          </div>
        ) : activeTab === 'feed' ? (
          
          /* ─── TAB 1: NOTIFICATION FEED ─── */
          notifications.length === 0 ? (
            <div className="bg-white dark:bg-[#131B2E] border border-slate-200/40 dark:border-slate-800/40 rounded-3xl p-12 shadow-sm text-center flex flex-col items-center justify-center min-h-[300px]">
              <div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center text-2xl mb-4">
                📭
              </div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base mb-1.5">No alerts at the moment</h3>
              <p className="text-xs text-slate-400 max-w-xs font-medium leading-relaxed">
                You are completely caught up! We will alert you here as soon as new jobs process or systems update.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((item) => {
                const isRead = readIds.includes(item._id);
                return (
                  <div
                    key={item._id}
                    onClick={() => toggleRead(item._id)}
                    className={`bg-white dark:bg-[#131B2E] border rounded-2xl p-5 shadow-sm transition-all flex items-start gap-4 cursor-pointer relative group ${
                      isRead 
                        ? 'border-slate-200/40 dark:border-slate-800/40 opacity-70' 
                        : 'border-slate-200 dark:border-slate-850 hover:border-[#F57B36]/50 dark:hover:border-[#F57B36]/30'
                    }`}
                  >
                    {/* Unread blue dot indicator */}
                    {!isRead && (
                      <span className="absolute top-5 right-5 w-2 h-2 rounded-full bg-[#F57B36] shadow-sm" />
                    )}

                    {/* Category icon */}
                    <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center shrink-0 border border-slate-100 dark:border-slate-700/30">
                      {getCategoryIcon(item.category)}
                    </div>

                    <div className="flex-1 min-w-0 pr-8">
                      <div className="flex items-baseline gap-2 mb-0.5">
                        <h4 className={`text-sm font-extrabold text-slate-900 dark:text-white truncate ${!isRead ? 'font-black' : ''}`}>
                          {item.title}
                        </h4>
                        <span className="text-[10px] text-slate-400 font-bold shrink-0">
                          {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 dark:text-slate-405 font-medium leading-relaxed text-left">
                        {item.message}
                      </p>
                    </div>

                    {/* Dismiss button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleRead(item._id);
                        toast.success(isRead ? 'Marked alert as unread' : 'Alert marked as read');
                      }}
                      className="absolute bottom-5 right-5 md:opacity-0 md:group-hover:opacity-100 p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-[#F57B36] transition-all focus:outline-none"
                      title={isRead ? 'Mark unread' : 'Mark read'}
                    >
                      <Check size={14} />
                    </button>

                  </div>
                );
              })}
            </div>
          )
        ) : (
          
          /* ─── TAB 2: BROADCAST MANAGER (Admin Only) ─── */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left: Create Notification Form */}
            <div className="lg:col-span-5">
              <form onSubmit={handleCreateNotification} className="bg-white dark:bg-[#131B2E] border border-slate-200/40 dark:border-slate-800/40 rounded-3xl p-6 shadow-sm theme-transition">
                <h3 className="text-base font-extrabold text-slate-950 dark:text-white mb-4 flex items-center gap-2.5">
                  <Megaphone size={18} className="text-[#F57B36]" />
                  <span>Broadcast New Notification</span>
                </h3>

                <div className="space-y-4 mb-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">Notification Title</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Server Maintenance Scheduled"
                      value={newTitle}
                      onChange={e => setNewTitle(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 text-xs focus:outline-none focus:border-[#F57B36] font-bold transition-all text-slate-900 dark:text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">Alert Broadcast Message</label>
                    <textarea 
                      placeholder="Enter detailed notification context..."
                      value={newMessage}
                      onChange={e => setNewMessage(e.target.value)}
                      rows={4}
                      className="w-full bg-slate-50 dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 text-xs focus:outline-none focus:border-[#F57B36] font-medium transition-all text-slate-900 dark:text-white resize-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">Severity Category</label>
                    <select 
                      value={newCategory}
                      onChange={e => setNewCategory(e.target.value as any)}
                      className="w-full bg-slate-50 dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 text-xs focus:outline-none focus:border-[#F57B36] font-bold transition-all text-slate-900 dark:text-white appearance-none cursor-pointer"
                    >
                      <option value="info">💬 Info Alert (Blue)</option>
                      <option value="success">✅ Success Alert (Green)</option>
                      <option value="warning">⚠️ Warning Alert (Orange)</option>
                      <option value="error">❌ Error Alert (Red)</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={createLoading}
                  className="w-full bg-[#1C1D21] hover:bg-black dark:bg-[#1E293B] dark:hover:bg-slate-800 text-white font-bold text-xs py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer focus:outline-none disabled:opacity-50"
                >
                  {createLoading ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Plus size={14} />
                  )}
                  <span>Broadcast System Alert</span>
                </button>
              </form>
            </div>

            {/* Right: Existing Broadcasts list with inline edit and delete */}
            <div className="lg:col-span-7 space-y-4">
              
              <div className="bg-white dark:bg-[#131B2E] border border-slate-200/40 dark:border-slate-800/40 rounded-3xl p-6 shadow-sm theme-transition">
                <h3 className="text-base font-extrabold text-slate-950 dark:text-white mb-4 flex items-center gap-2.5">
                  <Megaphone size={18} className="text-[#F57B36]" />
                  <span>Existing System Broadcasts</span>
                </h3>

                {notifications.length === 0 ? (
                  <p className="text-xs text-slate-400 font-medium py-10 text-center">No broadcast notifications registered in database.</p>
                ) : (
                  <div className="space-y-4">
                    {notifications.map((item) => {
                      const isEditing = editingId === item._id;
                      return (
                        <div key={item._id} className="border border-slate-200/60 dark:border-slate-800/80 rounded-2xl p-4 space-y-3 bg-slate-50/40 dark:bg-slate-900/10">
                          {isEditing ? (
                            /* Editing State */
                            <div className="space-y-3">
                              <input 
                                type="text"
                                value={editTitle}
                                onChange={e => setEditTitle(e.target.value)}
                                className="w-full bg-white dark:bg-[#1E293B] border border-slate-250 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-extrabold text-slate-950 dark:text-white focus:outline-none focus:border-[#F57B36]"
                              />
                              <textarea
                                value={editMessage}
                                onChange={e => setEditMessage(e.target.value)}
                                rows={3}
                                className="w-full bg-white dark:bg-[#1E293B] border border-slate-250 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-450 dark:text-slate-400 focus:outline-none focus:border-[#F57B36] resize-none"
                              />
                              <select 
                                value={editCategory}
                                onChange={e => setEditCategory(e.target.value as any)}
                                className="w-full bg-white dark:bg-[#1E293B] border border-slate-250 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-950 dark:text-white focus:outline-none focus:border-[#F57B36] cursor-pointer"
                              >
                                <option value="info">Info (Blue)</option>
                                <option value="success">Success (Green)</option>
                                <option value="warning">Warning (Orange)</option>
                                <option value="error">Error (Red)</option>
                              </select>
                              
                              <div className="flex gap-2 justify-end">
                                <button
                                  onClick={handleCancelEdit}
                                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-650 dark:text-slate-350 font-bold text-[10px] rounded-lg transition-colors flex items-center gap-1 focus:outline-none"
                                >
                                  <X size={12} />
                                  <span>Cancel</span>
                                </button>
                                <button
                                  onClick={() => handleSaveEdit(item._id)}
                                  disabled={editLoading}
                                  className="px-3 py-1.5 bg-[#F57B36] hover:bg-[#E15A20] text-white font-bold text-[10px] rounded-lg shadow-sm transition-colors flex items-center gap-1 focus:outline-none disabled:opacity-50"
                                >
                                  <Save size={12} />
                                  <span>Save Update</span>
                                </button>
                              </div>
                            </div>
                          ) : (
                            /* Static View with Actions */
                            <div className="flex justify-between items-start gap-4">
                              <div className="flex gap-3 items-start">
                                <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 flex items-center justify-center shrink-0 border border-slate-100 dark:border-slate-700/30">
                                  {getCategoryIcon(item.category)}
                                </div>
                                <div className="text-left">
                                  <h4 className="text-xs font-black text-slate-950 dark:text-white leading-tight mb-1">{item.title}</h4>
                                  <p className="text-[11px] font-medium text-slate-450 dark:text-slate-400 leading-relaxed mb-1.5">{item.message}</p>
                                  <span className="text-[9px] font-bold text-slate-400 flex items-center gap-1">
                                    <Calendar size={10} />
                                    {new Date(item.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                                  </span>
                                </div>
                              </div>

                              <div className="flex gap-1.5 shrink-0">
                                <button
                                  onClick={() => handleStartEdit(item)}
                                  className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:text-blue-600 rounded-lg text-blue-500 font-extrabold transition-colors focus:outline-none"
                                  title="Edit broadcast alert"
                                >
                                  <Edit2 size={17} />
                                </button>
                                <button
                                  onClick={() => handleDeleteNotification(item._id)}
                                  className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-red-50 hover:text-red-600 rounded-lg text-red-500 font-extrabold transition-colors focus:outline-none"
                                  title="Delete broadcast permanently"
                                >
                                  <Trash2 size={17} />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>

          </div>
        )}

      </div>

    </main>
  );
}
