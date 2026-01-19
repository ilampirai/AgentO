---
description: Index the codebase. Scans all source files and extracts functions, classes, and builds flow graph.
---

# /agento:index

Index or re-index the codebase with enhanced v5.0 features.

## Usage

```
/agento:index [path] [options]
```

## Options

- `--path <path>` - Directory to index (default: current directory)
- `--force` - Re-index even if already indexed

## Examples

### Index Entire Project

```
/agento:index
```

### Index Specific Directory

```
/agento:index src/services/
/agento:index --path src/components/
```

### Force Re-index

```
/agento:index --force
```

## What It Does (v5.0 Enhanced)

1. Scans all code files (`.ts`, `.tsx`, `.js`, `.jsx`, `.py`, `.php`, `.go`, `.rs`, `.java`)
2. Extracts function signatures with parameters and return types
3. **Extracts classes and methods**
4. **Builds call graph** (what calls what)
5. **Detects entry points** (server.ts, main.ts, index.ts, etc.)
6. Updates `.agenticMemory/FUNCTIONS.md` - Function index
7. **Generates `.agenticMemory/PROJECT_MAP.md`** - Unified project structure
8. **Generates `.agenticMemory/FLOW_GRAPH.json`** - Full call graph with IDs
9. Updates `.agenticMemory/DISCOVERY.md` with explored areas
10. Updates `.agenticMemory/ARCHITECTURE.md` with structure

## Output

```
✅ **Indexing Complete** (2.34s)

📊 **Stats**
- Files scanned: 45
- Functions indexed: 147
- Classes indexed: 23
- Call graph edges: 312
- Entry points: 3
- Directories explored: 12
- Total functions in index: 147

📝 **Newly Indexed Files**
- src/auth/login.ts
- src/auth/register.ts
- src/services/api.ts
- ... and 42 more
```

## Generated Files

### PROJECT_MAP.md
Compact overview for LLM understanding:
- Entry points
- Module summaries
- Class summaries
- Top functions

### FLOW_GRAPH.json
Full call graph with unique IDs:
- All functions, methods, classes with IDs
- Call relationships (edges)
- Entry point markers
- Use with `agento_flow`, `agento_symbol`, `agento_entrypoints` tools

## Skipped Directories

These directories are automatically skipped:
- `node_modules/`
- `.git/`
- `dist/`
- `build/`
- `.agenticMemory/`

## After Indexing

Use the flow graph tools for efficient code understanding:

```
# Find entry points for a feature
agento_entrypoints {query: "auth"}

# Get call graph for specific functions
agento_flow {ids: ["F123", "F456"], depth: 2}

# Lookup function details
agento_symbol {name: "getUser"}
```

## Auto-Indexing

With `autoIndex: true` in config (default), indexing happens automatically when:
- Files are read with `agento_read`
- Files are written with `agento_write`

However, for full flow graph generation, run `agento_index` explicitly.
