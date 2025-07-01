#!/bin/bash

# DataKit API Test Script
# This script tests all the main API endpoints

BASE_URL="http://localhost:3001/api"
EMAIL="test$(date +%s)@example.com"  # Unique email for each test run
PASSWORD="Test123456!"
NAME="Test User"

echo "🚀 Testing DataKit API"
echo "===================="
echo ""

# 1. Test Health Check
echo "1️⃣ Testing Health Check..."
curl -s "$BASE_URL/" | jq '.' || echo "API not responding"
echo ""

# 2. Test Signup
echo "2️⃣ Testing User Signup..."
SIGNUP_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/signup" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$EMAIL\",
    \"password\": \"$PASSWORD\",
    \"name\": \"$NAME\"
  }")

echo "$SIGNUP_RESPONSE" | jq '.'
AUTH_TOKEN=$(echo "$SIGNUP_RESPONSE" | jq -r '.access_token')
echo ""

# 3. Test Login
echo "3️⃣ Testing User Login..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$EMAIL\",
    \"password\": \"$PASSWORD\"
  }")

echo "$LOGIN_RESPONSE" | jq '.'
echo ""

# 4. Get Current User
echo "4️⃣ Getting Current User..."
curl -s -X GET "$BASE_URL/auth/me" \
  -H "Authorization: Bearer $AUTH_TOKEN" | jq '.'
echo ""

# 5. Get User Profile
echo "5️⃣ Getting User Profile..."
curl -s -X GET "$BASE_URL/users/profile" \
  -H "Authorization: Bearer $AUTH_TOKEN" | jq '.'
echo ""

# 6. Update User Profile
echo "6️⃣ Updating User Profile..."
curl -s -X PATCH "$BASE_URL/users/profile" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Updated Test User\"
  }" | jq '.'
echo ""

# 7. Get Subscription
echo "7️⃣ Getting Subscription..."
curl -s -X GET "$BASE_URL/subscriptions/my-subscription" \
  -H "Authorization: Bearer $AUTH_TOKEN" | jq '.'
echo ""

# 8. Get Credits
echo "8️⃣ Getting Remaining Credits..."
curl -s -X GET "$BASE_URL/subscriptions/credits" \
  -H "Authorization: Bearer $AUTH_TOKEN" | jq '.'
echo ""

# 9. Calculate Credits
echo "9️⃣ Calculating Credit Cost..."
curl -s -X POST "$BASE_URL/credits/calculate" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"modelId\": \"gpt-4o\",
    \"inputTokens\": 1000,
    \"outputTokens\": 500
  }" | jq '.'
echo ""

# 10. Check Credits
echo "🔟 Checking Available Credits..."
curl -s -X POST "$BASE_URL/credits/check" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"estimatedCredits\": 5
  }" | jq '.'
echo ""

# 11. Get Usage Stats
echo "1️⃣1️⃣ Getting Usage Statistics..."
curl -s -X GET "$BASE_URL/credits/stats" \
  -H "Authorization: Bearer $AUTH_TOKEN" | jq '.'
echo ""

echo "✅ API Testing Complete!"
echo "===================="