/**
 * agento_write - Lean file writer
 * Enforces user rules, writes the file, marks dirty for deferred indexing.
 * NO inline FUNCTIONS.md updates - that's handled by agento_index.
 */

import { memoryCache } from '../memory/cache.js';
import { writeProjectFile } from '../memory/loader.js';
import type { WriteInput } from '../types.js';

export const writeToolDef = {
  name: 'agento_write',
  description: 'Write a file with AgentO enforcement. Checks rules, line limits, duplicates before writing. Auto-updates FUNCTIONS.md after write.',
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

  // PRE-CHECK 1: Line count (only if lineLimit > 0)
  if (config.lineLimit > 0 && lines > config.lineLimit) {
    violations.push(
      `⛔ LINE LIMIT: ${lines} lines (max ${config.lineLimit}). Split into smaller modules.`
    );
  }

  // PRE-CHECK 2: User-defined rules
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
      case 'max-lines':
        break; // Handled by lineLimit config
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
