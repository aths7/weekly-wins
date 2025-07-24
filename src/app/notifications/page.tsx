'use client';

import { useState } from 'react';
import { Bell, Check, Filter, Users, UserPlus, Award, Building2, X, Clock } from 'lucide-react';
import { useNotifications } from '@/lib/hooks/useNotifications';
import { UserNotificationWithContext } from '@/lib/supabase/database.types';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

export default function NotificationsPage() {
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead, deleteNotification } = useNotifications();
  const [filter, setFilter] = useState<'all' | 'unread' | 'join_request' | 'invitation'>('all');

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'invitation':
        return <UserPlus className="w-5 h-5 text-blue-500" />;
      case 'join_request':
        return <Users className="w-5 h-5 text-orange-500" />;
      case 'request_approved':
        return <Check className="w-5 h-5 text-green-500" />;
      case 'request_rejected':
        return <X className="w-5 h-5 text-red-500" />;
      case 'entry_approved':
        return <Award className="w-5 h-5 text-green-500" />;
      case 'entry_rejected':
        return <X className="w-5 h-5 text-red-500" />;
      case 'organization_update':
        return <Building2 className="w-5 h-5 text-blue-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
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

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !notification.is_read;
    return notification.type === filter;
  });

  const handleNotificationClick = async (notification: UserNotificationWithContext) => {
    // Mark as read if unread
    if (!notification.is_read) {
      await markAsRead([notification.id]);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading notifications...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Notifications</h1>
          <p className="text-muted-foreground mt-2">
            Stay updated with all your organization activities
          </p>
        </div>
        
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            <Check className="w-4 h-4" />
            Mark All Read ({unreadCount})
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 mb-6 p-1 bg-muted rounded-lg">
        {[
          { key: 'all', label: 'All', count: notifications.length },
          { key: 'unread', label: 'Unread', count: unreadCount },
          { key: 'join_request', label: 'Join Requests', count: notifications.filter(n => n.type === 'join_request').length },
          { key: 'invitation', label: 'Invitations', count: notifications.filter(n => n.type === 'invitation').length },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key as any)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === tab.key
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label} {tab.count > 0 && `(${tab.count})`}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      {filteredNotifications.length === 0 ? (
        <div className="text-center py-12">
          <Bell className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No notifications found</h3>
          <p className="text-muted-foreground">
            {filter === 'unread' 
              ? 'All caught up! No unread notifications.' 
              : filter === 'all'
              ? 'You don\'t have any notifications yet.'
              : `No ${filter.replace('_', ' ')} notifications found.`
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredNotifications.map((notification) => (
            <NotificationCard
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
  );
}

interface NotificationCardProps {
  notification: UserNotificationWithContext;
  onClick: () => void;
  onDelete: () => void;
  getIcon: (type: string) => React.ReactNode;
  getColor: (type: string) => string;
}

function NotificationCard({ notification, onClick, onDelete, getIcon, getColor }: NotificationCardProps) {
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
      className={`bg-card border border-border rounded-lg p-6 hover:bg-muted/30 transition-colors border-l-4 ${getColor(notification.type)} ${
        !notification.is_read ? 'ring-1 ring-primary/20' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 mt-1">
          {getIcon(notification.type)}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <h3 className="font-semibold text-foreground mb-1">
                {notification.title}
              </h3>
              <p className="text-sm text-muted-foreground">
                {notification.message}
              </p>
            </div>
            
            <div className="flex items-center gap-2 ml-4">
              {!notification.is_read && (
                <div className="w-2 h-2 bg-primary rounded-full"></div>
              )}
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Delete notification"
              >
                {isDeleting ? (
                  <div className="w-4 h-4 animate-spin rounded-full border border-current border-t-transparent"></div>
                ) : (
                  <X className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              {notification.organization_name && (
                <div className="flex items-center gap-1">
                  <Building2 className="w-3 h-3" />
                  {notification.organization_name}
                </div>
              )}
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
              </div>
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
      <Link href={notification.action_url} className="block">
        {content}
      </Link>
    );
  }

  return <div className="cursor-pointer">{content}</div>;
}