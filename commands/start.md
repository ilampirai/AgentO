---
description: Initialize AgentO in a new project. Sets up memory files and config. Example: /AgentO:start
---

# Start Command

Initialize AgentO in a new project. Creates the memory directory structure and runs initial indexing.

## Usage

```
/AgentO:start
```

## What It Does

1. **Creates .agenticMemory/ directory structure**:
   ```
   .agenticMemory/
   ├── agents/           # User-defined agents
   ├── templates/        # Scraped design templates
   ├── styles/           # Style guides
   ├── config.json       # Agent routing config
   ├── session.json      # Session persistence
   ├── ARCHITECTURE.md   # Project structure
   ├── FUNCTIONS.md      # Code index
   ├── ERRORS.md         # Error solutions
   └── RULES.md          # Project rules
   ```

2. **Creates default config.json**:
   ```json
   {
     "routing": {
       "coder": "coder-ts",
       "coder-py": "coder-py",
       "coder-php": "coder-php",
       "coder-general": "coder-general",
       "designer": "designer",
       "reviewer": "reviewer",
       "debugger": "debugger",
       "tester": "tester"
     },
     "lastIndexed": null,
     "fileCount": 0,
     "functionCount": 0
   }
   ```

3. **Creates default RULES.md**:
   ```markdown
   ## System Rules
   - MAX_FILE_LINES: 500
   - NO_DUPLICATE_CODE: true
   - REQUIRE_TYPES: true

   ## Custom Rules
   (Add your project-specific rules here)

   ## Disabled Rules
   (Temporarily disabled rules go here)
   ```

4. **Runs initial index** to populate:
   - ARCHITECTURE.md
   - FUNCTIONS.md

5. **Adds to .gitignore** (if exists):
   ```
   # AgentO session data
   .agenticMemory/session.json
   ```

## Output

```
## AgentO Initialized

### Directory Created
.agenticMemory/

### Files Created
- config.json (default routing)
- RULES.md (system rules)
- ARCHITECTURE.md (project structure)
- FUNCTIONS.md (code index)
- ERRORS.md (empty)

### Initial Index
- Files scanned: 23
- Functions found: 67
- Classes found: 12

### Next Steps
1. Review and customize RULES.md
2. Use /AgentO:agents list to see available agents
3. Start coding! The orchestrator will help.

### Commands Available
- /AgentO:index - Re-index codebase
- /AgentO:agents - Manage agents
- /AgentO:rules - Manage rules
- /AgentO:session - Session management
- /AgentO:design - UI/UX tools
```

## Idempotent

Running `/AgentO:start` again will:
- NOT overwrite existing files
- Update ARCHITECTURE.md and FUNCTIONS.md
- Report what already exists

```
## AgentO Already Initialized

Existing files preserved:
- config.json (kept)
- RULES.md (kept)
- ERRORS.md (kept)

Updated files:
- ARCHITECTURE.md (re-indexed)
- FUNCTIONS.md (re-indexed)
```
