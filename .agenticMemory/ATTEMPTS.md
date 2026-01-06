# Attempted Actions Log

Track what was tried to avoid repeating failed attempts. Agents MUST check this before retrying.

## Format

```
## [TIMESTAMP] ACTION_TYPE: description
STATUS: failed | blocked | succeeded
REASON: Why it failed
DONT_RETRY: true | false
SOLUTION: What worked instead (if found)
```

## Failed Attempts

(Logged automatically by hooks)

### Example Entries

```
## [2025-01-07 10:30] BASH: mysql -u root -p password
STATUS: blocked
REASON: System denied - credentials in command line not allowed
DONT_RETRY: true
SOLUTION: Use environment variables or config file for credentials

## [2025-01-07 10:35] FILE: Read /etc/passwd
STATUS: blocked
REASON: Permission denied - system file
DONT_RETRY: true
SOLUTION: N/A - not needed for this task

## [2025-01-07 10:40] API: fetch('http://localhost:3000/api')
STATUS: failed
REASON: ECONNREFUSED - server not running
DONT_RETRY: false (retry after starting server)
SOLUTION: Run `npm run dev` first
```

## Blocked Patterns

Patterns that should never be attempted:

- `mysql -u * -p *` - Use config/env vars instead
- `sudo *` - Request user to run manually
- Hardcoded credentials in commands
- Reading system files outside project

## Session Learnings

Things learned this session that should inform future actions:

(Updated as session progresses)

---

*Auto-updated by PostToolUse hooks*
