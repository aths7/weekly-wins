'use client';

import { Building2, Users, Calendar, Shield } from 'lucide-react';
import { useOrganizations } from '@/lib/hooks/useOrganizations';
import { getRoleDisplayName, formatMembershipDate } from '@/lib/organizations/utils';

interface OrganizationInfoProps {
  showDetailed?: boolean;
}

export default function OrganizationInfo({ showDetailed = false }: OrganizationInfoProps) {
  const { currentOrganization, getCurrentMembership } = useOrganizations();
  const userMembership = getCurrentMembership();

  if (!currentOrganization || !userMembership) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        <Building2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No organization selected</p>
      </div>
    );
  }

  if (!showDetailed) {
    // Simple view for tooltips/compact spaces
    return (
      <div className="flex items-center gap-2">
        <div 
          className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium"
          style={{ backgroundColor: currentOrganization.primary_color }}
        >
          {currentOrganization.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <div className="font-medium text-sm">{currentOrganization.name}</div>
          <div className="text-xs text-muted-foreground">
            {getRoleDisplayName(userMembership.role)}
          </div>
        </div>
      </div>
    );
  }

  // Detailed view for info panels
  return (
    <div className="bg-card border border-border rounded-lg p-4 space-y-3">
      <div className="flex items-center gap-3">
        <div 
          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium"
          style={{ backgroundColor: currentOrganization.primary_color }}
        >
          {currentOrganization.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <h3 className="font-semibold">{currentOrganization.name}</h3>
          {currentOrganization.description && (
            <p className="text-sm text-muted-foreground">{currentOrganization.description}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-muted-foreground" />
          <div>
            <div className="font-medium">{getRoleDisplayName(userMembership.role)}</div>
            <div className="text-xs text-muted-foreground">Your Role</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <div>
            <div className="font-medium">{formatMembershipDate(userMembership.joined_at)}</div>
            <div className="text-xs text-muted-foreground">Joined</div>
          </div>
        </div>
      </div>

      {currentOrganization.settings && (
        <div className="pt-2 border-t border-border">
          <div className="text-xs text-muted-foreground space-y-1">
            <div className="flex justify-between">
              <span>Approval Required:</span>
              <span>{(currentOrganization.settings as any)?.require_approval ? 'Yes' : 'No'}</span>
            </div>
            <div className="flex justify-between">
              <span>Public View:</span>
              <span>{(currentOrganization.settings as any)?.allow_public_view ? 'Yes' : 'No'}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}