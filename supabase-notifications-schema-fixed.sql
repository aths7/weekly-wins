-- FIXED: In-App Notification System Schema
-- Run this to create the notification system without policy conflicts

-- Create tables first (with IF NOT EXISTS to avoid conflicts)

-- Core notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'invitation',
    'join_request', 
    'request_approved',
    'request_rejected',
    'entry_approved',
    'entry_rejected',
    'system_message',
    'organization_update'
  )),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  action_url TEXT,
  action_data JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Notification preferences per user
CREATE TABLE IF NOT EXISTS notification_preferences (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE PRIMARY KEY,
  push_enabled BOOLEAN DEFAULT true,
  sound_enabled BOOLEAN DEFAULT true,
  invitation_notifications BOOLEAN DEFAULT true,
  request_notifications BOOLEAN DEFAULT true,
  approval_notifications BOOLEAN DEFAULT true,
  system_notifications BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enhanced invitations table (in-app focused)
CREATE TABLE IF NOT EXISTS organization_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  invited_by UUID REFERENCES profiles(id) ON DELETE SET NULL NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('org_admin', 'member')),
  token UUID DEFAULT gen_random_uuid() UNIQUE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  message TEXT, -- Optional message from inviter
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one invitation per user per organization
  CONSTRAINT unique_invitation_user_org UNIQUE(organization_id, user_id)
);

-- Join requests table (user-initiated)
CREATE TABLE IF NOT EXISTS organization_join_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  message TEXT, -- User's optional message to admins
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  admin_notes TEXT, -- Private notes from admin
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one request per user per organization
  CONSTRAINT unique_request_user_org UNIQUE(organization_id, user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_organization_invitations_user_id ON organization_invitations(user_id);
CREATE INDEX IF NOT EXISTS idx_organization_invitations_org_id ON organization_invitations(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_invitations_status ON organization_invitations(status);
CREATE INDEX IF NOT EXISTS idx_join_requests_user_id ON organization_join_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_join_requests_org_id ON organization_join_requests(organization_id);
CREATE INDEX IF NOT EXISTS idx_join_requests_status ON organization_join_requests(status);

-- Enable Row Level Security
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_join_requests ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies first to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
DROP POLICY IF EXISTS "System can create notifications" ON notifications;
DROP POLICY IF EXISTS "Users can manage their own notification preferences" ON notification_preferences;
DROP POLICY IF EXISTS "Users can view invitations sent to them" ON organization_invitations;
DROP POLICY IF EXISTS "Users can update invitations sent to them" ON organization_invitations;
DROP POLICY IF EXISTS "Org admins can view invitations for their organizations" ON organization_invitations;
DROP POLICY IF EXISTS "Org admins can create invitations for their organizations" ON organization_invitations;
DROP POLICY IF EXISTS "Users can view their own join requests" ON organization_join_requests;
DROP POLICY IF EXISTS "Users can create their own join requests" ON organization_join_requests;
DROP POLICY IF EXISTS "Org admins can view requests for their organizations" ON organization_join_requests;
DROP POLICY IF EXISTS "Org admins can update requests for their organizations" ON organization_join_requests;

-- Create new RLS policies
-- Notifications RLS Policies
CREATE POLICY "notifications_select_own" 
  ON notifications 
  FOR SELECT 
  USING (user_id = auth.uid());

CREATE POLICY "notifications_update_own" 
  ON notifications 
  FOR UPDATE 
  USING (user_id = auth.uid());

CREATE POLICY "notifications_insert_system" 
  ON notifications 
  FOR INSERT 
  WITH CHECK (true); -- Handled by functions

-- Notification preferences RLS policies
CREATE POLICY "notification_prefs_manage_own" 
  ON notification_preferences 
  FOR ALL 
  USING (user_id = auth.uid());

-- Organization invitations RLS policies
CREATE POLICY "invitations_select_own" 
  ON organization_invitations 
  FOR SELECT 
  USING (user_id = auth.uid());

CREATE POLICY "invitations_update_own" 
  ON organization_invitations 
  FOR UPDATE 
  USING (user_id = auth.uid());

CREATE POLICY "invitations_select_admin" 
  ON organization_invitations 
  FOR SELECT 
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_memberships 
      WHERE user_id = auth.uid() 
      AND role IN ('org_admin', 'super_admin')
      AND status = 'active'
    )
  );

CREATE POLICY "invitations_insert_admin" 
  ON organization_invitations 
  FOR INSERT 
  WITH CHECK (
    organization_id IN (
      SELECT organization_id 
      FROM organization_memberships 
      WHERE user_id = auth.uid() 
      AND role IN ('org_admin', 'super_admin')
      AND status = 'active'
    )
  );

-- Join requests RLS policies
CREATE POLICY "join_requests_select_own" 
  ON organization_join_requests 
  FOR SELECT 
  USING (user_id = auth.uid());

CREATE POLICY "join_requests_insert_own" 
  ON organization_join_requests 
  FOR INSERT 
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "join_requests_select_admin" 
  ON organization_join_requests 
  FOR SELECT 
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_memberships 
      WHERE user_id = auth.uid() 
      AND role IN ('org_admin', 'super_admin')
      AND status = 'active'
    )
  );

CREATE POLICY "join_requests_update_admin" 
  ON organization_join_requests 
  FOR UPDATE 
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_memberships 
      WHERE user_id = auth.uid() 
      AND role IN ('org_admin', 'super_admin')
      AND status = 'active'
    )
  );

-- Drop existing functions to avoid conflicts
DROP FUNCTION IF EXISTS create_notification(UUID, TEXT, TEXT, TEXT, UUID, TEXT, JSONB, INTEGER);
DROP FUNCTION IF EXISTS send_organization_invitation(UUID, UUID, TEXT, TEXT);
DROP FUNCTION IF EXISTS respond_to_invitation(UUID, TEXT);
DROP FUNCTION IF EXISTS submit_join_request(UUID, TEXT);
DROP FUNCTION IF EXISTS respond_to_join_request(UUID, TEXT, TEXT);
DROP FUNCTION IF EXISTS mark_notifications_read(UUID[]);
DROP FUNCTION IF EXISTS cleanup_expired_notifications();

-- Function to create notification
CREATE OR REPLACE FUNCTION create_notification(
  target_user_id UUID,
  notification_type TEXT,
  notification_title TEXT,
  notification_message TEXT,
  org_id UUID DEFAULT NULL,
  action_url TEXT DEFAULT NULL,
  action_data JSONB DEFAULT '{}',
  expires_in_hours INTEGER DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  notification_id UUID;
  expires_at_value TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Calculate expiration if provided
  IF expires_in_hours IS NOT NULL THEN
    expires_at_value := NOW() + (expires_in_hours || ' hours')::INTERVAL;
  END IF;
  
  -- Insert notification
  INSERT INTO notifications (
    user_id, 
    organization_id, 
    type, 
    title, 
    message, 
    action_url, 
    action_data, 
    expires_at
  )
  VALUES (
    target_user_id,
    org_id,
    notification_type,
    notification_title,
    notification_message,
    action_url,
    action_data,
    expires_at_value
  )
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to send invitation with notification
CREATE OR REPLACE FUNCTION send_organization_invitation(
  org_id UUID,
  target_user_id UUID,
  inviter_role TEXT,
  invitation_message TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  invitation_id UUID;
  org_name TEXT;
  inviter_name TEXT;
  notification_title TEXT;
  notification_message TEXT;
BEGIN
  -- Get organization name
  SELECT name INTO org_name FROM organizations WHERE id = org_id;
  
  -- Get inviter name
  SELECT full_name INTO inviter_name FROM profiles WHERE id = auth.uid();
  
  -- Create invitation
  INSERT INTO organization_invitations (
    organization_id,
    user_id,
    invited_by,
    role,
    message
  )
  VALUES (
    org_id,
    target_user_id,
    auth.uid(),
    inviter_role,
    invitation_message
  )
  RETURNING id INTO invitation_id;
  
  -- Create notification
  notification_title := 'Invitation to join ' || org_name;
  notification_message := inviter_name || ' invited you to join ' || org_name || ' as ' || replace(inviter_role, '_', ' ');
  
  PERFORM create_notification(
    target_user_id,
    'invitation',
    notification_title,
    notification_message,
    org_id,
    '/invitations/' || invitation_id,
    jsonb_build_object('invitation_id', invitation_id, 'organization_id', org_id),
    168 -- 7 days
  );
  
  RETURN invitation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle invitation response
CREATE OR REPLACE FUNCTION respond_to_invitation(
  invitation_id UUID,
  response TEXT -- 'accepted' or 'declined'
)
RETURNS BOOLEAN AS $$
DECLARE
  invitation_record RECORD;
  org_name TEXT;
  user_name TEXT;
BEGIN
  -- Get invitation details
  SELECT * INTO invitation_record FROM organization_invitations 
  WHERE id = invitation_id AND user_id = auth.uid() AND status = 'pending';
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Update invitation status
  UPDATE organization_invitations 
  SET 
    status = response,
    accepted_at = CASE WHEN response = 'accepted' THEN NOW() ELSE NULL END
  WHERE id = invitation_id;
  
  -- If accepted, create membership
  IF response = 'accepted' THEN
    INSERT INTO organization_memberships (organization_id, user_id, role, status)
    VALUES (invitation_record.organization_id, auth.uid(), invitation_record.role, 'active')
    ON CONFLICT (user_id, organization_id) DO UPDATE SET
      role = EXCLUDED.role,
      status = 'active',
      updated_at = NOW();
  END IF;
  
  -- Create notification for inviter
  SELECT name INTO org_name FROM organizations WHERE id = invitation_record.organization_id;
  SELECT full_name INTO user_name FROM profiles WHERE id = auth.uid();
  
  PERFORM create_notification(
    invitation_record.invited_by,
    CASE WHEN response = 'accepted' THEN 'request_approved' ELSE 'request_rejected' END,
    user_name || CASE WHEN response = 'accepted' THEN ' joined ' ELSE ' declined invitation to ' END || org_name,
    CASE 
      WHEN response = 'accepted' THEN user_name || ' has joined your organization ' || org_name
      ELSE user_name || ' declined the invitation to join ' || org_name
    END,
    invitation_record.organization_id
  );
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to submit join request
CREATE OR REPLACE FUNCTION submit_join_request(
  org_id UUID,
  request_message TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  request_id UUID;
  org_name TEXT;
  user_name TEXT;
  admin_user_id UUID;
BEGIN
  -- Create join request
  INSERT INTO organization_join_requests (
    organization_id,
    user_id,
    message
  )
  VALUES (
    org_id,
    auth.uid(),
    request_message
  )
  RETURNING id INTO request_id;
  
  -- Get organization and user names
  SELECT name INTO org_name FROM organizations WHERE id = org_id;
  SELECT full_name INTO user_name FROM profiles WHERE id = auth.uid();
  
  -- Create notifications for all admins of the organization
  FOR admin_user_id IN 
    SELECT user_id FROM organization_memberships 
    WHERE organization_id = org_id 
    AND role IN ('org_admin', 'super_admin')
    AND status = 'active'
  LOOP
    PERFORM create_notification(
      admin_user_id,
      'join_request',
      'New member request for ' || org_name,
      user_name || ' wants to join your organization',
      org_id,
      '/admin/requests/' || request_id,
      jsonb_build_object('request_id', request_id, 'user_id', auth.uid())
    );
  END LOOP;
  
  RETURN request_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle join request response
CREATE OR REPLACE FUNCTION respond_to_join_request(
  request_id UUID,
  response TEXT, -- 'approved' or 'rejected'
  admin_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  request_record RECORD;
  org_name TEXT;
  admin_name TEXT;
  notification_title TEXT;
  notification_message TEXT;
BEGIN
  -- Get request details
  SELECT * INTO request_record FROM organization_join_requests 
  WHERE id = request_id AND status = 'pending';
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Check if current user is admin of the organization
  IF NOT EXISTS (
    SELECT 1 FROM organization_memberships 
    WHERE organization_id = request_record.organization_id 
    AND user_id = auth.uid() 
    AND role IN ('org_admin', 'super_admin')
    AND status = 'active'
  ) THEN
    RETURN FALSE;
  END IF;
  
  -- Update request status
  UPDATE organization_join_requests 
  SET 
    status = response,
    reviewed_by = auth.uid(),
    reviewed_at = NOW(),
    admin_notes = admin_notes
  WHERE id = request_id;
  
  -- If approved, create membership
  IF response = 'approved' THEN
    INSERT INTO organization_memberships (organization_id, user_id, role, status)
    VALUES (request_record.organization_id, request_record.user_id, 'member', 'active')
    ON CONFLICT (user_id, organization_id) DO UPDATE SET
      status = 'active',
      updated_at = NOW();
  END IF;
  
  -- Get names for notification
  SELECT name INTO org_name FROM organizations WHERE id = request_record.organization_id;
  SELECT full_name INTO admin_name FROM profiles WHERE id = auth.uid();
  
  -- Create notification for user
  IF response = 'approved' THEN
    notification_title := 'Welcome to ' || org_name || '!';
    notification_message := 'Your request to join ' || org_name || ' has been approved';
  ELSE
    notification_title := 'Request declined';
    notification_message := 'Your request to join ' || org_name || ' was declined';
  END IF;
  
  PERFORM create_notification(
    request_record.user_id,
    CASE WHEN response = 'approved' THEN 'request_approved' ELSE 'request_rejected' END,
    notification_title,
    notification_message,
    request_record.organization_id,
    CASE WHEN response = 'approved' THEN '/organizations/' || request_record.organization_id ELSE NULL END
  );
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark notifications as read
CREATE OR REPLACE FUNCTION mark_notifications_read(notification_ids UUID[])
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE notifications 
  SET is_read = true 
  WHERE id = ANY(notification_ids) 
  AND user_id = auth.uid()
  AND is_read = false;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up expired notifications
CREATE OR REPLACE FUNCTION cleanup_expired_notifications()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM notifications 
  WHERE expires_at IS NOT NULL 
  AND expires_at < NOW();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add triggers for updated_at
DROP TRIGGER IF EXISTS handle_updated_at_notification_preferences ON notification_preferences;
CREATE TRIGGER handle_updated_at_notification_preferences
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_updated_at_join_requests ON organization_join_requests;
CREATE TRIGGER handle_updated_at_join_requests
  BEFORE UPDATE ON organization_join_requests
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Drop existing views to avoid conflicts
DROP VIEW IF EXISTS user_notifications_with_context;

-- Create views for easier querying
CREATE OR REPLACE VIEW user_notifications_with_context AS
SELECT 
  n.*,
  o.name as organization_name,
  o.slug as organization_slug,
  CASE 
    WHEN n.type = 'invitation' THEN (
      SELECT jsonb_build_object(
        'inviter_name', p.full_name,
        'role', oi.role
      )
      FROM organization_invitations oi
      JOIN profiles p ON oi.invited_by = p.id
      WHERE oi.id = (n.action_data->>'invitation_id')::UUID
    )
    WHEN n.type = 'join_request' THEN (
      SELECT jsonb_build_object(
        'requester_name', p.full_name,
        'message', ojr.message
      )
      FROM organization_join_requests ojr
      JOIN profiles p ON ojr.user_id = p.id
      WHERE ojr.id = (n.action_data->>'request_id')::UUID
    )
    ELSE '{}'::jsonb
  END as context_data
FROM notifications n
LEFT JOIN organizations o ON n.organization_id = o.id;

-- Grant necessary permissions
GRANT SELECT, UPDATE ON notifications TO authenticated;
GRANT ALL ON notification_preferences TO authenticated;
GRANT SELECT, UPDATE ON organization_invitations TO authenticated;
GRANT SELECT, INSERT, UPDATE ON organization_join_requests TO authenticated;
GRANT SELECT ON user_notifications_with_context TO authenticated;
GRANT EXECUTE ON FUNCTION create_notification TO authenticated;
GRANT EXECUTE ON FUNCTION send_organization_invitation TO authenticated;
GRANT EXECUTE ON FUNCTION respond_to_invitation TO authenticated;
GRANT EXECUTE ON FUNCTION submit_join_request TO authenticated;
GRANT EXECUTE ON FUNCTION respond_to_join_request TO authenticated;
GRANT EXECUTE ON FUNCTION mark_notifications_read TO authenticated;