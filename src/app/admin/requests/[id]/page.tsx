'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, User, Clock, MessageSquare, Check, X } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useOrganizations } from '@/lib/hooks/useOrganizations';
import { useJoinRequests } from '@/lib/hooks/useNotifications';
import AuthGuard from '@/components/auth/AuthGuard';
import MainLayout from '@/components/layout/MainLayout';
import { OrganizationJoinRequest } from '@/lib/supabase/database.types';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

interface RequestWithProfile extends OrganizationJoinRequest {
  profiles: {
    full_name: string | null;
    email: string;
    avatar_url: string | null;
  } | null;
}

export default function AdminRequestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const requestId = params.id as string;
  
  const { currentOrganization, hasPermission } = useOrganizations();
  const { respondToJoinRequest } = useJoinRequests();
  
  const [request, setRequest] = useState<RequestWithProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [responding, setResponding] = useState<'approving' | 'rejecting' | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');

  useEffect(() => {
    if (requestId) {
      fetchRequest();
    }
  }, [requestId]);

  const fetchRequest = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('organization_join_requests')
        .select(`
          *,
          profiles!organization_join_requests_user_id_fkey (full_name, email, avatar_url)
        `)
        .eq('id', requestId)
        .single();

      if (fetchError) throw fetchError;

      // Check if request belongs to current organization
      if (data && currentOrganization && data.organization_id !== currentOrganization.id) {
        setError('Request not found or access denied');
        return;
      }

      setRequest(data);
    } catch (err) {
      console.error('Error fetching request:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch request');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!request) return;
    
    setResponding('approving');
    
    try {
      await respondToJoinRequest(request.id, 'approved');
      router.push('/admin/requests');
    } catch (error) {
      console.error('Failed to approve request:', error);
      setError('Failed to approve request');
    } finally {
      setResponding(null);
    }
  };

  const handleReject = async () => {
    if (!request) return;
    
    setResponding('rejecting');
    
    try {
      await respondToJoinRequest(request.id, 'rejected', adminNotes);
      setShowRejectModal(false);
      router.push('/admin/requests');
    } catch (error) {
      console.error('Failed to reject request:', error);
      setError('Failed to reject request');
    } finally {
      setResponding(null);
    }
  };

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
            <p className="text-muted-foreground">Loading request...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Link href="/admin/requests" className="btn-primary">
            Back to Requests
          </Link>
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Request Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The join request you're looking for doesn't exist or has been removed.
          </p>
          <Link href="/admin/requests" className="btn-primary">
            Back to Requests
          </Link>
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
            href="/admin/requests"
            className="p-2 hover:bg-muted rounded-md transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Join Request Details</h1>
            <p className="text-muted-foreground">
              Review and respond to membership request
            </p>
          </div>
        </div>

      {/* Request Card */}
      <div className="max-w-2xl mx-auto">
        <div className="bg-card border border-border rounded-lg p-6">
          {/* User Info */}
          <div className="flex items-start gap-4 mb-6">
            <div className="flex-shrink-0">
              {request.profiles?.avatar_url ? (
                <img
                  src={request.profiles.avatar_url}
                  alt={request.profiles.full_name || 'User'}
                  className="w-16 h-16 rounded-full"
                />
              ) : (
                <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center">
                  <User className="w-8 h-8 text-orange-600 dark:text-orange-400" />
                </div>
              )}
            </div>
            
            <div className="flex-1">
              <h2 className="text-xl font-semibold mb-2">
                {request.profiles?.full_name || 'Unknown User'}
              </h2>
              <p className="text-muted-foreground mb-2">
                {request.profiles?.email}
              </p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>
                  Requested {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
                </span>
              </div>
            </div>

            <div className="flex-shrink-0">
              <span className="px-3 py-1 text-sm bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 rounded-full">
                {request.status === 'pending' ? 'Pending Review' : request.status}
              </span>
            </div>
          </div>

          {/* Organization Info */}
          <div className="mb-6 p-4 bg-muted/50 rounded-lg">
            <h3 className="font-medium mb-2">Organization</h3>
            <p className="text-sm text-muted-foreground">
              User wants to join <span className="font-medium text-foreground">{currentOrganization?.name}</span>
            </p>
          </div>

          {/* User Message */}
          {request.message && (
            <div className="mb-6 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-start gap-2 mb-2">
                <MessageSquare className="w-4 h-4 text-muted-foreground mt-0.5" />
                <h3 className="font-medium">Message from User</h3>
              </div>
              <p className="text-sm text-foreground pl-6">
                "{request.message}"
              </p>
            </div>
          )}

          {/* Actions */}
          {request.status === 'pending' && (
            <div className="flex gap-3 pt-4 border-t border-border">
              <button
                onClick={handleApprove}
                disabled={responding !== null}
                className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md transition-colors disabled:opacity-50 flex-1"
              >
                {responding === 'approving' ? (
                  <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                ) : (
                  <Check className="w-4 h-4" />
                )}
                Approve Request
              </button>
              
              <button
                onClick={() => setShowRejectModal(true)}
                disabled={responding !== null}
                className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-md transition-colors disabled:opacity-50 flex-1"
              >
                <X className="w-4 h-4" />
                Reject Request
              </button>
            </div>
          )}

          {/* Already processed */}
          {request.status !== 'pending' && (
            <div className="pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground">
                This request has been {request.status}.
                {request.reviewed_at && (
                  <span className="block mt-1">
                    Reviewed {formatDistanceToNow(new Date(request.reviewed_at), { addSuffix: true })}
                  </span>
                )}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background border border-border rounded-lg max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Reject Join Request</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Are you sure you want to reject this request from{' '}
                <span className="font-medium">
                  {request.profiles?.full_name || request.profiles?.email}
                </span>?
              </p>
              
              <div className="mb-4">
                <label htmlFor="admin-notes" className="block text-sm font-medium mb-2">
                  Optional note to user:
                </label>
                <textarea
                  id="admin-notes"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Reason for rejection..."
                  rows={3}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder-muted-foreground resize-none"
                />
              </div>

              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setAdminNotes('');
                  }}
                  disabled={responding !== null}
                  className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={responding !== null}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-md transition-colors disabled:opacity-50"
                >
                  {responding === 'rejecting' ? (
                    <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  ) : (
                    <X className="w-4 h-4" />
                  )}
                  Reject Request
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </MainLayout>
    </AuthGuard>
  );
}