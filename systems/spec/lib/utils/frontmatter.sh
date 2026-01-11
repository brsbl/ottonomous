# Frontmatter parsing utilities for spec-system
# Source this file to access YAML frontmatter functions

# Parse frontmatter from a spec file (content between --- markers)
# Usage: parse_frontmatter "/path/to/spec.md"
# Output: YAML content without the --- markers
parse_frontmatter() {
    local file="$1"

    if [ ! -f "$file" ]; then
        return 1
    fi

    # Extract content between first pair of --- markers
    sed -n '/^---$/,/^---$/p' "$file" | sed '1d;$d'
}

# Get a specific field value from frontmatter
# Usage: get_field "/path/to/spec.md" "status"
# Output: The field value (quotes stripped)
get_field() {
    local file="$1"
    local field="$2"
    local frontmatter
    local value

    frontmatter=$(parse_frontmatter "$file")
    if [ $? -ne 0 ]; then
        return 1
    fi

    # Match field at start of line, handle quoted and unquoted values
    value=$(printf '%s\n' "$frontmatter" | grep -E "^${field}:" | head -1 | sed "s/^${field}:[[:space:]]*//")

    # Strip surrounding quotes if present
    value=$(printf '%s' "$value" | sed 's/^["'"'"']//;s/["'"'"']$//')

    printf '%s' "$value"
}

# Set/update a field in frontmatter (rewrites the file)
# Usage: set_field "/path/to/spec.md" "status" "approved"
# Returns: 0 on success, 1 on failure
set_field() {
    local file="$1"
    local field="$2"
    local value="$3"

    if [ ! -f "$file" ]; then
        return 1
    fi

    local temp_file
    temp_file=$(mktemp)

    # Check if field exists in frontmatter
    local field_exists
    field_exists=$(parse_frontmatter "$file" | grep -E "^${field}:" | head -1)

    if [ -n "$field_exists" ]; then
        # Field exists, update it
        local in_frontmatter=0
        local frontmatter_count=0

        while IFS= read -r line || [ -n "$line" ]; do
            if [ "$line" = "---" ]; then
                frontmatter_count=$((frontmatter_count + 1))
                if [ $frontmatter_count -eq 1 ]; then
                    in_frontmatter=1
                elif [ $frontmatter_count -eq 2 ]; then
                    in_frontmatter=0
                fi
                printf '%s\n' "$line" >> "$temp_file"
            elif [ $in_frontmatter -eq 1 ] && printf '%s' "$line" | grep -qE "^${field}:"; then
                printf '%s: %s\n' "$field" "$value" >> "$temp_file"
            else
                printf '%s\n' "$line" >> "$temp_file"
            fi
        done < "$file"
    else
        # Field does not exist, add it before closing ---
        local frontmatter_count=0

        while IFS= read -r line || [ -n "$line" ]; do
            if [ "$line" = "---" ]; then
                frontmatter_count=$((frontmatter_count + 1))
                if [ $frontmatter_count -eq 2 ]; then
                    # Add new field before closing ---
                    printf '%s: %s\n' "$field" "$value" >> "$temp_file"
                fi
            fi
            printf '%s\n' "$line" >> "$temp_file"
        done < "$file"
    fi

    # Move temp file to original
    mv "$temp_file" "$file"
    return 0
}

# Create a new spec file with frontmatter and body
# Usage: write_spec "/path/to/spec.md" "id" "title" "status" "body content"
# Returns: 0 on success, 1 on failure
write_spec() {
    local file="$1"
    local spec_id="$2"
    local spec_title="$3"
    local spec_status="$4"
    local spec_body="$5"
    local created_at

    # Get current date in ISO format
    created_at=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

    # Create parent directory if needed
    local dir
    dir=$(dirname "$file")
    if [ ! -d "$dir" ]; then
        mkdir -p "$dir"
    fi

    # Write the spec file
    {
        printf '%s\n' "---"
        printf 'id: %s\n' "$spec_id"
        printf 'title: %s\n' "$spec_title"
        printf 'status: %s\n' "$spec_status"
        printf 'created_at: %s\n' "$created_at"
        printf 'updated_at: %s\n' "$created_at"
        printf '%s\n' "---"
        printf '\n'
        printf '%s\n' "$spec_body"
    } > "$file"

    return 0
}
