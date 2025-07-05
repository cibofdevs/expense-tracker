import { format } from 'date-fns';
import { X } from 'lucide-react';
import type { Notification } from '../types';

type NotificationListProps = {
  notifications: Notification[];
  onClose: () => void;
  onMarkAsRead: (id: string) => void;
};

export function NotificationList({ notifications, onClose, onMarkAsRead }: NotificationListProps) {
  return (
    <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700 transition-colors duration-300">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Notifications
        </h3>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="divide-y divide-gray-200 dark:divide-gray-700 max-h-96 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-4 text-center text-gray-500 dark:text-gray-400">
            No notifications
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 ${
                notification.read
                  ? 'bg-white dark:bg-gray-800'
                  : 'bg-blue-50 dark:bg-gray-700'
              } hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-300 cursor-pointer`}
              onClick={() => onMarkAsRead(notification.id)}
            >
              <div className="flex justify-between items-start">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                  {notification.title}
                </h4>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {format(new Date(notification.created_at), 'MMM d, h:mm a')}
                </span>
              </div>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                {notification.message}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}