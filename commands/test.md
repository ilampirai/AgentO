---
description: Run tests in auto mode (Playwright) or manual mode (user tests with instructions). Example: /AgentO:test --manual login
---

# Test Command

Run tests with AgentO. Two modes available.

## Usage

```
/AgentO:test [options] [feature]
```

## Modes

### Auto Mode (Default)

AgentO runs tests automatically, fixes failures, retests.

```
/AgentO:test
/AgentO:test --auto
/AgentO:test login
/AgentO:test --auto checkout
```

**What happens:**
1. Runs Playwright tests
2. On failure: identifies issue, fixes, retests
3. Loops until pass or 3 attempts
4. Reports concise summary

### Manual Mode

AgentO gives you test instructions, waits for your feedback.

```
/AgentO:test --manual
/AgentO:test --manual login
/AgentO:test --manual "checkout flow"
```

**What happens:**
1. Generates test checklist
2. Waits for you to test
3. You report pass/fail
4. On fail: fixes and asks you to retest

## Examples

### Auto-test everything
```
/AgentO:test
```

### Auto-test specific feature
```
/AgentO:test login
/AgentO:test "add to cart"
/AgentO:test checkout
```

### Manual test with instructions
```
/AgentO:test --manual
```
Output:
```
📋 Test Checklist

### Login
1. Go to /login
2. Enter: test@example.com
3. Enter: password123
4. Click "Sign In"
5. Expected: Redirect to /dashboard

Reply: "step 3 failed" or "all pass"
```

### Manual test specific area
```
/AgentO:test --manual payment
```

## Output Format

### Auto Mode
```
🧪 Testing login (auto)
   ✓ Page loads
   ✓ Form submits
   ✗ Redirect fails
   
🔧 Fixing redirect...
🧪 Retesting...
   ✓ Redirect works

✅ 3/3 passed
```

### Manual Mode
```
📋 Test: Login

1. /login → should load form
2. Submit with test@test.com / pass123
3. Should redirect to /dashboard

Your turn. Reply with results.
```

## Test Types

| Flag | What it tests |
|------|---------------|
| (none) | All relevant tests |
| `--smoke` | Quick health checks |
| `--e2e` | Full user flows |
| `--api` | Backend endpoints |
| `--visual` | Screenshot comparison |

## Combining Options

```
/AgentO:test --manual --e2e login
/AgentO:test --auto --smoke
/AgentO:test --api users
```

## Switching Modes

During a session:
```
/AgentO:test --manual    # Switch to manual
/AgentO:test --auto      # Switch back to auto
```

## Fix Loop (Auto Mode)

When tests fail:

```
Test fails → Analyze → Route to coder → Fix → Retest
     ↑                                          │
     └──────────── Still failing? ──────────────┘
     
After 3 attempts → Escalate to user
```

## Integration

Test command works with:
- **Playwright** - Browser automation
- **Coder agents** - For fixes
- **Debugger** - For complex failures
- **Memory** - Knows what to test from FUNCTIONS.md

