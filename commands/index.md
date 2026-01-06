---
description: Run the indexer to scan and update memory files with dependency levels and data structures. Example: /AgentO:index --data
---

# Index Command

Trigger the indexer agent to scan the codebase and update ALL memory files with smart context data.

## Usage

```
/AgentO:index [options]
```

## Options

### Default (no args)
Full index - code + dependencies.

```
/AgentO:index
```

### --data
Index data structures (DB schemas, models, API flows).

```
/AgentO:index --data
```

### --full
Complete index - code + data + dependencies.

```
/AgentO:index --full
```

### --quick
Incremental update (only changed files).

```
/AgentO:index --quick
```

### --path [path]
Index specific directory only.

```
/AgentO:index --path src/services
```

### --force
Force re-index everything, ignore cache.

```
/AgentO:index --force
```

## What Gets Indexed

### Code Index (default)

1. **ARCHITECTURE.md** - Project structure with file tags
2. **FUNCTIONS.md** - Functions with L1/L2 dependencies
   ```
   F:login(email,pass):Token [L1:validateUser,hash] [L2:dbQuery]
   ```

### Data Index (--data)

3. **DATASTRUCTURE.md** - Data layer mapping
   - Database tables with relationships
   - Data models and their connections
   - API endpoints with data flow
   ```
   T:users [PK:id] [REL:1-N orders]
   FLOW:POST /api/login [IN:email,pass] [OUT:token]
   ```

### Always Updated

4. **config.json** - Statistics and timestamps

## Dependency Levels

The indexer maps function dependencies:

| Level | What It Is | Example |
|-------|------------|---------|
| L0 | Signature only | `F:login(email,pass):Token` |
| L1 | Direct calls | `[L1:validateUser,hashCompare]` |
| L2 | What L1 calls | `[L2:dbQuery,bcrypt]` |

This enables smart context loading - load only what you need.

## Output

```
## Index Complete

### Code Index
- Files: 45 (3 new)
- Functions: 127 [+12]
- L1 Dependencies: 89 mapped
- L2 Dependencies: 156 mapped

### Data Index
- Tables: 8
- Models: 12
- API Flows: 15
- Relationships: 24

### Memory Files Updated
- ARCHITECTURE.md
- FUNCTIONS.md (with L1/L2 deps)
- DATASTRUCTURE.md
- config.json

### Token Savings
- Before: ~50k tokens to grep codebase
- After: ~2k tokens from memory files
```

## When to Run

| Scenario | Command |
|----------|---------|
| First time setup | `/AgentO:index --full` |
| After adding files | `/AgentO:index --quick` |
| After schema changes | `/AgentO:index --data` |
| Outdated memory | `/AgentO:index` |
| Something seems wrong | `/AgentO:index --force` |

## Auto-Indexing

Memory files update automatically via hooks:
- After Write/Edit → Update FUNCTIONS.md section
- After schema change → Update DATASTRUCTURE.md
- Full re-index only when explicitly requested
