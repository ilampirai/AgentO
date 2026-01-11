---
name: memory-management
description: Manages the .agenticMemory system - loading, updating, and maintaining project memory files. Use when working with FUNCTIONS.md, DISCOVERY.md, ERRORS.md, or other memory files.
---

# Memory Management Skill

This skill handles all operations related to the .agenticMemory system.

## Memory Files

| File | Purpose | Format |
|------|---------|--------|
| FUNCTIONS.md | Function/class signatures with dependencies | L0/L1/L2 format |
| DISCOVERY.md | Index of explored areas | Table with timestamps |
| ARCHITECTURE.md | Project structure | Markdown with diagrams |
| DATASTRUCTURE.md | Database schemas, models | Schema definitions |
| ERRORS.md | Known errors and solutions | ERR[id] format |
| RULES.md | Project rules | Numbered rules |
| ATTEMPTS.md | Failed actions | DONT_RETRY markers |
| VERSIONS.md | Package versions | Version tracking |
| config.json | Agent routing, stats | JSON config |

## Loading Memory

### Progressive Loading (Token Efficient)

```
Level 0 (Always): config.json, RULES.md, ATTEMPTS.md headers
Level 1 (On Demand): Relevant FUNCTIONS.md section, DISCOVERY.md
Level 2 (If Needed): Full function deps, DATASTRUCTURE.md sections
```

### Load by Task Type

| Task | Load First | Then If Needed |
|------|------------|----------------|
| Coding | FUNCTIONS.md (relevant section) | DATASTRUCTURE.md |
| Debugging | ERRORS.md | FUNCTIONS.md |
| New Feature | ARCHITECTURE.md | FUNCTIONS.md |
| Database Work | DATASTRUCTURE.md | FUNCTIONS.md |

## Updating Memory

### After Code Changes

1. Extract new function signatures
2. Identify L1 dependencies from imports
3. Update FUNCTIONS.md section for modified file
4. Update DISCOVERY.md if new area explored

### After Errors Fixed

1. Add entry to ERRORS.md with ERR[id]
2. Include symptoms, root cause, solution, prevention

### After Failed Actions

1. Log to ATTEMPTS.md with timestamp
2. Mark DONT_RETRY:true if system-blocked
3. Include what was tried and why it failed

## Memory File Formats

### FUNCTIONS.md Entry

```
F:functionName(param1:type, param2:type):returnType [L1:dep1,dep2]
C:ClassName [L1:BaseClass] {method1,method2,method3}
```

### ERRORS.md Entry

```markdown
## ERR[YYYY-MM-DD-NNN]: Brief description

**Status**: ✅ Resolved | 🔄 Open | ⚠️ Workaround
**Files**: path/to/file.ts

### Symptoms
- What the error looks like

### Root Cause
Why it happened

### Solution
```code
fix here
```

### Prevention
How to avoid
```

### ATTEMPTS.md Entry

```markdown
## [YYYY-MM-DD HH:MM] Action Description

**Command/Action**: what was tried
**Result**: FAILED
**Error**: error message
**DONT_RETRY**: true/false
**Alternative**: suggested alternative approach
```

## Memory Hygiene

### Regular Cleanup
- Remove stale FUNCTIONS.md entries for deleted files
- Clear resolved entries from ATTEMPTS.md
- Archive old ERRORS.md entries (keep last 50)

### Validation
- Check FUNCTIONS.md entries match actual files
- Verify DISCOVERY.md timestamps are reasonable
- Ensure no circular dependencies in ARCHITECTURE.md
