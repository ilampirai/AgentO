#!/bin/bash
# pre-write-check.sh — Claude Code PreToolUse hook for Write tool
# Checks if the target file is in a protected flow before allowing writes.
#
# Reads the flows JSON index and checks for file membership.
# Exit 0 = allow, Exit 2 = block with message.

FLOWS_INDEX=".agenticMemory/core/.flows.json"

# No flows file = allow all writes
if [ ! -f "$FLOWS_INDEX" ]; then
  exit 0
fi

# Read tool input from stdin
INPUT=$(cat)

# Extract file_path from JSON input
TARGET_FILE=$(echo "$INPUT" | node -e "
  let data = '';
  process.stdin.on('data', chunk => data += chunk);
  process.stdin.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      console.log(parsed.file_path || parsed.path || '');
    } catch {
      console.log('');
    }
  });
" 2>/dev/null)

if [ -z "$TARGET_FILE" ]; then
  exit 0
fi

# Check if file is in any protected flow
RESULT=$(node -e "
  const fs = require('fs');
  try {
    const flows = JSON.parse(fs.readFileSync('$FLOWS_INDEX', 'utf8'));
    const target = '$TARGET_FILE'.replace(/\\\\\\\\/g, '/');
    const impacted = flows.filter(f =>
      f.files && f.files.some(file => {
        const normFile = file.replace(/\\\\\\\\/g, '/');
        return normFile === target ||
               normFile.endsWith('/' + target) ||
               target.endsWith('/' + normFile);
      })
    );
    if (impacted.length > 0) {
      console.log('BLOCKED: File is in protected flow(s): ' +
        impacted.map(f => f.id + ': ' + f.name).join(', '));
      console.log('Use agento_write with force:true to override.');
      process.exit(2);
    }
  } catch (e) {
    // Parse error or missing file — allow write
  }
" 2>&1)

EXIT_CODE=$?
if [ $EXIT_CODE -eq 2 ]; then
  echo "$RESULT"
  exit 2
fi

exit 0
