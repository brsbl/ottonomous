#!/usr/bin/env bash
#
# spec init [--dir <path>]
#
# Initialize a project with spec system directories and templates.
# Idempotent: skips existing files/directories without overwriting.
#

set -euo pipefail

# Source utilities
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/../utils/core.sh"

# Template content for SKILL.md
read -r -d '' SKILL_TEMPLATE << 'EOF' || true
# Spec System Skill

This skill enables AI agents to work with project specifications.

## Commands

- `spec init` - Initialize spec system in a project
- `spec create --name "Name"` - Create a new specification
- `spec list` - List all specifications
- `spec show <id>` - Show a specification
- `spec update <id>` - Update a specification

## Workflow

1. Create specs for features before implementation
2. Reference specs during development
3. Update specs as requirements evolve
4. Mark specs complete when done

## Spec Format

Specs are markdown files in `.kit/specs/` with frontmatter metadata.
EOF

# Template content for spec.md command
read -r -d '' COMMAND_TEMPLATE << 'EOF' || true
# Spec Command

Create and manage project specifications.

## Usage

```
spec init [--dir <path>]     Initialize spec system
spec create --name "Name"    Create new specification
spec list                    List all specifications
spec show <id>               Show specification details
spec update <id>             Update a specification
```

## Examples

```bash
# Initialize in current directory
spec init

# Create a new feature spec
spec create --name "User Authentication"

# Create spec with content
spec create --name "API Design" --content "Design the REST API..."

# List all specs
spec list
```
EOF

# Parse command line arguments
parse_init_args() {
    local target_dir=""

    while [[ $# -gt 0 ]]; do
        case "$1" in
            --dir)
                if [[ -z "${2:-}" ]]; then
                    error "Missing value for --dir flag"
                    return 1
                fi
                target_dir="$2"
                shift 2
                ;;
            --dir=*)
                target_dir="${1#*=}"
                shift
                ;;
            -h|--help)
                show_init_help
                return 0
                ;;
            *)
                error "Unknown option: $1"
                show_init_help
                return 1
                ;;
        esac
    done

    # Default to current working directory
    if [[ -z "$target_dir" ]]; then
        target_dir="$(pwd)"
    fi

    # Resolve to absolute path
    if [[ ! "$target_dir" = /* ]]; then
        target_dir="$(cd "$target_dir" 2>/dev/null && pwd)" || {
            error "Directory does not exist: $target_dir"
            return 1
        }
    fi

    echo "$target_dir"
}

show_init_help() {
    cat << 'HELP'
Usage: spec init [--dir <path>]

Initialize a project with the spec system.

Options:
  --dir <path>   Target directory (default: current directory)
  -h, --help     Show this help message

This command creates:
  - .kit/specs/                      Directory for specification files
  - .claude/skills/spec/        Skill definition for AI agents
  - .claude/commands/           Command documentation

The initialization is idempotent - existing files are not overwritten.
HELP
}

# Main init command
cmd_init() {
    local target_dir
    target_dir=$(parse_init_args "$@") || return 1

    # Track what was created
    local created=()
    local skipped=()

    # Ensure target directory exists
    if [[ ! -d "$target_dir" ]]; then
        error "Target directory does not exist: $target_dir"
        return 1
    fi

    # Create .kit/specs/ directory
    local specs_dir="${target_dir}/.kit/specs"
    if [[ ! -d "$specs_dir" ]]; then
        mkdir -p "$specs_dir"
        created+=(".kit/specs/")
    else
        skipped+=(".kit/specs/ (already exists)")
    fi

    # Create .claude/skills/spec/ directory and SKILL.md
    local skill_dir="${target_dir}/.claude/skills/spec"
    local skill_file="${skill_dir}/SKILL.md"
    if [[ ! -f "$skill_file" ]]; then
        mkdir -p "$skill_dir"
        echo "$SKILL_TEMPLATE" > "$skill_file"
        created+=(".claude/skills/spec/SKILL.md")
    else
        skipped+=(".claude/skills/spec/SKILL.md (already exists)")
    fi

    # Create .claude/commands/ directory and spec.md
    local commands_dir="${target_dir}/.claude/commands"
    local command_file="${commands_dir}/spec.md"
    if [[ ! -f "$command_file" ]]; then
        mkdir -p "$commands_dir"
        echo "$COMMAND_TEMPLATE" > "$command_file"
        created+=(".claude/commands/spec.md")
    else
        skipped+=(".claude/commands/spec.md (already exists)")
    fi

    # Print results
    if [[ ${#created[@]} -gt 0 ]]; then
        for item in "${created[@]}"; do
            case "$item" in
                .kit/specs/*)
                    echo "Created $item"
                    ;;
                *)
                    echo "Installed $item"
                    ;;
            esac
        done
        echo ""
        success "Ready! Run 'spec create --name \"Feature Name\"' to create your first spec."
    else
        info "Spec system already initialized. Nothing to do."
        if [[ ${#skipped[@]} -gt 0 ]]; then
            for item in "${skipped[@]}"; do
                debug "Skipped: $item"
            done
        fi
    fi

    return 0
}

# Run if executed directly (not sourced)
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    cmd_init "$@"
fi
