-- Fix for duplicate join request issue
-- Run this to update the submit_join_request function

CREATE OR REPLACE FUNCTION submit_join_request(
  org_id UUID,
  request_message TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  request_id UUID;
  existing_request RECORD;
  org_name TEXT;
  user_name TEXT;
  admin_user_id UUID;
BEGIN
  -- Check for existing request
  SELECT * INTO existing_request 
  FROM organization_join_requests 
  WHERE organization_id = org_id 
  AND user_id = auth.uid();
  
  -- If request exists and is pending, return existing ID
  IF FOUND THEN
    IF existing_request.status = 'pending' THEN
      RETURN existing_request.id;
    ELSIF existing_request.status = 'rejected' THEN
      -- Update the rejected request to pending with new message
      UPDATE organization_join_requests
      SET 
        status = 'pending',
        message = request_message,
        created_at = NOW(),
        reviewed_by = NULL,
        reviewed_at = NULL,
        admin_notes = NULL
      WHERE id = existing_request.id
      RETURNING id INTO request_id;
    ELSE
      -- Request was approved, user is already a member
      RAISE EXCEPTION 'You are already a member of this organization';
    END IF;
  ELSE
    -- Create new join request
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
  END IF;
  
  -- Get organization and user names
  SELECT name INTO org_name FROM organizations WHERE id = org_id;
  SELECT full_name INTO user_name FROM profiles WHERE id = auth.uid();
  
  -- Only send notifications if this is a new request or resubmitted request
  IF existing_request.id IS NULL OR existing_request.status = 'rejected' THEN
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
  END IF;
  
  RETURN request_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;