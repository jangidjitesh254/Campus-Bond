import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  Trash2,
  Calendar,
  MessageSquare,
  UserCheck,
  Search,
  ShoppingBag,
  Users,
  Sparkles,
  Info,
  X,
} from 'lucide-react';
import { notificationService } from '../services/api';
import { useAuth } from '../context/AuthContext';

function formatRelativeTime(dateString) {
  if (!dateString) return '';
  const now = new Date();
  const date = new Date(dateString);
  const diffSec = Math.floor((now - date) / 1000);

  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function getNotificationIcon(type) {
  switch (type) {
    case 'event':
      return {
        icon: Calendar,
        bg: 'bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/30',
      };
    case 'chat':
      return {
        icon: MessageSquare,
        bg: 'bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/30',
      };
    case 'application':
      return {
        icon: UserCheck,
        bg: 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/30',
      };
    case 'lostfound':
      return {
        icon: Search,
        bg: 'bg-purple-100 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-900/30',
      };
    case 'market':
      return {
        icon: ShoppingBag,
        bg: 'bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/30',
      };
    case 'club':
      return {
        icon: Users,
        bg: 'bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900/30',
      };
    case 'system':
    default:
      return {
        icon: Sparkles,
        bg: 'bg-orange-100 dark:bg-orange-950/40 text-[#EE5933] border border-orange-200 dark:border-orange-900/30',
      };
  }
}

export default function NotificationBell({ buttonClassName = '' }) {
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'unread'
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  const fetchNotifications = async () => {
    if (!isLoggedIn) return;
    try {
      const res = await notificationService.getNotifications();
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unreadCount || 0);
    } catch (err) {
      console.warn('Failed to load notifications:', err.message);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Poll every 30 seconds for background updates
    const interval = setInterval(fetchNotifications, 30000);

    // Refresh when user tabs back
    const handleFocus = () => fetchNotifications();
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [isLoggedIn]);

  // Click outside and ESC key listener
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleMarkAsRead = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      const res = await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((item) => (item._id === id ? { ...item, isRead: true } : item))
      );
      setUnreadCount(res.data.unreadCount ?? Math.max(0, unreadCount - 1));
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  const handleDelete = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      const res = await notificationService.deleteNotification(id);
      setNotifications((prev) => prev.filter((item) => item._id !== id));
      if (res.data.unreadCount !== undefined) {
        setUnreadCount(res.data.unreadCount);
      }
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('Clear all notifications?')) return;
    try {
      await notificationService.clearAll();
      setNotifications([]);
      setUnreadCount(0);
    } catch (err) {
      console.error('Error clearing notifications:', err);
    }
  };

  const handleNotificationClick = async (notif) => {
    if (!notif.isRead) {
      handleMarkAsRead(notif._id);
    }
    setIsOpen(false);
    if (notif.link) {
      navigate(notif.link);
    }
  };

  const filteredNotifications =
    activeTab === 'unread'
      ? notifications.filter((item) => !item.isRead)
      : notifications;

  const defaultButtonClass =
    'p-2 sm:p-2.5 rounded-full hover:bg-black/[0.04] dark:hover:bg-white/10 text-[#4A3E3C] dark:text-slate-200 transition-colors relative cursor-pointer';

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      {/* ─── Notification Bell Trigger Button ─── */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) fetchNotifications();
        }}
        className={buttonClassName || defaultButtonClass}
        title="Notifications"
        aria-label="Open notifications"
      >
        <Bell className="w-5 h-5 stroke-[2]" />

        {/* Unread Counter Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-[#EE5933] text-white font-bold text-[10px] rounded-full flex items-center justify-center ring-2 ring-white dark:ring-[#1C1614] shadow-xs animate-in zoom-in-50 duration-200">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* ─── Notification Dropdown Panel ─── */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white dark:bg-[#1C1614] border border-[#E8DEC9] dark:border-[#382823] rounded-2xl shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150 overflow-hidden flex flex-col text-[#1E1917] dark:text-slate-100">
          {/* Header */}
          <div className="px-4 py-3 border-b border-[#EFE8DC] dark:border-white/10 flex items-center justify-between bg-[#FCFAF7] dark:bg-[#171210]">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-[#221614] dark:text-white tracking-tight">
                Notifications
              </span>
              {unreadCount > 0 && (
                <span className="text-[11px] bg-[#FEF0EB] text-[#EE5933] dark:bg-[#EE5933]/20 dark:text-[#FF7F59] font-bold px-2 py-0.5 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllAsRead}
                  className="flex items-center gap-1 text-[11px] font-semibold text-gray-500 dark:text-slate-400 hover:text-[#EE5933] dark:hover:text-[#EE5933] px-2 py-1 rounded-lg hover:bg-black/[0.04] dark:hover:bg-white/5 transition-colors cursor-pointer"
                  title="Mark all as read"
                >
                  <CheckCheck className="w-3.5 h-3.5 stroke-[2.2]" />
                  <span className="hidden sm:inline">Mark all read</span>
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="p-1 text-gray-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors cursor-pointer"
                  title="Clear all notifications"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="px-4 pt-2.5 pb-1 flex gap-2 border-b border-[#F0EBE1] dark:border-white/5 bg-white dark:bg-[#1C1614]">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-[#221614] text-[#E5DACB] dark:bg-white dark:text-[#221614]'
                  : 'text-gray-500 hover:text-black dark:text-slate-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('unread')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                activeTab === 'unread'
                  ? 'bg-[#EE5933] text-white shadow-xs'
                  : 'text-gray-500 hover:text-black dark:text-slate-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5'
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>

          {/* Notifications Scroll List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-gray-100 dark:divide-white/5">
            {filteredNotifications.length === 0 ? (
              <div className="py-10 px-4 text-center">
                <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center mx-auto mb-3 text-gray-400">
                  <Bell className="w-6 h-6 stroke-[1.5]" />
                </div>
                <p className="text-sm font-bold text-gray-800 dark:text-white">
                  {activeTab === 'unread' ? 'No unread notifications' : 'All caught up!'}
                </p>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 max-w-[220px] mx-auto">
                  {activeTab === 'unread'
                    ? 'You have read all your campus updates.'
                    : 'Campus alerts, applications, and messages will appear here.'}
                </p>
              </div>
            ) : (
              filteredNotifications.map((notif) => {
                const iconConfig = getNotificationIcon(notif.type);
                const IconComponent = iconConfig.icon;

                return (
                  <div
                    key={notif._id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`p-3.5 flex items-start gap-3 hover:bg-[#F9F7F4] dark:hover:bg-white/[0.03] transition-colors cursor-pointer relative group ${
                      !notif.isRead
                        ? 'bg-[#FEF9F6] dark:bg-[#EE5933]/[0.06]'
                        : 'bg-white dark:bg-transparent'
                    }`}
                  >
                    {/* Category Icon */}
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-2xs ${iconConfig.bg}`}
                    >
                      <IconComponent className="w-4 h-4 stroke-[2]" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pr-4">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <p
                          className={`text-xs font-bold truncate leading-tight ${
                            !notif.isRead
                              ? 'text-[#221614] dark:text-white'
                              : 'text-gray-700 dark:text-slate-300'
                          }`}
                        >
                          {notif.title}
                        </p>
                      </div>
                      <p className="text-[11px] text-gray-600 dark:text-slate-400 leading-snug line-clamp-2">
                        {notif.message}
                      </p>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-[10px] text-gray-400 dark:text-slate-500 font-medium">
                          {formatRelativeTime(notif.createdAt)}
                        </span>
                        {!notif.isRead && (
                          <span className="w-1.5 h-1.5 rounded-full bg-[#EE5933]" />
                        )}
                      </div>
                    </div>

                    {/* Quick Action Button: Delete on hover */}
                    <button
                      type="button"
                      onClick={(e) => handleDelete(notif._id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all absolute top-2 right-2 cursor-pointer"
                      title="Delete"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-2 border-t border-[#EFE8DC] dark:border-white/10 text-center bg-[#FCFAF7] dark:bg-[#171210]">
              <span className="text-[10px] text-gray-400 dark:text-slate-500 font-medium">
                Tap any notification to view details
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
