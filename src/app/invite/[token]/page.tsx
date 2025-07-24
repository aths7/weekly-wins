'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Building2, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useInvitations } from '@/lib/hooks/useOrganizations';
import { useAuth } from '@/lib/hooks/useAuth';

export default function InvitePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { acceptInvitation } = useInvitations('');
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'expired'>('loading');
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    if (params.token && user) {
      handleAcceptInvitation(params.token as string);
    }
  }, [params.token, user]);

  const handleAcceptInvitation = async (token: string) => {
    try {
      setStatus('loading');
      const result = await acceptInvitation(token);
      
      if (result) {
        setStatus('success');
        setMessage('Successfully joined the organization!');
        
        // Redirect to dashboard after 3 seconds
        setTimeout(() => {
          router.push('/dashboard');
        }, 3000);
      } else {
        setStatus('error');
        setMessage('Invalid or expired invitation.');
      }
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Failed to accept invitation');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Building2 className="w-16 h-16 text-primary mx-auto" />
          <h1 className="text-2xl font-bold">Join Organization</h1>
          <p className="text-muted-foreground">Please sign in to accept this invitation</p>
          <button
            onClick={() => router.push('/auth/login')}
            className="btn-primary"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full mx-4">
        <div className="bg-card border border-border rounded-lg shadow-lg p-8 text-center">
          <div className="mb-6">
            {status === 'loading' && (
              <div className="space-y-4">
                <Loader2 className="w-16 h-16 text-primary mx-auto animate-spin" />
                <h1 className="text-2xl font-bold">Processing Invitation</h1>
                <p className="text-muted-foreground">Please wait while we process your invitation...</p>
              </div>
            )}

            {status === 'success' && (
              <div className="space-y-4">
                <CheckCircle className="w-16 h-16 text-green-600 mx-auto" />
                <h1 className="text-2xl font-bold text-green-600">Welcome!</h1>
                <p className="text-muted-foreground">{message}</p>
                <p className="text-sm text-muted-foreground">
                  Redirecting you to the dashboard...
                </p>
              </div>
            )}

            {status === 'error' && (
              <div className="space-y-4">
                <XCircle className="w-16 h-16 text-red-600 mx-auto" />
                <h1 className="text-2xl font-bold text-red-600">Invitation Error</h1>
                <p className="text-muted-foreground">{message}</p>
                <div className="space-y-2">
                  <button
                    onClick={() => router.push('/dashboard')}
                    className="btn-primary w-full"
                  >
                    Go to Dashboard
                  </button>
                  <button
                    onClick={() => router.push('/auth/login')}
                    className="btn-outline w-full"
                  >
                    Sign In with Different Account
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}