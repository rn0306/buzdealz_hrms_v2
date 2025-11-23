// pages/Notifications.tsx
import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { getUser } from '../utils/auth';
import { toast } from 'sonner';
import Button from '../components/ui/Button';
import Dialog from '../components/ui/Dialog';

type NotificationType = 'warning' | 'info' | 'reminder' | 'urgent';

interface Notification {
  id: string;
  to_user_id: string;
  from_user_id: string;
  target_id?: string | null;
  type: NotificationType;
  title?: string;
  message: string;
  is_read: boolean;
  read_at?: string | null;
  meta?: any;
  created_at: string;
  sender?: {
    id: string;
    fname: string;
    lname: string;
    email: string;
  };
  target?: {
    id: string;
    start_date: string;
    end_date: string;
  };
}

interface Recipient {
  user_id: string;
  name: string;
  email: string;
}

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'warning' | 'info' | 'reminder'>('all');
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);

  // Recipients (interns/employees) for sending notifications
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [recipientsLoading, setRecipientsLoading] = useState(false);

  // Send Notification modal state
  const [sendOpen, setSendOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendForm, setSendForm] = useState<{
    to_user_id: string;
    type: NotificationType;
    title: string;
    message: string;
  }>({
    to_user_id: '',
    type: 'warning',
    title: '',
    message: '',
  });

  const currentUser = getUser();
  const role = (currentUser?.role || "").toUpperCase();
  const canSendNotification = ["ADMIN", "MANAGER", "RECRUITER"].includes(role);


  // Fetch notifications, unread count, and recipients on mount
  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
    if (canSendNotification) {
      fetchRecipients();
    }

    // Poll for updates every 60 mins (3600000)
    const interval = setInterval(() => {
      fetchNotifications();
      fetchUnreadCount();
    }, 3600000);

    return () => clearInterval(interval);
  }, []);

  // Re-fetch when filter changes
  useEffect(() => {
    fetchNotifications();
  }, [filter]);

  async function fetchNotifications() {
    try {
      setLoading(true);
      const params: any = { limit: 50, page: 1 };
      if (filter === 'unread') {
        params.unread = 'true';
      }
      const res = await api.get('/api/notifications', { params });
      const notifs = res.data.notifications || [];

      // Apply client-side filter for type
      let filtered = notifs as Notification[];
      if (filter === 'warning') {
        filtered = notifs.filter((n: Notification) => n.type === 'warning');
      } else if (filter === 'info') {
        filtered = notifs.filter((n: Notification) => n.type === 'info');
      } else if (filter === 'reminder') {
        filtered = notifs.filter((n: Notification) => n.type === 'reminder');
      }

      setNotifications(filtered);
      setTotalCount(res.data.total);
    } catch (err: any) {
      console.error('Error fetching notifications:', err);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }

  async function fetchUnreadCount() {
    try {
      const res = await api.get('/api/notifications/count');
      setUnreadCount(res.data.count);
    } catch (err) {
      console.error('Error fetching unread count:', err);
    }
  }

  // Fetch recipients (interns/employees) from /api/personaldetails/filled
  async function fetchRecipients() {
    try {
      setRecipientsLoading(true);
      const res = await api.get('/api/personaldetails/filled');
      const raw = Array.isArray(res.data) ? res.data : res.data?.data || [];

      const verified = raw.filter(
        (item: any) => item.verification_status === 'VERIFIED' && item.user
      );

      const mapped: Recipient[] = verified.map((item: any) => {
        const user = item.user || {};
        const fullName = `${user.fname || ''} ${user.lname || ''}`.trim();
        return {
          user_id: item.user_id,
          name: fullName || user.email || 'Unknown User',
          email: user.email || '',
        };
      });

      setRecipients(mapped);
    } catch (err: any) {
      console.error('Error fetching recipients:', err);
      toast.error('Failed to load employees/interns for notifications');
    } finally {
      setRecipientsLoading(false);
    }
  }

  async function handleMarkRead(notification: Notification) {
    try {
      await api.put(`/api/notifications/${notification.id}/read`);
      setNotifications((notifs) =>
        notifs.map((n) =>
          n.id === notification.id
            ? { ...n, is_read: true, read_at: new Date().toISOString() }
            : n
        )
      );
      await fetchUnreadCount();
      toast.success('Notification marked as read');
    } catch (err: any) {
      console.error('Error marking read:', err);
      toast.error('Failed to mark notification as read');
    }
  }

  async function handleMarkUnread(notification: Notification) {
    try {
      await api.put(`/api/notifications/${notification.id}/unread`);
      setNotifications((notifs) =>
        notifs.map((n) =>
          n.id === notification.id ? { ...n, is_read: false, read_at: null } : n
        )
      );
      await fetchUnreadCount();
      toast.success('Notification marked as unread');
    } catch (err: any) {
      console.error('Error marking unread:', err);
      toast.error('Failed to mark notification as unread');
    }
  }

  async function handleMarkAllAsRead() {
    try {
      await api.put('/api/notifications/all/read');
      setNotifications((notifs) =>
        notifs.map((n) => ({
          ...n,
          is_read: true,
          read_at: new Date().toISOString(),
        }))
      );
      await fetchUnreadCount();
      toast.success('All notifications marked as read');
    } catch (err: any) {
      console.error('Error marking all as read:', err);
      toast.error('Failed to mark all as read');
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Are you sure you want to delete this notification?')) return;
    try {
      await api.delete(`/api/notifications/${id}`);
      setNotifications((notifs) => notifs.filter((n) => n.id !== id));
      toast.success('Notification deleted');
    } catch (err: any) {
      console.error('Error deleting notification:', err);
      toast.error('Failed to delete notification');
    }
  }

  function viewNotification(notification: Notification) {
    setSelectedNotification(notification);
    setDetailOpen(true);
    if (!notification.is_read) {
      handleMarkRead(notification);
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

  function getTypeColor(type: string): string {
    switch (type) {
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'info':
        return 'bg-blue-50 border-blue-200';
      case 'reminder':
        return 'bg-purple-50 border-purple-200';
      case 'urgent':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  }

  function getSeverityBadgeColor(severity?: string): string {
    switch (severity) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-orange-100 text-orange-800';
      case 'low':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  }

  function resetSendForm() {
    setSendForm({
      to_user_id: '',
      type: 'warning',
      title: '',
      message: '',
    });
  }

  async function handleSendNotification(e: React.FormEvent) {
    e.preventDefault();

    if (!sendForm.to_user_id) {
      toast.error('Please select an employee/intern');
      return;
    }
    if (!sendForm.message.trim()) {
      toast.error('Message is required');
      return;
    }

    try {
      setSending(true);

      await api.post('/api/notifications', {
        to_user_id: sendForm.to_user_id,
        target_id: null, // as per requirement
        type: sendForm.type,
        title: sendForm.title?.trim() || undefined,
        message: sendForm.message.trim(),
        meta: {
          source: 'manual',
          createdFrom: 'NotificationsPage',
        },
      });

      toast.success('Notification sent successfully');

      setSendOpen(false);
      resetSendForm();

      // Refresh notifications & unread count (if sending to self, etc.)
      await fetchNotifications();
      await fetchUnreadCount();
    } catch (err: any) {
      console.error('Error sending notification:', err);
      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        'Failed to send notification';
      toast.error(msg);
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-screen">
        <div className="text-gray-500">Loading notifications...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
              <p className="mt-2 text-gray-600">
                Manage your notifications and stay updated
              </p>
            </div>

            <div className="flex flex-col items-end gap-3">
              {unreadCount > 0 && (
                <div className="px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-600 font-medium">
                    {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                {unreadCount > 0 && (
                  <Button
                    onClick={handleMarkAllAsRead}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm text-sm"
                  >
                    Mark All as Read
                  </Button>
                )}
                {canSendNotification && (
                  <Button
                    onClick={() => setSendOpen(true)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-sm text-sm"
                  >
                    Send Notification
                  </Button>
                )}

              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-8">
            {(['all', 'unread', 'warning', 'info', 'reminder'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-all ${filter === f
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                  }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {notifications.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No notifications found</p>
            <p className="text-gray-400 text-sm mt-2">
              {filter === 'all'
                ? "You're all caught up!"
                : `No ${filter} notifications at this time`}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`border rounded-lg p-4 transition-all cursor-pointer hover:shadow-md ${notification.is_read
                    ? 'bg-white border-gray-200'
                    : `${getTypeColor(notification.type)} border-2`
                  }`}
              >
                <div className="flex gap-4">
                  {/* Icon */}
                  <div className="text-2xl flex-shrink-0">
                    {getTypeIcon(notification.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div
                        onClick={() => viewNotification(notification)}
                        className="flex-1"
                      >
                        <h3 className="font-semibold text-gray-900">
                          {notification.title ||
                            notification.type.charAt(0).toUpperCase() +
                            notification.type.slice(1)}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        <div className="flex gap-2 items-center mt-2 flex-wrap">
                          <span className="text-xs text-gray-500">
                            From: {notification.sender?.fname}{' '}
                            {notification.sender?.lname}
                          </span>
                          {notification.meta?.severity && (
                            <span
                              className={`text-xs px-2 py-1 rounded-full font-medium ${getSeverityBadgeColor(
                                notification.meta.severity
                              )}`}
                            >
                              {notification.meta.severity
                                .charAt(0)
                                .toUpperCase() +
                                notification.meta.severity.slice(1)}{' '}
                              Severity
                            </span>
                          )}
                          <span className="text-xs text-gray-400">
                            {formatDate(notification.created_at)}
                          </span>
                        </div>
                      </div>

                      {/* Read Status */}
                      {!notification.is_read && (
                        <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-1" />
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => viewNotification(notification)}
                      title="View details"
                      className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                    >
                      👁️
                    </button>
                    {!notification.is_read ? (
                      <button
                        onClick={() => handleMarkRead(notification)}
                        title="Mark as read"
                        className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all"
                      >
                        ✓
                      </button>
                    ) : (
                      <button
                        onClick={() => handleMarkUnread(notification)}
                        title="Mark as unread"
                        className="p-2 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all"
                      >
                        ↩️
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(notification.id)}
                      title="Delete"
                      className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <Dialog
        open={detailOpen}
        onClose={() => {
          setDetailOpen(false);
          setSelectedNotification(null);
        }}
        title="Notification Details"
      >
        {selectedNotification && (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex gap-4 items-start">
              <div className="text-4xl">
                {getTypeIcon(selectedNotification.type)}
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900">
                  {selectedNotification.title || selectedNotification.type}
                </h2>
                {selectedNotification.meta?.severity && (
                  <span
                    className={`inline-block mt-2 text-xs px-3 py-1 rounded-full font-medium ${getSeverityBadgeColor(
                      selectedNotification.meta.severity
                    )}`}
                  >
                    {selectedNotification.meta.severity
                      .charAt(0)
                      .toUpperCase() +
                      selectedNotification.meta.severity.slice(1)}{' '}
                    Severity
                  </span>
                )}
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">
                  {new Date(
                    selectedNotification.created_at
                  ).toLocaleString()}
                </p>
                {selectedNotification.read_at && (
                  <p className="text-xs text-gray-400 mt-1">
                    Read:{' '}
                    {new Date(
                      selectedNotification.read_at
                    ).toLocaleString()}
                  </p>
                )}
              </div>
            </div>

            {/* Message */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-gray-700 whitespace-pre-wrap">
                {selectedNotification.message}
              </p>
            </div>

            {/* Sender Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 font-medium">From</p>
                <p className="text-gray-900 font-medium">
                  {selectedNotification.sender?.fname}{' '}
                  {selectedNotification.sender?.lname}
                </p>
                <p className="text-sm text-gray-600">
                  {selectedNotification.sender?.email}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Type</p>
                <p className="text-gray-900 font-medium">
                  {selectedNotification.type.charAt(0).toUpperCase() +
                    selectedNotification.type.slice(1)}
                </p>
                <p className="text-sm text-gray-600">
                  {selectedNotification.is_read ? 'Read' : 'Unread'}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setDetailOpen(false);
                  setSelectedNotification(null);
                }}
                className="px-4 py-2"
              >
                Close
              </Button>
              {!selectedNotification.is_read && (
                <Button
                  onClick={() => {
                    handleMarkRead(selectedNotification);
                    setDetailOpen(false);
                    setSelectedNotification(null);
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm hover:shadow-md transition-all"
                >
                  Mark as Read
                </Button>
              )}
            </div>
          </div>
        )}
      </Dialog>

      {/* Send Notification Modal */}
      {canSendNotification && (
      <Dialog
        open={sendOpen}
        onClose={() => {
          setSendOpen(false);
          resetSendForm();
        }}
        title="Send Notification"
      >
        <form onSubmit={handleSendNotification} className="space-y-6">
          {/* Employee Select */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Select Employee / Intern <span className="text-red-500">*</span>
            </label>
            <select
              value={sendForm.to_user_id}
              onChange={(e) =>
                setSendForm((prev) => ({ ...prev, to_user_id: e.target.value }))
              }
              required
              className="w-full rounded-lg border border-gray-300 shadow-sm px-4 py-2 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm"
            >
              <option value="">
                {recipientsLoading ? 'Loading...' : 'Choose a user'}
              </option>
              {recipients.map((r) => (
                <option key={r.user_id} value={r.user_id}>
                  {r.name} {r.email ? `(${r.email})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Type Select */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Notification Type <span className="text-red-500">*</span>
            </label>
            <select
              value={sendForm.type}
              onChange={(e) =>
                setSendForm((prev) => ({
                  ...prev,
                  type: e.target.value as NotificationType,
                }))
              }
              required
              className="w-full rounded-lg border border-gray-300 shadow-sm px-4 py-2 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm"
            >
              <option value="warning">Warning</option>
              <option value="info">Info</option>
              <option value="reminder">Reminder</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Title (optional)
            </label>
            <input
              type="text"
              value={sendForm.title}
              onChange={(e) =>
                setSendForm((prev) => ({ ...prev, title: e.target.value }))
              }
              placeholder="e.g. Performance Warning, Daily Reminder"
              className="w-full rounded-lg border border-gray-300 shadow-sm px-4 py-2 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm"
            />
          </div>

          {/* Message */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Message <span className="text-red-500">*</span>
            </label>
            <textarea
              value={sendForm.message}
              onChange={(e) =>
                setSendForm((prev) => ({ ...prev, message: e.target.value }))
              }
              rows={4}
              required
              className="w-full rounded-lg border border-gray-300 shadow-sm px-4 py-2 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm"
              placeholder="Write the notification message you want to send..."
            />
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setSendOpen(false);
                resetSendForm();
              }}
              className="px-4 py-2"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={sending}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-sm hover:shadow-md transition-all disabled:opacity-60"
            >
              {sending ? 'Sending...' : 'Send Notification'}
            </Button>
          </div>
        </form>
      </Dialog>
      )}
    </div>
  );
}
