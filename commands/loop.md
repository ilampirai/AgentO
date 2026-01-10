---
description: Start an iterative loop that continues until completion criteria met (Ralph Wiggum pattern). Example: /AgentO:loop "fix all errors" --until "0 errors" --max 5
---

# Loop Command (Ralph Wiggum Pattern)

Run a task iteratively until a completion condition is met or max iterations reached.

## Usage

```
/AgentO:loop "<task>" --until "<completion marker>" --max <iterations>
```

## Parameters

| Parameter | Required | Default | Description |
|-----------|----------|---------|-------------|
| `task` | Yes | - | The task to execute repeatedly |
| `--until` | Yes | - | Text that indicates completion |
| `--max` | No | 10 | Maximum iterations |

## Examples

### Fix All Errors
```
/AgentO:loop "Fix TypeScript errors in src/" --until "0 errors" --max 5
```

### Pass All Tests
```
/AgentO:loop "Fix failing tests" --until "All tests passed" --max 10
```

### Lint Clean
```
/AgentO:loop "Fix ESLint warnings" --until "0 warnings" --max 8
```

### Build Success
```
/AgentO:loop "Fix build errors" --until "Build successful" --max 5
```

## How It Works

```
┌─────────────────────────────────────────────┐
│           LOOP START                        │
│  Task: "Fix all errors"                     │
│  Until: "0 errors"                          │
│  Max: 5 iterations                          │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
        ┌─────────────────┐
        │  Execute Task   │◄────────────────┐
        └────────┬────────┘                 │
                 │                          │
                 ▼                          │
        ┌─────────────────┐                 │
        │ Check Output    │                 │
        │ for "0 errors"  │                 │
        └────────┬────────┘                 │
                 │                          │
         ┌───────┴───────┐                  │
         │               │                  │
    Found ✓         Not Found               │
         │               │                  │
         ▼               ▼                  │
   ┌──────────┐   ┌─────────────┐          │
   │ SUCCESS  │   │ iteration   │          │
   │ Exit     │   │ < max?      │          │
   └──────────┘   └──────┬──────┘          │
                         │                  │
                  ┌──────┴──────┐           │
                  │             │           │
                 Yes           No           │
                  │             │           │
                  │        ┌────┴────┐      │
                  │        │ MAX     │      │
                  │        │ REACHED │      │
                  │        │ Exit    │      │
                  │        └─────────┘      │
                  │                         │
                  └─────────────────────────┘
```

## Iteration Context

Each iteration receives:
1. Original task
2. Previous iteration's output
3. Current iteration number
4. Remaining iterations
5. What changed since last iteration

## Loop State

During a loop, state is tracked in `.agenticMemory/LOOP_STATE.json`:

```json
{
  "active": true,
  "task": "Fix all errors",
  "completionMarker": "0 errors",
  "maxIterations": 5,
  "currentIteration": 2,
  "startedAt": "2024-01-10T10:30:00Z",
  "history": [
    {
      "iteration": 1,
      "output": "Found 5 errors, fixed 3",
      "completed": false
    }
  ]
}
```

## Cancel a Loop

To stop a running loop:

```
/AgentO:cancel-loop
```

Or use the interrupt signal (Ctrl+C).

## Best Practices

### Good Completion Markers
```
✅ "0 errors"           - Clear, grep-able
✅ "All tests passed"   - Standard output
✅ "Build successful"   - Common build message
✅ "DONE"               - Explicit marker
```

### Bad Completion Markers
```
❌ "maybe fixed"        - Ambiguous
❌ "looks good"         - Subjective
❌ ""                   - Empty/missing
```

### Reasonable Max Iterations
```
Simple fixes:     3-5 iterations
Test failures:    5-10 iterations
Complex refactor: 10-15 iterations
Never:            > 20 (something's wrong)
```

## Error Handling

| Situation | Behavior |
|-----------|----------|
| Completion found | Exit with success |
| Max iterations | Exit with summary |
| Same error repeats 3x | Auto-cancel, log to ATTEMPTS.md |
| User cancels | Clean exit, preserve progress |
| System error | Pause, ask for guidance |

## Integration with Hooks

The loop uses the `Stop` hook to:
1. Intercept session exit
2. Check if loop is active
3. Re-issue task if not complete
4. Track iteration count

## Output Format

```
## Loop Progress

**Task**: Fix all TypeScript errors
**Status**: Iteration 3/5
**Completion**: "0 errors" not found yet

### Iteration 3
- Fixed: missing return type in utils.ts
- Fixed: unused variable in api.ts
- Remaining: 2 errors in auth.ts

### Next Action
Attempting to fix remaining errors...

---
*Loop started: 10:30:00 | Elapsed: 2m 15s*
```

## When to Use Loops

| Task | Loop? | Why |
|------|-------|-----|
| Fix compile errors | ✅ Yes | Deterministic, measurable |
| Pass tests | ✅ Yes | Clear success criteria |
| "Make it better" | ❌ No | Subjective, no end condition |
| Refactor code | ⚠️ Maybe | Only with measurable goal |
| Write new feature | ❌ No | No iteration benefit |

