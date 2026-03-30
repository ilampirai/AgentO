# AgentO Claude Code Hooks Setup

AgentO v6.0 includes Claude Code hooks for hard-gate enforcement of protected flows
and automatic observation logging.

## Installation

Add the following to your Claude Code `settings.json`:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Write",
        "command": "bash mcp-server/hooks/pre-write-check.sh"
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "command": "bash mcp-server/hooks/post-change-review.sh"
      }
    ]
  }
}
```

## How It Works

### PreToolUse: pre-write-check.sh

Runs **before** every native `Write` tool call (not `agento_write`). It:

1. Reads `.agenticMemory/core/.flows.json` for protected flow definitions
2. Extracts the target file path from the tool input
3. Checks if the file is in any protected flow's file list
4. If matched: **blocks the write** (exit code 2) with a message explaining which flow is affected
5. If not matched or no flows defined: allows the write (exit code 0)

This ensures that even native Write calls (outside `agento_write`) respect flow protection.

**To override:** Use `agento_write` with `force: true` instead of the native Write tool.

### PostToolUse: post-change-review.sh

Runs **after** every `Write` or `Edit` tool call completes. It:

1. Reads the tool result from stdin
2. Extracts the file path that was changed
3. Appends a timestamped `FILE_CHANGE` observation to `ACTIVE_CONTEXT.md`

This keeps the working memory up-to-date with all file changes, even those made
outside `agento_write`.

## Requirements

- Node.js (for JSON parsing in the hooks)
- bash shell
- `.agenticMemory/` directory must exist (run `agento_memory { action: "init" }` first)

## Troubleshooting

**Hook not firing:** Check that the matcher string matches exactly. `Write` matches the
Claude Code native Write tool. `Write|Edit` matches both.

**Permission denied:** Make the hook scripts executable:
```bash
chmod +x mcp-server/hooks/pre-write-check.sh
chmod +x mcp-server/hooks/post-change-review.sh
```

**Hook blocking everything:** If the flows JSON is corrupt, the hook will fail open
(allow all writes). Check `.agenticMemory/core/.flows.json` for valid JSON.
