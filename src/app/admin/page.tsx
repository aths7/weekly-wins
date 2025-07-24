'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { useOrganizations } from '@/lib/hooks/useOrganizations';
import AuthGuard from '@/components/auth/AuthGuard';
import MainLayout from '@/components/layout/MainLayout';
import AdminDashboard from '@/components/organizations/AdminDashboard';
import InviteMembersForm from '@/components/organizations/InviteMembersForm';
import OrganizationSettings from '@/components/organizations/OrganizationSettings';
import OrganizationSelector from '@/components/organizations/OrganizationSelector';
import CreateOrganizationForm from '@/components/organizations/CreateOrganizationForm';
import { Shield, Building2 } from 'lucide-react';

export default function AdminPage() {
  const { user } = useAuth();
  const { currentOrganization, hasPermission, loading } = useOrganizations();
  const router = useRouter();
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [showSettingsForm, setShowSettingsForm] = useState(false);
  const [showCreateOrg, setShowCreateOrg] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    router.push('/auth/login');
    return null;
  }

  if (!currentOrganization) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md mx-auto p-8">
          <Building2 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">No Organization Selected</h1>
          <p className="text-muted-foreground mb-6">
            You need to be part of an organization to access the admin dashboard.
          </p>
          <div className="space-y-4">
            <OrganizationSelector onCreateNew={() => setShowCreateOrg(true)} />
            <button
              onClick={() => router.push('/dashboard')}
              className="btn-outline w-full"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!hasPermission('manage')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md mx-auto p-8">
          <Shield className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground mb-6">
            You don't have permission to access the admin dashboard for this organization.
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            className="btn-primary"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <AuthGuard>
      <MainLayout>
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <OrganizationSelector />
          </div>
          <p className="text-muted-foreground">
            Manage {currentOrganization.name} settings, members, and approval workflows.
          </p>
        </div>

        <AdminDashboard
          onInviteMembers={() => setShowInviteForm(true)}
          onManageSettings={() => setShowSettingsForm(true)}
        />

        {/* Modals */}
        {showInviteForm && (
          <InviteMembersForm
            organizationId={currentOrganization.id}
            onClose={() => setShowInviteForm(false)}
            onSuccess={() => {
              setShowInviteForm(false);
              // Refresh the dashboard
              window.location.reload();
            }}
          />
        )}

        {showSettingsForm && (
          <OrganizationSettings
            onClose={() => setShowSettingsForm(false)}
            onSuccess={() => {
              setShowSettingsForm(false);
              // Refresh the dashboard
              window.location.reload();
            }}
          />
        )}

        {showCreateOrg && (
          <CreateOrganizationForm
            onClose={() => setShowCreateOrg(false)}
            onSuccess={() => {
              setShowCreateOrg(false);
              // Refresh the page to show the new organization
              window.location.reload();
            }}
          />
        )}
      </MainLayout>
    </AuthGuard>
  );
}