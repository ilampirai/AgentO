---
description: Route a role to a specific agent. Example: /AgentO:use coder-rust as coder
---

# Use Agent Command

Route a role to a different agent. This updates the agent routing configuration.

## Usage

```
/AgentO:use [agent-name] as [role]
```

## Arguments

`$ARGUMENTS` should contain: `[agent-name] as [role]`

Example: `coder-rust as coder`

## Process

1. **Parse arguments**: Extract agent name and target role
2. **Validate agent**: Check if agent exists in:
   - Built-in agents (agents/ directory)
   - User-defined agents (.agenticMemory/agents/)
3. **Update routing**: Modify `.agenticMemory/config.json`
4. **Confirm**: Report the routing change

## Implementation

When this command is invoked:

1. Read `.agenticMemory/config.json`
2. Parse `$ARGUMENTS` to extract:
   - `agentName`: The agent to use (e.g., "coder-rust")
   - `role`: The role to assign (e.g., "coder")
3. Update the routing configuration:
   ```json
   {
     "routing": {
       "[role]": "[agentName]"
     }
   }
   ```
4. Save the updated config
5. Report: "Now using [agentName] for [role] tasks"

## Examples

```
/AgentO:use coder-rust as coder
→ Now using coder-rust for coder tasks

/AgentO:use my-custom-reviewer as reviewer
→ Now using my-custom-reviewer for reviewer tasks

/AgentO:use coder-ts as coder
→ Now using coder-ts for coder tasks (reset to default)
```

## Error Handling

- If agent doesn't exist: "Agent '[name]' not found. Available agents: [list]"
- If role is invalid: "Invalid role '[role]'. Valid roles: coder, reviewer, debugger, tester, designer"
- If config is missing: Create default config first
