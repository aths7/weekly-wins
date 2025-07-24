-- Fix the respond_to_join_request function to resolve admin_notes ambiguity

-- First drop the existing function
DROP FUNCTION IF EXISTS respond_to_join_request(UUID, TEXT, TEXT);

-- Create the fixed function with renamed parameter
CREATE OR REPLACE FUNCTION respond_to_join_request(
  request_id UUID,
  response TEXT, -- 'approved' or 'rejected'
  admin_notes_param TEXT DEFAULT NULL
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
    admin_notes = admin_notes_param  -- Use the renamed parameter
  WHERE id = request_id;
  
  -- If approved, create membership
  IF response = 'approved' THEN
    INSERT INTO organization_memberships (organization_id, user_id, role, status)
    VALUES (request_record.organization_id, request_record.user_id, 'member', 'active')
    ON CONFLICT (user_id, organization_id) DO UPDATE SET
      role = 'member',
      status = 'active',
      updated_at = NOW();
  END IF;
  
  -- Get organization and admin names for notification
  SELECT name INTO org_name FROM organizations WHERE id = request_record.organization_id;
  SELECT full_name INTO admin_name FROM profiles WHERE id = auth.uid();
  
  -- Create notification for the requester
  IF response = 'approved' THEN
    notification_title := 'Welcome to ' || org_name;
    notification_message := 'Your request to join ' || org_name || ' has been approved by ' || admin_name;
  ELSE
    notification_title := 'Request declined';
    notification_message := 'Your request to join ' || org_name || ' has been declined by ' || admin_name;
    IF admin_notes_param IS NOT NULL THEN
      notification_message := notification_message || '. Note: ' || admin_notes_param;
    END IF;
  END IF;
  
  PERFORM create_notification(
    request_record.user_id,
    CASE WHEN response = 'approved' THEN 'request_approved' ELSE 'request_rejected' END,
    notification_title,
    notification_message,
    request_record.organization_id
  );
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION respond_to_join_request TO authenticated;