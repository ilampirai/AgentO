---
name: memory-management
description: Manages AgentO's persistent memory system. Reads and updates ARCHITECTURE.md, FUNCTIONS.md, ERRORS.md, and RULES.md files. Use when needing project context or updating knowledge.
---

# Memory Management Skill

This skill manages AgentO's persistent memory for project knowledge.

## Memory Files

### ARCHITECTURE.md
Project structure in compressed tree format.

**Read when**: Understanding project layout, finding files, planning new features.

**Format**:
```
src/
  index.ts [entry]
  config.ts [config]
  types/ [5 files]
  utils/ [8 files]
```

### FUNCTIONS.md
Index of all functions, classes, and types.

**Read when**: Before writing any code (to avoid duplicates), understanding existing APIs.

**Format**:
```
## src/utils/format.ts
F:formatDate(date,fmt?):string
F:formatCurrency(amt,currency?):string
C:Formatter{format(),parse()}
T:FormatOptions{locale?,timezone?}
```

**Legend**:
- `F:` = Function
- `C:` = Class with methods
- `T:` = Type/Interface
- `E:` = Enum

### ERRORS.md
Known errors and their solutions.

**Read when**: Encountering an error, debugging issues.

**Format**:
```
## ERR001: Cannot find module
FIX: npm install [module-name]
FILES: Check import paths

## ERR002: Type error
FIX: [Solution]
FILES: [Affected files]
```

### RULES.md
Project rules all agents must follow.

**Read when**: Before any code action to ensure compliance.

**Format**:
```
## System Rules
- MAX_FILE_LINES: 500
- NO_DUPLICATE_CODE: true

## Custom Rules
- [USR001] Rule description
```

## Memory Operations

### Reading Memory

Before any significant action:
1. Read RULES.md - Know what rules apply
2. Read ARCHITECTURE.md - Understand project structure
3. Read FUNCTIONS.md - Check for existing code
4. Read ERRORS.md - If dealing with an error

### Updating Memory

After completing tasks:

**New functions/classes**:
1. Add to FUNCTIONS.md in correct file section
2. Use compressed format (signatures only)

**Project structure changes**:
1. Update ARCHITECTURE.md
2. Maintain tree format

**Solved errors**:
1. Add to ERRORS.md with ERR ID
2. Include fix and affected files

**New rules**:
1. Add to RULES.md Custom Rules section
2. Assign USR ID

## Invocation

This skill is automatically invoked:
- At session start (read all memory)
- Before writing code (check FUNCTIONS.md)
- After completing features (update memory)
- When errors occur (read/update ERRORS.md)
