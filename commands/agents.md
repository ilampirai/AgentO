---
description: Manage agents - list, add, remove, or view details. Example: /AgentO:agents list
---

# Agents Management Command

List, add, remove, or view agent details.

## Usage

```
/AgentO:agents [action] [args]
```

## Actions

### list
Show all available agents and current routing.

```
/AgentO:agents list
```

Output:
```
## Available Agents

### Built-in
- orchestrator (active: orchestrator)
- coder-ts (active: coder)
- coder-py
- coder-php
- coder-general
- designer (active: designer)
- reviewer (active: reviewer)
- debugger (active: debugger)
- tester (active: tester)
- indexer

### User-Defined
- coder-rust (.agenticMemory/agents/coder-rust.md)
- my-reviewer (.agenticMemory/agents/my-reviewer.md)

### Current Routing
| Role | Agent |
|------|-------|
| coder | coder-ts |
| designer | designer |
| reviewer | reviewer |
| debugger | debugger |
| tester | tester |
```

### add
Create a new user-defined agent.

```
/AgentO:agents add [name]
```

Creates `.agenticMemory/agents/[name].md` with a template:

```markdown
---
description: [Your agent description]
capabilities:
  - [capability 1]
  - [capability 2]
---

# [Agent Name]

[Your agent instructions here]

## Before Acting
1. Check FUNCTIONS.md for existing code
2. Check RULES.md for constraints
3. Check ARCHITECTURE.md for context

## Your Specialty
[Describe what this agent does best]

## Output Format
[Describe expected output]
```

### remove
Delete a user-defined agent.

```
/AgentO:agents remove [name]
```

- Only removes from `.agenticMemory/agents/`
- Cannot remove built-in agents
- Updates routing if agent was active

### info
Show detailed information about an agent.

```
/AgentO:agents info [name]
```

Output:
```
## Agent: coder-ts

**Type**: Built-in
**Location**: agents/coder-ts.md
**Active for**: coder

### Description
TypeScript and JavaScript specialist...

### Capabilities
- TypeScript with strict typing
- JavaScript ES6+ patterns
- React/Vue/Angular components
```

## Implementation

Based on `$ARGUMENTS`:

1. **Parse action**: First word is the action
2. **Parse args**: Remaining words are arguments
3. **Execute**:
   - `list`: Read agents/ and .agenticMemory/agents/, show routing
   - `add [name]`: Create template file
   - `remove [name]`: Delete file, update routing
   - `info [name]`: Read and display agent details

## Error Handling

- Unknown action: "Unknown action. Use: list, add, remove, info"
- Agent not found: "Agent '[name]' not found"
- Cannot remove built-in: "Cannot remove built-in agent '[name]'"
- Agent already exists: "Agent '[name]' already exists"
