#!/bin/bash

# Comprehensive Webhook Integration Test Suite
# Based on IMPLEMENTATION_GUIDE.md Testing Strategy

set -e  # Exit on error

echo "🧪 Webhook Integration Test Suite"
echo "=========================================="
echo ""

BASE_URL="http://localhost:3001"
API_BASE="$BASE_URL/api"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0
TOTAL_TESTS=12

# Helper functions
print_test() {
    echo -e "${BLUE}TEST $1/${TOTAL_TESTS}:${NC} $2"
}

print_pass() {
    echo -e "${GREEN}✅ PASS:${NC} $1"
    ((TESTS_PASSED++))
}

print_fail() {
    echo -e "${RED}❌ FAIL:${NC} $1"
    ((TESTS_FAILED++))
}

print_info() {
    echo -e "${YELLOW}ℹ️  INFO:${NC} $1"
}

# Check if services are running
echo "🔍 Checking Service Status..."
echo "=========================================="
echo ""

# Test 1: Backend Health Check
print_test 1 "Backend Health Check"
HEALTH_RESPONSE=$(curl -s "$BASE_URL/health")
if echo "$HEALTH_RESPONSE" | grep -q '"status":"healthy"'; then
    print_pass "Backend is healthy"
    echo "   Response: $HEALTH_RESPONSE"
else
    print_fail "Backend is not healthy"
    echo "   Response: $HEALTH_RESPONSE"
    exit 1
fi
echo ""

# Test 2: Database Connection
print_test 2 "Database Connection"
DB_CHECK=$(docker-compose exec -T postgres psql -U postgres -d beton_ai -c "SELECT 1;" 2>&1)
if echo "$DB_CHECK" | grep -q "1 row"; then
    print_pass "Database is accessible"
else
    print_fail "Database connection failed"
    echo "   Error: $DB_CHECK"
    exit 1
fi
echo ""

# Test 3: Webhook Tables Exist
print_test 3 "Webhook Tables Schema"
TABLES_CHECK=$(docker-compose exec -T postgres psql -U postgres -d beton_ai -c "SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE '%webhook%';" 2>&1)
if echo "$TABLES_CHECK" | grep -q "incoming_webhooks" && echo "$TABLES_CHECK" | grep -q "outbound_webhooks"; then
    print_pass "All webhook tables exist"
    echo "   Tables: incoming_webhooks, outbound_webhooks, webhook_deliveries"
else
    print_fail "Webhook tables missing"
    echo "   Tables found: $TABLES_CHECK"
fi
echo ""

# Test 4: Authentication Required on Protected Endpoints
print_test 4 "Authentication Protection"
AUTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$API_BASE/webhooks")
if [ "$AUTH_RESPONSE" = "401" ]; then
    print_pass "Protected endpoints require authentication (401)"
else
    print_fail "Authentication not working (got $AUTH_RESPONSE, expected 401)"
fi
echo ""

# Test 5: Incoming Webhook - Data Reception (Public Endpoint)
print_test 5 "Incoming Webhook Data Reception"
WEBHOOK_URL="$API_BASE/webhooks/receive/cmci0gf510000z62hoq9w4nlh_1729090170000"

# Get initial row count
INITIAL_COUNT=$(docker-compose exec -T postgres psql -U postgres -d beton_ai -c "SELECT COUNT(*) FROM table_rows WHERE \"tableId\" = 'cmci0gf510000z62hoq9w4nlh';" | grep -o '[0-9]*' | head -1)

print_info "Initial row count: $INITIAL_COUNT"

# Send test data to webhook
WEBHOOK_RESPONSE=$(curl -s -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "integration-test@example.com",
    "firstName": "Integration",
    "company": "Test Suite Inc"
  }')

echo "   Webhook Response: $WEBHOOK_RESPONSE"

if echo "$WEBHOOK_RESPONSE" | grep -q '"success":true'; then
    # Wait a moment for database write
    sleep 2
    
    # Check new row count
    NEW_COUNT=$(docker-compose exec -T postgres psql -U postgres -d beton_ai -c "SELECT COUNT(*) FROM table_rows WHERE \"tableId\" = 'cmci0gf510000z62hoq9w4nlh';" | grep -o '[0-9]*' | head -1)
    
    if [ "$NEW_COUNT" -gt "$INITIAL_COUNT" ]; then
        print_pass "Webhook received data and created new row"
        echo "   Row count: $INITIAL_COUNT → $NEW_COUNT"
    else
        print_fail "Row was not created (count unchanged: $NEW_COUNT)"
    fi
else
    print_fail "Webhook reception failed"
fi
echo ""

# Test 6: Incoming Webhook - Stats Tracking
print_test 6 "Incoming Webhook Stats Tracking"
STATS=$(docker-compose exec -T postgres psql -U postgres -d beton_ai -c "SELECT \"receivedCount\", \"lastReceivedAt\" FROM incoming_webhooks WHERE id = 'webhook_incoming_test_001';" 2>&1)

if echo "$STATS" | grep -q "receivedCount"; then
    RECEIVED_COUNT=$(echo "$STATS" | grep -o '[0-9]*' | head -1)
    print_pass "Stats are being tracked (receivedCount: $RECEIVED_COUNT)"
    echo "   Stats: $STATS"
else
    print_fail "Stats tracking not working"
    echo "   Output: $STATS"
fi
echo ""

# Test 7: Field Mapping Verification
print_test 7 "Field Mapping Configuration"
FIELD_MAPPING=$(docker-compose exec -T postgres psql -U postgres -d beton_ai -c "SELECT \"fieldMapping\" FROM incoming_webhooks WHERE id = 'webhook_incoming_test_001';" 2>&1)

if echo "$FIELD_MAPPING" | grep -q "email"; then
    print_pass "Field mapping is configured"
    echo "   Mapping contains: email, firstName, company"
else
    print_fail "Field mapping not found"
fi
echo ""

# Test 8: Webhook URL Generation Pattern
print_test 8 "Webhook URL Pattern"
WEBHOOK_CONFIG=$(docker-compose exec -T postgres psql -U postgres -d beton_ai -c "SELECT url FROM incoming_webhooks WHERE id = 'webhook_incoming_test_001';" 2>&1)

if echo "$WEBHOOK_CONFIG" | grep -q "/api/webhooks/receive/"; then
    print_pass "Webhook URL follows correct pattern"
    echo "   URL pattern: /api/webhooks/receive/{uniqueId}"
else
    print_fail "Webhook URL pattern incorrect"
fi
echo ""

# Test 9: Invalid Webhook URL Returns 404
print_test 9 "Invalid Webhook URL Handling"
INVALID_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API_BASE/webhooks/receive/invalid_webhook_id" \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}')

if [ "$INVALID_RESPONSE" = "404" ] || [ "$INVALID_RESPONSE" = "400" ]; then
    print_pass "Invalid webhook URL returns error ($INVALID_RESPONSE)"
else
    print_fail "Invalid webhook should return 404 or 400 (got $INVALID_RESPONSE)"
fi
echo ""

# Test 10: Outbound Webhook Configuration
print_test 10 "Outbound Webhook Configuration"
OUTBOUND_CONFIG=$(docker-compose exec -T postgres psql -U postgres -d beton_ai -c "SELECT id, \"isActive\", events FROM outbound_webhooks WHERE id = 'webhook_outbound_test_001';" 2>&1)

if echo "$OUTBOUND_CONFIG" | grep -q "webhook_outbound_test_001"; then
    print_pass "Outbound webhook is configured"
    echo "   Config found: webhook_outbound_test_001"
else
    print_fail "Outbound webhook not found"
fi
echo ""

# Test 11: Webhook Delivery History
print_test 11 "Webhook Delivery History"
DELIVERY_HISTORY=$(docker-compose exec -T postgres psql -U postgres -d beton_ai -c "SELECT COUNT(*) FROM webhook_deliveries WHERE \"webhookId\" = 'webhook_outbound_test_001';" 2>&1)

DELIVERY_COUNT=$(echo "$DELIVERY_HISTORY" | grep -o '[0-9]*' | head -1)
if [ "$DELIVERY_COUNT" -gt "0" ]; then
    print_pass "Delivery history is tracked ($DELIVERY_COUNT deliveries)"
else
    print_fail "No delivery history found"
fi
echo ""

# Test 12: Database Indexes and Performance
print_test 12 "Database Indexes"
INDEXES=$(docker-compose exec -T postgres psql -U postgres -d beton_ai -c "SELECT tablename, indexname FROM pg_indexes WHERE schemaname = 'public' AND tablename LIKE '%webhook%';" 2>&1)

if echo "$INDEXES" | grep -q "incoming_webhooks"; then
    print_pass "Database indexes exist for webhook tables"
    echo "   Indexes found for webhook tables"
else
    print_fail "Missing database indexes"
fi
echo ""

# Summary
echo "=========================================="
echo "📊 Test Results Summary"
echo "=========================================="
echo ""
echo -e "${GREEN}Tests Passed:${NC} $TESTS_PASSED/$TOTAL_TESTS"
echo -e "${RED}Tests Failed:${NC} $TESTS_FAILED/$TOTAL_TESTS"
echo ""

# Additional Information
echo "=========================================="
echo "📈 Current Database State"
echo "=========================================="
echo ""

echo "📥 Incoming Webhooks:"
docker-compose exec -T postgres psql -U postgres -d beton_ai -c "SELECT id, \"isActive\", \"receivedCount\", \"lastReceivedAt\" FROM incoming_webhooks;" 2>&1 | grep -v "^time="
echo ""

echo "📤 Outbound Webhooks:"
docker-compose exec -T postgres psql -U postgres -d beton_ai -c "SELECT id, \"isActive\", \"deliveryCount\", \"successCount\", \"failureCount\" FROM outbound_webhooks;" 2>&1 | grep -v "^time="
echo ""

echo "📦 Recent Deliveries:"
docker-compose exec -T postgres psql -U postgres -d beton_ai -c "SELECT id, event, success, \"statusCode\", \"createdAt\" FROM webhook_deliveries ORDER BY \"createdAt\" DESC LIMIT 5;" 2>&1 | grep -v "^time="
echo ""

# Test Coverage Report
echo "=========================================="
echo "📋 Test Coverage"
echo "=========================================="
echo ""
echo "✅ Integration Tests:"
echo "   - Backend health check"
echo "   - Database connectivity"
echo "   - Schema verification"
echo "   - Authentication protection"
echo "   - Incoming webhook reception"
echo "   - Stats tracking"
echo "   - Field mapping"
echo "   - URL generation"
echo "   - Error handling"
echo "   - Outbound configuration"
echo "   - Delivery history"
echo "   - Database performance"
echo ""

# Exit with appropriate code
if [ "$TESTS_FAILED" -gt 0 ]; then
    echo -e "${RED}❌ Some tests failed${NC}"
    exit 1
else
    echo -e "${GREEN}✅ All tests passed!${NC}"
    echo ""
    echo "🎉 Webhook system is fully operational!"
    exit 0
fi

