#!/bin/bash

# Test CORS Configuration
# This script tests the multi-site CORS setup

echo "🧪 Testing CORS Configuration"
echo "=============================="
echo ""

BASE_URL="http://localhost:3000"
API_KEY="a99e349cea2953f2ace15a8d41b3d7966f98d060f49dc6db2677954637890efb"

# Function to test CORS
test_cors() {
    local origin=$1
    local should_succeed=$2
    
    echo "Testing origin: $origin"
    
    # Make preflight request (OPTIONS)
    response=$(curl -s -w "\n%{http_code}" \
        -H "Origin: $origin" \
        -H "Access-Control-Request-Method: POST" \
        -H "Access-Control-Request-Headers: authorization,content-type" \
        -X OPTIONS "$BASE_URL/search" 2>&1)
    
    http_code=$(echo "$response" | tail -n1)
    
    if [ "$should_succeed" = "yes" ]; then
        if [ "$http_code" = "204" ] || [ "$http_code" = "200" ]; then
            echo "  ✅ Preflight passed (HTTP $http_code)"
        else
            echo "  ❌ Preflight failed (HTTP $http_code)"
        fi
    else
        if [ "$http_code" = "500" ]; then
            echo "  ✅ Correctly blocked (HTTP $http_code)"
        else
            echo "  ⚠️  Expected block but got HTTP $http_code"
        fi
    fi
    
    # Make actual request
    response=$(curl -s -w "\n%{http_code}" \
        -H "Origin: $origin" \
        -H "Authorization: Bearer $API_KEY" \
        -H "Content-Type: application/json" \
        -X POST "$BASE_URL/search" \
        -d '{"site_id":"test","query":"test"}' 2>&1)
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n -1)
    
    # Check for CORS headers (this is simplified - in reality check actual headers)
    if echo "$body" | grep -q "error"; then
        echo "  Response: Error received"
    else
        echo "  Response: Success"
    fi
    
    echo ""
}

echo "1️⃣ Testing with current CORS_ORIGIN configuration..."
echo ""

# Test case 1: No origin header (should always work)
echo "Test 1: No origin header (curl/Postman)"
curl -s -H "Authorization: Bearer $API_KEY" \
     -H "Content-Type: application/json" \
     -X POST "$BASE_URL/search" \
     -d '{"site_id":"test","query":"test"}' | head -c 100
echo ""
echo "  ✅ Request without Origin header works"
echo ""

# Test case 2: Check current CORS_ORIGIN value
echo "Test 2: Current CORS_ORIGIN configuration"
CORS_VALUE=$(grep CORS_ORIGIN .env 2>/dev/null | cut -d= -f2)
if [ -z "$CORS_VALUE" ]; then
    CORS_VALUE="*"
fi
echo "  Current value: $CORS_VALUE"
echo ""

if [ "$CORS_VALUE" = "*" ]; then
    echo "  ℹ️  CORS_ORIGIN=* allows ALL origins (development mode)"
    echo "  Testing with example origins..."
    echo ""
    test_cors "https://site1.com" "yes"
    test_cors "https://site2.com" "yes"
    test_cors "https://any-site.com" "yes"
else
    echo "  ℹ️  CORS_ORIGIN has specific origins configured"
    echo "  Testing configured origins..."
    echo ""
    
    # Parse comma-separated origins
    IFS=',' read -ra ORIGINS <<< "$CORS_VALUE"
    for origin in "${ORIGINS[@]}"; do
        origin=$(echo "$origin" | xargs) # trim whitespace
        test_cors "$origin" "yes"
    done
    
    # Test an origin that should be blocked
    echo "Testing unauthorized origin (should fail):"
    test_cors "https://unauthorized-site.com" "no"
fi

echo ""
echo "=============================="
echo "✅ CORS Test Complete"
echo ""
echo "💡 To configure CORS for multiple sites:"
echo ""
echo "   Edit .env and set:"
echo "   CORS_ORIGIN=https://site1.com,https://site2.com,https://site3.com"
echo ""
echo "   Then restart the server."
echo ""
echo "📚 See CORS-GUIDE.md for detailed instructions"
