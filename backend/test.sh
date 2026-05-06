#!/bin/bash

# Test script for SemaSearch API
# Make sure the server is running before executing this script

API_KEY="a99e349cea2953f2ace15a8d41b3d7966f98d060f49dc6db2677954637890efb"
BASE_URL="http://localhost:3000"

echo "🧪 Testing SemaSearch API"
echo "=========================="
echo ""

# Test 1: Health Check
echo "1️⃣ Testing Health Endpoint (no auth)..."
curl -s "$BASE_URL/health" | python3 -m json.tool
echo ""
echo ""

# Test 2: Test without auth (should fail)
echo "2️⃣ Testing without authentication (should fail)..."
curl -s -X POST "$BASE_URL/search" \
  -H "Content-Type: application/json" \
  -d '{"site_id":"test","query":"test"}' | python3 -m json.tool
echo ""
echo ""

# Test 3: Test with invalid auth (should fail)
echo "3️⃣ Testing with invalid API key (should fail)..."
curl -s -X POST "$BASE_URL/search" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer invalid_key" \
  -d '{"site_id":"test","query":"test"}' | python3 -m json.tool
echo ""
echo ""

# Test 4: Test input validation (should fail)
echo "4️⃣ Testing path traversal protection (should fail)..."
curl -s -X POST "$BASE_URL/search" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d '{"site_id":"../../../etc/passwd","query":"test"}' | python3 -m json.tool
echo ""
echo ""

# Test 5: Get collection stats (should fail - collection doesn't exist)
echo "5️⃣ Testing collection stats for non-existent collection..."
curl -s -X GET "$BASE_URL/collections/test-store/stats" \
  -H "Authorization: Bearer $API_KEY" | python3 -m json.tool
echo ""
echo ""

echo "✅ Basic security tests completed!"
echo ""
echo "To test full functionality (indexing and search):"
echo "1. Make sure you have a valid JINA_API_KEY in .env"
echo "2. Run the commands in TESTING.md"
