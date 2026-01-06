---
description: Run the indexer to scan and update memory files. Example: /AgentO:index
---

# Index Command

Trigger the indexer agent to scan the codebase and update memory files.

## Usage

```
/AgentO:index [options]
```

## Options

### Default (no args)
Full index of the project.

```
/AgentO:index
```

### --quick
Quick incremental update (only changed files).

```
/AgentO:index --quick
```

### --path [path]
Index specific directory only.

```
/AgentO:index --path src/components
```

### --force
Force re-index everything, ignore cache.

```
/AgentO:index --force
```

## What Gets Indexed

1. **ARCHITECTURE.md** - Project structure
   - Directory tree
   - File counts
   - File purposes

2. **FUNCTIONS.md** - Code index
   - Classes and methods
   - Functions and signatures
   - Types and interfaces
   - Enums and constants

3. **config.json** - Metadata
   - Last indexed timestamp
   - File and function counts
   - Index statistics

## Output

```
## Index Complete

### Statistics
- Files scanned: 45
- Functions found: 127
- Classes found: 23
- Types found: 34

### Changes
- New: 12 functions, 3 classes
- Updated: 5 signatures
- Removed: 2 functions (files deleted)

### Memory Files Updated
- ARCHITECTURE.md (8 lines changed)
- FUNCTIONS.md (23 entries modified)
- config.json (stats updated)

### Duration
- Scan time: 2.3s
- Parse time: 1.1s
- Total: 3.4s
```

## When to Run

- After adding new files
- After significant refactoring
- When orchestrator reports outdated memory
- Before starting a new feature
- Periodically (daily/weekly)

## Implementation

1. **Parse options** from `$ARGUMENTS`
2. **Invoke indexer agent**
3. **Indexer scans** based on options:
   - Default: Full scan
   - `--quick`: Check file modification times, scan only changed
   - `--path`: Limit scope to directory
   - `--force`: Ignore cache, rescan all
4. **Update memory files** with compressed format
5. **Report results**

## Automatic Indexing

The orchestrator may trigger indexing automatically when:
- Memory files are missing
- Memory is significantly outdated
- User asks about code that's not in memory
