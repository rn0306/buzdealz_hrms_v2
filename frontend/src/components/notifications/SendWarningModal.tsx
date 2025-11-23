// components/notifications/SendWarningModal.tsx
import { useState } from 'react';
import Dialog from '../ui/Dialog';
import Button from '../ui/Button';
import { api } from '../../lib/api';
import { toast } from 'sonner';

interface SendWarningModalProps {
  open: boolean;
  onClose: () => void;
  toUserId: string;
  targetId: string;
  employeeName?: string;
  targetDescription?: string;
}

export default function SendWarningModal({
  open,
  onClose,
  toUserId,
  targetId,
  employeeName,
  targetDescription,
}: SendWarningModalProps) {
  const [title, setTitle] = useState('Target Warning');
  const [message, setMessage] = useState('');
  const [severity, setSeverity] = useState<'low' | 'medium' | 'high'>('medium');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!message.trim()) {
      toast.error('Message is required');
      return;
    }

    setLoading(true);
    try {
      await api.post('/api/notifications', {
        to_user_id: toUserId,
        target_id: targetId,
        type: 'warning',
        title,
        message,
        meta: {
          severity,
        },
      });

      toast.success('Warning sent successfully');
      resetForm();
      onClose();
    } catch (err: any) {
      console.error('Error sending warning:', err);
      toast.error(err.response?.data?.error || 'Failed to send warning');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTitle('Target Warning');
    setMessage('');
    setSeverity('medium');
  };

  return (
    <Dialog
      open={open}
      onClose={() => {
        resetForm();
        onClose();
      }}
      title="Send Warning"
    >
      <div className="space-y-6">
        {/* Context Info */}
        {(employeeName || targetDescription) && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            {employeeName && (
              <div>
                <p className="text-xs text-blue-600 font-medium">Employee</p>
                <p className="text-sm font-semibold text-blue-900">{employeeName}</p>
              </div>
            )}
            {targetDescription && (
              <div className="mt-2">
                <p className="text-xs text-blue-600 font-medium">Target</p>
                <p className="text-sm font-semibold text-blue-900">{targetDescription}</p>
              </div>
            )}
          </div>
        )}

        {/* Title Field */}
        <div className="space-y-2">
          <label className="block font-medium text-gray-700">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Target Warning"
            className="w-full rounded-lg border border-gray-300 shadow-sm px-4 py-2 focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500"
          />
        </div>

        {/* Severity Level */}
        <div className="space-y-2">
          <label className="block font-medium text-gray-700">
            Severity Level
          </label>
          <div className="flex gap-3">
            {(['low', 'medium', 'high'] as const).map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => setSeverity(level)}
                className={`flex-1 px-3 py-2 rounded-lg font-medium text-sm border-2 transition-all ${
                  severity === level
                    ? level === 'low'
                      ? 'bg-yellow-50 border-yellow-400 text-yellow-700'
                      : level === 'medium'
                        ? 'bg-orange-50 border-orange-400 text-orange-700'
                        : 'bg-red-50 border-red-400 text-red-700'
                    : 'bg-white border-gray-300 text-gray-600 hover:border-gray-400'
                }`}
              >
                {level.charAt(0).toUpperCase() + level.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Message Field */}
        <div className="space-y-2">
          <label className="block font-medium text-gray-700">
            Message <span className="text-red-500">*</span>
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter your warning message here..."
            rows={6}
            className="w-full rounded-lg border border-gray-300 shadow-sm px-4 py-2 focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 resize-none"
          />
          <div className="text-xs text-gray-500">
            {message.length} / 1000 characters
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              resetForm();
              onClose();
            }}
            disabled={loading}
            className="px-4 py-2"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSend}
            disabled={loading || !message.trim()}
            className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white font-medium rounded-lg shadow-sm hover:shadow-md transition-all disabled:opacity-50"
          >
            {loading ? 'Sending...' : 'Send Warning'}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
