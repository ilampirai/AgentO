---
description: Manage project rules - list, add, remove, enable, disable. Example: /AgentO:rules add No console.log in production
---

# Rules Management Command

Manage project rules that all agents must follow.

## Usage

```
/AgentO:rules [action] [args]
```

## Actions

### list
Show all active and disabled rules.

```
/AgentO:rules list
```

Output:
```
## Project Rules

### System Rules (Cannot Disable)
- [SYS001] MAX_FILE_LINES: 500
- [SYS002] NO_DUPLICATE_CODE: true

### Custom Rules (Active)
- [USR001] All API calls must have error handling
- [USR002] Use async/await, no callbacks
- [USR003] Components must be in separate files

### Custom Rules (Disabled)
- [USR004] ~Require JSDoc for all functions~ (disabled)
```

### add
Add a new custom rule.

```
/AgentO:rules add [rule description]
```

Example:
```
/AgentO:rules add All database queries must use transactions
→ Added rule [USR005]: All database queries must use transactions
```

Updates `.agenticMemory/RULES.md`:
```markdown
## Custom Rules
- [USR001] All API calls must have error handling
- [USR002] Use async/await, no callbacks
- [USR005] All database queries must use transactions  ← NEW
```

### remove
Remove a custom rule.

```
/AgentO:rules remove [rule-id]
```

Example:
```
/AgentO:rules remove USR002
→ Removed rule [USR002]: Use async/await, no callbacks
```

### enable
Re-enable a disabled rule.

```
/AgentO:rules enable [rule-id]
```

### disable
Temporarily disable a rule without removing it.

```
/AgentO:rules disable [rule-id]
```

Example:
```
/AgentO:rules disable USR003
→ Disabled rule [USR003]: Components must be in separate files
```

### check
Check if current code follows all rules.

```
/AgentO:rules check
```

Output:
```
## Rules Check

### Violations Found
- [USR001] src/api.ts:45 - API call without error handling
- [SYS001] src/components/BigComponent.tsx - 523 lines (max 500)

### Passed
- [SYS002] NO_DUPLICATE_CODE: No duplicates found
- [USR002] All async code uses await
```

## RULES.md Format

```markdown
## System Rules
- MAX_FILE_LINES: 500
- NO_DUPLICATE_CODE: true
- REQUIRE_TYPES: true

## Custom Rules
- [USR001] All API calls must have error handling
- [USR002] Use async/await, no callbacks
- [USR003] Components must be in separate files

## Disabled Rules
- [USR004] ~Require JSDoc for all functions~
```

## Implementation

Based on `$ARGUMENTS`:

1. **Parse action**: First word is the action
2. **Execute**:
   - `list`: Read and display RULES.md
   - `add [desc]`: Add new rule with next USR ID
   - `remove [id]`: Remove rule from file
   - `enable [id]`: Move from Disabled to Custom Rules
   - `disable [id]`: Move from Custom Rules to Disabled
   - `check`: Scan codebase and report violations

## Error Handling

- Cannot modify system rules: "Cannot modify system rule [SYS001]"
- Rule not found: "Rule '[id]' not found"
- Invalid format: "Usage: /AgentO:rules [list|add|remove|enable|disable|check]"
