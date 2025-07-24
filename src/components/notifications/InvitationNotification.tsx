'use client';

import { useState } from 'react';
import { Check, X, UserPlus, Building2, Clock } from 'lucide-react';
import { useInvitations } from '@/lib/hooks/useNotifications';
import { OrganizationInvitation } from '@/lib/supabase/database.types';
import { formatDistanceToNow } from 'date-fns';

interface InvitationNotificationProps {
  invitation: OrganizationInvitation & {
    organizations: {
      name: string;
      slug: string;
      logo_url: string | null;
    } | null;
    inviter: {
      full_name: string | null;
      avatar_url: string | null;
    } | null;
  };
}

export default function InvitationNotification({ invitation }: InvitationNotificationProps) {
  const { respondToInvitation } = useInvitations();
  const [responding, setResponding] = useState<'accepting' | 'declining' | null>(null);

  const handleResponse = async (response: 'accepted' | 'declined') => {
    setResponding(response === 'accepted' ? 'accepting' : 'declining');
    
    try {
      await respondToInvitation(invitation.id, response);
    } catch (error) {
      console.error('Failed to respond to invitation:', error);
    } finally {
      setResponding(null);
    }
  };

  const isExpired = new Date(invitation.expires_at) < new Date();

  return (
    <div className={`p-4 border border-border rounded-lg ${isExpired ? 'opacity-50' : ''}`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
            <UserPlus className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-semibold text-foreground">
              Invitation to join {invitation.organizations?.name}
            </h3>
            {isExpired && (
              <span className="px-2 py-1 text-xs bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded">
                Expired
              </span>
            )}
          </div>
          
          <p className="text-sm text-muted-foreground mb-3">
            {invitation.inviter?.full_name || 'Someone'} invited you to join{' '}
            {invitation.organizations?.name} as{' '}
            <span className="font-medium capitalize">
              {invitation.role.replace('_', ' ')}
            </span>
          </p>

          {invitation.message && (
            <div className="mb-3 p-3 bg-muted rounded-md">
              <p className="text-sm text-foreground">&ldquo;{invitation.message}&rdquo;</p>
            </div>
          )}

          <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
            <div className="flex items-center gap-1">
              <Building2 className="w-3 h-3" />
              {invitation.organizations?.slug}
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Expires {formatDistanceToNow(new Date(invitation.expires_at), { addSuffix: true })}
            </div>
          </div>

          {!isExpired && (
            <div className="flex gap-2">
              <button
                onClick={() => handleResponse('accepted')}
                disabled={responding !== null}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-md transition-colors disabled:opacity-50"
              >
                {responding === 'accepting' ? (
                  <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                ) : (
                  <Check className="w-4 h-4" />
                )}
                Accept
              </button>
              
              <button
                onClick={() => handleResponse('declined')}
                disabled={responding !== null}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium rounded-md transition-colors disabled:opacity-50"
              >
                {responding === 'declining' ? (
                  <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                ) : (
                  <X className="w-4 h-4" />
                )}
                Decline
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}