'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/hooks/useAuth';
import { 
  Organization, 
  OrganizationMembership, 
  OrganizationMemberStats,
  Invitation,
  EntryApproval,
  WeeklyEntryWithOrganization 
} from '@/lib/supabase/database.types';

export function useOrganizations() {
  const { user } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null);
  const [userMemberships, setUserMemberships] = useState<OrganizationMembership[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchUserOrganizations();
    }
  }, [user]);

  const fetchUserOrganizations = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if organization tables exist by attempting to query
      const { data: memberships, error: membershipsError } = await supabase
        .from('organization_memberships')
        .select(`
          *,
          organizations (*)
        `)
        .eq('user_id', user?.id)
        .eq('status', 'active');

      if (membershipsError) {
        // Handle various database errors gracefully
        if (membershipsError.code === '42P01') {
          // Table doesn't exist
          setUserMemberships([]);
          setOrganizations([]);
          setCurrentOrganization(null);
          return;
        } else if (membershipsError.code === '42P17') {
          // Infinite recursion in RLS policy
          console.error('RLS policy recursion detected. Please run the fixed schema.');
          setUserMemberships([]);
          setOrganizations([]);
          setCurrentOrganization(null);
          setError('Organization setup incomplete. Please contact administrator.');
          return;
        } else if (membershipsError.message?.includes('recursion')) {
          // Any other recursion-related error
          console.error('Database recursion error:', membershipsError);
          setUserMemberships([]);
          setOrganizations([]);
          setCurrentOrganization(null);
          setError('Organization setup issue detected.');
          return;
        }
        throw membershipsError;
      }

      const membershipData = memberships || [];
      setUserMemberships(membershipData);

      // Extract organizations from memberships
      const orgs = membershipData
        .map(m => m.organizations)
        .filter(Boolean) as Organization[];
      
      setOrganizations(orgs);

      // Set current organization from user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('current_organization_id')
        .eq('id', user?.id)
        .single();

      if (profile?.current_organization_id) {
        const currentOrg = orgs.find(org => org.id === profile.current_organization_id);
        if (currentOrg) {
          setCurrentOrganization(currentOrg);
        }
      } else if (orgs.length > 0) {
        // Set first organization as current if none is set
        setCurrentOrganization(orgs[0]);
        await switchOrganization(orgs[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch organizations');
    } finally {
      setLoading(false);
    }
  };

  const switchOrganization = async (organizationId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ current_organization_id: organizationId })
        .eq('id', user?.id);

      if (error) throw error;

      const org = organizations.find(o => o.id === organizationId);
      if (org) {
        setCurrentOrganization(org);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to switch organization');
    }
  };

  const createOrganization = async (name: string, slug: string, description?: string) => {
    try {
      const { data, error } = await supabase.rpc('create_organization_with_admin', {
        org_name: name,
        org_slug: slug,
        org_description: description,
      });

      if (error) throw error;

      // Refresh organizations
      await fetchUserOrganizations();
      
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create organization');
      throw err;
    }
  };

  const updateOrganization = async (organizationId: string, updates: Partial<Organization>) => {
    try {
      const { error } = await supabase
        .from('organizations')
        .update(updates)
        .eq('id', organizationId);

      if (error) throw error;

      // Update local state
      setOrganizations(prev => prev.map(org => 
        org.id === organizationId ? { ...org, ...updates } : org
      ));

      if (currentOrganization?.id === organizationId) {
        setCurrentOrganization(prev => prev ? { ...prev, ...updates } : null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update organization');
      throw err;
    }
  };

  const getCurrentMembership = (): OrganizationMembership | null => {
    if (!currentOrganization) return null;
    return userMemberships.find(m => m.organization_id === currentOrganization.id) || null;
  };

  const hasPermission = (permission: 'manage' | 'approve' | 'invite'): boolean => {
    const membership = getCurrentMembership();
    if (!membership || membership.status !== 'active') return false;
    
    const isAdmin = membership.role === 'org_admin' || membership.role === 'super_admin';
    return isAdmin;
  };

  return {
    organizations,
    currentOrganization,
    userMemberships,
    loading,
    error,
    switchOrganization,
    createOrganization,
    updateOrganization,
    getCurrentMembership,
    hasPermission,
    refetch: fetchUserOrganizations,
  };
}

export function useOrganizationMembers(organizationId: string) {
  const [members, setMembers] = useState<OrganizationMemberStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (organizationId) {
      fetchMembers();
    }
  }, [organizationId]);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('organization_member_stats')
        .select('*')
        .eq('organization_id', organizationId)
        .order('joined_at', { ascending: false });

      if (fetchError) throw fetchError;

      setMembers(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch members');
    } finally {
      setLoading(false);
    }
  };

  const updateMemberRole = async (userId: string, newRole: 'org_admin' | 'member') => {
    try {
      const { error } = await supabase
        .from('organization_memberships')
        .update({ role: newRole })
        .eq('organization_id', organizationId)
        .eq('user_id', userId);

      if (error) throw error;

      // Refresh members
      await fetchMembers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update member role');
      throw err;
    }
  };

  const removeMember = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('organization_memberships')
        .delete()
        .eq('organization_id', organizationId)
        .eq('user_id', userId);

      if (error) throw error;

      // Refresh members
      await fetchMembers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove member');
      throw err;
    }
  };

  return {
    members,
    loading,
    error,
    updateMemberRole,
    removeMember,
    refetch: fetchMembers,
  };
}

export function useInvitations(organizationId: string) {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (organizationId) {
      fetchInvitations();
    }
  }, [organizationId]);

  const fetchInvitations = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('invitations')
        .select('*, invited_by_profile:profiles!invitations_invited_by_fkey(full_name)')
        .eq('organization_id', organizationId)
        .is('accepted_at', null)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setInvitations(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch invitations');
    } finally {
      setLoading(false);
    }
  };

  const sendInvitation = async (email: string, role: 'org_admin' | 'member') => {
    try {
      const { error } = await supabase
        .from('invitations')
        .insert({
          organization_id: organizationId,
          email,
          role,
        });

      if (error) throw error;

      // Refresh invitations
      await fetchInvitations();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send invitation');
      throw err;
    }
  };

  const cancelInvitation = async (invitationId: string) => {
    try {
      const { error } = await supabase
        .from('invitations')
        .delete()
        .eq('id', invitationId);

      if (error) throw error;

      // Refresh invitations
      await fetchInvitations();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel invitation');
      throw err;
    }
  };

  const acceptInvitation = async (token: string) => {
    try {
      const { data, error } = await supabase.rpc('accept_invitation', {
        invitation_token: token,
      });

      if (error) throw error;

      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to accept invitation');
      throw err;
    }
  };

  return {
    invitations,
    loading,
    error,
    sendInvitation,
    cancelInvitation,
    acceptInvitation,
    refetch: fetchInvitations,
  };
}

export function useEntryApprovals(organizationId: string) {
  const [approvals, setApprovals] = useState<EntryApproval[]>([]);
  const [pendingEntries, setPendingEntries] = useState<WeeklyEntryWithOrganization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (organizationId) {
      fetchApprovals();
    }
  }, [organizationId]);

  const fetchApprovals = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch pending entries for approval
      const { data: entries, error: entriesError } = await supabase
        .from('weekly_entries_with_organization')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('is_published', false)
        .is('approval_status', null)
        .order('created_at', { ascending: false });

      if (entriesError) throw entriesError;

      setPendingEntries(entries || []);

      // Fetch all approvals for this organization
      const { data: approvalData, error: approvalError } = await supabase
        .from('entry_approvals')
        .select('*, reviewer:profiles!entry_approvals_reviewed_by_fkey(full_name)')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      if (approvalError) throw approvalError;

      setApprovals(approvalData || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch approvals');
    } finally {
      setLoading(false);
    }
  };

  const approveEntry = async (entryId: string, status: 'approved' | 'rejected', feedback?: string) => {
    try {
      const { data, error } = await supabase.rpc('approve_entry', {
        entry_id: entryId,
        approval_status: status,
        feedback_text: feedback,
      });

      if (error) throw error;

      // Refresh approvals
      await fetchApprovals();
      
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve entry');
      throw err;
    }
  };

  return {
    approvals,
    pendingEntries,
    loading,
    error,
    approveEntry,
    refetch: fetchApprovals,
  };
}