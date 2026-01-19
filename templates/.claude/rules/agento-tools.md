# AgentO Tools (Mandatory)

**ALWAYS use AgentO MCP tools for file operations:**

| Operation | Required Tool |
|-----------|---------------|
| Write files | `agento_write` |
| Read files | `agento_read` |
| Run commands | `agento_bash` |
| Run tests | `agento_test` |
| Fix iterations | `agento_loop` |
| Search code | `agento_search` |
| **Index codebase** | `agento_index` |
| **Get flow graph** | `agento_flow` |
| **Lookup symbols** | `agento_symbol` |
| **Find entry points** | `agento_entrypoints` |

## Rules

1. **NEVER** use built-in `Write` tool → use `agento_write`
2. **NEVER** use built-in `Read` tool → use `agento_read`
3. **NEVER** use built-in `Bash` tool → use `agento_bash`
4. **NEVER** use built-in `Grep`/`Glob` tools → use `agento_search`

## 🧠 Code Understanding (CRITICAL - Use Flow Graph Tools)

**BEFORE reading or modifying code, you MUST:**

### Step 1: Check if index exists
- Check for `.agenticMemory/PROJECT_MAP.md` and `.agenticMemory/FLOW_GRAPH.json`
- If missing, run `agento_index` first

### Step 2: For feature requests, use entry points
When user asks for features like "add auth", "implement cart", "payment flow":
1. **First**: `agento_entrypoints {query: "auth"}` → Gets relevant entry point IDs
2. **Then**: `agento_flow {ids: [...], depth: 2, direction: "both"}` → Gets call graph subgraph
3. **Finally**: `agento_symbol {ids: [...]}` → Gets detailed function/class info

**DO NOT** read entire files to understand code structure. Use flow graph tools instead.

### Step 3: For function lookups
- Use `agento_symbol {name: "functionName"}` instead of reading files
- Returns: file path, line number, signature, dependencies
- Much more token-efficient than reading source files

### Step 4: ⚠️ FALLBACK WORKFLOW (MANDATORY)
**If function/symbol NOT found, you MUST follow this order:**

1. **First**: Run `agento_index {force: true}` to reindex the codebase
   - Updates PROJECT_MAP.md and FLOW_GRAPH.json with latest code
   - May have been added since last index

2. **Then**: Try again with `agento_symbol` or `agento_entrypoints`
   - Function should now be in the index

3. **Finally**: If still not found, use your thinking ability:
   - Use `agento_search {query: "functionName", type: "functions"}` to search
   - Use codebase search capabilities to locate it
   - Read relevant files with `agento_read` to find it manually
   
**CRITICAL**: Never skip the reindex step. Always reindex before giving up.

### Step 5: Only read files when you need actual implementation
- After understanding structure via flow graph, read specific files
- Use `agento_read` (not built-in Read) to track discovery

## Why Flow Graph Tools Matter

**Token Efficiency:**
- Reading entire codebase: 10,000+ tokens
- Using flow graph tools: 500-1,000 tokens
- **90% token savings** for code understanding

**Accuracy:**
- Flow graph shows exact call relationships
- No guessing about what calls what
- Entry points show where features start

**Speed:**
- Instant understanding of code structure
- No need to read multiple files
- Clear navigation path

## Example Workflow

```
User: "Add login functionality"

WRONG APPROACH (wastes tokens):
- Read auth.ts (500 tokens)
- Read user.ts (400 tokens)
- Read db.ts (300 tokens)
- Read routes.ts (200 tokens)
Total: 1,400 tokens, still unclear relationships

CORRECT APPROACH (efficient):
1. agento_entrypoints {query: "login"} → 50 tokens
   Returns: ["F123", "F456"]
2. agento_flow {ids: ["F123", "F456"], depth: 2} → 300 tokens
   Returns: call graph with 15 nodes, 20 edges
3. agento_symbol {ids: ["F123"]} → 100 tokens
   Returns: getUser function details
4. agento_read {path: "auth.ts"} → 400 tokens (only when needed)
Total: 850 tokens, clear understanding
```

## Why

AgentO tools automatically:
- Update `.agenticMemory/` files (FUNCTIONS.md, DISCOVERY.md, PROJECT_MAP.md)
- Enforce project rules from RULES.md
- Track errors and failed attempts
- Detect duplicate functions
- Smart search with memory-first lookups
- **Provide efficient code understanding via flow graph**

Using built-in tools bypasses all enforcement and wastes tokens.
