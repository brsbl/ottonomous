#!/usr/bin/env bash
# kb-system/lib/utils/frontmatter.sh
# Functions for parsing and manipulating YAML frontmatter in KB files

# Prevent multiple sourcing
[[ -n "${_KB_FRONTMATTER_LOADED:-}" ]] && return 0
readonly _KB_FRONTMATTER_LOADED=1

# Source dependencies
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/../config.sh"

# ==============================================================================
# Frontmatter Parsing
# ==============================================================================

# Parse YAML frontmatter from a KB file
# Arguments:
#   $1 - path to KB file
# Outputs:
#   YAML frontmatter content (without delimiters) to stdout
# Returns:
#   0 on success, 1 if no frontmatter found
parse_kb_frontmatter() {
    local kb_file="$1"

    if [[ ! -f "$kb_file" ]]; then
        echo "Error: File not found: $kb_file" >&2
        return 1
    fi

    local in_frontmatter=0
    local frontmatter_started=0
    local line_num=0

    while IFS= read -r line || [[ -n "$line" ]]; do
        ((line_num++))

        # Check for frontmatter delimiter
        if [[ "$line" == "---" ]]; then
            if [[ $frontmatter_started -eq 0 ]]; then
                # First delimiter - start of frontmatter
                if [[ $line_num -eq 1 ]]; then
                    frontmatter_started=1
                    in_frontmatter=1
                    continue
                else
                    # Frontmatter must start at line 1
                    return 1
                fi
            else
                # Second delimiter - end of frontmatter
                return 0
            fi
        fi

        # Output frontmatter content
        if [[ $in_frontmatter -eq 1 ]]; then
            echo "$line"
        fi
    done < "$kb_file"

    # If we get here without finding closing delimiter, no valid frontmatter
    if [[ $frontmatter_started -eq 1 ]]; then
        echo "Error: Unclosed frontmatter in $kb_file" >&2
        return 1
    fi

    return 1
}

# Get list of anchor paths from KB file frontmatter
# Arguments:
#   $1 - path to KB file
# Outputs:
#   One anchor path per line to stdout
# Returns:
#   0 on success, 1 on error
get_anchors() {
    local kb_file="$1"
    local frontmatter

    frontmatter=$(parse_kb_frontmatter "$kb_file") || return 1

    # Parse YAML array under 'anchors:' key
    local in_anchors=0

    while IFS= read -r line; do
        # Check for anchors key
        if [[ "$line" =~ ^anchors: ]]; then
            in_anchors=1
            # Check for inline array format: anchors: [path1, path2]
            if [[ "$line" =~ \[.*\] ]]; then
                # Extract inline array content
                local array_content="${line#*[}"
                array_content="${array_content%]*}"
                # Split by comma and output each item
                IFS=',' read -ra items <<< "$array_content"
                for item in "${items[@]}"; do
                    # Trim whitespace and quotes
                    item="${item#"${item%%[![:space:]]*}"}"
                    item="${item%"${item##*[![:space:]]}"}"
                    item="${item#\"}"
                    item="${item%\"}"
                    item="${item#\'}"
                    item="${item%\'}"
                    [[ -n "$item" ]] && echo "$item"
                done
                in_anchors=0
            fi
            continue
        fi

        # If we're in anchors section, parse list items
        if [[ $in_anchors -eq 1 ]]; then
            # Check if line is a list item (starts with -)
            if [[ "$line" =~ ^[[:space:]]*-[[:space:]]+(.*) ]]; then
                local anchor="${BASH_REMATCH[1]}"
                # Trim quotes if present
                anchor="${anchor#\"}"
                anchor="${anchor%\"}"
                anchor="${anchor#\'}"
                anchor="${anchor%\'}"
                echo "$anchor"
            elif [[ "$line" =~ ^[a-zA-Z] ]]; then
                # New key found, end of anchors section
                break
            fi
        fi
    done <<< "$frontmatter"

    return 0
}

# Get the body content (everything after frontmatter)
# Arguments:
#   $1 - path to KB file
# Outputs:
#   Body content to stdout
# Returns:
#   0 on success, 1 on error
get_kb_body() {
    local kb_file="$1"

    if [[ ! -f "$kb_file" ]]; then
        echo "Error: File not found: $kb_file" >&2
        return 1
    fi

    local delimiter_count=0
    local output_started=0

    while IFS= read -r line || [[ -n "$line" ]]; do
        if [[ "$line" == "---" ]] && [[ $delimiter_count -lt 2 ]]; then
            ((delimiter_count++))
            if [[ $delimiter_count -eq 2 ]]; then
                output_started=1
            fi
            continue
        fi

        if [[ $output_started -eq 1 ]]; then
            echo "$line"
        fi
    done < "$kb_file"

    return 0
}

# ==============================================================================
# Frontmatter Writing
# ==============================================================================

# Create a KB file with frontmatter and body content
# Arguments:
#   $1 - output file path
#   $2 - body content (can be empty)
#   $3... - anchor paths (at least one required)
# Returns:
#   0 on success, 1 on error
write_kb_file() {
    local output_file="$1"
    local body="$2"
    shift 2
    local anchors=("$@")

    if [[ ${#anchors[@]} -eq 0 ]]; then
        echo "Error: At least one anchor is required" >&2
        return 1
    fi

    # Create parent directory if needed
    local parent_dir
    parent_dir="$(dirname "$output_file")"
    if [[ ! -d "$parent_dir" ]]; then
        mkdir -p "$parent_dir" || {
            echo "Error: Cannot create directory: $parent_dir" >&2
            return 1
        }
    fi

    # Write the file
    {
        echo "---"
        echo "anchors:"
        for anchor in "${anchors[@]}"; do
            echo "  - $anchor"
        done
        echo "---"
        if [[ -n "$body" ]]; then
            echo ""
            echo "$body"
        fi
    } > "$output_file"

    return 0
}

# Update body content of KB file, preserving frontmatter
# Arguments:
#   $1 - KB file path
#   $2 - new body content
# Returns:
#   0 on success, 1 on error
update_kb_body() {
    local kb_file="$1"
    local new_body="$2"

    if [[ ! -f "$kb_file" ]]; then
        echo "Error: File not found: $kb_file" >&2
        return 1
    fi

    # Get existing anchors
    local anchors=()
    while IFS= read -r anchor; do
        anchors+=("$anchor")
    done < <(get_anchors "$kb_file")

    if [[ ${#anchors[@]} -eq 0 ]]; then
        echo "Error: No anchors found in frontmatter" >&2
        return 1
    fi

    # Rewrite file with new body
    write_kb_file "$kb_file" "$new_body" "${anchors[@]}"
}

# Add an anchor to existing KB file
# Arguments:
#   $1 - KB file path
#   $2 - anchor path to add
# Returns:
#   0 on success, 1 on error
add_anchor() {
    local kb_file="$1"
    local new_anchor="$2"

    if [[ ! -f "$kb_file" ]]; then
        echo "Error: File not found: $kb_file" >&2
        return 1
    fi

    # Get existing anchors
    local anchors=()
    while IFS= read -r anchor; do
        # Check for duplicate
        if [[ "$anchor" == "$new_anchor" ]]; then
            echo "Warning: Anchor already exists: $new_anchor" >&2
            return 0
        fi
        anchors+=("$anchor")
    done < <(get_anchors "$kb_file")

    # Add new anchor
    anchors+=("$new_anchor")

    # Get existing body
    local body
    body=$(get_kb_body "$kb_file")

    # Rewrite file
    write_kb_file "$kb_file" "$body" "${anchors[@]}"
}

# Remove an anchor from existing KB file
# Arguments:
#   $1 - KB file path
#   $2 - anchor path to remove
# Returns:
#   0 on success, 1 on error
remove_anchor() {
    local kb_file="$1"
    local remove_anchor="$2"

    if [[ ! -f "$kb_file" ]]; then
        echo "Error: File not found: $kb_file" >&2
        return 1
    fi

    # Get existing anchors, excluding the one to remove
    local anchors=()
    local found=0
    while IFS= read -r anchor; do
        if [[ "$anchor" == "$remove_anchor" ]]; then
            found=1
        else
            anchors+=("$anchor")
        fi
    done < <(get_anchors "$kb_file")

    if [[ $found -eq 0 ]]; then
        echo "Warning: Anchor not found: $remove_anchor" >&2
        return 1
    fi

    if [[ ${#anchors[@]} -eq 0 ]]; then
        echo "Error: Cannot remove last anchor" >&2
        return 1
    fi

    # Get existing body
    local body
    body=$(get_kb_body "$kb_file")

    # Rewrite file
    write_kb_file "$kb_file" "$body" "${anchors[@]}"
}

# Validate frontmatter structure
# Arguments:
#   $1 - KB file path
# Outputs:
#   Error messages to stderr
# Returns:
#   0 if valid, 1 if invalid
validate_frontmatter() {
    local kb_file="$1"
    local is_valid=0

    # Check file exists
    if [[ ! -f "$kb_file" ]]; then
        echo "Error: File not found: $kb_file" >&2
        return 1
    fi

    # Check frontmatter can be parsed
    if ! parse_kb_frontmatter "$kb_file" >/dev/null 2>&1; then
        echo "Error: Invalid or missing frontmatter" >&2
        return 1
    fi

    # Check for required anchors field
    local anchors_count=0
    while IFS= read -r anchor; do
        ((anchors_count++))
    done < <(get_anchors "$kb_file")

    if [[ $anchors_count -eq 0 ]]; then
        echo "Error: No anchors defined in frontmatter" >&2
        return 1
    fi

    return 0
}
