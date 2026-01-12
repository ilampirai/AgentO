---
description: Run tests with auto-detection and optional retry. Supports Playwright, Jest, pytest, PHPUnit.
---

# /agento:test

Run tests with framework auto-detection.

## Usage

```
/agento:test [options] [pattern]
```

## Options

| Option | Description |
|--------|-------------|
| --framework | Force framework: playwright, jest, pytest, phpunit |
| --pattern | Test file pattern or specific test |
| --retries | Max retry attempts (default: 0) |
| --fix | Return failure details for fixing |

## Examples

### Run All Tests (Auto-detect)

```
/agento:test
```

### Run Specific Tests

```
/agento:test login
/agento:test --pattern "auth.spec.ts"
```

### Run with Retry

```
/agento:test --retries 3
```

### Run with Fix Details

```
/agento:test --fix
```

Returns detailed failure information to help fix issues.

### Force Framework

```
/agento:test --framework playwright
/agento:test --framework jest
```

## Auto-Detection

AgentO detects the test framework from:

| Framework | Detection |
|-----------|-----------|
| Playwright | `playwright.config.ts/js` |
| Jest | `jest.config.ts/js/json` |
| pytest | `pytest.ini`, `pyproject.toml` |
| PHPUnit | `phpunit.xml` |

## Output

### Success

```
✅ **Tests Passed** (Playwright)

```
Running 24 tests using 4 workers
  24 passed (12.3s)
```

### Failure with --fix

```
❌ **Tests Failed** (Jest)

```
FAIL src/auth/login.spec.ts
  ✕ should authenticate valid user (45ms)
  
  expect(received).toBe(expected)
  Expected: true
  Received: false
```

**Failures to Fix:**
- login.spec.ts: expected true, got false in authentication test

Fix the issues and run agento_test again.
```

## Integration with Loop

Combine with `/agento:loop` for auto-fix:

```
/agento:loop "Fix test failures" --until "passed" --max 5 --test "npx playwright test"
```
