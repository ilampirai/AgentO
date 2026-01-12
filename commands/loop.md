---
description: Start an iteration loop (Ralph Wiggum pattern). Runs a task repeatedly until completion marker is found.
---

# /agento:loop

Start an iteration loop that runs until a condition is met.

## Usage

```
/agento:loop "<task>" --until "<completion marker>" [options]
```

## Parameters

| Parameter | Required | Description |
|-----------|----------|-------------|
| task | Yes | Description of what to do |
| --until | Yes | Text that indicates success |
| --max | No | Max iterations (default: 5) |
| --test | No | Test command to run |

## Examples

### Fix Test Failures

```
/agento:loop "Fix failing tests" --until "All tests passed" --max 5 --test "npm test"
```

### Fix Build Errors

```
/agento:loop "Fix TypeScript errors" --until "0 errors" --max 3 --test "npx tsc --noEmit"
```

### Fix Lint Warnings

```
/agento:loop "Fix ESLint warnings" --until "0 warnings" --max 5 --test "npm run lint"
```

## How It Works

```
Start Loop
    ↓
Run Test Command
    ↓
Check for "until" marker in output
    ↓
Found? → Success! Exit loop
    ↓
Not found? → Increment iteration
    ↓
iteration < max? → Fix issues → Retry
    ↓
iteration >= max? → Exit with summary
```

## Loop Control

### Check Status

```
/agento:loop status
```

### Cancel Loop

```
/agento:loop cancel
```

### Continue Iteration

```
/agento:loop iterate
```

## Output

```
🔄 **Loop Started**

Task: Fix failing tests
Completion marker: "All tests passed"
Max iterations: 5
Test command: npm test

---

🔄 **Iteration 1/5**

Marker "All tests passed" not found.

Output:
  ✗ login.spec.ts - 2 failures
  ✗ auth.spec.ts - 1 failure

Fix the issues and run `/agento:loop iterate` to continue.
```

## Best Practices

### Good Completion Markers
- `"All tests passed"` - Standard test output
- `"0 errors"` - TypeScript/lint output
- `"Build successful"` - Build output
- `"DONE"` - Explicit marker you add

### Reasonable Max Iterations
- Simple fixes: 3-5
- Test failures: 5-10
- Complex refactoring: 10-15
