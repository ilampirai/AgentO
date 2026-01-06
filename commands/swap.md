---
description: Quick swap current agent for a role. Example: /AgentO:swap coder coder-py
---

# Swap Agent Command

Quickly swap the current agent for a role with another agent.

## Usage

```
/AgentO:swap [role] [new-agent]
```

## Arguments

`$ARGUMENTS` should contain: `[role] [new-agent]`

Example: `coder coder-py`

## Process

1. **Parse arguments**: Extract role and new agent
2. **Show current**: Display current agent for the role
3. **Validate**: Check new agent exists
4. **Swap**: Update `.agenticMemory/config.json`
5. **Confirm**: Report the swap

## Implementation

When this command is invoked:

1. Parse `$ARGUMENTS` to extract:
   - `role`: The role to update (e.g., "coder")
   - `newAgent`: The replacement agent (e.g., "coder-py")
2. Read current routing from `.agenticMemory/config.json`
3. Store the old agent name for reporting
4. Update the routing:
   ```json
   {
     "routing": {
       "[role]": "[newAgent]"
     }
   }
   ```
5. Report: "Swapped [role]: [oldAgent] → [newAgent]"

## Examples

```
/AgentO:swap coder coder-py
→ Swapped coder: coder-ts → coder-py

/AgentO:swap designer my-designer
→ Swapped designer: designer → my-designer
```

## Difference from /use

- `/use` is declarative: "use X as Y"
- `/swap` is imperative: "swap Y with X"

Both achieve the same result, choose based on preference.

## Error Handling

- If role doesn't exist: "Role '[role]' not found in routing"
- If agent doesn't exist: "Agent '[agent]' not found"
- Invalid syntax: "Usage: /AgentO:swap [role] [new-agent]"
