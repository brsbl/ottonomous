#!/usr/bin/env bash
#
# Core utility functions for the spec CLI
#

# Colors for output (disabled if not a terminal)
if [[ -t 1 ]]; then
    RED='\033[0;31m'
    GREEN='\033[0;32m'
    YELLOW='\033[0;33m'
    BLUE='\033[0;34m'
    NC='\033[0m' # No Color
else
    RED=''
    GREEN=''
    YELLOW=''
    BLUE=''
    NC=''
fi

# Logging functions
error() {
    echo -e "${RED}Error:${NC} $*" >&2
}

success() {
    echo -e "${GREEN}$*${NC}"
}

info() {
    echo -e "${BLUE}$*${NC}"
}

warn() {
    echo -e "${YELLOW}Warning:${NC} $*" >&2
}

debug() {
    if [[ "${SPEC_DEBUG:-}" == "1" ]]; then
        echo -e "${YELLOW}Debug:${NC} $*" >&2
    fi
}

# Check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Ensure we're in a valid project directory
ensure_project_dir() {
    if [[ ! -d "specs" ]]; then
        error "Not in a spec-enabled project. Run 'spec init' first."
        return 1
    fi
}
