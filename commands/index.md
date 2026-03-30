---
description: Index the codebase. Scans source files for functions, classes, data structures, routes. Builds flow graph. Post-index flow verification.
---

# /agento:index

Index or re-index the codebase with v6.0 features.

## Usage

```
/agento:index [options]
```

## Options

- `--path <path>` — Directory to index (default: current directory)
- `--force` — Re-index even if already indexed

## What It Does

1. Scans code files (`.ts`, `.tsx`, `.js`, `.jsx`, `.py`, `.php`, `.go`, `.rs`, `.java`)
2. Extracts functions, classes, methods (dynamic pattern system — 25 patterns, 8 languages)
3. Extracts data structures (interfaces, types, enums, structs, models)
4. Extracts routes (Express, FastAPI, Flask, NestJS, Next.js, Gin)
5. Builds call graph with symbol IDs
6. Cross-references types to functions that use them
7. **Post-index flow verification** — checks protected flow files still exist
8. **New file detection** — flags files not in any flow or decision
9. Updates surface layer:
   - `.agenticMemory/surface/FUNCTIONS.md`
   - `.agenticMemory/surface/PROJECT_MAP.md`
   - `.agenticMemory/surface/DATASTRUCTURE.md`
   - `.agenticMemory/surface/FLOW_GRAPH.json`
10. Updates working layer:
    - `.agenticMemory/working/DISCOVERY.md`
    - `.agenticMemory/working/ACTIVE_CONTEXT.md` (post-index observations)
11. Updates core layer:
    - `.agenticMemory/core/ARCHITECTURE.md`

## Incremental Indexing

With `deferIndex: true` (default), `agento_write` marks files dirty. Running `agento_index` processes only dirty + new files. Use `--force` for full reindex.

## After Indexing

Use flow graph tools for efficient code understanding:

```
agento_entrypoints { query: "auth" }
agento_flow { ids: [...], depth: 2 }
agento_symbol { name: "getUser" }
```

## Skipped Directories

`node_modules/`, `.git/`, `dist/`, `build/`, `.agenticMemory/`
