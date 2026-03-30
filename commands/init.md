---
description: Initialize AgentO v6.0 in a project. Creates layered .agenticMemory structure and .claude/rules for tool enforcement.
---

# /agento:init

Initialize AgentO v6.0 in your project.

## Usage

```
/agento:init
```

## What To Do

### Step 1: Create `.claude/rules/agento-tools.md`

Copy the content from the plugin's `templates/.claude/rules/agento-tools.md`.

This forces Claude to:
- Use AgentO tools instead of built-in equivalents
- Start every session with `agento_memory { action: "resume", resume_action: "start" }`
- Check decisions and flows before writing
- Record significant architectural decisions

### Step 2: Initialize Memory

```
agento_memory { action: "init" }
```

This creates the layered `.agenticMemory/` structure:

```
.agenticMemory/
├── soul/           IDENTITY.md, PRINCIPLES.md
├── core/           DECISIONS.md, FLOWS.md, shadow indexes
├── working/        ACTIVE_CONTEXT.md, DISCOVERY.md, ATTEMPTS.md
├── surface/        FUNCTIONS.md, DATASTRUCTURE.md, PROJECT_MAP.md, FLOW_GRAPH.json
├── .branch-context/
├── .archive/
├── config.json
└── RULES.md
```

### Step 3: Index the Codebase

```
agento_index { force: true }
```

Populates surface layer: FUNCTIONS.md, PROJECT_MAP.md, DATASTRUCTURE.md, FLOW_GRAPH.json.

### Step 4: Confirm

Reply: "AgentO v6.0 initialized. 4-layer memory active. 15 tools registered."

## After Init

Prompt normally. No prefix needed:

```
"Build a login page"
"Fix the authentication bug"
"Run tests and fix failures"
```

The `.claude/rules/agento-tools.md` ensures AgentO tools are used automatically. The skill at `skills/agento/SKILL.md` teaches Claude the full memory-first workflow.

## Migration from v5.x

If a flat `.agenticMemory/` already exists:

```
agento_memory { action: "migrate" }
```

Atomic migration: copies files to layers, verifies, generates IDENTITY.md.

## MCP Tools (15)

| Tool | Purpose |
|------|---------|
| `agento_write` | Write with rule + decision + flow enforcement |
| `agento_read` | Read with discovery tracking |
| `agento_bash` | Safe command execution |
| `agento_search` | Memory-first codebase search |
| `agento_memory` | Session resume, migration, memory I/O |
| `agento_rules` | Project rule management |
| `agento_functions` | Function index queries |
| `agento_index` | Full codebase indexer |
| `agento_config` | Config + memory health |
| `agento_entrypoints` | Feature entry point discovery |
| `agento_flow` | Call graphs + flow protection |
| `agento_symbol` | Symbol lookup |
| `agento_patterns` | Extraction pattern management |
| `agento_decide` | Decision tracking |
| `agento_compact` | Memory compaction |
