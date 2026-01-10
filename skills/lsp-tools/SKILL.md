# LSP Tools Skill

Leverage Language Server Protocol for intelligent code operations.

## Available Operations

| Operation | Purpose | When to Use |
|-----------|---------|-------------|
| **Hover** | Get type info & docs | Understanding code |
| **Definition** | Jump to declaration | Exploring implementations |
| **References** | Find all usages | Before refactoring |
| **Rename** | Safe symbol rename | Refactoring |
| **Code Actions** | Quick fixes & refactors | Improving code |
| **Diagnostics** | Errors & warnings | Debugging |

## Hover - Type Information

Get detailed type information and documentation for any symbol.

### Use Cases
```
✅ "What type is this variable?"
✅ "What parameters does this function take?"
✅ "Show me the interface definition"
✅ "What does this import provide?"
```

### What You Get
- Full type signature
- JSDoc/docstring comments
- Parameter descriptions
- Return type information
- Generic constraints

## Go to Definition

Navigate to where a symbol is declared.

### Use Cases
```
✅ "Where is this function defined?"
✅ "Show me the source of this class"
✅ "Find the original type declaration"
```

### Jump Targets
- Function implementations
- Class definitions
- Type/interface declarations
- Variable declarations
- Import sources

## Find References

Locate all usages of a symbol across the codebase.

### Use Cases
```
✅ "Where is this function called?"
✅ "What uses this interface?"
✅ "Find all imports of this module"
✅ "Check before deleting this code"
```

### CRITICAL: Always Use Before
- Renaming symbols
- Deleting functions/classes
- Changing function signatures
- Removing exports

## Rename Symbol

Safely rename identifiers across all files.

### Use Cases
```
✅ "Rename this function to better name"
✅ "Rename this class throughout the project"
✅ "Fix this typo in variable name everywhere"
```

### Process
1. **First**: Find references to understand scope
2. **Verify**: Check all affected files
3. **Execute**: Apply rename
4. **Validate**: Run tests/lints

### What Gets Renamed
- The symbol itself
- All references to it
- Import statements
- Export statements
- Documentation references (in some cases)

## Code Actions

Automated refactoring and quick fixes.

### Common Actions

| Action | Trigger |
|--------|---------|
| **Extract function** | Selected code block |
| **Extract variable** | Complex expression |
| **Auto-import** | Unknown identifier |
| **Add missing imports** | Unresolved symbols |
| **Remove unused** | Unused imports/vars |
| **Convert to async** | Promise chains |
| **Add type annotation** | Implicit any |

### Refactoring Actions
```
Extract to function    → Selected code → New function
Extract to variable    → Expression → Named const
Inline variable        → Variable → Replace with value
Move to new file       → Class/function → Separate file
Convert to arrow       → Function → Arrow function
```

## Diagnostics

Real-time error and warning detection.

### Severity Levels
| Level | Meaning |
|-------|---------|
| **Error** | Won't compile/run |
| **Warning** | Potential issue |
| **Info** | Suggestions |
| **Hint** | Style/convention |

### Common Diagnostics
```
Error:   Type 'X' is not assignable to type 'Y'
Error:   Cannot find name 'X'
Warning: 'X' is declared but never used
Warning: Unexpected any
Info:    Prefer const over let
```

## Workflow Integration

### Before Writing New Code
1. Hover over similar functions to understand patterns
2. Go to definition of types you'll extend
3. Check diagnostics in related files

### During Refactoring
1. Find all references first
2. Understand the full scope of change
3. Use rename for safe symbol changes
4. Check diagnostics after changes

### When Debugging
1. Hover to verify types are what you expect
2. Go to definition to check implementation
3. Find references to trace data flow
4. Check diagnostics for hidden issues

## Language Support

| Language | Full Support | Partial |
|----------|--------------|---------|
| TypeScript | ✅ All operations | |
| JavaScript | ✅ All operations | |
| Python | ✅ With Pylance/Pyright | |
| Go | ✅ With gopls | |
| Rust | ✅ With rust-analyzer | |
| Java | ✅ With Eclipse JDT | |
| C/C++ | | ⚠️ Varies by LSP |

## Best Practices

### Prefer LSP Over Grep
```
❌ grep -r "functionName" .
✅ LSP Find References

Why: LSP understands scope, grep finds text
```

### Verify Before Refactoring
```
❌ Find-and-replace symbol name
✅ LSP Rename with preview

Why: LSP handles scope, imports, exports correctly
```

### Trust Hover Types
```
❌ Guessing what type a variable is
✅ Hover to see exact type

Why: Avoid runtime type errors
```

## Integration with AgentO

When editing code:

1. **Before changes**: Use hover to understand existing code
2. **Before refactoring**: Find references to assess impact
3. **During rename**: Use LSP rename, not find-replace
4. **After changes**: Check diagnostics for errors
5. **Update memory**: Log renamed symbols in FUNCTIONS.md

