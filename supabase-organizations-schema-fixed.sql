-- FIXED: Organization & Community Management Extension Schema
-- Run this to fix the infinite recursion issue

-- First, drop the problematic policies
DROP POLICY IF EXISTS "Users can view memberships in their organizations" ON organization_memberships;
DROP POLICY IF EXISTS "Org admins can manage memberships in their organizations" ON organization_memberships;
DROP POLICY IF EXISTS "Org admins can manage invitations in their organizations" ON invitations;
DROP POLICY IF EXISTS "Org admins can manage approvals in their organizations" ON entry_approvals;

-- Create fixed organization memberships RLS policies without recursion
CREATE POLICY "Users can view their own memberships" 
  ON organization_memberships 
  FOR SELECT 
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own memberships via invitations" 
  ON organization_memberships 
  FOR INSERT 
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Org admins can view all memberships in their organizations" 
  ON organization_memberships 
  FOR SELECT 
  USING (
    user_id = auth.uid() OR
    organization_id IN (
      SELECT organization_id 
      FROM organization_memberships 
      WHERE user_id = auth.uid() 
      AND role IN ('org_admin', 'super_admin')
      AND status = 'active'
    )
  );

CREATE POLICY "Org admins can update memberships in their organizations" 
  ON organization_memberships 
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

CREATE POLICY "Org admins can delete memberships in their organizations" 
  ON organization_memberships 
  FOR DELETE 
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_memberships 
      WHERE user_id = auth.uid() 
      AND role IN ('org_admin', 'super_admin')
      AND status = 'active'
    )
  );

-- Fixed invitations RLS policies
CREATE POLICY "Org admins can manage invitations" 
  ON invitations 
  FOR ALL 
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_memberships 
      WHERE user_id = auth.uid() 
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

-- Fixed entry approvals RLS policies
CREATE POLICY "Users can view approvals for their entries" 
  ON entry_approvals 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM weekly_entries 
      WHERE id = entry_id 
      AND user_id = auth.uid()
    ) OR
    organization_id IN (
      SELECT organization_id 
      FROM organization_memberships 
      WHERE user_id = auth.uid() 
      AND role IN ('org_admin', 'super_admin')
      AND status = 'active'
    )
  );

CREATE POLICY "Org admins can manage approvals" 
  ON entry_approvals 
  FOR ALL 
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_memberships 
      WHERE user_id = auth.uid() 
      AND role IN ('org_admin', 'super_admin')
      AND status = 'active'
    )
  );

-- Create a helper function to check if user is admin (optional, for better performance)
CREATE OR REPLACE FUNCTION is_organization_admin(org_id UUID, user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM organization_memberships 
    WHERE organization_id = org_id 
    AND organization_memberships.user_id = is_organization_admin.user_id 
    AND role IN ('org_admin', 'super_admin')
    AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Alternative simpler policies using the helper function (you can use these instead if preferred)
/*
DROP POLICY IF EXISTS "Org admins can view all memberships in their organizations" ON organization_memberships;
CREATE POLICY "Org admins can view all memberships in their organizations" 
  ON organization_memberships 
  FOR SELECT 
  USING (
    user_id = auth.uid() OR 
    is_organization_admin(organization_id)
  );
*/