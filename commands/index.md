---
description: Index the codebase. Scans all source files and extracts functions to FUNCTIONS.md.
---

# /agento:index

Index or re-index the codebase.

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

## What It Does

1. Scans all code files (`.ts`, `.tsx`, `.js`, `.jsx`, `.py`, `.php`, `.go`, `.rs`)
2. Extracts function signatures with parameters and return types
3. Updates `.agenticMemory/FUNCTIONS.md`
4. Updates `.agenticMemory/DISCOVERY.md` with explored areas
5. Updates `.agenticMemory/ARCHITECTURE.md` with structure

## Output

```
✅ **Indexing Complete** (2.34s)

📊 **Stats**
- Files scanned: 45
- Functions indexed: 147
- Directories explored: 12
- Total functions in index: 147

📝 **Newly Indexed Files**
- src/auth/login.ts
- src/auth/register.ts
- src/services/api.ts
- ... and 42 more
```

## Skipped Directories

These directories are automatically skipped:
- `node_modules/`
- `.git/`
- `dist/`
- `build/`
- `.agenticMemory/`

## Auto-Indexing

With `autoIndex: true` in config (default), indexing happens automatically when:
- Files are read with `agento_read`
- Files are written with `agento_write`
