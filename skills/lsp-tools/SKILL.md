---
name: lsp-tools
description: Language Server Protocol tools for code intelligence including go-to-definition, find references, rename symbol, and diagnostics.
---

# LSP Tools Skill

Language Server Protocol integration for advanced code intelligence.

## Available Operations

### Go to Definition
Find where a symbol is defined.
```
Input: file path + position (line, character)
Output: Definition location(s)
```

### Find References
Find all usages of a symbol.
```
Input: file path + position
Output: List of reference locations
```

### Rename Symbol
Rename a symbol across the codebase.
```
Input: file path + position + new name
Output: List of edits to apply
```

### Get Diagnostics
Get errors, warnings, and hints for a file.
```
Input: file path
Output: List of diagnostics with severity and message
```

### Hover Information
Get type information and documentation.
```
Input: file path + position
Output: Type info, documentation
```

### Code Actions
Get suggested fixes and refactorings.
```
Input: file path + range
Output: List of available actions
```

## Use Cases

### Safe Refactoring

```
1. Use "Find References" to see all usages
2. Review each usage context for safety
3. Use "Rename Symbol" for safe rename across codebase
4. Verify diagnostics show no new errors
5. Run tests to confirm nothing broke
```

### Understanding Code

```
1. Use "Go to Definition" to find source
2. Use "Hover" to see type information
3. Use "Find References" to see usage patterns
4. Build mental model of dependencies
```

### Finding Issues

```
1. Get diagnostics for a file
2. Filter by severity (errors first)
3. Use code actions for quick fixes
4. Address warnings before they become errors
```

## Integration with Memory

### After Find References

```
If function has many references (>10):
- Note in FUNCTIONS.md as "widely used"
- Be extra careful when modifying
- Consider impact analysis before changes
```

### After Rename

```
- Update FUNCTIONS.md with new name
- Update any references in ARCHITECTURE.md
- Check ERRORS.md for references to old name
```

### After Diagnostics

```
If recurring error pattern:
- Add solution to ERRORS.md
- Consider adding prevention rule to RULES.md
```

## Supported Languages

| Language | LSP Server | Features |
|----------|------------|----------|
| TypeScript/JavaScript | typescript-language-server | Full support |
| Python | pyright, pylsp | Full support |
| Go | gopls | Full support |
| Rust | rust-analyzer | Full support |
| PHP | intelephense | Full support |
| Java | jdtls | Full support |
| C/C++ | clangd | Full support |

## Common LSP Workflows

### Rename a Function Safely

```
1. Position cursor on function name
2. LSP: Find References
   → See all 15 usages across 8 files
3. Review usages - any dynamic calls? reflection?
4. LSP: Rename Symbol → "newFunctionName"
   → All 15 usages updated automatically
5. LSP: Get Diagnostics on affected files
   → Verify no new errors
6. Update FUNCTIONS.md with new name
```

### Trace a Bug

```
1. Start at error location
2. LSP: Go to Definition on suspicious function
3. LSP: Hover to check types
4. LSP: Find References to see all callers
5. Identify where bad data enters
6. Fix and document in ERRORS.md
```

### Refactor to Extract Function

```
1. Select code block to extract
2. LSP: Code Actions → "Extract to function"
3. Name the new function appropriately
4. LSP: Find References to verify extraction
5. Add new function to FUNCTIONS.md
```

## Error Handling

### LSP Server Not Running

```
If LSP operations fail:
- Check if language server is installed
- Restart the language server
- Fall back to grep-based searching
```

### LSP Results Incomplete

```
If results seem wrong:
- Rebuild project (npm run build, etc.)
- Invalidate caches
- Check tsconfig/pyproject.toml settings
```

## Tips

- Trust but verify LSP results
- Combine with tests for safety
- Update memory after large refactors
