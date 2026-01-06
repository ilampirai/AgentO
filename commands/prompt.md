---
description: Natural language interface to AgentO. Just describe what you want and the orchestrator will handle it. Example: /AgentO add a rule that all functions need error handling
---

# AgentO Prompt Command

The main entry point for natural language interaction with AgentO. Just describe what you want.

## Usage

```
/AgentO [natural language request]
```

## What You Can Do

### Add Rules (Natural Language)

Instead of `/AgentO:rules add`, just say:

```
/AgentO add a rule that all API calls must have error handling
/AgentO add rule: no inline styles in React components
/AgentO new rule - all functions must have return types
```

The orchestrator understands and updates RULES.md.

### Request Fixes

Instead of `/AgentO:fix`, just describe the problem:

```
/AgentO the submit button doesn't work
/AgentO fix the TypeError in checkout.ts
/AgentO users are getting 404 errors on the dashboard
```

### Manage Agents

```
/AgentO switch to python coder
/AgentO use my-custom-agent for code review
/AgentO list all available agents
```

### Design Requests

```
/AgentO build a login page like stripe.com
/AgentO scrape the template from https://example.com
/AgentO design a pricing card component
```

### Code Requests

```
/AgentO write a function to validate email addresses
/AgentO create a new API endpoint for user profiles
/AgentO refactor the authentication module
```

### Project Management

```
/AgentO index the codebase
/AgentO show me the project structure
/AgentO what functions exist for handling payments?
```

## How It Works

1. **You speak naturally** - No need to remember specific subcommands
2. **Orchestrator interprets** - Understands your intent
3. **Routes to right agent** - Delegates to specialized agents
4. **Executes the task** - Gets it done
5. **Reports back** - Tells you what happened

## Examples

### Adding Rules

```
User: /AgentO add a rule that components should be under 200 lines
Orchestrator: Added rule [USR003]: Components should be under 200 lines
              Updated .agenticMemory/RULES.md
```

### Fixing Issues

```
User: /AgentO the dark mode toggle isn't saving
Orchestrator: Routing to debugger...
Debugger: Found issue - localStorage key mismatch in settings.ts:45
Orchestrator: Routing to coder-ts...
Coder: Fixed key from 'darkmode' to 'dark-mode' to match reader
Reviewer: Fix verified, no side effects
Orchestrator: Issue fixed! Changes in settings.ts:45
```

### Design Requests

```
User: /AgentO create a card component styled like tailwindui
Orchestrator: Routing to designer...
Designer: Created Card.tsx with Tailwind classes
          Created Card.stories.tsx for Storybook
          Components follow active style guide
```

## When to Use Subcommands vs Natural Language

| Use Subcommand | Use Natural Language |
|----------------|---------------------|
| `/AgentO:rules list` - exact listing | `/AgentO what rules do we have?` |
| `/AgentO:agents add my-agent` - specific action | `/AgentO I need a new agent for testing` |
| `/AgentO:index --force` - with flags | `/AgentO rescan everything` |
| `/AgentO:session clear` - system action | N/A (use subcommand for session) |

Both approaches work! Subcommands are precise, natural language is flexible.

## The Orchestrator Understands

- Imperative: "fix the bug", "add a rule", "create a component"
- Questions: "what agents are available?", "how many functions do we have?"
- Descriptions: "the button is broken", "users are seeing errors"
- References: "like stripe", "similar to the header", "using material design"
