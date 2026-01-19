# AgentO v5.0 - Enhanced Code Understanding

When user runs `/agento <prompt>`, use ONLY AgentO MCP tools:

| Operation | Use |
|-----------|-----|
| Write | `agento_write` |
| Read | `agento_read` |
| Commands | `agento_bash` |
| Tests | `agento_test` |
| Fix loops | `agento_loop` |
| Search | `agento_search` |
| **Index codebase** | `agento_index` |
| **Get flow graph** | `agento_flow` |
| **Lookup symbols** | `agento_symbol` |
| **Find entry points** | `agento_entrypoints` |

Do NOT use built-in Write, Read, Bash, Grep, or Glob for `/agento` prompts.

## 🧠 Code Understanding Workflow (CRITICAL)

**BEFORE writing or modifying code, ALWAYS:**

1. **Understand the codebase structure:**
   - First, check if `.agenticMemory/PROJECT_MAP.md` exists
   - If not, run `agento_index` to generate it
   - Read `PROJECT_MAP.md` to understand modules, classes, and entry points

2. **For feature requests (e.g., "add auth", "implement cart"):**
   - Use `agento_entrypoints` with the feature name (e.g., `agento_entrypoints {query: "auth"}`)
   - This returns relevant entry point IDs
   - Then use `agento_flow` with those IDs to get the call graph
   - Example: `agento_flow {ids: ["F123", "F456"], depth: 2, direction: "both"}`

3. **When you need function/class details:**
   - Use `agento_symbol` instead of reading files directly
   - Example: `agento_symbol {name: "getUser", kind: "function"}`
   - This returns file, line, signature, and dependencies in minimal tokens

4. **⚠️ FALLBACK WORKFLOW (MANDATORY):**
   If you cannot find a function/symbol you're looking for:
   
   **Step 1**: Run `agento_index {force: true}` to reindex the codebase
   - This updates PROJECT_MAP.md and FLOW_GRAPH.json with latest code
   
   **Step 2**: Try again with `agento_symbol` or `agento_entrypoints`
   - The function might have been added since last index
   
   **Step 3**: If still not found, use your thinking ability and search tools:
   - Use `agento_search` to search the codebase for the function name
   - Use codebase search to find where it might be defined
   - Read relevant files with `agento_read` to locate it
   
   **NEVER skip the reindex step** - it's critical for finding recently added code.

5. **Why this matters:**
   - **Token efficiency**: Flow graph tools return only relevant subgraphs (100-500 tokens vs 10k+ tokens)
   - **Faster understanding**: No need to read multiple files to understand relationships
   - **Accurate navigation**: Call graph shows exactly what calls what

## 📋 Memory Files Usage

Always check these files FIRST before reading code:

- `.agenticMemory/PROJECT_MAP.md` - Overview of modules, classes, entry points
- `.agenticMemory/FUNCTIONS.md` - All function signatures
- `.agenticMemory/FLOW_GRAPH.json` - Full call graph (use tools, don't read directly)
- `.agenticMemory/ARCHITECTURE.md` - Project structure
- `.agenticMemory/RULES.md` - Project rules (enforced automatically)

## 🔄 Typical Workflow

```
User: "Add authentication to the app"

1. agento_entrypoints {query: "auth"} → Get entry point IDs
2. agento_flow {ids: [...], depth: 2} → Get relevant call graph
3. agento_symbol {ids: [...]} → Get function details
4. agento_read {path: "relevant-file.ts"} → Read only what's needed
5. agento_write {path: "...", content: "..."} → Write with rule enforcement
```

This workflow uses ~500-1000 tokens instead of reading entire codebase (10k+ tokens).
