'use client';

import { useState } from 'react';
import { Check, X, Users, MessageSquare, Clock, User } from 'lucide-react';
import { useJoinRequests } from '@/lib/hooks/useNotifications';
import { OrganizationJoinRequest } from '@/lib/supabase/database.types';
import { formatDistanceToNow } from 'date-fns';

interface JoinRequestNotificationProps {
  request: OrganizationJoinRequest & {
    profiles: {
      full_name: string | null;
      email: string;
      avatar_url: string | null;
    } | null;
  };
}

export default function JoinRequestNotification({ request }: JoinRequestNotificationProps) {
  const { respondToJoinRequest } = useJoinRequests();
  const [responding, setResponding] = useState<'approving' | 'rejecting' | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');

  const handleApprove = async () => {
    setResponding('approving');
    
    try {
      await respondToJoinRequest(request.id, 'approved');
    } catch (error) {
      console.error('Failed to approve request:', error);
    } finally {
      setResponding(null);
    }
  };

  const handleReject = async () => {
    setResponding('rejecting');
    
    try {
      await respondToJoinRequest(request.id, 'rejected', adminNotes);
      setShowRejectModal(false);
      setAdminNotes('');
    } catch (error) {
      console.error('Failed to reject request:', error);
    } finally {
      setResponding(null);
    }
  };

  return (
    <>
      <div className="p-4 border border-border rounded-lg">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            {request.profiles?.avatar_url ? (
              <img
                src={request.profiles.avatar_url}
                alt={request.profiles.full_name || 'User'}
                className="w-10 h-10 rounded-full"
              />
            ) : (
              <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-foreground">
                New member request
              </h3>
              <span className="px-2 py-1 text-xs bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 rounded">
                Pending
              </span>
            </div>
            
            <p className="text-sm text-muted-foreground mb-3">
              <span className="font-medium">
                {request.profiles?.full_name || request.profiles?.email}
              </span>{' '}
              wants to join your organization
            </p>

            {request.message && (
              <div className="mb-3 p-3 bg-muted rounded-md">
                <div className="flex items-start gap-2">
                  <MessageSquare className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Message from user:</p>
                    <p className="text-sm text-foreground">"{request.message}"</p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
              <div className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {request.profiles?.email}
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleApprove}
                disabled={responding !== null}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-md transition-colors disabled:opacity-50"
              >
                {responding === 'approving' ? (
                  <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                ) : (
                  <Check className="w-4 h-4" />
                )}
                Approve
              </button>
              
              <button
                onClick={() => setShowRejectModal(true)}
                disabled={responding !== null}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-md transition-colors disabled:opacity-50"
              >
                <X className="w-4 h-4" />
                Reject
              </button>
            </div>
          </div>
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
                  Optional note to user (private):
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
    </>
  );
}