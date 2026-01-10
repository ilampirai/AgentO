---
description: Index codebase into memory. Supports full, focused (keyword), path-specific, and incremental modes. Example: /AgentO:index --focus "login auth"
---

# Index Command

Scan codebase and update memory files. AgentO builds memory incrementally - full index is optional, not required.

## Usage

```
/AgentO:index [options]
```

## Index Modes

### Focused Index (Recommended for Tasks) ⭐

Index only code related to specific keywords/features:

```
/AgentO:index --focus "login auth session"
/AgentO:index --focus "cart checkout payment"
/AgentO:index --focus "user profile settings"
```

**What it does:**
1. Searches project for keyword matches
2. Finds related files and functions
3. Extracts signatures and dependencies
4. Updates memory with just that feature area

**Best for:**
- Bug fixes ("index login area, then fix")
- Feature work ("index cart before adding discount")
- Quick exploration ("what do we have for payments?")

### Auto Focus (No Args in Task Context)

When you're already working on something:

```
/AgentO:index
```

**Behavior:**
- Detects what you're working on from context
- Indexes just that area
- Smarter than full index for active work

### Path Index

Index a specific directory:

```
/AgentO:index --path src/services/auth
/AgentO:index --path lib/
```

### Quick Index

Incremental update (only changed files since last index):

```
/AgentO:index --quick
```

### Full Index

Complete codebase scan (use sparingly):

```
/AgentO:index --full
```

**When to use full:**
- New team member needs complete context
- Major refactoring planned
- Memory seems corrupted/outdated
- You have time to wait

### Data Index

Focus on data structures (DB, models, APIs):

```
/AgentO:index --data
```

### Force Re-index

Ignore cache, rebuild from scratch:

```
/AgentO:index --force
```

## Focus Index Keywords

Common feature areas and their expanded search terms:

| You Say | AgentO Searches |
|---------|-----------------|
| `login` | login, auth, signin, session, token, password, jwt |
| `cart` | cart, basket, checkout, order, payment, stripe |
| `user` | user, profile, account, settings, preferences |
| `api` | route, controller, handler, endpoint, middleware |
| `db` | model, schema, query, migration, repository |
| `test` | test, spec, mock, fixture, jest, playwright |
| `ui` | component, page, layout, style, css, theme |

## How Focused Indexing Works

```
/AgentO:index --focus "login"
         ↓
1. SEARCH: Find files containing "login", "auth", etc.
   Found: src/auth/login.ts, src/middleware/session.ts...
         ↓
2. EXTRACT: Parse functions, classes, types
   F:login(email,pass):Token
   F:validateSession(token):User
         ↓
3. DEPENDENCIES: Map what calls what
   [L1:hashPassword,createToken] [L2:bcrypt,jwt]
         ↓
4. UPDATE: Add to memory files
   FUNCTIONS.md: ✓ auth section added
   DATASTRUCTURE.md: ✓ session model added
         ↓
5. REPORT: Show what was indexed
```

## Output

### Focused Index Output
```
## Focus Index: "login auth"

### Discovery
- Keywords expanded: login, auth, signin, session, token...
- Files found: 8
- Functions extracted: 23

### Added to Memory
- FUNCTIONS.md: +23 entries (auth section)
- DATASTRUCTURE.md: +3 models (User, Session, Token)
- ARCHITECTURE.md: +1 directory (src/auth/)

### Ready
Context loaded for authentication work.
```

### Full Index Output
```
## Full Index Complete

### Code Index
- Files: 145
- Functions: 387
- L1 Dependencies: 234 mapped
- L2 Dependencies: 412 mapped

### Data Index
- Tables: 12
- Models: 18
- API Flows: 24
- Relationships: 36

### Token Savings
- Before: ~80k tokens to grep codebase
- After: ~3k tokens from memory files
```

## When to Use What

| Situation | Command | Why |
|-----------|---------|-----|
| Bug fix | `--focus "feature"` | Only need that area |
| New feature | `--focus "related"` | Build context for area |
| Exploring | `--focus "keyword"` | Quick discovery |
| New project (first task) | (auto) | Builds as you work |
| Major refactor | `--full` | Need everything |
| After git pull | `--quick` | Just updates |
| Specific folder | `--path dir/` | Targeted scan |

## Automatic Indexing

Memory builds automatically as you work:

1. **Task Start**: Focus index if area unknown
2. **After Write/Edit**: Update FUNCTIONS.md
3. **After Discovery**: Add new files to ARCHITECTURE.md
4. **Session End**: Consolidate updates

## Tips

### Don't Over-Index
```
❌ /AgentO:index --full (for a simple bug fix)
✅ /AgentO:index --focus "login" (index just what you need)
```

### Chain Focus Areas
```
/AgentO:index --focus "auth"
/AgentO:index --focus "user"
# Memory now has both areas
```

### Check What's Indexed
```
# See current memory coverage
cat .agenticMemory/ARCHITECTURE.md
```
