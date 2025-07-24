'use client';

import { useEffect, useState } from 'react';
import { Users, Clock, ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useOrganizations } from '@/lib/hooks/useOrganizations';
import { useJoinRequests } from '@/lib/hooks/useNotifications';
import AuthGuard from '@/components/auth/AuthGuard';
import MainLayout from '@/components/layout/MainLayout';
import JoinRequestNotification from '@/components/notifications/JoinRequestNotification';
import Link from 'next/link';

export default function AdminRequestsPage() {
  const { currentOrganization, hasPermission } = useOrganizations();
  const { requests, loading, error } = useJoinRequests(currentOrganization?.id);

  // Debug logging
  console.log('AdminRequestsPage Debug:', {
    currentOrganization,
    hasPermission: hasPermission('manage'),
    requests,
    loading,
    error
  });

  // Additional debug to compare with notification center
  useEffect(() => {
    const testNotificationQuery = async () => {
      if (!currentOrganization?.id) return;
      
      console.log('=== COMPARING QUERIES ===');
      
      // Test 1: Same query as notification center (general notifications)
      const { data: { user: authUser } } = await supabase.auth.getUser();
      const { data: notifications, error: notifError } = await supabase
        .from('user_notifications_with_context')
        .select('*')
        .eq('user_id', authUser?.id)
        .eq('type', 'join_request');
      
      console.log('Notification center style query:', { notifications, notifError });
      
      // Test 2: Join requests query with different approaches
      const { data: directQuery, error: directError } = await supabase
        .from('organization_join_requests')
        .select(`*, profiles!organization_join_requests_user_id_fkey(full_name, email)`)
        .eq('organization_id', currentOrganization.id);
        
      console.log('Direct query (all statuses):', { directQuery, directError, orgId: currentOrganization.id });
      
      // Test 3: Check if admin is authenticated
      const { data: { user } } = await supabase.auth.getUser();
      console.log('Current auth user:', user?.id);
      
      // Test 4: Check admin's membership in this org
      const { data: membership, error: memberError } = await supabase
        .from('organization_memberships')
        .select('*')
        .eq('user_id', user?.id)
        .eq('organization_id', currentOrganization.id);
        
      console.log('Admin membership check:', { membership, memberError });
    };
    
    testNotificationQuery();
  }, [currentOrganization?.id]);

  // Test multiple queries to debug
  useEffect(() => {
    const debugQueries = async () => {
      if (currentOrganization?.id) {
        console.log('=== ADMIN REQUESTS DEBUG ===');
        console.log('Organization ID:', currentOrganization.id);
        console.log('Has permission:', hasPermission('manage'));
        
        try {
          // Query 1: All join requests for this org (any status)
          const { data: allRequests, error: allError } = await supabase
            .from('organization_join_requests')
            .select(`*, profiles!organization_join_requests_user_id_fkey(full_name, email)`)
            .eq('organization_id', currentOrganization.id);
          
          console.log('All requests for org:', { 
            orgId: currentOrganization.id,
            orgName: currentOrganization.name,
            data: allRequests, 
            error: allError 
          });
          
          // Query 2: Only pending requests
          const { data: pendingRequests, error: pendingError } = await supabase
            .from('organization_join_requests')
            .select(`*, profiles!organization_join_requests_user_id_fkey(full_name, email)`)
            .eq('organization_id', currentOrganization.id)
            .eq('status', 'pending');
          
          console.log('Pending requests:', { 
            orgId: currentOrganization.id,
            data: pendingRequests, 
            error: pendingError 
          });

          // Query 3: Test the exact request we know exists
          const { data: specificRequest, error: specificError } = await supabase
            .from('organization_join_requests')
            .select(`*, profiles!organization_join_requests_user_id_fkey(full_name, email)`)
            .eq('organization_id', '13ffe779-f1b9-4c3a-9b86-c375b7f0857f')
            .eq('status', 'pending');
          
          console.log('Specific known request:', { 
            data: specificRequest, 
            error: specificError 
          });
          
          // Query 4: Check what the hook is returning
          console.log('Hook data:', { requests, loading, error });
          
        } catch (e) {
          console.error('Debug queries error:', e);
        }
      }
    };
    debugQueries();
  }, [currentOrganization?.id, requests, loading, error]);

  // Redirect if not admin
  if (!hasPermission('manage')) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-muted-foreground mb-6">
            You don't have permission to view this page. Only organization admins can manage join requests.
          </p>
          <Link href="/dashboard" className="btn-primary">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading join requests...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AuthGuard>
      <MainLayout>
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/admin"
            className="p-2 hover:bg-muted rounded-md transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Join Requests</h1>
            <p className="text-muted-foreground">
              Manage pending membership requests for {currentOrganization?.name}
            </p>
          </div>
        </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-5 h-5 text-orange-500" />
            <h3 className="font-semibold">Pending Requests</h3>
          </div>
          <p className="text-2xl font-bold text-orange-500">{requests.length}</p>
          <p className="text-sm text-muted-foreground">Awaiting your review</p>
        </div>
        
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">Organization</h3>
          </div>
          <p className="text-lg font-bold text-primary">{currentOrganization?.name}</p>
          <p className="text-sm text-muted-foreground">@{currentOrganization?.slug}</p>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-5 h-5 text-green-500" />
            <h3 className="font-semibold">Quick Actions</h3>
          </div>
          <div className="space-y-2">
            <Link
              href="/admin"
              className="block text-sm text-primary hover:text-primary/80"
            >
              Manage Members →
            </Link>
            <Link
              href="/admin"
              className="block text-sm text-primary hover:text-primary/80"
            >
              Admin Dashboard →
            </Link>
          </div>
        </div>
      </div>

      {/* Join Requests */}
      <div className="space-y-6">
        {requests.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No pending requests</h3>
            <p className="text-muted-foreground">
              All caught up! There are no pending join requests to review.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <h2 className="text-lg font-semibold mb-2">Pending Requests</h2>
              <p className="text-sm text-muted-foreground">
                Review and respond to membership requests below
              </p>
            </div>
            
            {requests.map((request) => (
              <JoinRequestNotification
                key={request.id}
                request={request as any} // Type assertion to handle the join
              />
            ))}
          </>
        )}
      </div>
      </MainLayout>
    </AuthGuard>
  );
}