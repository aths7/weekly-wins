'use client';

import { useState, useEffect } from 'react';
import { Search, Building2, Plus } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/hooks/useAuth';
import { useOrganizations } from '@/lib/hooks/useOrganizations';
import { useJoinRequests } from '@/lib/hooks/useNotifications';
import AuthGuard from '@/components/auth/AuthGuard';
import MainLayout from '@/components/layout/MainLayout';
import { Organization } from '@/lib/supabase/database.types';
import OrganizationCard from '@/components/organizations/OrganizationCard';
import JoinRequestModal from '@/components/organizations/JoinRequestModal';
import Link from 'next/link';

interface JoinRequestStatus {
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

interface OrganizationWithStats extends Organization {
  organization_member_stats?: {
    organization_id: string;
    total_entries: number;
    published_entries: number;
  };
  member_count: number;
  total_entries: number;
  published_entries: number;
}

export default function OrganizationsPage() {
  const { user } = useAuth();
  const { userMemberships } = useOrganizations();
  const { submitJoinRequest } = useJoinRequests();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [userJoinRequests, setUserJoinRequests] = useState<Record<string, JoinRequestStatus>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [showJoinModal, setShowJoinModal] = useState(false);

  useEffect(() => {
    if (user) {
      fetchOrganizations();
      fetchUserJoinRequests();
    }
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      
      // Fetch all organizations (public discovery)
      const { data, error } = await supabase
        .from('organizations')
        .select(`
          *,
          organization_member_stats!inner (
            organization_id,
            total_entries,
            published_entries
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Group by organization and calculate stats
      const orgMap = new Map();
      data?.forEach((row: OrganizationWithStats) => {
        if (!orgMap.has(row.id)) {
          orgMap.set(row.id, {
            ...row,
            member_count: 0,
            total_entries: 0,
            published_entries: 0
          });
        }
        
        const org = orgMap.get(row.id);
        org.member_count++;
        if (row.organization_member_stats) {
          org.total_entries += row.organization_member_stats.total_entries || 0;
          org.published_entries += row.organization_member_stats.published_entries || 0;
        }
      });

      setOrganizations(Array.from(orgMap.values()));
    } catch (error) {
      console.error('Error fetching organizations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserJoinRequests = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('organization_join_requests')
        .select('organization_id, status, created_at')
        .eq('user_id', user.id);

      if (error) throw error;

      const requestsMap: Record<string, JoinRequestStatus> = {};
      data?.forEach(request => {
        requestsMap[request.organization_id] = request;
      });

      setUserJoinRequests(requestsMap);
    } catch (error) {
      console.error('Error fetching join requests:', error);
    }
  };

  const filteredOrganizations = organizations.filter(org =>
    org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    org.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleJoinRequest = async (organization: Organization) => {
    if (!user) return;

    // Check if user is already a member
    const isMember = userMemberships.some(m => m.organization_id === organization.id && m.status === 'active');
    if (isMember) {
      alert('You are already a member of this organization');
      return;
    }

    // Check if user already has a pending request
    const existingRequest = userJoinRequests[organization.id];
    if (existingRequest?.status === 'pending') {
      alert('You already have a pending request for this organization');
      return;
    }

    setSelectedOrg(organization);
    setShowJoinModal(true);
  };

  const handleSubmitJoinRequest = async (message: string) => {
    if (!selectedOrg) return;

    try {
      await submitJoinRequest(selectedOrg.id, message);
      setShowJoinModal(false);
      setSelectedOrg(null);
      // Refresh join requests to show updated status
      await fetchUserJoinRequests();
    } catch (error) {
      console.error('Failed to submit join request:', error);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading organizations...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AuthGuard>
      <MainLayout>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Discover Organizations</h1>
            <p className="text-muted-foreground mt-2">
              Find and join communities that match your interests
            </p>
          </div>
        
        <Link
          href="/organizations/create"
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Organization
        </Link>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search organizations..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        />
      </div>

      {/* Results */}
      <div className="mb-4">
        <p className="text-sm text-muted-foreground">
          {filteredOrganizations.length} organization{filteredOrganizations.length !== 1 ? 's' : ''} found
        </p>
      </div>

      {/* Organizations Grid */}
      {filteredOrganizations.length === 0 ? (
        <div className="text-center py-12">
          <Building2 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No organizations found</h3>
          <p className="text-muted-foreground mb-6">
            {searchTerm 
              ? 'Try adjusting your search terms'
              : 'Be the first to create an organization!'
            }
          </p>
          {!searchTerm && (
            <Link
              href="/organizations/create"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create First Organization
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOrganizations.map((organization) => (
            <OrganizationCard
              key={organization.id}
              organization={organization}
              userMemberships={userMemberships}
              userJoinRequest={userJoinRequests[organization.id]}
              onJoinRequest={handleJoinRequest}
            />
          ))}
        </div>
      )}

      {/* Join Request Modal */}
      {showJoinModal && selectedOrg && (
        <JoinRequestModal
          organization={selectedOrg}
          onSubmit={handleSubmitJoinRequest}
          onClose={() => {
            setShowJoinModal(false);
            setSelectedOrg(null);
          }}
        />
      )}
      </MainLayout>
    </AuthGuard>
  );
}