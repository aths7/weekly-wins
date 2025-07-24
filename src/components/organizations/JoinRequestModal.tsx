'use client';

import { useState } from 'react';
import { X, Users, Building2, MessageSquare } from 'lucide-react';
import { Organization } from '@/lib/supabase/database.types';

interface OrganizationSettings {
  require_approval?: boolean;
  weekly_reminder_enabled?: boolean;
  allow_public_view?: boolean;
}

interface JoinRequestModalProps {
  organization: Organization;
  onSubmit: (message: string) => Promise<void>;
  onClose: () => void;
}

export default function JoinRequestModal({ organization, onSubmit, onClose }: JoinRequestModalProps) {
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setSubmitting(true);
    try {
      await onSubmit(message.trim());
    } catch (error) {
      console.error('Failed to submit join request:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background border border-border rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-background border-b border-border p-6 pb-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Request to Join</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-muted rounded-md transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 pt-4">
          {/* Organization Info */}
          <div className="flex items-center gap-4 mb-6 p-4 bg-muted rounded-lg">
            {organization.logo_url ? (
              <img
                src={organization.logo_url}
                alt={`${organization.name} logo`}
                className="w-12 h-12 rounded-lg object-cover"
              />
            ) : (
              <div 
                className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold"
                style={{ backgroundColor: organization.primary_color }}
              >
                {organization.name.charAt(0).toUpperCase()}
              </div>
            )}
            
            <div>
              <h3 className="font-semibold">{organization.name}</h3>
              <p className="text-sm text-muted-foreground">@{organization.slug}</p>
              {organization.description && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {organization.description}
                </p>
              )}
            </div>
          </div>

          {/* Join Request Form */}
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare className="w-4 h-4 text-primary" />
                <label htmlFor="join-message" className="text-sm font-medium">
                  Introduce yourself (optional)
                </label>
              </div>
              <textarea
                id="join-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tell the admins why you'd like to join this organization..."
                rows={4}
                maxLength={500}
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <div className="flex justify-between items-center mt-2">
                <p className="text-xs text-muted-foreground">
                  This message will be sent to organization admins
                </p>
                <span className="text-xs text-muted-foreground">
                  {message.length}/500
                </span>
              </div>
            </div>

            {/* Organization Settings Info */}
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <div className="flex items-start gap-2">
                <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                    About this organization:
                  </p>
                  <ul className="text-blue-700 dark:text-blue-300 space-y-1">
                    {(organization.settings as OrganizationSettings)?.require_approval && (
                      <li>• Your request will need admin approval</li>
                    )}
                    {(organization.settings as OrganizationSettings)?.weekly_reminder_enabled && (
                      <li>• Weekly entry reminders are enabled</li>
                    )}
                    {(organization.settings as OrganizationSettings)?.allow_public_view ? (
                      <li>• Your entries will be publicly visible</li>
                    ) : (
                      <li>• Your entries will only be visible to organization members</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="flex-1 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground border border-border rounded-md hover:bg-muted transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <Users className="w-4 h-4" />
                    Send Request
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}