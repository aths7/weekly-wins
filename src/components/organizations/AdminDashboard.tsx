'use client';

import { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Settings,
  BarChart3,
  Mail,
  Shield
} from 'lucide-react';
import { useOrganizations, useOrganizationMembers, useInvitations, useEntryApprovals } from '@/lib/hooks/useOrganizations';
import { getRoleDisplayName, getRoleColor, formatMembershipDate } from '@/lib/organizations/utils';

interface AdminDashboardProps {
  onInviteMembers: () => void;
  onManageSettings: () => void;
}

export default function AdminDashboard({ onInviteMembers, onManageSettings }: AdminDashboardProps) {
  const { currentOrganization, hasPermission } = useOrganizations();
  const { members, updateMemberRole, removeMember } = useOrganizationMembers(currentOrganization?.id || '');
  const { invitations, cancelInvitation } = useInvitations(currentOrganization?.id || '');
  const { pendingEntries, approveEntry } = useEntryApprovals(currentOrganization?.id || '');
  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'invitations' | 'approvals'>('overview');

  if (!currentOrganization || !hasPermission('manage')) {
    return (
      <div className="text-center py-8">
        <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
        <p className="text-muted-foreground">You don&apos;t have permission to access the admin dashboard.</p>
      </div>
    );
  }

  const stats = {
    totalMembers: members.length,
    pendingInvitations: invitations.length,
    pendingApprovals: pendingEntries.length,
    activeMembers: members.filter(m => m.status === 'active').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">{currentOrganization.name}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={onInviteMembers} className="btn-primary">
            <UserPlus className="w-4 h-4 mr-2" />
            Invite Members
          </button>
          <button onClick={onManageSettings} className="btn-outline">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Members</p>
              <p className="text-2xl font-bold">{stats.totalMembers}</p>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-500/10 rounded-lg">
              <Mail className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pending Invites</p>
              <p className="text-2xl font-bold">{stats.pendingInvitations}</p>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pending Approvals</p>
              <p className="text-2xl font-bold">{stats.pendingApprovals}</p>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <BarChart3 className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active Members</p>
              <p className="text-2xl font-bold">{stats.activeMembers}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <nav className="flex space-x-8">
          {(['overview', 'members', 'invitations', 'approvals'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2 px-1 border-b-2 font-medium text-sm capitalize ${
                activeTab === tab
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-4">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Member Activity */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Recent Members</h3>
              <div className="space-y-3">
                {members.slice(0, 5).map((member) => (
                  <div key={member.user_id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                        {member.full_name?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <p className="font-medium">{member.full_name || 'Unknown User'}</p>
                        <p className="text-sm text-muted-foreground">{member.email}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getRoleColor(member.role)}`}>
                      {getRoleDisplayName(member.role)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Pending Approvals */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Pending Approvals</h3>
              <div className="space-y-3">
                {pendingEntries.slice(0, 5).map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{entry.full_name || 'Unknown User'}</p>
                      <p className="text-sm text-muted-foreground">
                        Week ending {new Date(entry.week_ending_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => approveEntry(entry.id, 'approved')}
                        className="p-1 text-green-600 hover:bg-green-50 rounded"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => approveEntry(entry.id, 'rejected')}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'members' && (
          <div className="bg-card border border-border rounded-lg">
            <div className="p-6 border-b border-border">
              <h3 className="text-lg font-semibold">Members</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-4 font-medium">Member</th>
                    <th className="text-left p-4 font-medium">Role</th>
                    <th className="text-left p-4 font-medium">Joined</th>
                    <th className="text-left p-4 font-medium">Entries</th>
                    <th className="text-left p-4 font-medium">Status</th>
                    <th className="text-left p-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((member) => (
                    <tr key={member.user_id} className="border-b border-border">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                            {member.full_name?.charAt(0) || 'U'}
                          </div>
                          <div>
                            <p className="font-medium">{member.full_name || 'Unknown User'}</p>
                            <p className="text-sm text-muted-foreground">{member.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getRoleColor(member.role)}`}>
                          {getRoleDisplayName(member.role)}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {formatMembershipDate(member.joined_at)}
                      </td>
                      <td className="p-4 text-sm">
                        {member.published_entries}/{member.total_entries}
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${
                          member.status === 'active' ? 'text-green-600 bg-green-50 border-green-200' : 
                          'text-gray-600 bg-gray-50 border-gray-200'
                        }`}>
                          {member.status}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          {member.role !== 'super_admin' && (
                            <button
                              onClick={() => updateMemberRole(member.user_id, member.role === 'org_admin' ? 'member' : 'org_admin')}
                              className="text-xs px-2 py-1 bg-secondary text-secondary-foreground rounded hover:bg-secondary/80"
                            >
                              {member.role === 'org_admin' ? 'Make Member' : 'Make Admin'}
                            </button>
                          )}
                          <button
                            onClick={() => removeMember(member.user_id)}
                            className="text-xs px-2 py-1 bg-destructive text-destructive-foreground rounded hover:bg-destructive/80"
                          >
                            Remove
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'invitations' && (
          <div className="bg-card border border-border rounded-lg">
            <div className="p-6 border-b border-border">
              <h3 className="text-lg font-semibold">Pending Invitations</h3>
            </div>
            <div className="p-6">
              {invitations.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No pending invitations</p>
              ) : (
                <div className="space-y-4">
                  {invitations.map((invitation) => (
                    <div key={invitation.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div>
                        <p className="font-medium">{invitation.email}</p>
                        <p className="text-sm text-muted-foreground">
                          Role: {getRoleDisplayName(invitation.role)} • 
                          Expires: {new Date(invitation.expires_at).toLocaleDateString()}
                        </p>
                      </div>
                      <button
                        onClick={() => cancelInvitation(invitation.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'approvals' && (
          <div className="bg-card border border-border rounded-lg">
            <div className="p-6 border-b border-border">
              <h3 className="text-lg font-semibold">Entry Approvals</h3>
            </div>
            <div className="p-6">
              {pendingEntries.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No entries pending approval</p>
              ) : (
                <div className="space-y-4">
                  {pendingEntries.map((entry) => (
                    <div key={entry.id} className="border border-border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="font-medium">{entry.full_name || 'Unknown User'}</p>
                          <p className="text-sm text-muted-foreground">
                            Week ending {new Date(entry.week_ending_date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => approveEntry(entry.id, 'approved')}
                            className="btn-primary px-3 py-1 text-sm"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Approve
                          </button>
                          <button 
                            onClick={() => approveEntry(entry.id, 'rejected')}
                            className="btn-outline px-3 py-1 text-sm text-red-600 border-red-200 hover:bg-red-50"
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Reject
                          </button>
                        </div>
                      </div>
                      
                      {/* Entry preview */}
                      <div className="space-y-2 text-sm">
                        {entry.wins && Array.isArray(entry.wins) && (entry.wins as string[]).length > 0 && (
                          <div>
                            <p className="font-medium">Wins:</p>
                            <ul className="list-disc list-inside ml-4 text-muted-foreground">
                              {(entry.wins as string[]).map((win, index) => (
                                <li key={index}>{win}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {entry.work_summary && (
                          <div>
                            <p className="font-medium">Work Summary:</p>
                            <p className="text-muted-foreground">{entry.work_summary}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}