---
description: Show AgentO status. Overview of all memory files, configuration, and current loop state.
---

# /agento:status

Show AgentO status and overview.

## Usage

```
/agento:status
```

## Output

```
📊 **AgentO Status**

⚙️ **Configuration**
- Line limit: 500
- Strict mode: ON
- Auto-index: ON
- Test framework: auto

📚 **Functions Index**
- Total functions: 147
- Files indexed: 23

📋 **Rules**
- Total rules: 5
- Enabled: 4

🔍 **Discovery**
- Areas explored: 12

⚠️ **Attempts**
- Total logged: 3
- Blocked patterns: 1

🔄 **Loop**
- Status: Inactive

📁 **Memory Files**
- .agenticMemory/FUNCTIONS.md: ✅
- .agenticMemory/RULES.md: ✅
- .agenticMemory/ARCHITECTURE.md: ✅
- .agenticMemory/DISCOVERY.md: ✅
- .agenticMemory/ATTEMPTS.md: ✅
- .agenticMemory/ERRORS.md: ✅
- .agenticMemory/VERSIONS.md: ✅
- .agenticMemory/DATASTRUCTURE.md: ✅
```

## Active Loop Status

When a loop is running:

```
🔄 **Loop**
- Status: ACTIVE
- Task: Fix failing tests
- Progress: 2/5
```

## Use Cases

- Verify AgentO is initialized
- Check current configuration
- See index coverage
- Monitor loop progress
- Troubleshoot issues

