---
description: Manage session persistence - status, clear, permissions. Example: /AgentO:session status
---

# Session Management Command

Manage session persistence so you don't have to re-grant permissions.

## Usage

```
/AgentO:session [action]
```

## Actions

### status
Show current session information.

```
/AgentO:session status
```

Output:
```
## Session Status

**Session ID**: sess_abc123def456
**Started**: 2025-01-07 10:30:00
**Last Active**: 2025-01-07 14:45:00
**Duration**: 4h 15m

### Permission Mode
Mode: acceptEdits

### Allowed Tools
- Read, Write, Edit, Bash
- Glob, Grep, WebFetch
- Task (subagents)

### Allowed Directories
- /project/src
- /project/tests
- /project/.agenticMemory

### Denied Patterns
- *.env
- *.secret
- **/credentials/**
```

### clear
Clear the current session and start fresh.

```
/AgentO:session clear
```

Output:
```
Session cleared.
- Previous session: sess_abc123def456
- New session will be created on next interaction
- Permissions will need to be re-granted
```

### permissions
View or modify saved permissions.

```
/AgentO:session permissions
```

Output:
```
## Saved Permissions

### Tools
[x] Read - Read files
[x] Write - Create files
[x] Edit - Modify files
[x] Bash - Run commands
[x] Glob - Search files
[x] Grep - Search content
[x] WebFetch - Fetch URLs
[x] Task - Run subagents
[ ] WebSearch - Search web (not granted)

### Directories
Allowed:
- /project/src
- /project/tests

Denied:
- /project/node_modules
- /project/.git

### To modify, use:
/AgentO:session permissions add tool [name]
/AgentO:session permissions remove tool [name]
/AgentO:session permissions add dir [path]
/AgentO:session permissions deny dir [path]
```

### save
Explicitly save current session state.

```
/AgentO:session save
```

Saves to `.agenticMemory/session.json`:
```json
{
  "sessionId": "sess_abc123def456",
  "createdAt": "2025-01-07T10:30:00Z",
  "lastActive": "2025-01-07T14:45:00Z",
  "permissionMode": "acceptEdits",
  "permissions": {
    "allowedTools": ["Read", "Write", "Edit", "Bash", "Glob", "Grep", "WebFetch", "Task"],
    "allowedDirectories": ["/project/src", "/project/tests"],
    "deniedPatterns": ["*.env", "*.secret"]
  }
}
```

### restore
Restore a previous session.

```
/AgentO:session restore
```

Reads `.agenticMemory/session.json` and resumes the session.

## How Session Persistence Works

1. **First Run**: User grants permissions, session created
2. **Session Saved**: Automatically saves to `.agenticMemory/session.json`
3. **Next Run**: AgentO reads session.json and resumes
4. **No Re-prompting**: Permissions already granted carry over

## Implementation

Based on `$ARGUMENTS`:

1. **status**: Read session.json, display formatted info
2. **clear**: Delete session.json, report
3. **permissions**: Read/modify session.json permissions
4. **save**: Write current session state to session.json
5. **restore**: Read session.json, apply to current session

## Privacy Note

- session.json is in .gitignore by default
- Contains session IDs and permission grants
- Should not be committed to version control
- Clear before sharing project if concerned
