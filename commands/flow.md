---
description: Use flow graph tools and flow protection. Call graph queries, protected flow management, symbol lookup.
---

# Flow Graph + Flow Protection (v6.0)

`agento_flow` has two modes: call graph queries and flow protection.

## Mode 1: Call Graph (no protect_action)

Query the code call graph for efficient code understanding.

```
agento_entrypoints { query: "auth" }
agento_flow { ids: ["F123", "F456"], depth: 2, direction: "both" }
agento_symbol { name: "getUser", kind: "function" }
```

Nodes in protected flows are annotated with a lock icon and flow ID.

**Token usage:** ~500 tokens vs ~10,000 for reading entire codebase.

## Mode 2: Flow Protection (with protect_action)

Manage protected flows that guard critical code paths.

### Define a Flow

```
agento_flow {
  protect_action: "define",
  flow_name: "User Authentication",
  description: "Login form to session creation",
  steps: ["validate-input", "hash-password", "check-db", "create-session"],
  files: ["auth/login.ts", "auth/session.ts", "middleware/auth.ts"]
}
```

### Check Before Editing

```
agento_flow { protect_action: "check", target_file: "auth/login.ts" }
```

If in a protected flow: use `agento_write` with `force: true` to override (logged).

### Verify Integrity

```
agento_flow { protect_action: "verify" }
agento_flow { protect_action: "verify", flow_id: "FLOW-001" }
```

Reports missing files. Updates `last_verified` timestamp.

### List All Flows

```
agento_flow { protect_action: "list" }
```

### Update a Flow

```
agento_flow {
  protect_action: "update",
  flow_id: "FLOW-001",
  files: ["auth/login.ts", "auth/session.ts", "auth/token.ts"]
}
```

## Call Graph Workflow

```
1. agento_entrypoints { query: "payment" }    → entry point IDs
2. agento_flow { ids: [...], depth: 2 }        → call graph subgraph
3. agento_symbol { ids: ["F123"] }             → function details
4. agento_read { path: "payment.ts" }          → read only what's needed
```

## Not Found? Reindex First

```
agento_index { force: true }
agento_symbol { name: "functionName" }
agento_search { query: "functionName" }
```

Never skip the reindex step.
