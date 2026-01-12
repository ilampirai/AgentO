---
description: Initialize AgentO in a project. Creates .agenticMemory folder with all memory files and registers the MCP server.
---

# /agento:init

Initialize AgentO in your project.

## Usage

```
/agento:init
```

## Prerequisites

Add to your project's `.mcp.json`:

```json
{
  "mcpServers": {
    "agento": {
      "command": "npx",
      "args": ["-y", "@ilampirai/agento-mcp"]
    }
  }
}
```

## What It Does

1. Creates `.agenticMemory/` directory
2. Initializes all memory files:
   - FUNCTIONS.md - Function index
   - RULES.md - Project rules
   - ARCHITECTURE.md - Project structure
   - DISCOVERY.md - Exploration log
   - ATTEMPTS.md - Failed actions log
   - ERRORS.md - Known errors & solutions
   - VERSIONS.md - Dependency versions
   - DATASTRUCTURE.md - Data models
   - config.json - Settings
   - LOOP_STATE.json - Loop tracking
3. Registers AgentO MCP server

## After Init

Just prompt normally. AgentO MCP tools enforce rules automatically.

```
"Build a login page"           # agento_write enforces rules
"Fix the auth bug"             # agento_read tracks discovery
"Run tests and fix failures"   # agento_test runs with retry
```

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

