---
name: smart-context
description: Intelligently loads relevant context based on task keywords and file patterns. Prevents context bloat by loading only what's needed.
---

# Smart Context Skill

This skill determines what context to load based on the current task.

## Keyword Detection

| Keywords | Area to Load | Memory Files |
|----------|--------------|--------------|
| login, auth, signin, password | Authentication | FUNCTIONS.md:auth/, ERRORS.md:auth |
| user, profile, account | User Management | FUNCTIONS.md:user/, DATASTRUCTURE.md:users |
| cart, checkout, payment, order | E-commerce | FUNCTIONS.md:cart/, DATASTRUCTURE.md:orders |
| api, endpoint, route, REST | API Layer | FUNCTIONS.md:api/, ARCHITECTURE.md |
| database, model, schema, migration | Data Layer | DATASTRUCTURE.md, FUNCTIONS.md:models/ |
| test, spec, coverage | Testing | FUNCTIONS.md:tests/, RULES.md:testing |
| ui, component, style, CSS | Frontend | FUNCTIONS.md:components/, templates/ |
| deploy, build, CI, CD | DevOps | ARCHITECTURE.md, VERSIONS.md |

## Context Loading Algorithm

```
1. Parse user message for keywords
2. Check DISCOVERY.md - is area indexed?
3. If not indexed:
   - Flag for indexer
   - Load ARCHITECTURE.md for overview
4. If indexed:
   - Load relevant FUNCTIONS.md section
   - Load related DATASTRUCTURE.md if data-related
   - Check ERRORS.md for known issues in area
5. Always load:
   - RULES.md (full, it's small)
   - ATTEMPTS.md headers (blocked patterns only)
```

## File Pattern Matching

When user mentions a file:

```
"fix the login function" → src/auth/login.ts → FUNCTIONS.md:src/auth/
"update user model" → src/models/user.ts → DATASTRUCTURE.md:users
"the cart component" → src/components/Cart.tsx → FUNCTIONS.md:src/components/
```

## Context Size Limits

| Context Type | Max Tokens | Strategy |
|--------------|------------|----------|
| FUNCTIONS.md section | 2000 | Load only relevant file section |
| DATASTRUCTURE.md | 1500 | Load only relevant tables/models |
| ERRORS.md | 1000 | Load only matching errors |
| ARCHITECTURE.md | 1000 | Load structure overview only |

## Overflow Handling

If context would exceed limits:
1. Prioritize most relevant section
2. Load L0 signatures only (skip L1/L2 deps)
3. Summarize instead of full content
4. Note what was skipped for later loading
