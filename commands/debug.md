---
description: Toggle debug mode to see AgentO's thought process, agent routing, and memory lookups. Example: /AgentO:debug on
---

# Debug Command

Toggle debug mode to see how AgentO thinks.

## Usage

```
/AgentO:debug [on|off|status]
```

## What Debug Mode Shows

When ON, AgentO prints its internal process:

```
┌─────────────────────────────────────────────┐
│ 🔍 AGENTO DEBUG                             │
├─────────────────────────────────────────────┤
│ 📝 Task: "fix the roll 6 bug"               │
│                                             │
│ 🧠 THINKING:                                │
│    Keywords detected: roll, bug, fix        │
│    Area: game logic                         │
│                                             │
│ 📚 MEMORY CHECK:                            │
│    DISCOVERY.md: game area indexed? YES     │
│    FUNCTIONS.md: rollDice() found at L45    │
│    ATTEMPTS.md: no blocked patterns         │
│                                             │
│ 🎯 ROUTING:                                 │
│    Task type: bug fix                       │
│    Language: JavaScript                     │
│    Agent selected: coder-ts                 │
│                                             │
│ 📄 CONTEXT LOADED:                          │
│    - src/Game.js (from ARCHITECTURE.md)     │
│    - rollDice() signature (from FUNCTIONS)  │
│    - L1 deps: [updatePhase, addToHistory]   │
│                                             │
│ → Delegating to: CODER-TS                   │
└─────────────────────────────────────────────┘
```

## Examples

### Turn On
```
/AgentO:debug on
```
Output: `🔍 Debug mode ON - AgentO will show thought process`

### Turn Off
```
/AgentO:debug off
```
Output: `Debug mode OFF`

### Check Status
```
/AgentO:debug status
```
Output: `Debug mode: ON/OFF`

## Debug Output Sections

### 🧠 THINKING
What AgentO understood from your prompt:
- Keywords detected
- Task type identified
- Area/feature detected

### 📚 MEMORY CHECK
What was looked up in memory:
- DISCOVERY.md - is area indexed?
- FUNCTIONS.md - relevant functions found
- DATASTRUCTURE.md - data models involved
- ATTEMPTS.md - blocked patterns checked
- ERRORS.md - known solutions checked

### 🎯 ROUTING
How AgentO decided which agent to use:
- Task type (fix, feature, review, test, etc.)
- Language detected
- Agent selected

### 📄 CONTEXT LOADED
What context was passed to the sub-agent:
- Files identified
- Functions loaded (L0/L1/L2)
- Rules applied

### → DELEGATION
Which agent is now working:
- Agent name
- What it was asked to do

## Persistence

Debug mode persists in session:
- Set once, stays on until turned off
- Stored in `.agenticMemory/config.json`

## When to Use Debug Mode

| Scenario | Use Debug? |
|----------|------------|
| Learning how AgentO works | ✅ Yes |
| Verifying memory is used | ✅ Yes |
| Normal development | ❌ No (verbose) |
| Troubleshooting wrong agent | ✅ Yes |

## Integration

Debug flag is checked by orchestrator on every task.
When ON, orchestrator outputs the debug block before delegating.

