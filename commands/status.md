---
description: Show AgentO v6.0 status. Overview of memory layers, configuration, decisions, flows, and health metrics.
---

# /agento:status

Show AgentO status and memory health.

## Usage

```
/agento:status
```

## What It Shows

Runs `agento_config { action: "status" }` which reports:

- **Configuration** — strict mode, auto-index, deferred index
- **Functions Index** — total functions, files indexed
- **Rules** — total rules, enabled count
- **Discovery** — areas explored
- **Attempts** — logged failures, blocked patterns
- **Memory Health** (v6.0):
  - Decision count
  - Protected flow count
  - Working memory token usage (vs budget)
  - Dirty files pending index
  - Layered structure completeness (soul/core/working/surface)
- **Memory Files** — existence check for all layer files

## Use Cases

- Verify AgentO is initialized
- Check if migration to layered structure is needed
- Monitor memory token usage
- See if compaction is needed
- Troubleshoot missing files
