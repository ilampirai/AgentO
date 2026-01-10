# AgentO v2.0.0 - Enhancement Update

## Overview

This update brings powerful new capabilities inspired by oh-my-opencode and Ralph Wiggum plugins, including multi-source web search, LSP integration, git mastery, iterative loops, intelligent automation hooks, and **incremental memory building**.

## 🧠 Key Philosophy Change: Incremental Memory

**Old Way**: Require `/AgentO:index --full` before using
**New Way**: Memory builds as you work - no upfront index needed

### How It Works Now

**EVERY task follows this flow:**

```
User gives task → Detect keywords → Check DISCOVERY.md → Index if needed → Work
```

1. **First Task**: Orchestrator detects keywords, triggers indexer, builds memory
2. **Bug Fix**: Auto-detects area ("login" → auth), indexes if not in memory
3. **New Feature**: Indexes related areas before writing any code
4. **Full Index**: Optional, only when you want complete coverage

**Memory is built from the FIRST prompt - never work blind.**

### Focus Indexing

```bash
/AgentO:index --focus "login auth"     # Index just auth-related code
/AgentO:index --focus "cart checkout"  # Index just cart-related code
```

Keywords auto-expand: "login" → auth, signin, session, token, jwt, password

---

## 🆕 New MCP Servers

### Added to `.mcp.json`

| Server | Purpose | When to Use |
|--------|---------|-------------|
| **Exa** | AI-powered semantic web search | "How do I...", concept explanations, tutorials |
| **Context7** | Library documentation lookup | Official docs, API references, framework guides |
| **grep.app** | Search code across GitHub repos | Find real implementations, see how others solved X |
| **Playwright** | Browser automation & scraping | Live page data, design templates, testing |

### Configuration

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["@anthropic-ai/mcp-server-playwright@latest"],
      "env": { "PLAYWRIGHT_HEADLESS": "true" }
    },
    "exa": {
      "command": "npx", 
      "args": ["exa-mcp-server"],
      "env": { "EXA_API_KEY": "${EXA_API_KEY}" }
    },
    "context7": {
      "command": "npx",
      "args": ["@anthropic-ai/mcp-server-context7@latest"]
    }
  }
}
```

> **Note**: grep.app doesn't have official MCP - use Exa with site:grep.app or the web-search skill pattern.

---

## 🛠️ New Skills

### 1. Web Search Skill (`skills/web-search/`)

**Purpose**: Intelligent routing to the right search tool

**Decision Tree**:
```
User Query
    │
    ├─ "Official docs for X" ──────► Context7
    │
    ├─ "How do others implement X?" ► Exa (site:github.com) / grep.app
    │
    ├─ "Explain concept X" ─────────► Exa (semantic search)
    │
    ├─ "Scrape this specific page" ─► Playwright
    │
    └─ Complex query ───────────────► Parallel: Context7 + Exa
```

### 2. Git Master Skill (`skills/git-master/`)

**Purpose**: Advanced git workflows and best practices

**Capabilities**:
- Smart commit messages (conventional commits)
- Branch strategy recommendations
- Conflict resolution patterns
- Interactive rebase guidance
- Git hooks setup
- Monorepo patterns
- Cherry-pick and bisect workflows

### 3. LSP Tools Skill (`skills/lsp-tools/`)

**Purpose**: Leverage Language Server Protocol for code intelligence

**Operations**:
- Hover: Get type info and docs for any symbol
- References: Find all usages before refactoring
- Rename: Safe symbol renaming across files
- Definition: Jump to implementations
- Code Actions: Extract, auto-import, quick fixes

---

## 🔄 Ralph Wiggum Loop Feature

### New Command: `/AgentO:loop`

**Usage**:
```
/AgentO:loop "task description" --until "COMPLETION_MARKER" --max 10
```

**How it works**:
1. Executes task
2. Checks for completion marker in output
3. If not found and iterations < max, re-runs with context
4. Continues until success or max iterations

**Example**:
```
/AgentO:loop "Fix all TypeScript errors" --until "0 errors" --max 5
```

### Cancel Command: `/AgentO:cancel-loop`

Stops the current loop immediately.

---

## 🪝 New Hooks

### Comment Checker (PreToolUse → Write)
```
Before writing code:
- Verify functions have JSDoc/docstrings
- Check @param and @returns tags
- Warn if complex logic lacks comments
```

### Todo Enforcer (PostToolUse → Read)
```
After reading files:
- Scan for TODO/FIXME/HACK comments
- List found items with locations
- Track in session for end-of-session report
```

### Auto-Index (PostToolUse → Write|Edit)
```
After file modification:
- Extract new function signatures
- Parse imports for L1 dependencies  
- Update FUNCTIONS.md incrementally
- Flag files >500 lines
```

### Version Tracker (PostToolUse → Write)
```
When dependency files change:
- Detect package.json, requirements.txt, go.mod, etc.
- Log version changes to VERSIONS.md
- Alert on major version bumps
```

### Duplication Detection (PreToolUse → Write)
```
Before creating new code:
- Search FUNCTIONS.md for similar names
- Check for matching signatures
- Suggest reuse if duplicate found
```

### Keyword Activation (SessionStart + Notification)
```
Detect activation keywords:
- "ultrawork" / "deep work" → Focus mode (minimal output)
- "explain" → Verbose mode
- "quick" → Terse responses  
- "parallel" → Suggest background tasks
```

### Loop Control (Stop hook)
```
When loop active:
- Block session exit
- Re-issue task with updated context
- Track iteration count
- Check completion criteria
```

---

## 📁 New Memory Files

### VERSIONS.md

Track dependency versions across the project:

```markdown
# Dependency Versions

## JavaScript (package.json)
PKG:react@18.2.0 [package.json]
PKG:next@14.0.0 [package.json]

## Change Log
| Date | Package | From | To |
|------|---------|------|-----|
```

### DISCOVERY.md

Track what areas have been explored/indexed:

```markdown
# Discovery Tracking

AREA:authentication [coverage:80%] [last:2024-01-10]
  FILES: src/auth/login.ts, src/auth/session.ts
  FUNCTIONS: 15 indexed
  MODELS: User, Session, Token

AREA:cart [coverage:60%] [last:2024-01-09]
  FILES: src/cart/index.ts, src/cart/checkout.ts
  FUNCTIONS: 8 indexed
```

Benefits:
- Know what's indexed without reading full memory
- Identify gaps in coverage
- Avoid re-indexing same areas

---

## 🔧 Updated Files

| File | Changes |
|------|---------|
| `.mcp.json` | Added Exa, Context7 servers |
| `hooks/hooks.json` | Added 6 new hooks + incremental memory triggers |
| `.claude-plugin/plugin.json` | Version bump to 2.0.0, new keywords |
| `agents/orchestrator.md` | Incremental memory building, focus indexing |
| `agents/indexer.md` | Focused/keyword indexing support |
| `commands/index.md` | Added --focus option for keyword indexing |
| `skills/web-search/SKILL.md` | NEW - Search routing logic |
| `skills/git-master/SKILL.md` | NEW - Git workflows |
| `skills/lsp-tools/SKILL.md` | NEW - LSP operations |
| `commands/loop.md` | NEW - Ralph Wiggum loop |
| `commands/cancel-loop.md` | NEW - Cancel loop |
| `.agenticMemory/VERSIONS.md` | NEW - Version tracking |
| `.agenticMemory/DISCOVERY.md` | NEW - Exploration tracking |

---

## 🚀 Auto-Routing (Default Behavior)

After installation, AgentO activates automatically:
- **SessionStart hook** declares AgentO as the default orchestrator
- All prompts route through AgentO without `/AgentO:` prefix
- Smart agent selection based on task type
- Memory files consulted automatically

To disable: `/AgentO:auto off`

---

## 📋 Implementation Checklist

- [ ] Update `.mcp.json`
- [ ] Create `skills/web-search/SKILL.md`
- [ ] Create `skills/git-master/SKILL.md`  
- [ ] Create `skills/lsp-tools/SKILL.md`
- [ ] Create `commands/loop.md`
- [ ] Create `commands/cancel-loop.md`
- [ ] Update `hooks/hooks.json`
- [ ] Create `.agenticMemory/VERSIONS.md`
- [ ] Update `.claude-plugin/plugin.json` to v2.0.0

---

## 🔑 Environment Variables Required

```bash
# For Exa web search
EXA_API_KEY=your_exa_api_key

# Optional: for authenticated GitHub searches
GITHUB_TOKEN=your_github_token
```

---

## 🧪 Test Modes

Two testing modes available:

### Auto Mode (Default)
```
/AgentO:test login
```
- Runs Playwright tests automatically
- On failure: fixes and retests
- Loops until pass (max 3 attempts)
- Concise output

### Manual Mode
```
/AgentO:test --manual login
```
- Gives you test instructions
- Waits for your feedback
- You report pass/fail
- Fixes based on your report

---

## 📝 Concise Output Mode

**Default behavior: SHORT responses**

### What You See
```
📚 Indexing auth... ✓ 15 functions
🔧 Fixing login.ts:45 → Coder-ts
✓ Done. Login fixed.
```

### 5-Minute Updates (Long Tasks)
```
⏱️ Update (5 min)
   📍 Working: Cart checkout
   🤖 Agent: Coder-ts
   📊 Progress: 3/5 files
   ❓ Need Stripe MCP? (y/n)
```

### When to Get Details
- Say "explain" for verbose mode
- Say "summary" for full report
- Otherwise: bullet points only

---

*Generated: 2026-01-11*
*AgentO v2.0.0 Enhancement Plan*

