---
description: Lookup function, method, class, route, or data structure details by name, ID, or file. Token-efficient alternative to reading files.
---

# Symbol Lookup

Use `agento_symbol` to get details about any indexed symbol without reading entire files.

## Usage

```
agento_symbol { name: "getUser" }
agento_symbol { ids: ["F123", "F456"] }
agento_symbol { file: "src/auth/user.ts", kind: "function" }
```

## Parameters

| Param | Description |
|-------|-------------|
| `ids` | Array of symbol IDs from flow graph |
| `name` | Function/method/class name to search |
| `file` | File path to filter by |
| `kind` | Filter: "function", "method", "class", "route", "datastructure" |
| `limit` | Maximum results (default: 50) |

## Returns

- ID, name, kind
- File path and line number
- Signature (params + return type)
- Dependencies

## When to Use

- **Use `agento_symbol`** when you need signature, location, or dependencies
- **Use `agento_read`** when you need the actual implementation code
- **Use `agento_flow`** when you need to see call relationships

## Not Found?

```
agento_index { force: true }     — reindex (ALWAYS first)
agento_symbol { name: "..." }    — try again
agento_search { query: "..." }   — last resort
```

Never skip the reindex step.
