import { Organization, OrganizationMembership, UserRole, OrganizationSettings } from '@/lib/supabase/database.types';

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

export function validateSlug(slug: string): boolean {
  const slugRegex = /^[a-z0-9-]+$/;
  return slugRegex.test(slug) && slug.length >= 3 && slug.length <= 50;
}

export function getDefaultOrganizationSettings(): OrganizationSettings {
  return {
    require_approval: true,
    auto_approve_members: false,
    allow_public_view: false,
    weekly_reminder_enabled: true,
    weekly_reminder_day: 5, // Friday
  };
}

export function canManageOrganization(membership: OrganizationMembership | null): boolean {
  if (!membership || membership.status !== 'active') {
    return false;
  }
  return membership.role === 'org_admin' || membership.role === 'super_admin';
}

export function canApproveEntries(membership: OrganizationMembership | null): boolean {
  return canManageOrganization(membership);
}

export function canInviteMembers(membership: OrganizationMembership | null): boolean {
  return canManageOrganization(membership);
}

export function canManageMembers(membership: OrganizationMembership | null): boolean {
  return canManageOrganization(membership);
}

export function isSuperAdmin(membership: OrganizationMembership | null): boolean {
  return membership?.role === 'super_admin' && membership?.status === 'active';
}

export function getRoleDisplayName(role: UserRole): string {
  switch (role) {
    case 'super_admin':
      return 'Super Admin';
    case 'org_admin':
      return 'Organization Admin';
    case 'member':
      return 'Member';
    default:
      return 'Unknown';
  }
}

export function getRoleColor(role: UserRole): string {
  switch (role) {
    case 'super_admin':
      return 'text-red-600 bg-red-50 border-red-200';
    case 'org_admin':
      return 'text-blue-600 bg-blue-50 border-blue-200';
    case 'member':
      return 'text-green-600 bg-green-50 border-green-200';
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200';
  }
}

export function getApprovalStatusColor(status: string): string {
  switch (status) {
    case 'approved':
      return 'text-green-600 bg-green-50 border-green-200';
    case 'rejected':
      return 'text-red-600 bg-red-50 border-red-200';
    case 'pending':
      return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200';
  }
}

export function formatMembershipDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function generateInviteMessage(organizationName: string, inviterName: string): string {
  return `You've been invited to join ${organizationName} on Weekly Wins by ${inviterName}. Track your weekly achievements and collaborate with your team.`;
}

export function getOrganizationTheme(organization: Organization) {
  return {
    primary: organization.primary_color || '#3b82f6',
    secondary: organization.secondary_color || '#10b981',
    cssVariables: {
      '--organization-primary': organization.primary_color || '#3b82f6',
      '--organization-secondary': organization.secondary_color || '#10b981',
    },
  };
}

export function shouldRequireApproval(settings: OrganizationSettings): boolean {
  return settings.require_approval === true;
}

export function shouldAutoApproveMembers(settings: OrganizationSettings): boolean {
  return settings.auto_approve_members === true;
}

export function isWeeklyReminderEnabled(settings: OrganizationSettings): boolean {
  return settings.weekly_reminder_enabled === true;
}

export function getWeeklyReminderDay(settings: OrganizationSettings): number {
  return settings.weekly_reminder_day || 5; // Default to Friday
}

export function getDayName(dayNumber: number): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[dayNumber] || 'Unknown';
}