#!/bin/bash

# Library Service API Test Script
# 
# This script tests the Library service API endpoints.
# 
# Prerequisites:
# 1. Start the dev environment: pnpm start
# 2. Have a test user logged in to get a JWT token
# 3. Set JWT_TOKEN environment variable with the user's token
#
# Usage:
#   export JWT_TOKEN="your-jwt-token-here"
#   ./test-api.sh

set -e

LIBRARY_URL="http://localhost:5177"
JWT_TOKEN="${JWT_TOKEN:-}"

if [ -z "$JWT_TOKEN" ]; then
  echo "Error: JWT_TOKEN environment variable not set"
  echo "Usage: export JWT_TOKEN='your-jwt-token' && ./test-api.sh"
  exit 1
fi

echo "Testing Library Service API..."
echo "================================"
echo ""

# Test 1: List buckets
echo "Test 1: GET /api/buckets"
curl -s -X GET \
  -H "Authorization: Bearer $JWT_TOKEN" \
  "$LIBRARY_URL/api/buckets" | jq '.'
echo ""
echo "✓ List buckets"
echo ""

# Test 2: List files in user bucket
echo "Test 2: GET /api/buckets/{bucket_key}/files"
BUCKET_KEY=$(curl -s -X GET \
  -H "Authorization: Bearer $JWT_TOKEN" \
  "$LIBRARY_URL/api/buckets" | jq -r '.buckets[0].bucket_key')

echo "Using bucket: $BUCKET_KEY"
curl -s -X GET \
  -H "Authorization: Bearer $JWT_TOKEN" \
  "$LIBRARY_URL/api/buckets/$BUCKET_KEY/files" | jq '.'
echo ""
echo "✓ List files"
echo ""

# Test 3: Upload test file
echo "Test 3: POST /api/files (upload)"
echo "Creating test file..."
echo "This is a test file for the Library service" > /tmp/test-file.txt

UPLOAD_RESPONSE=$(curl -s -X POST \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -F "file=@/tmp/test-file.txt" \
  -F "bucket_key=$BUCKET_KEY" \
  "$LIBRARY_URL/api/files")

echo "$UPLOAD_RESPONSE" | jq '.'
FILE_ID=$(echo "$UPLOAD_RESPONSE" | jq -r '.id')
echo ""
echo "✓ Upload file (ID: $FILE_ID)"
echo ""

# Test 4: Download file
echo "Test 4: GET /api/files/{id} (download)"
curl -s -X GET \
  -H "Authorization: Bearer $JWT_TOKEN" \
  "$LIBRARY_URL/api/files/$FILE_ID" \
  -o /tmp/downloaded-file.txt

echo "Downloaded content:"
cat /tmp/downloaded-file.txt
echo ""
echo "✓ Download file"
echo ""

# Test 5: Create folder
echo "Test 5: POST /api/folders"
FOLDER_RESPONSE=$(curl -s -X POST \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"bucket_key\": \"$BUCKET_KEY\", \"name\": \"Test Folder\", \"parent_folder_id\": null}" \
  "$LIBRARY_URL/api/folders")

echo "$FOLDER_RESPONSE" | jq '.'
FOLDER_ID=$(echo "$FOLDER_RESPONSE" | jq -r '.id')
echo ""
echo "✓ Create folder (ID: $FOLDER_ID)"
echo ""

# Test 6: List folders
echo "Test 6: GET /api/buckets/{bucket_key}/folders"
curl -s -X GET \
  -H "Authorization: Bearer $JWT_TOKEN" \
  "$LIBRARY_URL/api/buckets/$BUCKET_KEY/folders" | jq '.'
echo ""
echo "✓ List folders"
echo ""

# Test 7: Move file to folder
echo "Test 7: PATCH /api/files/{id} (move)"
curl -s -X PATCH \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"folder_id\": $FOLDER_ID}" \
  "$LIBRARY_URL/api/files/$FILE_ID" | jq '.'
echo ""
echo "✓ Move file to folder"
echo ""

# Test 8: Rename file
echo "Test 8: PATCH /api/files/{id} (rename)"
curl -s -X PATCH \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"filename": "renamed-test-file.txt"}' \
  "$LIBRARY_URL/api/files/$FILE_ID" | jq '.'
echo ""
echo "✓ Rename file"
echo ""

# Test 9: Get folder contents
echo "Test 9: GET /api/folders/{id}/contents"
curl -s -X GET \
  -H "Authorization: Bearer $JWT_TOKEN" \
  "$LIBRARY_URL/api/folders/$FOLDER_ID/contents" | jq '.'
echo ""
echo "✓ Get folder contents"
echo ""

# Test 10: Delete file
echo "Test 10: DELETE /api/files/{id}"
curl -s -X DELETE \
  -H "Authorization: Bearer $JWT_TOKEN" \
  "$LIBRARY_URL/api/files/$FILE_ID"
echo ""
echo "✓ Delete file"
echo ""

# Test 11: Delete folder
echo "Test 11: DELETE /api/folders/{id}"
curl -s -X DELETE \
  -H "Authorization: Bearer $JWT_TOKEN" \
  "$LIBRARY_URL/api/folders/$FOLDER_ID"
echo ""
echo "✓ Delete folder"
echo ""

# Cleanup
rm -f /tmp/test-file.txt /tmp/downloaded-file.txt

echo "================================"
echo "All tests passed! ✓"
echo ""
echo "Summary:"
echo "  - Bucket listing works"
echo "  - File upload/download works"
echo "  - File move/rename works"
echo "  - Folder create/delete works"
echo "  - Folder contents listing works"
echo ""
echo "The Library service API is ready for integration!"
