export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          current_organization_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          current_organization_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          current_organization_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      weekly_entries: {
        Row: {
          id: string
          user_id: string
          week_ending_date: string
          wins: Json
          work_summary: string | null
          results_contributed: string | null
          learnings: string | null
          challenges: string | null
          is_published: boolean
          organization_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          week_ending_date: string
          wins?: Json
          work_summary?: string | null
          results_contributed?: string | null
          learnings?: string | null
          challenges?: string | null
          is_published?: boolean
          organization_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          week_ending_date?: string
          wins?: Json
          work_summary?: string | null
          results_contributed?: string | null
          learnings?: string | null
          challenges?: string | null
          is_published?: boolean
          organization_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      organizations: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          logo_url: string | null
          primary_color: string
          secondary_color: string
          settings: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          logo_url?: string | null
          primary_color?: string
          secondary_color?: string
          settings?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          logo_url?: string | null
          primary_color?: string
          secondary_color?: string
          settings?: Json
          created_at?: string
          updated_at?: string
        }
      }
      organization_memberships: {
        Row: {
          id: string
          organization_id: string
          user_id: string
          role: 'super_admin' | 'org_admin' | 'member'
          status: 'active' | 'inactive' | 'pending'
          joined_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          user_id: string
          role: 'super_admin' | 'org_admin' | 'member'
          status?: 'active' | 'inactive' | 'pending'
          joined_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          user_id?: string
          role?: 'super_admin' | 'org_admin' | 'member'
          status?: 'active' | 'inactive' | 'pending'
          joined_at?: string
          created_at?: string
          updated_at?: string
        }
      }
      invitations: {
        Row: {
          id: string
          organization_id: string
          email: string
          role: 'org_admin' | 'member'
          invited_by: string | null
          token: string
          expires_at: string
          accepted_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          email: string
          role: 'org_admin' | 'member'
          invited_by?: string | null
          token?: string
          expires_at?: string
          accepted_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          email?: string
          role?: 'org_admin' | 'member'
          invited_by?: string | null
          token?: string
          expires_at?: string
          accepted_at?: string | null
          created_at?: string
        }
      }
      entry_approvals: {
        Row: {
          id: string
          entry_id: string
          organization_id: string
          status: 'pending' | 'approved' | 'rejected'
          reviewed_by: string | null
          reviewed_at: string | null
          feedback: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          entry_id: string
          organization_id: string
          status?: 'pending' | 'approved' | 'rejected'
          reviewed_by?: string | null
          reviewed_at?: string | null
          feedback?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          entry_id?: string
          organization_id?: string
          status?: 'pending' | 'approved' | 'rejected'
          reviewed_by?: string | null
          reviewed_at?: string | null
          feedback?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          organization_id: string | null
          type: 'invitation' | 'join_request' | 'request_approved' | 'request_rejected' | 'entry_approved' | 'entry_rejected' | 'system_message' | 'organization_update'
          title: string
          message: string
          action_url: string | null
          action_data: Json
          is_read: boolean
          created_at: string
          expires_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          organization_id?: string | null
          type: 'invitation' | 'join_request' | 'request_approved' | 'request_rejected' | 'entry_approved' | 'entry_rejected' | 'system_message' | 'organization_update'
          title: string
          message: string
          action_url?: string | null
          action_data?: Json
          is_read?: boolean
          created_at?: string
          expires_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          organization_id?: string | null
          type?: 'invitation' | 'join_request' | 'request_approved' | 'request_rejected' | 'entry_approved' | 'entry_rejected' | 'system_message' | 'organization_update'
          title?: string
          message?: string
          action_url?: string | null
          action_data?: Json
          is_read?: boolean
          created_at?: string
          expires_at?: string | null
        }
      }
      notification_preferences: {
        Row: {
          user_id: string
          push_enabled: boolean
          sound_enabled: boolean
          invitation_notifications: boolean
          request_notifications: boolean
          approval_notifications: boolean
          system_notifications: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          push_enabled?: boolean
          sound_enabled?: boolean
          invitation_notifications?: boolean
          request_notifications?: boolean
          approval_notifications?: boolean
          system_notifications?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          push_enabled?: boolean
          sound_enabled?: boolean
          invitation_notifications?: boolean
          request_notifications?: boolean
          approval_notifications?: boolean
          system_notifications?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      organization_invitations: {
        Row: {
          id: string
          organization_id: string
          user_id: string
          invited_by: string
          role: 'org_admin' | 'member'
          token: string
          status: 'pending' | 'accepted' | 'declined' | 'expired'
          message: string | null
          expires_at: string
          accepted_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          user_id: string
          invited_by: string
          role?: 'org_admin' | 'member'
          token?: string
          status?: 'pending' | 'accepted' | 'declined' | 'expired'
          message?: string | null
          expires_at?: string
          accepted_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          user_id?: string
          invited_by?: string
          role?: 'org_admin' | 'member'
          token?: string
          status?: 'pending' | 'accepted' | 'declined' | 'expired'
          message?: string | null
          expires_at?: string
          accepted_at?: string | null
          created_at?: string
        }
      }
      organization_join_requests: {
        Row: {
          id: string
          organization_id: string
          user_id: string
          message: string | null
          status: 'pending' | 'approved' | 'rejected'
          reviewed_by: string | null
          reviewed_at: string | null
          admin_notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          user_id: string
          message?: string | null
          status?: 'pending' | 'approved' | 'rejected'
          reviewed_by?: string | null
          reviewed_at?: string | null
          admin_notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          user_id?: string
          message?: string | null
          status?: 'pending' | 'approved' | 'rejected'
          reviewed_by?: string | null
          reviewed_at?: string | null
          admin_notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      weekly_entries_with_organization: {
        Row: {
          id: string
          user_id: string
          week_ending_date: string
          wins: Json
          work_summary: string | null
          results_contributed: string | null
          learnings: string | null
          challenges: string | null
          is_published: boolean
          organization_id: string | null
          created_at: string
          updated_at: string
          full_name: string | null
          avatar_url: string | null
          email: string
          organization_name: string | null
          organization_slug: string | null
          organization_primary_color: string | null
          approval_status: 'pending' | 'approved' | 'rejected' | null
          approved_by: string | null
          approved_at: string | null
          approval_feedback: string | null
        }
      }
      organization_member_stats: {
        Row: {
          organization_id: string
          user_id: string
          full_name: string | null
          email: string
          role: 'super_admin' | 'org_admin' | 'member'
          status: 'active' | 'inactive' | 'pending'
          joined_at: string
          total_entries: number
          published_entries: number
          approved_entries: number
          pending_entries: number
        }
      }
      user_notifications_with_context: {
        Row: {
          id: string
          user_id: string
          organization_id: string | null
          type: 'invitation' | 'join_request' | 'request_approved' | 'request_rejected' | 'entry_approved' | 'entry_rejected' | 'system_message' | 'organization_update'
          title: string
          message: string
          action_url: string | null
          action_data: Json
          is_read: boolean
          created_at: string
          expires_at: string | null
          organization_name: string | null
          organization_slug: string | null
          context_data: Json
        }
      }
    }
    Functions: {
      create_organization_with_admin: {
        Args: {
          org_name: string
          org_slug: string
          org_description?: string | null
          admin_user_id?: string
        }
        Returns: string
      }
      accept_invitation: {
        Args: {
          invitation_token: string
        }
        Returns: boolean
      }
      approve_entry: {
        Args: {
          entry_id: string
          approval_status: 'pending' | 'approved' | 'rejected'
          feedback_text?: string | null
        }
        Returns: boolean
      }
      create_notification: {
        Args: {
          target_user_id: string
          notification_type: string
          notification_title: string
          notification_message: string
          org_id?: string | null
          action_url?: string | null
          action_data?: Json
          expires_in_hours?: number | null
        }
        Returns: string
      }
      send_organization_invitation: {
        Args: {
          org_id: string
          target_user_id: string
          inviter_role: string
          invitation_message?: string | null
        }
        Returns: string
      }
      respond_to_invitation: {
        Args: {
          invitation_id: string
          response: string
        }
        Returns: boolean
      }
      submit_join_request: {
        Args: {
          org_id: string
          request_message?: string | null
        }
        Returns: string
      }
      respond_to_join_request: {
        Args: {
          request_id: string
          response: string
          admin_notes?: string | null
        }
        Returns: boolean
      }
      mark_notifications_read: {
        Args: {
          notification_ids: string[]
        }
        Returns: number
      }
    }
    Enums: {
      user_role: 'super_admin' | 'org_admin' | 'member'
      membership_status: 'active' | 'inactive' | 'pending'
      approval_status: 'pending' | 'approved' | 'rejected'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Views<T extends keyof Database['public']['Views']> = Database['public']['Views'][T]['Row']
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T]

export type WeeklyEntry = Tables<'weekly_entries'> & {
  profiles: Tables<'profiles'> | null
}
export type Profile = Tables<'profiles'>
export type Organization = Tables<'organizations'>
export type OrganizationMembership = Tables<'organization_memberships'>
export type Invitation = Tables<'invitations'>
export type EntryApproval = Tables<'entry_approvals'>
export type Notification = Tables<'notifications'>
export type NotificationPreferences = Tables<'notification_preferences'>
export type OrganizationInvitation = Tables<'organization_invitations'>
export type OrganizationJoinRequest = Tables<'organization_join_requests'>

export type WeeklyEntryWithOrganization = Views<'weekly_entries_with_organization'>
export type OrganizationMemberStats = Views<'organization_member_stats'>
export type UserNotificationWithContext = Views<'user_notifications_with_context'>

export type UserRole = Enums<'user_role'>
export type MembershipStatus = Enums<'membership_status'>
export type ApprovalStatus = Enums<'approval_status'>

export interface OrganizationSettings {
  require_approval: boolean
  auto_approve_members: boolean
  allow_public_view: boolean
  weekly_reminder_enabled: boolean
  weekly_reminder_day: number
}