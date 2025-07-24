'use client';

import { useState } from 'react';
import { X, UserPlus, Mail, AlertCircle, Loader2, Plus, Trash2 } from 'lucide-react';
import { useInvitations } from '@/lib/hooks/useOrganizations';
import { isValidEmail, getRoleDisplayName } from '@/lib/organizations/utils';
import { UserRole } from '@/lib/supabase/database.types';

interface InviteMembersFormProps {
  organizationId: string;
  onClose: () => void;
  onSuccess?: () => void;
}

interface InviteEntry {
  id: string;
  email: string;
  role: 'org_admin' | 'member';
  error?: string;
}

export default function InviteMembersForm({ organizationId, onClose, onSuccess }: InviteMembersFormProps) {
  const { sendInvitation } = useInvitations(organizationId);
  const [invites, setInvites] = useState<InviteEntry[]>([
    { id: '1', email: '', role: 'member' }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  const addInvite = () => {
    setInvites(prev => [
      ...prev,
      { id: Date.now().toString(), email: '', role: 'member' }
    ]);
  };

  const removeInvite = (id: string) => {
    setInvites(prev => prev.filter(invite => invite.id !== id));
  };

  const updateInvite = (id: string, field: keyof InviteEntry, value: string) => {
    setInvites(prev => prev.map(invite => 
      invite.id === id 
        ? { ...invite, [field]: value, error: undefined }
        : invite
    ));
  };

  const validateInvites = () => {
    let isValid = true;
    const emails = new Set<string>();
    
    const updatedInvites = invites.map(invite => {
      let error: string | undefined;
      
      if (!invite.email.trim()) {
        error = 'Email is required';
        isValid = false;
      } else if (!isValidEmail(invite.email)) {
        error = 'Invalid email format';
        isValid = false;
      } else if (emails.has(invite.email.toLowerCase())) {
        error = 'Duplicate email';
        isValid = false;
      } else {
        emails.add(invite.email.toLowerCase());
      }
      
      return { ...invite, error };
    });
    
    setInvites(updatedInvites);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateInvites()) return;

    setIsSubmitting(true);
    setGeneralError(null);
    
    try {
      const validInvites = invites.filter(invite => invite.email.trim());
      
      for (const invite of validInvites) {
        await sendInvitation(invite.email.trim(), invite.role);
      }
      
      onSuccess?.();
      onClose();
    } catch (error) {
      if (error instanceof Error) {
        setGeneralError(error.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-card border border-border rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Invite Members</h2>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {generalError && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                <AlertCircle className="w-4 h-4 text-destructive" />
                <span className="text-sm text-destructive">{generalError}</span>
              </div>
            )}

            <div className="space-y-4">
              {invites.map((invite, index) => (
                <div key={invite.id} className="flex gap-3 items-start p-4 bg-muted/50 rounded-lg">
                  <div className="flex-1 space-y-3">
                    <div className="weekly-form__field">
                      <label className="weekly-form__label">
                        <Mail className="w-4 h-4" />
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={invite.email}
                        onChange={(e) => updateInvite(invite.id, 'email', e.target.value)}
                        className={`weekly-form__input ${invite.error ? 'input-error' : ''}`}
                        placeholder="Enter email address"
                        disabled={isSubmitting}
                      />
                      {invite.error && (
                        <span className="error-message">{invite.error}</span>
                      )}
                    </div>

                    <div className="weekly-form__field">
                      <label className="weekly-form__label">
                        Role
                      </label>
                      <select
                        value={invite.role}
                        onChange={(e) => updateInvite(invite.id, 'role', e.target.value)}
                        className="weekly-form__input"
                        disabled={isSubmitting}
                      >
                        <option value="member">Member</option>
                        <option value="org_admin">Organization Admin</option>
                      </select>
                      <p className="text-xs text-muted-foreground">
                        {invite.role === 'org_admin' 
                          ? 'Can manage organization settings and approve entries'
                          : 'Can submit weekly entries and view team progress'
                        }
                      </p>
                    </div>
                  </div>

                  {invites.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeInvite(invite.id)}
                      className="mt-8 p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      disabled={isSubmitting}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addInvite}
              className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
              disabled={isSubmitting}
            >
              <Plus className="w-4 h-4" />
              Add another invitation
            </button>
          </div>

          <div className="border-t border-border p-6">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="btn-outline flex-1"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary flex-1"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending Invitations...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-2" />
                    Send {invites.length} Invitation{invites.length > 1 ? 's' : ''}
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}