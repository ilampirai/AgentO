---
description: Use flow graph tools to understand code structure efficiently. Find entry points, get call graphs, lookup symbols.
---

# Flow Graph Tools (v5.0)

AgentO v5.0 provides powerful tools for understanding code structure without reading entire files.

## Tools

| Tool | Purpose | When to Use |
|------|---------|-------------|
| `agento_entrypoints` | Find entry points for features | When user asks for features like "auth", "cart", "payment" |
| `agento_flow` | Get call graph subgraph | After getting entry point IDs, to see what calls what |
| `agento_symbol` | Lookup function/class details | When you need specific function info (file, line, signature) |
| `agento_index` | Generate flow graph | First time, or when codebase changes significantly |

## Workflow

### Step 1: Index the Codebase (First Time)

```
/agento:index
```

This generates:
- `.agenticMemory/PROJECT_MAP.md` - Overview
- `.agenticMemory/FLOW_GRAPH.json` - Full call graph

### Step 2: Find Entry Points

When user asks for a feature:

```
agento_entrypoints {query: "auth"}
```

Returns entry point IDs like `["F123", "F456"]` that match "auth".

### Step 3: Get Call Graph

Use entry point IDs to get the relevant subgraph:

```
agento_flow {
  ids: ["F123", "F456"],
  depth: 2,
  direction: "both",
  maxNodes: 100
}
```

Returns:
- All functions/methods/classes in the flow
- Call relationships (edges)
- Only relevant code, not entire codebase

### Step 4: Get Function Details

When you need specific details:

```
agento_symbol {ids: ["F123"]}
# or
agento_symbol {name: "getUser", kind: "function"}
```

Returns:
- File path and line number
- Function signature
- Parameters and return type
- Dependencies

### Step 5: Read Only What's Needed

After understanding structure, read specific files:

```
agento_read {path: "src/auth/login.ts"}
```

## Example: Adding Authentication

```
User: "Add login functionality"

1. agento_entrypoints {query: "login"}
   → Returns: ["F123", "F456"]

2. agento_flow {ids: ["F123", "F456"], depth: 2}
   → Returns: 15 nodes, 20 edges showing login flow

3. agento_symbol {ids: ["F123"]}
   → Returns: getUser function at src/auth/user.ts:45

4. agento_read {path: "src/auth/user.ts"}
   → Read only the relevant file

5. agento_write {path: "src/auth/login.ts", content: "..."}
   → Write new login functionality
```

**Token Usage:**
- Flow graph tools: ~500 tokens
- Reading entire codebase: ~10,000 tokens
- **90% savings!**

## Benefits

1. **Token Efficiency**: Only get relevant code subgraph
2. **Fast Understanding**: See call relationships instantly
3. **Accurate Navigation**: Know exactly what calls what
4. **No Guessing**: Flow graph shows real relationships

## When NOT to Use

- Don't use for simple file reads (use `agento_read`)
- Don't use when you already know the file path
- Don't use for non-code understanding tasks

## ⚠️ Function Not Found? Follow This Workflow

If `agento_symbol` or `agento_entrypoints` doesn't find what you're looking for:

### Step 1: Reindex (MANDATORY)
```
agento_index {force: true}
```
This updates the flow graph with latest code. The function might have been added recently.

### Step 2: Try Again
```
agento_symbol {name: "functionName"}
# or
agento_entrypoints {query: "feature"}
```
The function should now be in the index.

### Step 3: If Still Not Found
Use your thinking ability and search:
```
agento_search {query: "functionName", type: "functions"}
```
Then read relevant files with `agento_read` to locate it manually.

**Never skip Step 1** - reindexing is critical for finding recently added code.

## Tips

- Run `agento_index` after major code changes
- Use `depth: 2` for most cases (shows 2 levels of calls)
- Use `direction: "both"` to see both callers and callees
- Use `maxNodes: 100` to limit results for large codebases

