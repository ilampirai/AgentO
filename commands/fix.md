---
description: Fix an issue in the project using AgentO's agents. Diagnoses the problem, finds the solution, and implements the fix. Example: /AgentO:fix the login button is not working
---

# Fix Command

Diagnose and fix issues in your project using the full power of AgentO's agent system.

## Usage

```
/AgentO:fix [description of the issue]
```

## Examples

```
/AgentO:fix the login button is not working
/AgentO:fix TypeError: Cannot read property 'map' of undefined
/AgentO:fix users can't upload images larger than 1MB
/AgentO:fix the API returns 500 error on checkout
/AgentO:fix CSS styles not applying to the modal
```

## How It Works

The fix command orchestrates multiple agents to solve your problem:

### Step 1: Understand the Issue

The **orchestrator** analyzes your description:
- Identifies the type of problem (bug, error, behavior, UI)
- Checks ERRORS.md for known solutions
- Determines which agents are needed

### Step 2: Diagnose

The **debugger** agent investigates:
- Reads relevant code from ARCHITECTURE.md and FUNCTIONS.md
- Traces the issue to its source
- Identifies root cause

### Step 3: Plan the Fix

The **orchestrator** creates a fix plan:
- What files need to change
- What the fix should do
- Which coder agent to use

### Step 4: Implement

The appropriate **coder** agent implements:
- Writes the fix following project rules
- Ensures no duplicate code
- Keeps files under 500 lines

### Step 5: Review

The **reviewer** agent validates:
- Fix addresses the issue
- No new problems introduced
- Code quality maintained
- Rules followed

### Step 6: Document

If this was a new error pattern:
- Add solution to ERRORS.md
- Update FUNCTIONS.md if new code added

## Agent Flow

```
User describes issue
        ↓
   Orchestrator
   (understands & routes)
        ↓
    Debugger
    (diagnoses)
        ↓
   Orchestrator
   (plans fix)
        ↓
  Coder (ts/py/php/general)
  (implements)
        ↓
    Reviewer
    (validates)
        ↓
   Orchestrator
   (documents & reports)
```

## Output Format

```markdown
## Fix Report

### Issue
[Original issue description]

### Diagnosis
**Root Cause**: [What was wrong]
**Location**: [file:line]

### Solution
[What was done to fix it]

### Changes Made
- [file1.ts:45] - [description of change]
- [file2.ts:12] - [description of change]

### Verification
- [x] Fix addresses the issue
- [x] No new errors introduced
- [x] Code review passed
- [x] Rules followed

### Prevention
[How to prevent this in the future - added to ERRORS.md]
```

## With Error Messages

You can paste error messages directly:

```
/AgentO:fix
Error: ENOENT: no such file or directory, open './config/settings.json'
    at Object.openSync (node:fs:603:3)
    at Object.readFileSync (node:fs:471:35)
    at loadConfig (/src/utils/config.ts:15:23)
```

The debugger will parse the stack trace and go directly to the source.

## Options

### --dry-run
Show what would be fixed without making changes:
```
/AgentO:fix --dry-run the button color is wrong
```

### --verbose
Show detailed agent reasoning:
```
/AgentO:fix --verbose users can't login
```
