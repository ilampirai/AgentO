---
name: smart-context
description: Intelligent context loading that minimizes token usage. Loads only what's needed at L0/L1/L2 levels. Prevents repeated file scanning and grep operations. Automatically invoked when accessing project context.
---

# Smart Context Loading Skill

Load project context efficiently without repeated scanning.

## The Problem

Without smart loading:
- Grep entire codebase for every search
- Read full files when only one function needed
- Re-scan the same files multiple times
- Waste tokens on irrelevant context

## The Solution: Dependency Levels

### L0 - Signature Only
Just the function/class signature from FUNCTIONS.md:
```
F:login(email,pass):Promise<Token>
```
**Use for**: Checking if code exists, understanding interfaces

### L1 - Direct Dependencies
The function plus what it directly calls:
```
F:login(email,pass):Promise<Token> [L1:validateUser,hashCompare]
```
**Use for**: Most fixes, understanding flow

### L2 - Deep Dependencies
L1 plus what those functions call:
```
login
├── validateUser [L1]
│   └── dbQuery [L2]
└── hashCompare [L1]
    └── bcrypt.compare [L2]
```
**Use for**: Complex bugs, refactoring

## Loading Strategy

### Step 1: Start with Memory Files (Never grep)
```
Need to fix auth?
1. ARCHITECTURE.md → Find: src/services/auth.ts
2. FUNCTIONS.md → Find section: ## src/services/auth.ts
3. Get L0: F:login(email,pass):Promise<Token> [L1:validateUser,hashCompare]
```

### Step 2: Expand Only If Needed
```
Need more context?
1. Load L1 deps signatures (validateUser, hashCompare)
2. Still not enough? Load L2 or read actual file
3. NEVER load L2 if L1 is sufficient
```

### Step 3: For Data Operations
```
Touching database?
1. DATASTRUCTURE.md → Find relevant table/model
2. Get schema and relationships
3. Only then look at actual queries
```

## When to Use Each Level

| Task | Level | What to Load |
|------|-------|--------------|
| Check if function exists | L0 | FUNCTIONS.md signature |
| Simple bug fix | L1 | Signature + direct deps |
| Refactoring | L2 | Full dependency tree |
| New feature | L0 | Check for duplicates only |
| Data migration | L1 | DATASTRUCTURE.md + related models |

## Anti-Patterns (AVOID)

```
BAD: grep -r "login" .
GOOD: Check FUNCTIONS.md for login

BAD: Read entire auth.ts file
GOOD: Read FUNCTIONS.md section for auth.ts

BAD: Search all files for database queries
GOOD: Check DATASTRUCTURE.md for DB functions

BAD: Re-scan after every change
GOOD: Update FUNCTIONS.md incrementally
```

## Integration with Memory Files

### FUNCTIONS.md Format
```
## src/services/auth.ts
F:login(email,pass):Token [L1:validate,hash] [L2:db,bcrypt]
```

### DATASTRUCTURE.md Format
```
T:users [L1:orders,profiles]
  PK:id
  F:email
```

### ARCHITECTURE.md Format
```
src/services/ [L1:auth.ts,user.ts,order.ts]
```

## Automatic Invocation

This skill activates when:
- Starting any task (load L0)
- Before writing code (check duplicates)
- When debugging (load relevant L1)
- After changes (update incrementally)
