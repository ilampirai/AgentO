/**
 * agento_write - Lean file writer with decision/flow protection
 * Enforces user rules, checks decision conflicts and flow impact,
 * writes the file, marks dirty for deferred indexing.
 * NO inline FUNCTIONS.md updates - that's handled by agento_index.
 */

import { memoryCache } from '../memory/cache.js';
import { writeProjectFile, appendMemoryFile } from '../memory/loader.js';
import { checkDecisionConflicts } from '../memory/decisions.js';
import { checkFlowImpact } from '../memory/flows.js';
import { resolveMemoryPath } from '../memory/resolver.js';
import type { WriteInput } from '../types.js';

export const writeToolDef = {
  name: 'agento_write',
  description: 'Write a file with AgentO enforcement. Checks rules, decision conflicts, and flow impact before writing. Use force:true to override conflicts.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      path: {
        type: 'string',
        description: 'File path to write to',
      },
      content: {
        type: 'string',
        description: 'Content to write',
      },
      force: {
        type: 'boolean',
        description: 'Force write even if conflicts detected (logs override)',
      },
    },
    required: ['path', 'content'],
  },
};

export async function handleWrite(args: unknown) {
  const input = args as WriteInput;
  const { path, content } = input;

  if (!path || content === undefined) {
    return {
      content: [{ type: 'text', text: '❌ Missing required parameters: path and content' }],
      isError: true,
    };
  }

  const violations: string[] = [];
  const warnings: string[] = [];
  const config = await memoryCache.getConfig();
  const lines = content.split('\n').length;

  // User-defined rules (line limits enforced via rules, not hardcoded)
  const rules = await memoryCache.getRules();
  for (const rule of rules) {
    if (!rule.enabled) continue;

    const filePatterns = rule.files.split(',').map(p => p.trim());
    const matchesFile = filePatterns.some(pattern => {
      if (pattern === '*') return true;
      const ext = pattern.replace('*', '');
      return path.endsWith(ext);
    });

    if (!matchesFile) continue;

    let violated = false;
    let message = '';

    switch (rule.pattern) {
      case 'no-inline-css':
        if (content.includes('<style') || content.includes('style="')) {
          violated = true;
          message = 'Found inline CSS';
        }
        break;
      case 'no-console':
        if (content.includes('console.log')) {
          violated = true;
          message = 'Found console.log';
        }
        break;
      case 'no-any':
        if (content.includes(': any') || content.includes(':any')) {
          violated = true;
          message = 'Found "any" type';
        }
        break;
      case 'max-lines': {
        const limitMatch = rule.pattern.match(/max-lines:(\d+)/);
        if (limitMatch) {
          const limit = parseInt(limitMatch[1], 10);
          if (lines > limit) {
            violated = true;
            message = `File exceeds ${limit} lines (has ${lines})`;
          }
        }
        break;
      }
      default:
        if (rule.pattern && content.includes(rule.pattern)) {
          violated = true;
          message = `Found forbidden pattern: ${rule.pattern}`;
        }
    }

    if (violated) {
      const msg = `[${rule.id}] ${rule.description}: ${message}`;
      if (rule.action === 'BLOCK') {
        violations.push(`⛔ ${msg}`);
      } else {
        warnings.push(`⚠️ ${msg}`);
      }
    }
  }

  // Block write if violations in strict mode
  if (violations.length > 0 && config.strictMode) {
    let response = `❌ WRITE BLOCKED\n${violations.join('\n')}`;
    if (warnings.length > 0) {
      response += `\n${warnings.slice(0, 3).join('\n')}`;
    }
    return { content: [{ type: 'text', text: response }], isError: true };
  }

  // Decision + flow conflict check (only if not forcing)
  if (!input.force) {
    try {
      const decisions = await memoryCache.getDecisions();
      const conflicts = checkDecisionConflicts(path, decisions);
      const flows = await memoryCache.getFlows();
      const impacted = checkFlowImpact(path, flows);

      if (conflicts.length > 0 || impacted.length > 0) {
        let report = '⚠️ CONFLICTS DETECTED — file not written.\n\n';
        if (conflicts.length) {
          report += '### Decisions referencing this file:\n';
          for (const d of conflicts) {
            report += `- ${d.id}: ${d.decision}\n`;
            if (d.alternatives.length) {
              report += `  Alternatives rejected: ${d.alternatives.map(a => a.option).join(', ')}\n`;
            }
          }
        }
        if (impacted.length) {
          report += '\n### Protected flows involving this file:\n';
          for (const f of impacted) {
            report += `- ${f.id}: ${f.name}\n  Steps: ${f.steps.join(' → ')}\n`;
          }
        }
        report += '\nTo proceed: re-call agento_write with force: true';
        return { content: [{ type: 'text', text: report }] };
      }
    } catch {
      // Graceful degradation — skip checks if memory files missing
    }
  }

  // If force=true, log override as observation
  if (input.force) {
    try {
      const timestamp = new Date().toISOString();
      await appendMemoryFile(
        resolveMemoryPath('ACTIVE_CONTEXT'),
        `\n- [${timestamp}] WRITE_OVERRIDE: Forced write to ${path}\n`
      );
    } catch { /* non-fatal */ }
  }

  // WRITE the file
  try {
    await writeProjectFile(path, content);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return {
      content: [{ type: 'text', text: `❌ Write failed: ${errorMsg}` }],
      isError: true,
    };
  }

  // Mark file as dirty for deferred indexing
  await memoryCache.markDirty(path);

  // Append richer summary to ACTIVE_CONTEXT.md
  if (config.memory?.autoContextOnWrite) {
    try {
      const firstLine = content.split('\n').find(l => l.trim() && !l.startsWith('//') && !l.startsWith('/*')) || '';
      const summary = `- Wrote ${path}: ${firstLine.trim().slice(0, 80)}`;
      await appendMemoryFile(resolveMemoryPath('ACTIVE_CONTEXT'), '\n' + summary + '\n');
    } catch { /* non-fatal */ }
  }

  // Build concise response
  let response = `✅ File written: ${path} (${lines} lines)`;

  if (warnings.length > 0) {
    const shown = warnings.slice(0, 3);
    response += `\n${shown.join('\n')}`;
    if (warnings.length > 3) {
      response += `\n... and ${warnings.length - 3} more warnings`;
    }
  }

  if (violations.length > 0) {
    response += `\n⚠️ ${violations.length} violation(s) (strict mode off)`;
  }

  return { content: [{ type: 'text', text: response }] };
}
