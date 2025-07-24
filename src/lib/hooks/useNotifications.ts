'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/hooks/useAuth';
import { 
  UserNotificationWithContext,
  OrganizationInvitation,
  OrganizationJoinRequest 
} from '@/lib/supabase/database.types';

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<UserNotificationWithContext[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('user_notifications_with_context')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (fetchError) throw fetchError;

      setNotifications(data || []);
      
      // Calculate unread count
      const unread = (data || []).filter(n => !n.is_read).length;
      setUnreadCount(unread);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const markAsRead = async (notificationIds: string[]) => {
    try {
      const { error } = await supabase.rpc('mark_notifications_read', {
        notification_ids: notificationIds
      });

      if (error) throw error;

      // Update local state
      setNotifications(prev => prev.map(n => 
        notificationIds.includes(n.id) ? { ...n, is_read: true } : n
      ));

      // Update unread count
      const newUnreadCount = notifications.filter(n => 
        !notificationIds.includes(n.id) && !n.is_read
      ).length;
      setUnreadCount(newUnreadCount);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark notifications as read');
      throw err;
    }
  };

  const markAllAsRead = async () => {
    const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
    if (unreadIds.length > 0) {
      await markAsRead(unreadIds);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', user?.id);

      if (error) throw error;

      // Update local state
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      
      // Update unread count if deleted notification was unread
      const deletedNotification = notifications.find(n => n.id === notificationId);
      if (deletedNotification && !deletedNotification.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete notification');
      throw err;
    }
  };

  // Set up real-time subscription
  useEffect(() => {
    if (!user) return;

    fetchNotifications();

    // Subscribe to new notifications
    const subscription = supabase
      .channel('user-notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          // Refetch notifications when changes occur
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user, fetchNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refetch: fetchNotifications,
  };
}

export function useInvitations() {
  const { user } = useAuth();
  const [invitations, setInvitations] = useState<OrganizationInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInvitations = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('organization_invitations')
        .select(`
          *,
          organizations (name, slug, logo_url),
          inviter:profiles!organization_invitations_invited_by_fkey (full_name, avatar_url)
        `)
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setInvitations(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch invitations');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const respondToInvitation = async (invitationId: string, response: 'accepted' | 'declined') => {
    try {
      const { error } = await supabase.rpc('respond_to_invitation', {
        invitation_id: invitationId,
        response
      });

      if (error) throw error;

      // Remove invitation from local state
      setInvitations(prev => prev.filter(inv => inv.id !== invitationId));
      
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to respond to invitation');
      throw err;
    }
  };

  useEffect(() => {
    fetchInvitations();
  }, [fetchInvitations]);

  return {
    invitations,
    loading,
    error,
    respondToInvitation,
    refetch: fetchInvitations,
  };
}

export function useJoinRequests(organizationId?: string) {
  const { user } = useAuth();
  const [requests, setRequests] = useState<OrganizationJoinRequest[]>([]);
  const [userRequest, setUserRequest] = useState<OrganizationJoinRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      console.log('useJoinRequests fetchRequests called with:', { organizationId, user: user.id });

      if (organizationId) {
        // Fetch requests for organization (admin view) - FIXED: Filter by organization_id, not user_id
        console.log('Fetching admin requests for org:', organizationId);
        
        // Debug: Check auth state first
        const { data: { user: authUser } } = await supabase.auth.getUser();
        console.log('Auth user in hook:', authUser?.id);
        
        // Debug: Try query without status filter first
        const { data: allData, error: allError } = await supabase
          .from('organization_join_requests')
          .select(`
            *,
            profiles!organization_join_requests_user_id_fkey (full_name, email, avatar_url)
          `)
          .eq('organization_id', organizationId)
          .order('created_at', { ascending: false });
          
        console.log('All requests for org (no status filter):', { data: allData, error: allError });
        
        // Now the main query with status filter
        const { data, error: fetchError } = await supabase
          .from('organization_join_requests')
          .select(`
            *,
            profiles!organization_join_requests_user_id_fkey (full_name, email, avatar_url)
          `)
          .eq('organization_id', organizationId)
          .eq('status', 'pending')
          .order('created_at', { ascending: false });

        console.log('useJoinRequests admin fetch result (pending only):', { data, error: fetchError, organizationId });

        if (fetchError) {
          console.log('First query failed, error:', fetchError);
          throw fetchError;
        }
        
        setRequests(data || []);
      } else {
        // Fetch user's own requests
        console.log('Fetching user requests for user:', user.id);
        const { data, error: fetchError } = await supabase
          .from('organization_join_requests')
          .select(`
            *,
            organizations (name, slug, logo_url)
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        console.log('useJoinRequests user fetch result:', { data, error: fetchError, userId: user.id });

        if (fetchError) throw fetchError;
        setUserRequest(data?.[0] || null);
      }
    } catch (err) {
      console.error('useJoinRequests error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch join requests');
    } finally {
      setLoading(false);
    }
  }, [user, organizationId]);

  const submitJoinRequest = async (orgId: string, message?: string) => {
    try {
      const { data, error } = await supabase.rpc('submit_join_request', {
        org_id: orgId,
        request_message: message
      });

      if (error) throw error;

      // Refresh requests
      await fetchRequests();
      
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit join request');
      throw err;
    }
  };

  const respondToJoinRequest = async (requestId: string, response: 'approved' | 'rejected', adminNotes?: string) => {
    try {
      const { error } = await supabase.rpc('respond_to_join_request', {
        request_id: requestId,
        response,
        admin_notes: adminNotes
      });

      if (error) throw error;

      // Remove request from local state
      setRequests(prev => prev.filter(req => req.id !== requestId));
      
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to respond to join request');
      throw err;
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  return {
    requests,
    userRequest,
    loading,
    error,
    submitJoinRequest,
    respondToJoinRequest,
    refetch: fetchRequests,
  };
}

export function useNotificationPreferences() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState({
    push_enabled: true,
    sound_enabled: true,
    invitation_notifications: true,
    request_notifications: true,
    approval_notifications: true,
    system_notifications: true,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPreferences = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      if (data) {
        setPreferences({
          push_enabled: data.push_enabled,
          sound_enabled: data.sound_enabled,
          invitation_notifications: data.invitation_notifications,
          request_notifications: data.request_notifications,
          approval_notifications: data.approval_notifications,
          system_notifications: data.system_notifications,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch notification preferences');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const updatePreferences = async (updates: Partial<typeof preferences>) => {
    if (!user) return;

    try {
      const newPreferences = { ...preferences, ...updates };

      const { error } = await supabase
        .from('notification_preferences')
        .upsert({
          user_id: user.id,
          ...newPreferences,
        });

      if (error) throw error;

      setPreferences(newPreferences);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update notification preferences');
      throw err;
    }
  };

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  return {
    preferences,
    loading,
    error,
    updatePreferences,
    refetch: fetchPreferences,
  };
}