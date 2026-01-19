# AgentO Project

This project uses AgentO v5.0. Use `/agento <prompt>` for tasks.

When `/agento` is used, all file operations must use:
- `agento_write` (not Write)
- `agento_read` (not Read)
- `agento_bash` (not Bash)
- `agento_search` (not Grep/Glob)

## 🧠 Code Understanding Tools (NEW in v5.0)

**ALWAYS use these tools for understanding code structure:**

1. **`agento_index`** - Index the codebase (run once, generates PROJECT_MAP.md and FLOW_GRAPH.json)
2. **`agento_entrypoints`** - Find entry points for features (e.g., "auth", "cart")
3. **`agento_flow`** - Get call graph subgraph for specific functions
4. **`agento_symbol`** - Lookup function/class details by name or ID

### Workflow Example:
```
User: "Add authentication"

1. agento_entrypoints {query: "auth"} → Get entry point IDs
2. agento_flow {ids: [...], depth: 2} → Get call graph
3. agento_symbol {ids: [...]} → Get function details
4. agento_read {path: "..."} → Read only needed files
5. agento_write {path: "...", content: "..."} → Write changes
```

**Benefits:**
- 90% token savings vs reading entire codebase
- Clear understanding of code relationships
- Fast navigation without file scanning

### ⚠️ If Function Not Found:
1. **First**: `agento_index {force: true}` → Reindex codebase
2. **Then**: Try `agento_symbol` or `agento_entrypoints` again
3. **Finally**: If still not found, use `agento_search` and your thinking ability
4. **Never skip the reindex step** - it's critical for finding recent code
