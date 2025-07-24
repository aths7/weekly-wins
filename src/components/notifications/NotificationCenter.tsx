'use client';

import { useState, useRef, useEffect } from 'react';
import { Bell, Check, X, Clock, Users, UserPlus, Award, Building2 } from 'lucide-react';
import { useNotifications } from '@/lib/hooks/useNotifications';
import { UserNotificationWithContext } from '@/lib/supabase/database.types';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

export default function NotificationCenter() {
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead, deleteNotification } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredNotifications = notifications.filter(notification => 
    filter === 'all' || !notification.is_read
  );

  const handleNotificationClick = async (notification: UserNotificationWithContext) => {
    // Mark as read if unread
    if (!notification.is_read) {
      await markAsRead([notification.id]);
    }

    // Navigate to action URL if provided
    if (notification.action_url) {
      setIsOpen(false);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'invitation':
        return <UserPlus className="w-4 h-4 text-blue-500" />;
      case 'join_request':
        return <Users className="w-4 h-4 text-orange-500" />;
      case 'request_approved':
        return <Check className="w-4 h-4 text-green-500" />;
      case 'request_rejected':
        return <X className="w-4 h-4 text-red-500" />;
      case 'entry_approved':
        return <Award className="w-4 h-4 text-green-500" />;
      case 'entry_rejected':
        return <X className="w-4 h-4 text-red-500" />;
      case 'organization_update':
        return <Building2 className="w-4 h-4 text-blue-500" />;
      default:
        return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'invitation':
      case 'organization_update':
        return 'border-l-blue-500';
      case 'join_request':
        return 'border-l-orange-500';
      case 'request_approved':
      case 'entry_approved':
        return 'border-l-green-500';
      case 'request_rejected':
      case 'entry_rejected':
        return 'border-l-red-500';
      default:
        return 'border-l-gray-500';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Notification Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-background border border-border rounded-lg shadow-lg z-50 max-h-[80vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h3 className="font-semibold">Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-primary hover:text-primary/80 flex items-center gap-1"
                >
                  <Check className="w-3 h-3" />
                  Mark all read
                </button>
              )}
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex border-b border-border">
            <button
              onClick={() => setFilter('all')}
              className={`flex-1 px-4 py-2 text-sm font-medium ${
                filter === 'all' 
                  ? 'text-primary border-b-2 border-primary' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`flex-1 px-4 py-2 text-sm font-medium ${
                filter === 'unread' 
                  ? 'text-primary border-b-2 border-primary' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-muted-foreground">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                Loading notifications...
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">
                  {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {filteredNotifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onClick={() => handleNotificationClick(notification)}
                    onDelete={() => deleteNotification(notification.id)}
                    getIcon={getNotificationIcon}
                    getColor={getNotificationColor}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-border">
              <Link
                href="/notifications"
                className="text-sm text-primary hover:text-primary/80 font-medium"
                onClick={() => setIsOpen(false)}
              >
                View all notifications →
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface NotificationItemProps {
  notification: UserNotificationWithContext;
  onClick: () => void;
  onDelete: () => void;
  getIcon: (type: string) => React.ReactNode;
  getColor: (type: string) => string;
}

function NotificationItem({ notification, onClick, onDelete, getIcon, getColor }: NotificationItemProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDeleting(true);
    try {
      await onDelete();
    } catch (error) {
      setIsDeleting(false);
    }
  };

  const content = (
    <div
      className={`p-4 hover:bg-muted/50 cursor-pointer transition-colors border-l-4 ${getColor(notification.type)} ${
        !notification.is_read ? 'bg-muted/30' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {getIcon(notification.type)}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground mb-1">
                {notification.title}
              </p>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {notification.message}
              </p>
              
              {notification.organization_name && (
                <div className="flex items-center gap-1 mt-1">
                  <Building2 className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    {notification.organization_name}
                  </span>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-1 ml-2">
              {!notification.is_read && (
                <div className="w-2 h-2 bg-primary rounded-full"></div>
              )}
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="p-1 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Delete notification"
              >
                {isDeleting ? (
                  <div className="w-3 h-3 animate-spin rounded-full border border-current border-t-transparent"></div>
                ) : (
                  <X className="w-3 h-3" />
                )}
              </button>
            </div>
          </div>
          
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
            </div>
            
            {notification.expires_at && new Date(notification.expires_at) > new Date() && (
              <span className="text-xs text-orange-500">
                Expires {formatDistanceToNow(new Date(notification.expires_at), { addSuffix: true })}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  if (notification.action_url) {
    return (
      <Link href={notification.action_url} className="block group">
        {content}
      </Link>
    );
  }

  return <div className="group">{content}</div>;
}