---
name: code-quality
description: Enforces code quality rules including line limits, duplicate detection, error handling requirements, and commenting standards.
---

# Code Quality Skill

This skill enforces code quality standards across all code changes.

## Rules

### 1. Line Limits

```
- Max file length: 500 lines
- Max function length: 50 lines (prefer < 25)
- Max line width: 100 characters (prefer 80)
- Max nesting depth: 4 levels
```

### 2. No Duplicates

```
Before writing new code:
1. Search FUNCTIONS.md for similar function names
2. Search codebase for similar logic
3. If similar exists, REUSE or EXTEND, don't duplicate
```

### 3. Error Handling

```
All functions that can fail MUST:
- Throw typed errors (not generic Error)
- Document thrown errors in JSDoc/docstring
- Handle errors at appropriate level
- Never silently swallow errors
```

### 4. Comments

```
Required:
- JSDoc/docstring for all public functions
- @param and @returns documentation
- Complex logic explanation (WHY, not WHAT)

Forbidden:
- Commented-out code (delete it)
- Obvious comments ("increment i")
- TODO without ticket/issue reference
```

### 5. Naming

```
- Functions: verb + noun (getUserById, calculateTotal)
- Booleans: is/has/can prefix (isValid, hasPermission)
- Constants: UPPER_SNAKE_CASE
- Classes: PascalCase, noun
- Files: kebab-case or camelCase (consistent per project)
```

## Pre-Write Checklist

Before writing/editing code:
- [ ] Checked FUNCTIONS.md for existing similar code
- [ ] Verified file won't exceed 500 lines
- [ ] Planned error handling approach
- [ ] Prepared documentation comments

## Post-Write Checklist

After writing/editing code:
- [ ] All functions have documentation
- [ ] Error cases are handled
- [ ] No magic numbers (use constants)
- [ ] Naming follows conventions
- [ ] No console.log/print debugging left
- [ ] File still under 500 lines

## Violation Handling

| Violation | Severity | Action |
|-----------|----------|--------|
| File > 500 lines | 🔴 Block | Must split before proceeding |
| Duplicate code | 🟡 Warning | Should refactor to reuse |
| Missing error handling | 🟡 Warning | Add try-catch or validation |
| Missing documentation | 🟢 Note | Add before completion |
| Poor naming | 🟢 Note | Suggest better name |

## Quality Metrics

Track and report:

```
- Files over 400 lines: [count]
- Functions over 30 lines: [count]
- Undocumented public functions: [count]
- TODO comments without references: [count]
```
