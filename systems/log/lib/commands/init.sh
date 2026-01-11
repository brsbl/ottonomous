#!/usr/bin/env bash
# log init - Initialize KB system in current directory
# Creates .kit/logs/ directory, config file, and installs Claude skill

set -euo pipefail

# Get the directory where this script lives
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEMPLATE_DIR="${SCRIPT_DIR}/../../templates"

# Default config content
DEFAULT_CONFIG="auto_verify: false"

cmd_init() {
    local log_dir=".kit/logs"
    local config_file=".kit/logs/config.yaml"
    local skill_dir=".claude/skills/log"
    local skill_file=".claude/skills/log/SKILL.md"
    local template_file="${TEMPLATE_DIR}/SKILL.md"

    # Verify template exists
    if [[ ! -f "$template_file" ]]; then
        echo "Error: Template not found at $template_file" >&2
        exit 1
    fi

    # Create .kit/logs/ directory
    if [[ ! -d "$log_dir" ]]; then
        mkdir -p "$log_dir"
        echo "Created $log_dir/"
    else
        echo "Skipped $log_dir/ (already exists)"
    fi

    # Create config.yaml
    if [[ ! -f "$config_file" ]]; then
        echo "$DEFAULT_CONFIG" > "$config_file"
        echo "Created $config_file"
    else
        echo "Skipped $config_file (already exists)"
    fi

    # Create skill directory and file from template
    if [[ ! -f "$skill_file" ]]; then
        mkdir -p "$skill_dir"
        cp "$template_file" "$skill_file"
        echo "Installed $skill_file"
    else
        echo "Skipped $skill_file (already exists)"
    fi

    echo ""
    echo "Log system initialized. Create entries with:"
    echo "  kit log create --name \"<name>\" --anchors <file1> [file2...] --prompt \"<what you learned>\""
}

# Run if executed directly (not sourced)
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    cmd_init "$@"
fi
