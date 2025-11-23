import { useState, useEffect } from 'react';
import { Bell, Search, LogOut, UserCircle, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

type HeaderProps = { username?: string; onLogout?: () => void }

interface Notification {
  id: string;
  title?: string;
  message: string;
  type: 'warning' | 'info' | 'reminder' | 'urgent';
  is_read: boolean;
  created_at: string;
  sender?: {
    fname: string;
    lname: string;
  };
}

export default function Header({ username, onLogout }: HeaderProps) {
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchUnreadCount();
    fetchRecentNotifications();
    // Poll every 30 seconds
    const interval = setInterval(() => {
      fetchUnreadCount();
      fetchRecentNotifications();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  async function fetchUnreadCount() {
    try {
      const res = await api.get('/api/notifications/count');
      setUnreadCount(res.data.count);
    } catch (err) {
      console.error('Error fetching unread count:', err);
    }
  }

  async function fetchRecentNotifications() {
    try {
      setLoading(true);
      const res = await api.get('/api/notifications', {
        params: { limit: 5, page: 1 },
      });
      setNotifications(res.data.notifications || []);
    } catch (err) {
      console.error('Error fetching recent notifications:', err);
    } finally {
      setLoading(false);
    }
  }

  function getTypeIcon(type: string): string {
    switch (type) {
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      case 'reminder':
        return '🔔';
      case 'urgent':
        return '🚨';
      default:
        return '📩';
    }
  }

  function formatTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-gray-200 bg-white/80 shadow-sm backdrop-blur-md supports-[backdrop-filter]:bg-white/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-xl font-bold tracking-tight text-transparent lg:text-2xl hidden sm:block">
            Human Resource and Management System
          </span>
          <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-xl font-bold tracking-tight text-transparent sm:hidden">
            HRMS
          </span>
        </div>
        <div className="flex items-center gap-3 md:gap-4">
          {username && (
            <div className="hidden sm:flex items-center gap-2 rounded-full border border-gray-200 bg-white/80 px-3 py-1.5 shadow-sm backdrop-blur-sm">
              <UserCircle className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium text-gray-700">{username}</span>
            </div>
          )}

          {/* Notification Bell with Dropdown */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="relative inline-flex items-center justify-center rounded-full h-10 w-10 border border-gray-200 bg-white text-gray-700 transition-all duration-200 hover:bg-gray-50 hover:text-blue-600 hover:shadow-md"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute right-2 top-2.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
              )}
            </button>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                <div className="p-4 border-b border-gray-200">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold text-gray-900">Notifications</h3>
                    {unreadCount > 0 && (
                      <span className="px-2.5 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                </div>

                <div className="max-h-96 overflow-y-auto">
                  {loading ? (
                    <div className="p-4 text-center text-gray-500 text-sm">Loading...</div>
                  ) : notifications.length === 0 ? (
                    <div className="p-4 text-center text-gray-500 text-sm">No notifications yet</div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {notifications.map((notif) => (
                        <div
                          key={notif.id}
                          onClick={() => {
                            navigate('/notifications');
                            setDropdownOpen(false);
                          }}
                          className={`p-3 hover:bg-gray-50 cursor-pointer transition-colors ${
                            !notif.is_read ? 'bg-blue-50' : ''
                          }`}
                        >
                          <div className="flex gap-3">
                            <div className="text-lg flex-shrink-0">
                              {getTypeIcon(notif.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 text-sm">
                                {notif.title || notif.type}
                              </p>
                              <p className="text-gray-600 text-xs line-clamp-1 mt-1">
                                {notif.message}
                              </p>
                              <p className="text-gray-400 text-xs mt-1">
                                {formatTime(notif.created_at)}
                              </p>
                            </div>
                            {!notif.is_read && (
                              <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-1" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="p-3 border-t border-gray-200 text-center">
                  <button
                    onClick={() => {
                      navigate('/notifications');
                      setDropdownOpen(false);
                    }}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    View All Notifications
                  </button>
                </div>
              </div>
            )}
          </div>

          {onLogout && (
            <button
              onClick={onLogout}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-md transition-all duration-200 hover:from-blue-700 hover:to-indigo-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          )}
        </div>
      </div>

      {/* Close dropdown when clicking outside */}
      {dropdownOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setDropdownOpen(false)}
        />
      )}
    </header>
  );
}
