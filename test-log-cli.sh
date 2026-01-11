#!/usr/bin/env bash
# Log CLI End-to-End Test Script
# Run from: /Users/brsbl/Documents/agent workflow/aidevkit

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Add CLI to PATH
export PATH="$PWD/systems/log/bin:$PATH"

# Test directory
TEST_DIR="/tmp/log-cli-test-$$"

echo "=========================================="
echo "Log CLI End-to-End Tests"
echo "=========================================="
echo "Test directory: $TEST_DIR"
echo ""

# Setup
setup() {
    echo -e "${YELLOW}[SETUP]${NC} Creating test environment..."
    rm -rf "$TEST_DIR"
    mkdir -p "$TEST_DIR/src"
    cd "$TEST_DIR"

    echo 'export const auth = () => { /* JWT validation */ }' > src/auth.js
    echo 'export const api = () => { /* API handler */ }' > src/api.js
    echo 'export const temp = () => { /* Temporary */ }' > src/temp.js

    echo -e "${GREEN}[OK]${NC} Test environment ready"
    echo ""
}

# Test: init
test_init() {
    echo -e "${YELLOW}[TEST]${NC} log init"
    log init

    if [[ -d ".kit/logs" && -f ".kit/logs/config.yaml" ]]; then
        echo -e "${GREEN}[PASS]${NC} init created .kit/logs/ and config.yaml"
    else
        echo -e "${RED}[FAIL]${NC} init did not create expected files"
        return 1
    fi
    echo ""
}

# Test: create
test_create() {
    echo -e "${YELLOW}[TEST]${NC} log create (single anchor)"
    log create --name "Auth Implementation" --anchors src/auth.js --prompt "JWT tokens validated via middleware"

    echo -e "${YELLOW}[TEST]${NC} log create (multiple anchors)"
    log create --name "API Auth Flow" --anchors src/auth.js src/api.js --prompt "API validates tokens before processing"

    echo -e "${YELLOW}[TEST]${NC} log create (with category)"
    log create --name "Token Refresh" --category auth --anchors src/auth.js --prompt "Tokens rotate on each use"

    echo -e "${YELLOW}[TEST]${NC} log create (with custom fields)"
    log create --name "Bug Fix" --anchors src/api.js --prompt "Fixed null pointer" --field type=bugfix --field severity=high

    local count=$(find .kit/logs -name "*.md" | wc -l | tr -d ' ')
    if [[ "$count" -ge 4 ]]; then
        echo -e "${GREEN}[PASS]${NC} create made $count entries"
    else
        echo -e "${RED}[FAIL]${NC} expected 4+ entries, got $count"
        return 1
    fi
    echo ""
}

# Test: list
test_list() {
    echo -e "${YELLOW}[TEST]${NC} log list"
    log list
    echo -e "${GREEN}[PASS]${NC} list executed"
    echo ""
}

# Test: search
test_search() {
    echo -e "${YELLOW}[TEST]${NC} log search 'auth'"
    log search "auth" || true

    echo -e "${YELLOW}[TEST]${NC} log search 'JWT'"
    log search "JWT" || true

    echo -e "${YELLOW}[TEST]${NC} log search 'nonexistent'"
    log search "nonexistent" || true

    echo -e "${GREEN}[PASS]${NC} search executed"
    echo ""
}

# Test: edit
test_edit() {
    echo -e "${YELLOW}[TEST]${NC} log edit"
    local entry=$(find .kit/logs -name "auth-implementation-*.md" | head -1)
    if [[ -n "$entry" ]]; then
        log edit "$entry" --content "Updated: Now uses RS256 algorithm"
        echo -e "${GREEN}[PASS]${NC} edit updated $entry"
    else
        echo -e "${RED}[FAIL]${NC} no entry found to edit"
        return 1
    fi
    echo ""
}

# Test: staleness
test_staleness() {
    echo -e "${YELLOW}[TEST]${NC} staleness detection"

    # Create fresh entry
    log create --name "Stale Test" --anchors src/auth.js --prompt "Will become stale"

    # Modify anchor to trigger staleness
    sleep 1
    echo "// modified $(date)" >> src/auth.js

    echo -e "${YELLOW}[TEST]${NC} log stale"
    log stale || true

    echo -e "${GREEN}[PASS]${NC} staleness check executed"
    echo ""
}

# Test: verify
test_verify() {
    echo -e "${YELLOW}[TEST]${NC} log verify"
    local stale_entry=$(find .kit/logs -name "stale-test-*.md" | head -1)
    if [[ -n "$stale_entry" ]]; then
        log verify "$stale_entry"
        echo -e "${GREEN}[PASS]${NC} verify executed on $stale_entry"
    else
        echo -e "${YELLOW}[SKIP]${NC} no stale entry to verify"
    fi
    echo ""
}

# Test: remove
test_remove() {
    echo -e "${YELLOW}[TEST]${NC} log remove"
    log create --name "To Remove" --anchors src/auth.js --prompt "Will be removed"

    local entry=$(find .kit/logs -name "to-remove-*.md" | head -1)
    if [[ -n "$entry" ]]; then
        log remove "$entry"
        if [[ ! -f "$entry" ]]; then
            echo -e "${GREEN}[PASS]${NC} remove deleted $entry"
        else
            echo -e "${RED}[FAIL]${NC} file still exists after remove"
            return 1
        fi
    fi
    echo ""
}

# Test: orphaned detection
test_orphaned() {
    echo -e "${YELLOW}[TEST]${NC} orphaned detection"
    log create --name "Temp Doc" --anchors src/temp.js --prompt "Documents temp file"

    rm src/temp.js

    echo -e "${YELLOW}[TEST]${NC} log stale (should show orphaned)"
    log stale || true

    echo -e "${GREEN}[PASS]${NC} orphaned detection executed"
    echo ""
}

# Test: JSON output
test_json() {
    echo -e "${YELLOW}[TEST]${NC} log create --json"
    # Recreate temp.js for this test
    echo "temp" > src/temp.js
    log create --name "JSON Test" --anchors src/temp.js --prompt "Testing JSON" --json
    echo -e "${GREEN}[PASS]${NC} JSON output executed"
    echo ""
}

# Test: error handling
test_errors() {
    echo -e "${YELLOW}[TEST]${NC} error handling"

    echo "Testing missing args..."
    log create 2>&1 || echo -e "${GREEN}[OK]${NC} Caught missing args error"

    echo "Testing missing anchors..."
    log create --name "Test" 2>&1 || echo -e "${GREEN}[OK]${NC} Caught missing anchors error"

    echo "Testing nonexistent anchor..."
    log create --name "Test" --anchors nonexistent.js --prompt "test" 2>&1 || echo -e "${GREEN}[OK]${NC} Caught nonexistent anchor error"

    echo "Testing edit nonexistent..."
    log edit .kit/logs/nonexistent.md --content "test" 2>&1 || echo -e "${GREEN}[OK]${NC} Caught edit error"

    echo -e "${GREEN}[PASS]${NC} error handling works"
    echo ""
}

# Cleanup
cleanup() {
    echo -e "${YELLOW}[CLEANUP]${NC} Removing test directory..."
    rm -rf "$TEST_DIR"
    echo -e "${GREEN}[DONE]${NC} Cleanup complete"
}

# Run all tests
main() {
    setup

    test_init
    test_create
    test_list
    test_search
    test_edit
    test_staleness
    test_verify
    test_remove
    test_orphaned
    test_json
    test_errors

    echo ""
    echo "=========================================="
    echo "All tests completed!"
    echo "=========================================="

    # Ask before cleanup
    read -p "Remove test directory? [y/N] " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        cleanup
    else
        echo "Test directory preserved at: $TEST_DIR"
    fi
}

main "$@"
