'use client';

import { Users, Calendar, Award, Building2, UserCheck, Clock } from 'lucide-react';
import { Organization, OrganizationMembership } from '@/lib/supabase/database.types';
import { formatDistanceToNow } from 'date-fns';

interface OrganizationCardProps {
  organization: Organization & {
    member_count?: number;
    total_entries?: number;
    published_entries?: number;
  };
  userMemberships: OrganizationMembership[];
  userJoinRequest?: {
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
  };
  onJoinRequest: (org: Organization) => void;
}

export default function OrganizationCard({ organization, userMemberships, userJoinRequest, onJoinRequest }: OrganizationCardProps) {
  const userMembership = userMemberships.find(m => m.organization_id === organization.id);
  const isMember = userMembership?.status === 'active';
  const hasPendingRequest = userJoinRequest?.status === 'pending';
  const hasRejectedRequest = userJoinRequest?.status === 'rejected';

  const getJoinButtonContent = () => {
    if (isMember) {
      return (
        <div className="flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-md">
          <UserCheck className="w-4 h-4" />
          Member ({userMembership.role.replace('_', ' ')})
        </div>
      );
    }

    if (hasPendingRequest) {
      return (
        <div className="flex items-center gap-2 px-4 py-2 bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 rounded-md">
          <Clock className="w-4 h-4" />
          Request Pending
        </div>
      );
    }

    if (hasRejectedRequest) {
      return (
        <button
          onClick={() => onJoinRequest(organization)}
          className="flex items-center gap-2 px-4 py-2 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-md hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
        >
          <Users className="w-4 h-4" />
          Request Again
        </button>
      );
    }

    return (
      <button
        onClick={() => onJoinRequest(organization)}
        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
      >
        <Users className="w-4 h-4" />
        Request to Join
      </button>
    );
  };

  return (
    <div className="bg-card text-card-foreground border border-border rounded-lg p-6 hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="flex items-start gap-4 mb-4">
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
        
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-lg mb-1">{organization.name}</h3>
          <p className="text-sm text-muted-foreground">@{organization.slug}</p>
        </div>
      </div>

      {/* Description */}
      {organization.description && (
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
          {organization.description}
        </p>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-4 text-center">
        <div>
          <div className="flex items-center justify-center gap-1 mb-1">
            <Users className="w-4 h-4 text-primary" />
          </div>
          <p className="text-lg font-semibold">{organization.member_count || 0}</p>
          <p className="text-xs text-muted-foreground">Members</p>
        </div>
        
        <div>
          <div className="flex items-center justify-center gap-1 mb-1">
            <Building2 className="w-4 h-4 text-primary" />
          </div>
          <p className="text-lg font-semibold">{organization.total_entries || 0}</p>
          <p className="text-xs text-muted-foreground">Entries</p>
        </div>
        
        <div>
          <div className="flex items-center justify-center gap-1 mb-1">
            <Award className="w-4 h-4 text-primary" />
          </div>
          <p className="text-lg font-semibold">{organization.published_entries || 0}</p>
          <p className="text-xs text-muted-foreground">Published</p>
        </div>
      </div>

      {/* Settings Preview */}
      <div className="mb-4 p-3 bg-muted rounded-md">
        <div className="text-xs text-muted-foreground mb-2">Organization Settings:</div>
        <div className="flex flex-wrap gap-2">
          {organization.settings?.require_approval && (
            <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 text-xs rounded">
              Approval Required
            </span>
          )}
          {organization.settings?.allow_public_view && (
            <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 text-xs rounded">
              Public View
            </span>
          )}
          {organization.settings?.weekly_reminder_enabled && (
            <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs rounded">
              Weekly Reminders
            </span>
          )}
        </div>
      </div>

      {/* Created Date */}
      <div className="flex items-center gap-1 text-xs text-muted-foreground mb-4">
        <Calendar className="w-3 h-3" />
        Created {formatDistanceToNow(new Date(organization.created_at), { addSuffix: true })}
      </div>

      {/* Action Button */}
      <div className="flex justify-end">
        {getJoinButtonContent()}
      </div>
    </div>
  );
}