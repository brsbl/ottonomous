# ID generation utilities for log system
# Source this file to access ID-related functions

# Convert a name to kebab-case, max 30 characters
# Usage: generate_slug "My Feature Name"
# Output: my-feature-name
generate_slug() {
    local name="$1"
    local slug

    # Convert to lowercase
    slug=$(printf '%s' "$name" | tr '[:upper:]' '[:lower:]')

    # Replace spaces and underscores with hyphens
    slug=$(printf '%s' "$slug" | tr ' _' '-')

    # Remove any character that is not alphanumeric or hyphen
    slug=$(printf '%s' "$slug" | tr -cd 'a-z0-9-')

    # Collapse multiple hyphens into one
    slug=$(printf '%s' "$slug" | tr -s '-')

    # Remove leading and trailing hyphens
    slug=$(printf '%s' "$slug" | sed 's/^-//;s/-$//')

    # Truncate to 30 characters
    slug=$(printf '%s' "$slug" | cut -c1-30)

    # Remove trailing hyphen if truncation created one
    slug=$(printf '%s' "$slug" | sed 's/-$//')

    printf '%s' "$slug"
}

# Generate a random 4-character alphanumeric hash (a-z, 0-9)
# Usage: generate_hash
# Output: a4b2
generate_hash() {
    local chars="abcdefghijklmnopqrstuvwxyz0123456789"
    local hash_result=""
    local i rand_byte index

    # Use /dev/urandom for randomness (works on macOS and Linux)
    for i in 1 2 3 4; do
        rand_byte=$(od -An -N1 -tu1 /dev/urandom 2>/dev/null | tr -d ' \n')
        index=$((rand_byte % 36))
        hash_result="${hash_result}${chars:$index:1}"
    done

    printf '%s' "$hash_result"
}

# Generate a full ID combining slug and hash
# Usage: generate_id "My Feature Name"
# Output: my-feature-name-a4b2
generate_id() {
    local name="$1"
    local slug
    local hash

    slug=$(generate_slug "$name")
    hash=$(generate_hash)

    printf '%s-%s' "$slug" "$hash"
}

# Check if an ID is unique across all log entries
# Usage: validate_unique "my-feature-name-a4b2" ".kit/logs"
# Returns: 0 if unique, 1 if collision exists
validate_unique() {
    local id="$1"
    local log_dir="${2:-.kit/logs}"

    # Find all log files
    local matching_files
    matching_files=$(find "$log_dir" -name "*.md" -type f 2>/dev/null)

    if [ -z "$matching_files" ]; then
        # No log files exist, ID is unique
        return 0
    fi

    # Check each log file for the ID in frontmatter
    while IFS= read -r log_file; do
        if [ -f "$log_file" ]; then
            # Extract ID from frontmatter
            local file_id
            file_id=$(sed -n '/^---$/,/^---$/p' "$log_file" | grep -E '^id:' | sed 's/^id:[[:space:]]*//' | tr -d '"'"'" | head -1)

            if [ "$file_id" = "$id" ]; then
                return 1
            fi
        fi
    done <<< "$matching_files"

    return 0
}
