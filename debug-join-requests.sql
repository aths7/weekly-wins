-- Debug script to check join requests data
-- Run this in Supabase SQL editor to see what's actually in the database

-- 1. Check if there are any join requests at all
SELECT 'All join requests:' as debug_step;
SELECT * FROM organization_join_requests ORDER BY created_at DESC;

-- 2. Check request statuses
SELECT 'Request statuses count:' as debug_step;
SELECT status, COUNT(*) FROM organization_join_requests GROUP BY status;

-- 3. Check organizations
SELECT 'All organizations:' as debug_step;
SELECT id, name, slug FROM organizations ORDER BY created_at DESC;

-- 4. Check organization memberships (to see which org the admin belongs to)
SELECT 'Organization memberships:' as debug_step;
SELECT 
  om.organization_id,
  o.name as org_name,
  om.user_id,
  p.full_name,
  om.role,
  om.status
FROM organization_memberships om
JOIN organizations o ON om.organization_id = o.id
JOIN profiles p ON om.user_id = p.id
ORDER BY om.created_at DESC;

-- 5. Check if there are pending requests with organization details
SELECT 'Pending requests with org details:' as debug_step;
SELECT 
  jr.id,
  jr.organization_id,
  o.name as org_name,
  jr.user_id,
  p.full_name as requester_name,
  jr.status,
  jr.created_at,
  jr.message
FROM organization_join_requests jr
JOIN organizations o ON jr.organization_id = o.id
JOIN profiles p ON jr.user_id = p.id
WHERE jr.status = 'pending'
ORDER BY jr.created_at DESC;