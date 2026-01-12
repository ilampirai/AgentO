# Discovery Tracking

Track what areas of the codebase have been explored and indexed.

## Format

```
AREA:name [coverage:X%] [last:timestamp]
  FILES: file1.ts, file2.ts
  FUNCTIONS: 12 indexed
  MODELS: 3 indexed
```

## Explored Areas

```
(Auto-populated as AgentO explores the codebase)

Example:
AREA:authentication [coverage:80%] [last:2024-01-10]
  FILES: src/auth/login.ts, src/auth/session.ts, src/middleware/auth.ts
  FUNCTIONS: 15 indexed
  MODELS: User, Session, Token

AREA:cart [coverage:60%] [last:2024-01-09]
  FILES: src/cart/index.ts, src/cart/checkout.ts
  FUNCTIONS: 8 indexed
  MODELS: Cart, CartItem, Order
```

## Coverage Summary

| Area | Files | Functions | Models | Coverage | Last Updated |
|------|-------|-----------|--------|----------|--------------|
| | | | | | |

## Unexplored Areas

```
(Directories/files not yet indexed)
```

## Session History

### Latest Session
```
Date: [timestamp]
Areas explored: [list]
Functions added: [count]
Coverage delta: +X%
```

### Previous Sessions
```
(Rolling log of last 5 sessions)
```

---

## How This Works

1. **On Task Start**: Check if task area is in explored list
2. **If Not Explored**: Do focused index, add to this file
3. **After Work**: Update coverage % and file list
4. **On Session End**: Log session summary

## Benefits

- Know what's indexed without reading full memory
- Identify gaps in coverage
- Track progress over time
- Avoid re-indexing same areas

---

*Auto-updated by AgentO as it explores the codebase*


