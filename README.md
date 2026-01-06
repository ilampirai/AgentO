# AgentO

**Multi-Agent Orchestrator for Claude Code**

A powerful plugin that brings intelligent multi-agent orchestration, persistent memory, and UI/UX design capabilities to your Claude Code workflow.

## Features

### Hierarchical Agent System

AgentO provides a top-level orchestrator that manages specialized sub-agents:

| Agent | Purpose |
|-------|---------|
| **Orchestrator** | Project-wide understanding, task routing, rule enforcement |
| **Coder (TS/JS)** | TypeScript and JavaScript development |
| **Coder (Python)** | Python development with PEP8 compliance |
| **Coder (PHP)** | PHP development with PSR standards |
| **Coder (General)** | Go, Rust, Java, C#, Ruby, and more |
| **Designer** | UI/UX, HTML/CSS/JS, web scraping |
| **Reviewer** | Code quality and security review |
| **Debugger** | Error diagnosis and solution documentation |
| **Tester** | Playwright browser automation and testing |
| **Indexer** | Background codebase scanning |

### Persistent Memory

Never lose project context:

- **ARCHITECTURE.md** - Compressed project structure
- **FUNCTIONS.md** - Index of all functions/classes (prevents duplicates!)
- **ERRORS.md** - Known errors and solutions
- **RULES.md** - Project rules all agents follow

### Code Quality Enforcement

Built-in rules that can't be bypassed:

- Maximum 500 lines per file
- No duplicate code
- Required error handling
- Custom rules you define

### Dynamic Agent Routing

Swap agents on the fly:

```
/AgentO:use coder-rust as coder
/AgentO:swap reviewer my-custom-reviewer
```

### Session Persistence

Grant permissions once, keep them across sessions:

```
/AgentO:session save
/AgentO:session restore
```

### Web Scraping & Templates

Build UIs by example:

```
/AgentO:design scrape https://stripe.com
/AgentO:design crawl https://example.com
/AgentO:design style material-design
```

## Installation

### From Marketplace

```
/plugin install AgentO@ilampirai
```

### From GitHub

```bash
git clone https://github.com/ilampirai/AgentO.git
```

Then in Claude Code:

```
claude --plugin-dir ./AgentO
```

## Quick Start

1. **Initialize AgentO** in your project:
   ```
   /AgentO:start
   ```

2. **Index your codebase**:
   ```
   /AgentO:index
   ```

3. **Start coding!** The orchestrator will:
   - Read your memory files for context
   - Route tasks to the right agents
   - Enforce code quality rules
   - Update memory as you work

## Commands

### Natural Language (Recommended)

Just describe what you want:

```
/AgentO fix the login button not working
/AgentO add a rule that all functions need error handling
/AgentO create a pricing card component like stripe
```

### Explicit Commands

| Command | Description |
|---------|-------------|
| `/AgentO <request>` | Natural language - just describe what you want |
| `/AgentO:fix <issue>` | Fix an issue using agents (debugger → coder → reviewer) |
| `/AgentO:start` | Initialize AgentO in a project |
| `/AgentO:index` | Scan codebase and update memory |
| `/AgentO:agents list` | Show available agents |
| `/AgentO:agents add <name>` | Create custom agent |
| `/AgentO:use <agent> as <role>` | Route role to agent |
| `/AgentO:swap <role> <agent>` | Quick swap agent |
| `/AgentO:rules list` | Show project rules |
| `/AgentO:rules add <rule>` | Add custom rule |
| `/AgentO:session status` | View session info |
| `/AgentO:session save` | Save session state |
| `/AgentO:design scrape <url>` | Scrape website template |
| `/AgentO:design crawl <url>` | Crawl entire site |
| `/AgentO:design style <name>` | Set active style guide |

### Fix Command Flow

When you run `/AgentO:fix`, the agents work together:

```
You describe the issue
        ↓
   Orchestrator (understands & routes)
        ↓
   Debugger (diagnoses root cause)
        ↓
   Coder (implements fix)
        ↓
   Reviewer (validates fix)
        ↓
   Documents solution in ERRORS.md
```

## Directory Structure

```
.agenticMemory/
├── agents/           # User-defined agents
├── templates/        # Scraped design templates
├── styles/           # Style guides
├── config.json       # Agent routing
├── ARCHITECTURE.md   # Project structure
├── FUNCTIONS.md      # Code index
├── ERRORS.md         # Error solutions
└── RULES.md          # Project rules
```

## Creating Custom Agents

Add agents to `.agenticMemory/agents/`:

```markdown
---
description: My custom agent description
capabilities:
  - capability 1
  - capability 2
---

# My Custom Agent

Instructions for the agent...
```

Then route to it:

```
/AgentO:use my-custom-agent as coder
```

## Requirements

- Claude Code CLI installed
- Node.js 18+ (for Playwright MCP)
- Playwright (for web scraping features)

## License

MIT

## Author

**ilampirai** - [GitHub](https://github.com/ilampirai)

---

Built with the [Claude Agent SDK](https://docs.claude.com/en/api/agent-sdk/overview)
