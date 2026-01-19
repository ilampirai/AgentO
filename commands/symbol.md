---
description: Lookup function, method, or class details by name, ID, or file. Use this instead of reading files directly.
---

# Symbol Lookup

Use `agento_symbol` to get detailed information about functions, methods, or classes without reading entire files.

## Usage

```
agento_symbol {name: "getUser"}
agento_symbol {ids: ["F123", "F456"]}
agento_symbol {file: "src/auth/user.ts", kind: "function"}
```

## Parameters

- `ids` - Array of symbol IDs from flow graph
- `name` - Function/method/class name to search for
- `file` - File path to filter by
- `kind` - Filter by type: "function", "method", or "class"
- `limit` - Maximum results (default: 50)

## Returns

For each symbol found:
- ID (if from flow graph)
- Name and kind (function/method/class)
- File path and line number
- Signature (parameters and return type)
- Dependencies (if available)

## Example

```
agento_symbol {name: "getUser", kind: "function"}

Returns:
📋 Symbol Details (1 result(s))

## getUser (function)
- ID: F123abc4
- File: src/auth/user.ts:45
- Signature: getUser(id: string): Promise<User>
- Details:
  Params: id: string
  Return: Promise<User>
  Dependencies: db.findUser, logger.info
```

## ⚠️ Function Not Found? Follow This Workflow

### Step 1: Reindex (MANDATORY)
```
agento_index {force: true}
```
The function might have been added since last index. Reindexing updates the flow graph.

### Step 2: Try Again
```
agento_symbol {name: "functionName"}
```
The function should now be in the index.

### Step 3: If Still Not Found
Use your thinking ability and search:
```
agento_search {query: "functionName", type: "functions"}
```
Then read relevant files with `agento_read` to locate it manually.

**CRITICAL**: Always reindex before giving up. Never skip Step 1.

## When to Use

✅ **Use `agento_symbol` when:**
- You need function signature/details
- You have a symbol ID from flow graph
- You want to know file location and line number
- You need dependencies

❌ **Don't use when:**
- You need to read actual implementation code (use `agento_read`)
- You already know the exact file and line
- You need to see the full function body

## Benefits

- **Token efficient**: Returns only metadata, not full code
- **Fast**: No need to read files to get basic info
- **Accurate**: Uses indexed data, not regex search

