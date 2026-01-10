---
description: Cancel a running loop started with /AgentO:loop. Example: /AgentO:cancel-loop
---

# Cancel Loop Command

Stop a currently running iterative loop.

## Usage

```
/AgentO:cancel-loop
```

## What Happens

1. **Immediate stop** - Current iteration completes, no new iteration starts
2. **State preserved** - Progress saved to LOOP_STATE.json
3. **Summary shown** - What was accomplished before cancel
4. **Clean exit** - No dangling processes or state

## Output

```
## Loop Cancelled

**Task**: Fix all TypeScript errors
**Iterations completed**: 3/5
**Status**: Cancelled by user

### Progress Made
- Iteration 1: Fixed 3 errors
- Iteration 2: Fixed 2 errors  
- Iteration 3: Fixed 1 error (interrupted)

### Remaining
- 2 errors still present in auth.ts

### To Resume
Run the same loop command again - it will continue from current state.

---
*Loop ran for: 2m 15s*
```

## Alternative Cancel Methods

| Method | When to Use |
|--------|-------------|
| `/AgentO:cancel-loop` | Clean cancel with summary |
| `Ctrl+C` | Immediate interrupt |
| Close terminal | Emergency stop |

## Resuming After Cancel

The loop state is preserved. To continue:

```
/AgentO:loop "same task" --until "same marker" --max <remaining>
```

Or start fresh:

```
/AgentO:loop "same task" --until "same marker" --max 5 --fresh
```

## When to Cancel

- Task is taking too long
- Realized wrong approach
- Need to do something else first
- Loop is stuck on same error
- Found the root cause manually

