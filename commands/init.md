---
description: Initialize AgentO in a project. Creates .agenticMemory folder and .claude/rules for tool enforcement.
---

# /agento:init

Initialize AgentO in your project.

## Usage

```
/agento:init
```

## What To Do

### Step 1: Create `.claude/rules/agento-tools.md`

This rule forces Claude to use AgentO tools for ALL prompts:

```markdown
# AgentO Tools (Mandatory)

**ALWAYS use AgentO MCP tools for file operations:**

| Operation | Required Tool |
|-----------|---------------|
| Write files | `agento_write` |
| Read files | `agento_read` |
| Run commands | `agento_bash` |
| Run tests | `agento_test` |

## Rules

1. **NEVER** use built-in `Write` tool → use `agento_write`
2. **NEVER** use built-in `Read` tool → use `agento_read`
3. **NEVER** use built-in `Bash` tool → use `agento_bash`
```

### Step 2: Create `.agenticMemory/` directory with these files:

- `FUNCTIONS.md` - Function index
- `RULES.md` - Project rules  
- `ARCHITECTURE.md` - Project structure
- `DISCOVERY.md` - Exploration log
- `ATTEMPTS.md` - Failed actions log
- `ERRORS.md` - Known errors & solutions
- `VERSIONS.md` - Dependency versions
- `DATASTRUCTURE.md` - Data models
- `config.json` - Settings
- `LOOP_STATE.json` - Loop tracking

Use template content from the plugin's `templates/` folder.

### Step 3: Confirm initialization

Reply: "✅ AgentO initialized. Tool enforcement rule active."

## After Init

Just prompt normally — no `/agento` prefix needed:

```
"Build a login page"           # agento_write enforces rules
"Fix the auth bug"             # agento_read tracks discovery
"Run tests and fix failures"   # agento_test runs with retry
```

The `.claude/rules/agento-tools.md` ensures AgentO tools are used automatically.

## MCP Tools Available

| Tool | Purpose |
|------|---------|
| agento_write | Write files with rule enforcement |
| agento_read | Read files with tracking |
| agento_bash | Execute commands safely |
| agento_rules | Manage project rules |
| agento_functions | Query function index |
| agento_index | Index the codebase |
| agento_loop | Start iteration loops |
| agento_test | Run tests with retry |
| agento_config | View/edit configuration |

