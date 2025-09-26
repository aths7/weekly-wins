'use client';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/hooks/useAuth';
import type {
  Organization,
  OrganizationMembership,
  OrganizationMemberStats,
  Invitation,
  EntryApproval,
  WeeklyEntryWithOrganization
} from '@/lib/supabase/database.types';

const CACHE_VERSION = 'v1';
const TTL_MS = 24 * 60 * 60 * 1000; // optional, 1 day

const k = (uid: string) => `orgctx:${CACHE_VERSION}:${uid}`;
type CacheShape = {
  at: number;
  organizations: Organization[];
  currentOrganization: Organization | null;
  memberships: OrganizationMembership[];
};

export function useOrganizations() {
  const { user } = useAuth(); // session used to detect login/logout
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null);
  const [userMemberships, setUserMemberships] = useState<OrganizationMembership[]>([]);
  const [loading, setLoading] = useState<boolean>(!!user); // loading only when a user exists
  const [error, setError] = useState<string | null>(null);

  // ---- helpers
  const readCache = useCallback((): CacheShape | null => {
    if (!user) return null;
    try {
      const raw = localStorage.getItem(k(user.id));
      if (!raw) return null;
      const parsed = JSON.parse(raw) as CacheShape;
      if (Date.now() - parsed.at > TTL_MS) return null; // optional TTL
      return parsed;
    } catch { return null; }
  }, [user]);

  const writeCache = useCallback((c: CacheShape) => {
    if (!user) return;
    localStorage.setItem(k(user.id), JSON.stringify(c));
  }, [user]);

  const clearCache = useCallback(() => {
    if (!user) return;
    localStorage.removeItem(k(user.id));
  }, [user]);

  // ---- hydrate from cache instantly
  useEffect(() => {
    if (!user) {
      setOrganizations([]); setUserMemberships([]); setCurrentOrganization(null);
      setLoading(false);
      return;
    }
    const cached = readCache();
    if (cached) {
      setOrganizations(cached.organizations);
      setUserMemberships(cached.memberships);
      setCurrentOrganization(cached.currentOrganization);
      setLoading(false); // instant UI
    }
  }, [user, readCache]);

  // ---- fetch once on (fresh) login / when no valid cache
  useEffect(() => {
    if (!user) return;
    const cached = readCache();
    if (cached) return; // we already hydrated; skip fetch

    (async () => {
      try {
        setLoading(true); setError(null);

        const { data: memberships, error: mErr } = await supabase
          .from('organization_memberships')
          .select('*, organizations(*)')
          .eq('user_id', user.id)
          .eq('status', 'active');

        if (mErr) throw mErr;
        const mem = memberships ?? [];
        const orgs = (mem.map(m => m.organizations).filter(Boolean) as Organization[]) ?? [];

        const { data: profile } = await supabase
          .from('profiles')
          .select('current_organization_id')
          .eq('id', user.id)
          .single();

        const curr =
          (profile?.current_organization_id &&
            orgs.find(o => o.id === profile.current_organization_id)) ||
          orgs[0] || null;

        setOrganizations(orgs);
        setUserMemberships(mem);
        setCurrentOrganization(curr);

        writeCache({ at: Date.now(), organizations: orgs, memberships: mem, currentOrganization: curr });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch organizations');
      } finally {
        setLoading(false);
      }
    })();
  }, [user, readCache, writeCache]);

  // ---- keep cache in sync when switching org
  const switchOrganization = useCallback(async (organizationId: string) => {
    if (!user) return;
    await supabase.from('profiles').update({ current_organization_id: organizationId }).eq('id', user.id);
    const org = organizations.find(o => o.id === organizationId) ?? null;
    setCurrentOrganization(org);
    writeCache({ at: Date.now(), organizations, memberships: userMemberships, currentOrganization: org });
  }, [user, organizations, userMemberships, writeCache]);

  // ---- clear on logout (auth change)
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((evt) => {
      if (evt === 'SIGNED_OUT') {
        clearCache();
        setOrganizations([]); setUserMemberships([]); setCurrentOrganization(null);
        setLoading(false);
      }
      if (evt === 'SIGNED_IN') {
        // allow fetch effect above to run; cache will be written.
        setLoading(true);
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [clearCache]);

  // ---- cross-tab sync
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (!user) return;
      if (e.key === k(user.id)) {
        const c = readCache();
        if (c) {
          setOrganizations(c.organizations);
          setUserMemberships(c.memberships);
          setCurrentOrganization(c.currentOrganization);
        }
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [user, readCache]);

  const createOrganization = async (name: string, slug: string, description?: string) => {
    const { data, error } = await supabase.rpc('create_organization_with_admin', {
      org_name: name, org_slug: slug, org_description: description,
    });
    if (error) throw error;
    // refresh once and update cache
    const fresh = await supabase
      .from('organization_memberships').select('*, organizations(*)')
      .eq('user_id', user?.id).eq('status', 'active');
    const mem = fresh.data ?? [];
    const orgs = (mem.map(m => m.organizations).filter(Boolean) as Organization[]) ?? [];
    setOrganizations(orgs); setUserMemberships(mem);
    writeCache({ at: Date.now(), organizations: orgs, memberships: mem, currentOrganization });
    return data;
  };

  const updateOrganization = async (organizationId: string, updates: Partial<Organization>) => {
    await supabase.from('organizations').update(updates).eq('id', organizationId);
    const next = organizations.map(o => (o.id === organizationId ? { ...o, ...updates } : o));
    setOrganizations(next);
    const curr = currentOrganization?.id === organizationId ? { ...currentOrganization, ...updates } : currentOrganization;
    setCurrentOrganization(curr ?? null);
    writeCache({ at: Date.now(), organizations: next, memberships: userMemberships, currentOrganization: curr ?? null });
  };

  const getCurrentMembership = () =>
    currentOrganization ? userMemberships.find(m => m.organization_id === currentOrganization.id) ?? null : null;

  const hasPermission = (p: 'manage' | 'approve' | 'invite') => {
    const m = getCurrentMembership();
    return !!m && m.status === 'active' && (m.role === 'org_admin' || m.role === 'super_admin');
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
    // optional: force-refresh & recache
    refetch: async () => {
      if (!user) return;
      const { data: memberships } = await supabase
        .from('organization_memberships').select('*, organizations(*)')
        .eq('user_id', user.id).eq('status', 'active');
      const mem = memberships ?? [];
      const orgs = (mem.map(m => m.organizations).filter(Boolean) as Organization[]) ?? [];
      setOrganizations(orgs); setUserMemberships(mem);
      const curr =
        (currentOrganization && orgs.find(o => o.id === currentOrganization.id)) ||
        orgs[0] || null;
      setCurrentOrganization(curr);
      writeCache({ at: Date.now(), organizations: orgs, memberships: mem, currentOrganization: curr });
    },
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