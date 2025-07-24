#!/bin/bash

# Weekly Wins - Admin Notifications API Test Script
# This script tests the Supabase REST API endpoints used for admin notifications

# Supabase Configuration
SUPABASE_URL="https://rbkabkvwnumsoncwuwxr.supabase.co"
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJia2Fia3Z3bnVtc29uY3d1d3hyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2NTM4NjcsImV4cCI6MjA2ODIyOTg2N30.4arkd4PeuRZ-sy2gSAhNbaaC7ZUhtmS2ENzva4TvMOc"
SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJia2Fia3Z3bnVtc29uY3d1d3hyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjY1Mzg2NywiZXhwIjoyMDY4MjI5ODY3fQ.9q2Q_NMDj1JdyqBDMXsPHRBHsccoUAQlnFPK64Vf2bg"

# Replace these with your actual IDs
YOUR_ORG_ID="13ffe779-f1b9-4c3a-9b86-c375b7f0857f"
YOUR_USER_ID="replace-with-your-user-id"

echo "=================================="
echo "Weekly Wins Admin Notifications API Tests"
echo "=================================="

echo ""
echo "1. GET ALL ORGANIZATIONS"
echo "========================"
curl -X GET \
  "${SUPABASE_URL}/rest/v1/organizations?select=id,name,slug,created_at" \
  -H "apikey: ${ANON_KEY}" \
  -H "Authorization: Bearer ${ANON_KEY}" \
  -H "Content-Type: application/json" \
  | jq '.'

echo ""
echo "2. GET PENDING JOIN REQUESTS FOR ORGANIZATION (Main Admin Notifications API)"
echo "==========================================================================="
curl -X GET \
  "${SUPABASE_URL}/rest/v1/organization_join_requests?organization_id=eq.${YOUR_ORG_ID}&status=eq.pending&select=*,profiles(full_name,email,avatar_url)&order=created_at.desc" \
  -H "apikey: ${ANON_KEY}" \
  -H "Authorization: Bearer ${ANON_KEY}" \
  -H "Content-Type: application/json" \
  | jq '.'

echo ""
echo "3. GET ALL JOIN REQUESTS FOR ORGANIZATION (Any Status)"
echo "======================================================"
curl -X GET \
  "${SUPABASE_URL}/rest/v1/organization_join_requests?organization_id=eq.${YOUR_ORG_ID}&select=*,profiles(full_name,email,avatar_url)&order=created_at.desc" \
  -H "apikey: ${ANON_KEY}" \
  -H "Authorization: Bearer ${ANON_KEY}" \
  -H "Content-Type: application/json" \
  | jq '.'

echo ""
echo "4. GET ORGANIZATION MEMBERSHIPS (To find your organization ID)"
echo "============================================================="
curl -X GET \
  "${SUPABASE_URL}/rest/v1/organization_memberships?select=*,organizations(id,name,slug),profiles(full_name,email)&order=created_at.desc" \
  -H "apikey: ${ANON_KEY}" \
  -H "Authorization: Bearer ${ANON_KEY}" \
  -H "Content-Type: application/json" \
  | jq '.'

echo ""
echo "5. GET USER NOTIFICATIONS (General notifications for admin)"
echo "=========================================================="
curl -X GET \
  "${SUPABASE_URL}/rest/v1/notifications?user_id=eq.${YOUR_USER_ID}&order=created_at.desc&limit=20" \
  -H "apikey: ${ANON_KEY}" \
  -H "Authorization: Bearer ${ANON_KEY}" \
  -H "Content-Type: application/json" \
  | jq '.'

echo ""
echo "6. GET PENDING ENTRY APPROVALS (Entries waiting for admin approval)"
echo "=================================================================="
curl -X GET \
  "${SUPABASE_URL}/rest/v1/weekly_entries?organization_id=eq.${YOUR_ORG_ID}&is_published=eq.false&approval_status=is.null&select=*,profiles(full_name,email)&order=created_at.desc" \
  -H "apikey: ${ANON_KEY}" \
  -H "Authorization: Bearer ${ANON_KEY}" \
  -H "Content-Type: application/json" \
  | jq '.'

echo ""
echo "7. GET ORGANIZATION INVITATIONS (Pending invitations sent by admin)"
echo "=================================================================="
curl -X GET \
  "${SUPABASE_URL}/rest/v1/organization_invitations?organization_id=eq.${YOUR_ORG_ID}&status=eq.pending&select=*,organizations(name,slug)&order=created_at.desc" \
  -H "apikey: ${ANON_KEY}" \
  -H "Authorization: Bearer ${ANON_KEY}" \
  -H "Content-Type: application/json" \
  | jq '.'

echo ""
echo "8. GET PROFILES (To understand user data structure)"
echo "=================================================="
curl -X GET \
  "${SUPABASE_URL}/rest/v1/profiles?select=id,full_name,email,avatar_url&limit=5" \
  -H "apikey: ${ANON_KEY}" \
  -H "Authorization: Bearer ${ANON_KEY}" \
  -H "Content-Type: application/json" \
  | jq '.'

echo ""
echo "=================================="
echo "ADMIN TESTS WITH SERVICE ROLE KEY"
echo "=================================="

echo ""
echo "9. GET PENDING JOIN REQUESTS (Using Service Role Key - Bypasses RLS)"
echo "=================================================================="
curl -X GET \
  "${SUPABASE_URL}/rest/v1/organization_join_requests?organization_id=eq.${YOUR_ORG_ID}&status=eq.pending&select=*,profiles(full_name,email,avatar_url)&order=created_at.desc" \
  -H "apikey: ${SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  | jq '.'

echo ""
echo "10. CALL RPC FUNCTION - Submit Join Request (Example POST operation)"
echo "=================================================================="
curl -X POST \
  "${SUPABASE_URL}/rest/v1/rpc/submit_join_request" \
  -H "apikey: ${ANON_KEY}" \
  -H "Authorization: Bearer ${ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "org_id": "'${YOUR_ORG_ID}'",
    "request_message": "Test request from API script"
  }' \
  | jq '.'

echo ""
echo "11. CALL RPC FUNCTION - Respond to Join Request (Example admin action)"
echo "===================================================================="
echo "Note: Replace 'request-id-here' with actual request ID from previous calls"
curl -X POST \
  "${SUPABASE_URL}/rest/v1/rpc/respond_to_join_request" \
  -H "apikey: ${ANON_KEY}" \
  -H "Authorization: Bearer ${ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "request_id": "request-id-here",
    "response": "approved",
    "admin_notes": "Test approval from API script"
  }' \
  | jq '.'

echo ""
echo "=================================="
echo "DEBUGGING QUERIES"
echo "=================================="

echo ""
echo "12. COUNT REQUESTS BY STATUS"
echo "============================"
curl -X GET \
  "${SUPABASE_URL}/rest/v1/organization_join_requests?select=status&organization_id=eq.${YOUR_ORG_ID}" \
  -H "apikey: ${ANON_KEY}" \
  -H "Authorization: Bearer ${ANON_KEY}" \
  -H "Content-Type: application/json" \
  | jq 'group_by(.status) | map({status: .[0].status, count: length})'

echo ""
echo "13. CHECK RLS POLICIES (Using Service Role)"
echo "==========================================="
curl -X GET \
  "${SUPABASE_URL}/rest/v1/organization_join_requests?select=*&limit=5" \
  -H "apikey: ${SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  | jq '.'

echo ""
echo "=================================="
echo "POSTMAN COLLECTION EXPORT"
echo "=================================="
echo "To import into Postman:"
echo "1. Copy each curl command above"
echo "2. In Postman, click 'Import' > 'Raw text'"
echo "3. Paste the curl command"
echo "4. Update YOUR_ORG_ID and YOUR_USER_ID variables"
echo ""
echo "Key endpoints for admin notifications:"
echo "- GET pending join requests: /rest/v1/organization_join_requests?organization_id=eq.{ORG_ID}&status=eq.pending"
echo "- GET pending entry approvals: /rest/v1/weekly_entries?organization_id=eq.{ORG_ID}&is_published=eq.false"
echo "- GET pending invitations: /rest/v1/organization_invitations?organization_id=eq.{ORG_ID}&status=eq.pending"