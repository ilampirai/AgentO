#!/bin/bash
# post-change-review.sh — Claude Code PostToolUse hook for Write/Edit tools
# Logs significant changes as observations in ACTIVE_CONTEXT.md.
#
# This hook runs after Write/Edit tool calls complete.
# It appends a timestamped observation to the working memory.

ACTIVE_CONTEXT=".agenticMemory/working/ACTIVE_CONTEXT.md"

# Skip if no active context file
if [ ! -f "$ACTIVE_CONTEXT" ]; then
  exit 0
fi

# Read tool result from stdin
INPUT=$(cat)

# Extract relevant info
INFO=$(echo "$INPUT" | node -e "
  let data = '';
  process.stdin.on('data', chunk => data += chunk);
  process.stdin.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      const path = parsed.file_path || parsed.path || 'unknown';
      const isNew = parsed.created === true;
      console.log(JSON.stringify({ path, isNew }));
    } catch {
      console.log('{}');
    }
  });
" 2>/dev/null)

# Only log if we got valid info
if [ "$INFO" != "{}" ] && [ -n "$INFO" ]; then
  TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
  FILE_PATH=$(echo "$INFO" | node -e "
    let d='';process.stdin.on('data',c=>d+=c);
    process.stdin.on('end',()=>{try{console.log(JSON.parse(d).path||'')}catch{console.log('')}});
  " 2>/dev/null)

  if [ -n "$FILE_PATH" ]; then
    echo "" >> "$ACTIVE_CONTEXT"
    echo "- [$TIMESTAMP] FILE_CHANGE: $FILE_PATH" >> "$ACTIVE_CONTEXT"
  fi
fi

exit 0
