---
name: code-quality
description: Enforces code quality rules including file size limits (500 lines max), duplicate code detection, and best practices. Automatically invoked when writing or reviewing code.
---

# Code Quality Skill

This skill ensures all code follows quality standards.

## When to Invoke

Automatically use this skill when:
- Writing new code
- Modifying existing code
- Reviewing pull requests
- Refactoring code

## Quality Checks

### 1. File Size Limit

**Rule**: No file should exceed 500 lines.

When a file approaches or exceeds this limit:
1. Identify logical boundaries for splitting
2. Extract reusable components/modules
3. Create new files with clear responsibilities
4. Update imports and exports

### 2. Duplicate Code Detection

**Rule**: Never write code that already exists.

Before writing code:
1. Check `.agenticMemory/FUNCTIONS.md` for existing functions
2. Search codebase for similar patterns
3. Reuse existing code via imports
4. If similar code exists, consider refactoring to share

### 3. Naming Conventions

Follow language-specific conventions:
- **TypeScript/JavaScript**: camelCase for variables, PascalCase for classes
- **Python**: snake_case for variables, PascalCase for classes
- **PHP**: camelCase for methods, PascalCase for classes

### 4. Error Handling

All code must handle errors appropriately:
- Catch specific exceptions
- Log errors with context
- Provide meaningful error messages
- Never swallow errors silently

### 5. Type Safety

Prefer strongly typed code:
- TypeScript: Use explicit types, avoid `any`
- Python: Use type hints
- PHP: Use type declarations

## Enforcement

When a quality rule is violated:
1. Stop and report the violation
2. Suggest how to fix it
3. Only proceed after fix is implemented

## Output Format

```
## Quality Check: [file_path]

[x] File size: 245 lines (under 500)
[x] No duplicates found
[x] Naming conventions followed
[ ] VIOLATION: Missing error handling at line 67

### Action Required
Add try-catch block around database call at line 67.
```
