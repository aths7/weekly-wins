-- Organization & Community Management Extension Schema
-- Run this after the base supabase-schema.sql in your Supabase SQL editor

-- Organizations table
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#3b82f6',
  secondary_color TEXT DEFAULT '#10b981',
  settings JSONB DEFAULT '{
    "require_approval": true,
    "auto_approve_members": false,
    "allow_public_view": false,
    "weekly_reminder_enabled": true,
    "weekly_reminder_day": 5
  }',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Organization memberships table
CREATE TABLE IF NOT EXISTS organization_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'org_admin', 'member')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one membership per user per organization
  CONSTRAINT unique_user_organization UNIQUE(user_id, organization_id)
);

-- Invitations table
CREATE TABLE IF NOT EXISTS invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('org_admin', 'member')),
  invited_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  token TEXT UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one active invitation per email per organization
  CONSTRAINT unique_email_organization UNIQUE(email, organization_id)
);

-- Entry approvals table
CREATE TABLE IF NOT EXISTS entry_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID REFERENCES weekly_entries(id) ON DELETE CASCADE NOT NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one approval per entry per organization
  CONSTRAINT unique_entry_organization UNIQUE(entry_id, organization_id)
);

-- Add organization_id to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS current_organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL;

-- Add organization_id to weekly_entries table
ALTER TABLE weekly_entries 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);
CREATE INDEX IF NOT EXISTS idx_organization_memberships_organization_id ON organization_memberships(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_memberships_user_id ON organization_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_organization_memberships_role ON organization_memberships(role);
CREATE INDEX IF NOT EXISTS idx_invitations_organization_id ON invitations(organization_id);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON invitations(email);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON invitations(token);
CREATE INDEX IF NOT EXISTS idx_entry_approvals_entry_id ON entry_approvals(entry_id);
CREATE INDEX IF NOT EXISTS idx_entry_approvals_organization_id ON entry_approvals(organization_id);
CREATE INDEX IF NOT EXISTS idx_entry_approvals_status ON entry_approvals(status);
CREATE INDEX IF NOT EXISTS idx_weekly_entries_organization_id ON weekly_entries(organization_id);
CREATE INDEX IF NOT EXISTS idx_profiles_current_organization_id ON profiles(current_organization_id);

-- Enable Row Level Security (RLS)
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE entry_approvals ENABLE ROW LEVEL SECURITY;

-- Organizations RLS Policies
CREATE POLICY "Users can view organizations they are members of" 
  ON organizations 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM organization_memberships 
      WHERE organization_id = id 
      AND user_id = auth.uid() 
      AND status = 'active'
    )
  );

CREATE POLICY "Org admins can update their organizations" 
  ON organizations 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM organization_memberships 
      WHERE organization_id = id 
      AND user_id = auth.uid() 
      AND role IN ('org_admin', 'super_admin')
      AND status = 'active'
    )
  );

CREATE POLICY "Super admins can create organizations" 
  ON organizations 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_memberships 
      WHERE user_id = auth.uid() 
      AND role = 'super_admin'
      AND status = 'active'
    )
  );

-- Organization memberships RLS Policies
CREATE POLICY "Users can view memberships in their organizations" 
  ON organization_memberships 
  FOR SELECT 
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM organization_memberships om 
      WHERE om.organization_id = organization_id 
      AND om.user_id = auth.uid() 
      AND om.role IN ('org_admin', 'super_admin')
      AND om.status = 'active'
    )
  );

CREATE POLICY "Org admins can manage memberships in their organizations" 
  ON organization_memberships 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM organization_memberships om 
      WHERE om.organization_id = organization_id 
      AND om.user_id = auth.uid() 
      AND om.role IN ('org_admin', 'super_admin')
      AND om.status = 'active'
    )
  );

-- Invitations RLS Policies
CREATE POLICY "Org admins can manage invitations in their organizations" 
  ON invitations 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM organization_memberships 
      WHERE organization_id = invitations.organization_id 
      AND user_id = auth.uid() 
      AND role IN ('org_admin', 'super_admin')
      AND status = 'active'
    )
  );

CREATE POLICY "Users can view invitations sent to their email" 
  ON invitations 
  FOR SELECT 
  USING (
    email = (SELECT email FROM profiles WHERE id = auth.uid())
  );

-- Entry approvals RLS Policies
CREATE POLICY "Organization members can view approvals for their entries" 
  ON entry_approvals 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM weekly_entries 
      WHERE id = entry_id 
      AND user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM organization_memberships 
      WHERE organization_id = entry_approvals.organization_id 
      AND user_id = auth.uid() 
      AND role IN ('org_admin', 'super_admin')
      AND status = 'active'
    )
  );

CREATE POLICY "Org admins can manage approvals in their organizations" 
  ON entry_approvals 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM organization_memberships 
      WHERE organization_id = entry_approvals.organization_id 
      AND user_id = auth.uid() 
      AND role IN ('org_admin', 'super_admin')
      AND status = 'active'
    )
  );

-- Update weekly_entries RLS policies to include organization context
DROP POLICY IF EXISTS "Users can view published entries and their own entries" ON weekly_entries;
CREATE POLICY "Users can view entries in their organization" 
  ON weekly_entries 
  FOR SELECT 
  USING (
    -- Own entries
    auth.uid() = user_id OR
    -- Published entries in same organization
    (is_published = true AND organization_id IN (
      SELECT organization_id FROM organization_memberships 
      WHERE user_id = auth.uid() AND status = 'active'
    )) OR
    -- Approved entries in organization with approval workflow
    (organization_id IN (
      SELECT ea.organization_id FROM entry_approvals ea
      JOIN organization_memberships om ON ea.organization_id = om.organization_id
      WHERE ea.entry_id = weekly_entries.id 
      AND ea.status = 'approved'
      AND om.user_id = auth.uid() 
      AND om.status = 'active'
    ))
  );

-- Update weekly_entries insert policy to include organization
DROP POLICY IF EXISTS "Users can insert their own entries" ON weekly_entries;
CREATE POLICY "Users can insert entries in their organization" 
  ON weekly_entries 
  FOR INSERT 
  WITH CHECK (
    auth.uid() = user_id AND
    (organization_id IS NULL OR organization_id IN (
      SELECT organization_id FROM organization_memberships 
      WHERE user_id = auth.uid() AND status = 'active'
    ))
  );

-- Update weekly_entries update policy to include organization
DROP POLICY IF EXISTS "Users can update their own entries" ON weekly_entries;
CREATE POLICY "Users can update their own entries in their organization" 
  ON weekly_entries 
  FOR UPDATE 
  USING (
    auth.uid() = user_id AND
    (organization_id IS NULL OR organization_id IN (
      SELECT organization_id FROM organization_memberships 
      WHERE user_id = auth.uid() AND status = 'active'
    ))
  );

-- Function to handle organization creation
CREATE OR REPLACE FUNCTION create_organization_with_admin(
  org_name TEXT,
  org_slug TEXT,
  org_description TEXT DEFAULT NULL,
  admin_user_id UUID DEFAULT auth.uid()
)
RETURNS UUID AS $$
DECLARE
  new_org_id UUID;
BEGIN
  -- Insert new organization
  INSERT INTO organizations (name, slug, description)
  VALUES (org_name, org_slug, org_description)
  RETURNING id INTO new_org_id;
  
  -- Add creator as org admin
  INSERT INTO organization_memberships (organization_id, user_id, role, status)
  VALUES (new_org_id, admin_user_id, 'org_admin', 'active');
  
  RETURN new_org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle invitation acceptance
CREATE OR REPLACE FUNCTION accept_invitation(invitation_token TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  invitation_record RECORD;
  user_email TEXT;
BEGIN
  -- Get current user's email
  SELECT email INTO user_email FROM profiles WHERE id = auth.uid();
  
  -- Find valid invitation
  SELECT * INTO invitation_record FROM invitations 
  WHERE token = invitation_token 
  AND email = user_email 
  AND expires_at > NOW() 
  AND accepted_at IS NULL;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Create organization membership
  INSERT INTO organization_memberships (organization_id, user_id, role, status)
  VALUES (invitation_record.organization_id, auth.uid(), invitation_record.role, 'active')
  ON CONFLICT (user_id, organization_id) DO UPDATE SET
    role = EXCLUDED.role,
    status = 'active',
    updated_at = NOW();
  
  -- Mark invitation as accepted
  UPDATE invitations 
  SET accepted_at = NOW() 
  WHERE id = invitation_record.id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle entry approval
CREATE OR REPLACE FUNCTION approve_entry(
  entry_id UUID,
  approval_status TEXT,
  feedback_text TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  entry_record RECORD;
  user_org_id UUID;
BEGIN
  -- Get entry details
  SELECT * INTO entry_record FROM weekly_entries WHERE id = entry_id;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Check if user is admin in the entry's organization
  SELECT organization_id INTO user_org_id 
  FROM organization_memberships 
  WHERE user_id = auth.uid() 
  AND organization_id = entry_record.organization_id
  AND role IN ('org_admin', 'super_admin')
  AND status = 'active';
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Update or create approval record
  INSERT INTO entry_approvals (entry_id, organization_id, status, reviewed_by, reviewed_at, feedback)
  VALUES (entry_id, entry_record.organization_id, approval_status, auth.uid(), NOW(), feedback_text)
  ON CONFLICT (entry_id, organization_id) DO UPDATE SET
    status = EXCLUDED.status,
    reviewed_by = EXCLUDED.reviewed_by,
    reviewed_at = EXCLUDED.reviewed_at,
    feedback = EXCLUDED.feedback,
    updated_at = NOW();
  
  -- Auto-publish if approved
  IF approval_status = 'approved' THEN
    UPDATE weekly_entries 
    SET is_published = true, updated_at = NOW() 
    WHERE id = entry_id;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add triggers for updated_at
CREATE TRIGGER handle_updated_at_organizations
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at_organization_memberships
  BEFORE UPDATE ON organization_memberships
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at_entry_approvals
  BEFORE UPDATE ON entry_approvals
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Create enhanced views with organization context
CREATE OR REPLACE VIEW weekly_entries_with_organization AS
SELECT 
  we.*,
  p.full_name,
  p.avatar_url,
  p.email,
  o.name as organization_name,
  o.slug as organization_slug,
  o.primary_color as organization_primary_color,
  ea.status as approval_status,
  ea.reviewed_by as approved_by,
  ea.reviewed_at as approved_at,
  ea.feedback as approval_feedback
FROM weekly_entries we
JOIN profiles p ON we.user_id = p.id
LEFT JOIN organizations o ON we.organization_id = o.id
LEFT JOIN entry_approvals ea ON we.id = ea.entry_id AND ea.organization_id = we.organization_id;

CREATE OR REPLACE VIEW organization_member_stats AS
SELECT 
  om.organization_id,
  om.user_id,
  p.full_name,
  p.email,
  om.role,
  om.status,
  om.joined_at,
  COUNT(we.id) as total_entries,
  COUNT(CASE WHEN we.is_published THEN 1 END) as published_entries,
  COUNT(CASE WHEN ea.status = 'approved' THEN 1 END) as approved_entries,
  COUNT(CASE WHEN ea.status = 'pending' THEN 1 END) as pending_entries
FROM organization_memberships om
JOIN profiles p ON om.user_id = p.id
LEFT JOIN weekly_entries we ON om.user_id = we.user_id AND we.organization_id = om.organization_id
LEFT JOIN entry_approvals ea ON we.id = ea.entry_id AND ea.organization_id = om.organization_id
GROUP BY om.organization_id, om.user_id, p.full_name, p.email, om.role, om.status, om.joined_at;

-- Grant necessary permissions
GRANT SELECT ON weekly_entries_with_organization TO authenticated;
GRANT SELECT ON organization_member_stats TO authenticated;
GRANT EXECUTE ON FUNCTION create_organization_with_admin TO authenticated;
GRANT EXECUTE ON FUNCTION accept_invitation TO authenticated;
GRANT EXECUTE ON FUNCTION approve_entry TO authenticated;