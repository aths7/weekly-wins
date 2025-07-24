'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/hooks/useAuth';

export default function NotificationRedirectPage() {
  const params = useParams();
  const router = useRouter();
  const notificationId = params.id as string;
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    redirectToAction();
  }, [user, notificationId]);

  const redirectToAction = async () => {
    try {
      // Get notification details
      const { data: notification, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('id', notificationId)
        .eq('user_id', user?.id)
        .single();

      if (error || !notification) {
        console.error('Notification not found:', error);
        router.push('/notifications');
        return;
      }

      // Mark as read
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      // Redirect based on action_url or type
      if (notification.action_url) {
        router.push(notification.action_url);
      } else {
        // Fallback based on notification type
        switch (notification.type) {
          case 'join_request':
            router.push('/admin/requests');
            break;
          case 'invitation':
            router.push('/notifications');
            break;
          case 'request_approved':
          case 'request_rejected':
            router.push('/dashboard');
            break;
          default:
            router.push('/notifications');
        }
      }
    } catch (error) {
      console.error('Error processing notification:', error);
      router.push('/notifications');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Processing notification...</p>
        </div>
      </div>
    </div>
  );
}