#!/bin/bash

# EngBee Backend API - Comprehensive Endpoint Test Script
# This script tests all endpoints according to the ENDPOINT_SPECIFICATION_ANALYSIS.md
# Prerequisites: Backend must be running on http://localhost:3000

API_BASE="http://localhost:3000/api"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Store IDs for reuse
TEACHER_ID=""
LEARNER1_ID=""
LEARNER2_ID=""
PROMPT1_ID=""
PROMPT2_ID=""
CLASS_ID=""
AI_RULE_ID=""
ASSIGNMENT_ID=""
ATTEMPT_ID=""
SCORE_ID=""

# Helper to extract ID from JSON response
extract_id() {
  local json=$1
  echo "$json" | grep -o '"id":"[^"]*"' | head -1 | sed 's/"id":"\([^"]*\)"/\1/'
}

# Helper to extract field from JSON response
extract_field() {
  local json=$1
  local field=$2
  echo "$json" | grep -o "\"$field\":\"[^\"]*\"" | head -1 | sed "s/\"$field\":\"\([^\"]*\)\"/\1/"
}

# Helper function to make API calls
api_call() {
  local method=$1
  local endpoint=$2
  local data=$3
  local description=$4

  echo ""
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${YELLOW}${description}${NC}"
  echo -e "${BLUE}${method} ${endpoint}${NC}"

  if [ -z "$data" ]; then
    response=$(curl -s -w "\n" -X "$method" "$API_BASE$endpoint" \
      -H "Content-Type: application/json")
  else
    response=$(curl -s -w "\n" -X "$method" "$API_BASE$endpoint" \
      -H "Content-Type: application/json" \
      -d "$data")
  fi

  # Wait for response to be fully captured
  sleep 0.5

  # Check if response contains error
  if echo "$response" | grep -q '"status":404\|"message":\|"error":'; then
    echo -e "${RED}✗ FAILED${NC}"
    echo -e "${RED}Response: ${response:0:200}${NC}"
    TESTS_FAILED=$((TESTS_FAILED + 1))
  elif echo "$response" | grep -q '"id":'; then
    echo -e "${GREEN}✓ PASSED${NC}"
    echo -e "ID: $(extract_id "$response")"
    TESTS_PASSED=$((TESTS_PASSED + 1))
  else
    echo -e "${GREEN}✓ PASSED${NC}"
    TESTS_PASSED=$((TESTS_PASSED + 1))
  fi

  echo "$response"

  # Small delay before next test
  sleep 0.3
}

echo ""
echo -e "${YELLOW}╔════════════════════════════════════════════════════╗${NC}"
echo -e "${YELLOW}║     EngBee API - Comprehensive Test Suite        ║${NC}"
echo -e "${YELLOW}╚════════════════════════════════════════════════════╝${NC}"
echo "API Base: $API_BASE"
echo "Start Time: $(date)"
echo ""

# Check if backend is running
echo -e "${YELLOW}Checking if backend is running...${NC}"
if ! curl -s "$API_BASE/prompts" > /dev/null 2>&1; then
  echo -e "${RED}✗ ERROR: Backend is not running on $API_BASE${NC}"
  echo "Please start the backend with: npm run dev"
  exit 1
fi
echo -e "${GREEN}✓ Backend is running${NC}"

# ============================================
# 1. USER MODULE - Create Users
# ============================================
echo ""
echo -e "${YELLOW}╔════════════════════════════════════════════════════╗${NC}"
echo -e "${YELLOW}║ 1. USER MODULE - Setup Test Data                  ║${NC}"
echo -e "${YELLOW}╚════════════════════════════════════════════════════╝${NC}"

echo -e "\n${BLUE}Creating Teacher...${NC}"
teacher_response=$(curl -s -X POST "$API_BASE/users" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teacher@example.com",
    "password": "Teacher123!",
    "firstName": "John",
    "lastName": "Doe",
    "role": "teacher"
  }')
sleep 0.5
TEACHER_ID=$(extract_id "$teacher_response")
echo "Teacher ID: $TEACHER_ID"

echo -e "\n${BLUE}Creating Learner 1...${NC}"
learner1_response=$(curl -s -X POST "$API_BASE/users" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "learner1@example.com",
    "password": "Learner123!",
    "firstName": "Alice",
    "lastName": "Smith",
    "role": "learner"
  }')
sleep 0.5
LEARNER1_ID=$(extract_id "$learner1_response")
echo "Learner 1 ID: $LEARNER1_ID"

echo -e "\n${BLUE}Creating Learner 2...${NC}"
learner2_response=$(curl -s -X POST "$API_BASE/users" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "learner2@example.com",
    "password": "Learner123!",
    "firstName": "Bob",
    "lastName": "Johnson",
    "role": "learner"
  }')
sleep 0.5
LEARNER2_ID=$(extract_id "$learner2_response")
echo "Learner 2 ID: $LEARNER2_ID"

# ============================================
# 2. PROMPT MODULE
# ============================================
echo ""
echo -e "${YELLOW}╔════════════════════════════════════════════════════╗${NC}"
echo -e "${YELLOW}║ 2. PROMPT MODULE                                  ║${NC}"
echo -e "${YELLOW}╚════════════════════════════════════════════════════╝${NC}"

echo -e "\n${BLUE}Creating Speaking Prompt...${NC}"
prompt1_response=$(curl -s -X POST "$API_BASE/prompts" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Describe your hometown in 2 minutes",
    "skillType": "speaking",
    "difficulty": "intermediate",
    "duration": 120
  }')
sleep 0.5
PROMPT1_ID=$(extract_id "$prompt1_response")
echo "Prompt 1 ID: $PROMPT1_ID"

echo -e "\n${BLUE}Creating Writing Prompt...${NC}"
prompt2_response=$(curl -s -X POST "$API_BASE/prompts" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Write an essay about your favorite book",
    "skillType": "writing",
    "difficulty": "advanced",
    "duration": 300
  }')
sleep 0.5
PROMPT2_ID=$(extract_id "$prompt2_response")
echo "Prompt 2 ID: $PROMPT2_ID"

response=$(api_call "GET" "/prompts" "" "Get all prompts")
response=$(api_call "GET" "/prompts/$PROMPT1_ID" "" "Get prompt by ID")

# ============================================
# 3. CLASS MODULE
# ============================================
echo ""
echo -e "${YELLOW}╔════════════════════════════════════════════════════╗${NC}"
echo -e "${YELLOW}║ 3. CLASS MODULE                                   ║${NC}"
echo -e "${YELLOW}╚════════════════════════════════════════════════════╝${NC}"

echo -e "\n${BLUE}Creating Class...${NC}"
class_response=$(curl -s -X POST "$API_BASE/classes" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"IELTS Speaking - Beginner\",
    \"description\": \"IELTS Speaking preparation for beginners\",
    \"teacherId\": \"$TEACHER_ID\",
    \"level\": \"beginner\",
    \"maxLearners\": 20
  }")
sleep 0.5
CLASS_ID=$(extract_id "$class_response")
echo "Class ID: $CLASS_ID"

response=$(api_call "GET" "/classes" "" "Get all classes")
response=$(api_call "GET" "/classes/$CLASS_ID" "" "Get class by ID")
response=$(api_call "POST" "/classes/$CLASS_ID/enroll" "{\"learnerId\": \"$LEARNER1_ID\"}" "Enroll Learner 1 in class")
response=$(api_call "POST" "/classes/$CLASS_ID/enroll" "{\"learnerId\": \"$LEARNER2_ID\"}" "Enroll Learner 2 in class")

# ============================================
# 4. AI RULE MODULE
# ============================================
echo ""
echo -e "${YELLOW}╔════════════════════════════════════════════════════╗${NC}"
echo -e "${YELLOW}║ 4. AI RULE MODULE                                 ║${NC}"
echo -e "${YELLOW}╚════════════════════════════════════════════════════╝${NC}"

echo -e "\n${BLUE}Creating AI Rule...${NC}"
ai_rule_response=$(curl -s -X POST "$API_BASE/ai-rules" \
  -H "Content-Type: application/json" \
  -d "{
    \"teacherId\": \"$TEACHER_ID\",
    \"name\": \"Strict IELTS Scoring\",
    \"description\": \"Strict scoring rule for IELTS speaking\",
    \"modelId\": \"gpt-3.5-turbo\",
    \"rubricId\": \"ielts_speaking\",
    \"weights\": {
      \"fluency\": 0.25,
      \"coherence\": 0.25,
      \"lexical\": 0.25,
      \"grammar\": 0.25,
      \"pronunciation\": 0.0
    },
    \"strictness\": 1.2
  }")
sleep 0.5
AI_RULE_ID=$(extract_id "$ai_rule_response")
echo "AI Rule ID: $AI_RULE_ID"

response=$(api_call "GET" "/ai-rules" "" "Get all AI rules")
response=$(api_call "GET" "/ai-rules/$AI_RULE_ID" "" "Get AI rule by ID")
response=$(api_call "GET" "/ai-rules/teacher/$TEACHER_ID" "" "Get AI rules by teacher")

# ============================================
# 5. ASSIGNMENT MODULE
# ============================================
echo ""
echo -e "${YELLOW}╔════════════════════════════════════════════════════╗${NC}"
echo -e "${YELLOW}║ 5. ASSIGNMENT MODULE                              ║${NC}"
echo -e "${YELLOW}╚════════════════════════════════════════════════════╝${NC}"

echo -e "\n${BLUE}Creating Assignment...${NC}"
# Use gdate if available (macOS with GNU coreutils), otherwise use date
FUTURE_DATE=$(gdate -u -d '+7 days' +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || date -u -v+7d +%Y-%m-%dT%H:%M:%SZ)
LATE_DATE=$(gdate -u -d '+8 days' +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || date -u -v+8d +%Y-%m-%dT%H:%M:%SZ)

assignment_response=$(curl -s -X POST "$API_BASE/assignments" \
  -H "Content-Type: application/json" \
  -d "{
    \"classId\": \"$CLASS_ID\",
    \"promptId\": \"$PROMPT1_ID\",
    \"title\": \"Week 1 - Speaking Practice\",
    \"description\": \"Describe your hometown\",
    \"deadline\": \"$FUTURE_DATE\",
    \"status\": \"active\",
    \"allowLateSubmission\": true,
    \"lateDeadline\": \"$LATE_DATE\"
  }")
sleep 0.5
ASSIGNMENT_ID=$(extract_id "$assignment_response")
echo "Assignment ID: $ASSIGNMENT_ID"

response=$(api_call "GET" "/assignments" "" "Get all assignments")
response=$(api_call "GET" "/assignments/$ASSIGNMENT_ID" "" "Get assignment by ID")
response=$(api_call "GET" "/assignments/class/$CLASS_ID" "" "Get assignments by class")
response=$(api_call "GET" "/assignments/by-status/active" "" "Get assignments by status")

# ============================================
# 6. ATTEMPT MODULE
# ============================================
echo ""
echo -e "${YELLOW}╔════════════════════════════════════════════════════╗${NC}"
echo -e "${YELLOW}║ 6. ATTEMPT MODULE                                 ║${NC}"
echo -e "${YELLOW}╚════════════════════════════════════════════════════╝${NC}"

echo -e "\n${BLUE}Creating Attempt...${NC}"
attempt_response=$(curl -s -X POST "$API_BASE/attempts" \
  -H "Content-Type: application/json" \
  -d "{
    \"learnerId\": \"$LEARNER1_ID\",
    \"promptId\": \"$PROMPT1_ID\",
    \"skillType\": \"speaking\"
  }")
sleep 0.5
ATTEMPT_ID=$(extract_id "$attempt_response")
echo "Attempt ID: $ATTEMPT_ID"

response=$(api_call "GET" "/attempts" "" "Get all attempts")
response=$(api_call "GET" "/attempts/$ATTEMPT_ID" "" "Get attempt by ID")
response=$(api_call "GET" "/attempts/learner/$LEARNER1_ID" "" "Get attempts by learner")
response=$(api_call "GET" "/attempts/by-status/in_progress" "" "Get attempts by status")
response=$(api_call "GET" "/attempts/by-skill/speaking" "" "Get attempts by skill type")

echo -e "\n${BLUE}Submitting Attempt with AI scoring...${NC}"
submit_response=$(curl -s -X PUT "$API_BASE/attempts/$ATTEMPT_ID/submit" \
  -H "Content-Type: application/json" \
  -d "{
    \"content\": \"My hometown is a beautiful city located in the mountains. It has a population of about 500,000 people and is known for its rich cultural heritage. The city is surrounded by stunning natural beauty with forests and rivers. I love living here because of the peaceful environment and friendly community.\",
    \"aiRuleId\": \"$AI_RULE_ID\"
  }")
sleep 1.0
echo "Submit response: $submit_response"

response=$(api_call "GET" "/attempts/$ATTEMPT_ID" "" "Get attempt after scoring")
response=$(api_call "GET" "/attempts/learner/$LEARNER1_ID/count" "" "Get attempt count by learner")
response=$(api_call "GET" "/attempts/learner/$LEARNER1_ID/submitted-count" "" "Get submitted attempts count")
response=$(api_call "GET" "/attempts/learner/$LEARNER1_ID/scored-count" "" "Get scored attempts count")

# ============================================
# 7. SCORE MODULE
# ============================================
echo ""
echo -e "${YELLOW}╔════════════════════════════════════════════════════╗${NC}"
echo -e "${YELLOW}║ 7. SCORE MODULE                                   ║${NC}"
echo -e "${YELLOW}╚════════════════════════════════════════════════════╝${NC}"

response=$(api_call "GET" "/scores" "" "Get all scores")

# ============================================
# 8. EXPORT MODULE
# ============================================
echo ""
echo -e "${YELLOW}╔════════════════════════════════════════════════════╗${NC}"
echo -e "${YELLOW}║ 8. EXPORT MODULE                                  ║${NC}"
echo -e "${YELLOW}╚════════════════════════════════════════════════════╝${NC}"

response=$(api_call "GET" "/exports/classes/$CLASS_ID/progress" "" "Get class progress report (JSON)")
response=$(api_call "GET" "/exports/classes/$CLASS_ID/csv" "" "Export class progress as CSV")
response=$(api_call "GET" "/exports/learner/$LEARNER1_ID/report" "" "Get learner report (JSON)")
response=$(api_call "GET" "/exports/learner/$LEARNER1_ID/csv" "" "Export learner report as CSV")

# ============================================
# SUMMARY
# ============================================
echo ""
echo -e "${YELLOW}╔════════════════════════════════════════════════════╗${NC}"
echo -e "${YELLOW}║ TEST SUMMARY                                      ║${NC}"
echo -e "${YELLOW}╚════════════════════════════════════════════════════╝${NC}"
echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Failed: $TESTS_FAILED${NC}"
echo "End Time: $(date)"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
  echo -e "${GREEN}✓ All tests passed!${NC}"
  exit 0
else
  echo -e "${RED}✗ Some tests failed!${NC}"
  exit 1
fi
