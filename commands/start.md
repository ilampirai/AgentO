---
description: Initialize AgentO in a new project. Sets up memory files and config. Example: /AgentO:start
---

# Start Command

Initialize AgentO in a new project.

## Usage

```
/AgentO:start
```

## ⚠️ CRITICAL: YOU MUST CREATE FILES

When this command runs, you MUST use the **Write tool** to create each file below.
Do NOT just describe what to create - ACTUALLY WRITE THE FILES.

## Step-by-Step Execution

### Step 1: Create Directory Structure

Create these directories (they'll be created when you write files to them):
- `.agenticMemory/`
- `.agenticMemory/agents/`
- `.agenticMemory/templates/`
- `.agenticMemory/styles/`

### Step 2: Create config.json

**WRITE THIS FILE**: `.agenticMemory/config.json`

```json
{
  "routing": {
    "explorer": "explorer",
    "coder": "coder-ts",
    "coder-py": "coder-py",
    "coder-php": "coder-php",
    "coder-general": "coder-general",
    "designer": "designer",
    "reviewer": "reviewer",
    "debugger": "debugger",
    "tester": "tester",
    "indexer": "indexer",
    "architect": "architect"
  },
  "debug": false,
  "lastIndexed": null,
  "fileCount": 0,
  "functionCount": 0
}
```

### Step 3: Create RULES.md

**WRITE THIS FILE**: `.agenticMemory/RULES.md`

```markdown
# Project Rules

All agents must follow these rules.

## System Rules
- MAX_FILE_LINES: 500
- NO_DUPLICATE_CODE: true
- REQUIRE_TYPES: true
- UPDATE_MEMORY_AFTER_CHANGES: true

## Custom Rules
(Add your project-specific rules here)

## Disabled Rules
(Temporarily disabled rules go here)
```

### Step 4: Create ARCHITECTURE.md

**WRITE THIS FILE**: `.agenticMemory/ARCHITECTURE.md`

```markdown
# Architecture

Project structure overview.

## Directory Tree
(Will be populated by /AgentO:index)

## Key Files
| File | Purpose |
|------|---------|
| | |

---
*Last indexed: Never*
```

### Step 5: Create FUNCTIONS.md

**WRITE THIS FILE**: `.agenticMemory/FUNCTIONS.md`

```markdown
# Function Index

## Format
F:name(params):return [L1:deps]
C:Class{methods} [L1:deps]

## Index
(Will be populated by /AgentO:index)

---
*Last indexed: Never*
```

### Step 6: Create DATASTRUCTURE.md

**WRITE THIS FILE**: `.agenticMemory/DATASTRUCTURE.md`

```markdown
# Data Structure Map

## Tables
(Will be populated by /AgentO:index --data)

## Models
(Will be populated by /AgentO:index --data)

---
*Last indexed: Never*
```

### Step 7: Create ERRORS.md

**WRITE THIS FILE**: `.agenticMemory/ERRORS.md`

```markdown
# Known Errors & Solutions

## Format
ERR001: Description
FIX: Solution
FILES: Affected files

## Errors
(Add solved errors here)
```

### Step 8: Create ATTEMPTS.md

**WRITE THIS FILE**: `.agenticMemory/ATTEMPTS.md`

```markdown
# Attempted Actions

Track failed attempts to avoid repeating.

## Blocked Patterns
(Actions marked DONT_RETRY:true)

## Attempts Log
(Recent attempts)
```

### Step 9: Create DISCOVERY.md

**WRITE THIS FILE**: `.agenticMemory/DISCOVERY.md`

```markdown
# Discovery Tracking

## Explored Areas
(Auto-populated as AgentO explores)

## Coverage Summary
| Area | Files | Functions | Coverage |
|------|-------|-----------|----------|
| | | | |
```

### Step 10: Create VERSIONS.md

**WRITE THIS FILE**: `.agenticMemory/VERSIONS.md`

```markdown
# Dependency Versions

## Dependencies
(Auto-populated when package files change)

## Change Log
| Date | Package | From | To |
|------|---------|------|-----|
| | | | |
```

### Step 11: Create placeholder in subdirs

**WRITE**: `.agenticMemory/agents/.gitkeep` (empty file)
**WRITE**: `.agenticMemory/templates/.gitkeep` (empty file)
**WRITE**: `.agenticMemory/styles/.gitkeep` (empty file)

### Step 12: Create CLAUDE.md (Auto-Routing)

**WRITE THIS FILE**: `CLAUDE.md` in project root

```markdown
# AgentO Project Rules

**This project uses AgentO orchestrator. ALL prompts route through AgentO.**

## Mandatory Routing

You are operating as **AgentO** - the orchestrator agent. Every user prompt goes through you.

On EVERY prompt:
1. Check `.agenticMemory/DISCOVERY.md` - is this area indexed?
2. If not indexed → run focused index first
3. Check `.agenticMemory/RULES.md` for project rules
4. Check `.agenticMemory/ATTEMPTS.md` for blocked patterns
5. Route to appropriate sub-agent
6. Update memory after changes

## Enforced Rules (MUST FOLLOW)

### MAX_FILE_LINES: 500
- **BEFORE writing**: Check if file will exceed 500 lines
- **IF exceeded**: STOP and split the file first
- **NO EXCEPTIONS**: Do not create files over 500 lines

### NO_DUPLICATE_CODE
- Check FUNCTIONS.md before writing
- REUSE existing functions

### UPDATE_MEMORY
- Update FUNCTIONS.md after changes
- Update DISCOVERY.md after exploring

## Output Style
- Concise (bullets, not paragraphs)
- 5-min updates on long tasks

---
*AgentO v3.0.0 - Auto-routing enabled*
```

This file makes Claude ALWAYS use AgentO for every prompt in this project.

### Step 13: Run Initial Index

After creating files, scan the project:
- List all directories
- Extract functions from code files
- Update ARCHITECTURE.md with tree
- Update FUNCTIONS.md with signatures

## Output After Completion

```
✅ AgentO Initialized

📁 Created:
   .agenticMemory/
   ├── config.json
   ├── RULES.md
   ├── ARCHITECTURE.md
   ├── FUNCTIONS.md
   ├── DATASTRUCTURE.md
   ├── ERRORS.md
   ├── ATTEMPTS.md
   ├── DISCOVERY.md
   ├── VERSIONS.md
   ├── agents/
   ├── templates/
   └── styles/

📊 Initial Index:
   Files: X | Functions: X | Classes: X

🚀 Ready! Use /AgentO:index for full scan.
```

## Alternative: Use Init Script

You can also run the init script directly:

```bash
node path/to/AgentO/scripts/init.js
```

This creates all files without needing Claude.
