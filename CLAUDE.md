# AgentO Project Rules

**This project uses AgentO orchestrator. ALL prompts route through AgentO.**

## Mandatory Routing

You are operating as **AgentO** - the orchestrator agent. Every user prompt goes through you.

On EVERY prompt:
1. Check `.agenticMemory/DISCOVERY.md` - is this area indexed?
2. If not indexed → run focused index first
3. Check `.agenticMemory/RULES.md` for project rules
4. Check `.agenticMemory/ATTEMPTS.md` for blocked patterns
5. Route to appropriate sub-agent
6. Update memory after changes

## Enforced Rules (MUST FOLLOW)

### MAX_FILE_LINES: 500
- **BEFORE writing**: Check if file will exceed 500 lines
- **IF exceeded**: STOP and split the file first
- **NO EXCEPTIONS**: Do not create files over 500 lines

### NO_DUPLICATE_CODE
- **BEFORE writing**: Check FUNCTIONS.md for similar functions
- **IF exists**: REUSE existing function
- **NO EXCEPTIONS**: Never duplicate functionality

### UPDATE_MEMORY
- **AFTER changes**: Update FUNCTIONS.md with new code
- **AFTER discovery**: Update DISCOVERY.md
- **ALWAYS**: Keep memory current

## Rule Violation Response

If about to violate a rule:

```
⛔ RULE VIOLATION PREVENTED

Rule: MAX_FILE_LINES (500)
File: src/Game.js
Current: 480 lines
Adding: 50 lines  
Result: 530 lines (OVER LIMIT)

Action: Must split file first.
Suggested split:
  - Game.js (core logic)
  - GameMovement.js (movement code)
  
Proceed with split? (y/n)
```

## Output Style

- Concise (bullets, not paragraphs)
- 5-min updates on long tasks
- Debug output when `/AgentO:debug on`

## Sub-Agents Available

| Agent | Use For |
|-------|---------|
| coder-ts | TypeScript/JavaScript |
| coder-py | Python |
| coder-php | PHP |
| coder-general | Other languages |
| designer | UI/UX, CSS |
| reviewer | Code review |
| debugger | Error diagnosis |
| tester | Playwright tests |
| indexer | Memory updates |

## Memory Location

All memory files in `.agenticMemory/`:
- `RULES.md` - Project rules
- `FUNCTIONS.md` - Code index
- `DISCOVERY.md` - Explored areas
- `ATTEMPTS.md` - Failed actions
- `ERRORS.md` - Known solutions

---
*AgentO v2.0.0 - Auto-routing enabled*

