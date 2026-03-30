/**
 * agento_decide — Decision tracking tool
 *
 * Actions:
 *   record  — Record a new decision with rationale and alternatives
 *   query   — Search decisions by keyword
 *   check   — Check a file for decision conflicts + flow impact
 *   list    — List recent decisions (optionally filtered)
 *   why     — Explain why a file/symbol has constraints
 */

import { memoryCache } from '../memory/cache.js';
import { readMemoryFile, appendMemoryFile } from '../memory/loader.js';
import { resolveMemoryPath } from '../memory/resolver.js';
import {
  parseDecisionsMarkdown,
  checkDecisionConflicts,
  getNextDecisionId,
  formatDecisionEntry,
  writeDecisionsIndex,
} from '../memory/decisions.js';
import { checkFlowImpact } from '../memory/flows.js';
import type { DecideInput, DecisionEntry } from '../types.js';

export const decideToolDef = {
  name: 'agento_decide',
  description: 'Track architectural decisions. Record decisions with rationale, query history, check conflicts, explain constraints.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      action: {
        type: 'string',
        enum: ['record', 'query', 'check', 'list', 'why'],
        description: 'Action: record a decision, query by keyword, check file conflicts, list recent, or explain why',
      },
      decision: {
        type: 'string',
        description: '[record] What was decided',
      },
      alternatives: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            option: { type: 'string' },
            rejected_reason: { type: 'string' },
          },
        },
        description: '[record] Rejected alternatives with reasons',
      },
      affected_flows: {
        type: 'array',
        items: { type: 'string' },
        description: '[record] Flow IDs affected (e.g., FLOW-001)',
      },
      affected_files: {
        type: 'array',
        items: { type: 'string' },
        description: '[record] File paths affected',
      },
      confidence: {
        type: 'number',
        description: '[record] Confidence 1-10 (default: 5)',
      },
      question: {
        type: 'string',
        description: '[query] Search keyword',
      },
      target_files: {
        type: 'array',
        items: { type: 'string' },
        description: '[check] Files to check for conflicts',
      },
      filter: {
        type: 'string',
        description: '[list] Filter by keyword',
      },
      limit: {
        type: 'number',
        description: '[list] Max results (default: 10)',
      },
      file: {
        type: 'string',
        description: '[why] File path to explain constraints for',
      },
      symbol: {
        type: 'string',
        description: '[why] Symbol name to explain constraints for',
      },
    },
    required: ['action'],
  },
};

export async function handleDecide(args: unknown) {
  const input = args as DecideInput;

  switch (input.action) {
    case 'record':
      return handleRecord(input);
    case 'query':
      return handleQuery(input);
    case 'check':
      return handleCheck(input);
    case 'list':
      return handleList(input);
    case 'why':
      return handleWhy(input);
    default:
      return {
        content: [{ type: 'text', text: `❌ Unknown action: ${input.action}. Use: record, query, check, list, why` }],
        isError: true,
      };
  }
}

// ─── Record ─────────────────────────────────────────────────────────────────

async function handleRecord(input: DecideInput) {
  if (!input.decision) {
    return {
      content: [{ type: 'text', text: '❌ Missing required field: decision' }],
      isError: true,
    };
  }

  const mdPath = resolveMemoryPath('DECISIONS');
  const content = await readMemoryFile(mdPath);
  const existing = parseDecisionsMarkdown(content);
  const id = getNextDecisionId(existing);

  const entry: DecisionEntry = {
    id,
    timestamp: new Date().toISOString().slice(0, 10),
    decision: input.decision,
    alternatives: input.alternatives || [],
    affected_flows: input.affected_flows || [],
    affected_files: input.affected_files || [],
    confidence: input.confidence ?? 5,
  };

  // Append to DECISIONS.md
  const formatted = formatDecisionEntry(entry);
  await appendMemoryFile(mdPath, '\n' + formatted);

  // Update JSON index
  existing.push(entry);
  await writeDecisionsIndex(existing);
  memoryCache.invalidateDecisions();

  return {
    content: [{ type: 'text', text: `✅ Decision recorded: ${id} — ${entry.decision}` }],
  };
}

// ─── Query ──────────────────────────────────────────────────────────────────

async function handleQuery(input: DecideInput) {
  if (!input.question) {
    return {
      content: [{ type: 'text', text: '❌ Missing required field: question' }],
      isError: true,
    };
  }

  const mdPath = resolveMemoryPath('DECISIONS');
  const content = await readMemoryFile(mdPath);
  const decisions = parseDecisionsMarkdown(content);
  const keyword = input.question.toLowerCase();

  const matches = decisions.filter(d =>
    d.decision.toLowerCase().includes(keyword) ||
    d.affected_files.some(f => f.toLowerCase().includes(keyword)) ||
    d.affected_flows.some(f => f.toLowerCase().includes(keyword)) ||
    d.alternatives.some(a => a.option.toLowerCase().includes(keyword))
  );

  if (!matches.length) {
    return {
      content: [{ type: 'text', text: `No decisions found matching "${input.question}"` }],
    };
  }

  const text = matches.map(d =>
    `**${d.id}** (${d.timestamp}): ${d.decision}\n  Files: ${d.affected_files.join(', ') || 'none'}\n  Confidence: ${d.confidence}/10`
  ).join('\n\n');

  return {
    content: [{ type: 'text', text: `Found ${matches.length} decision(s):\n\n${text}` }],
  };
}

// ─── Check ──────────────────────────────────────────────────────────────────

async function handleCheck(input: DecideInput) {
  if (!input.target_files?.length) {
    return {
      content: [{ type: 'text', text: '❌ Missing required field: target_files' }],
      isError: true,
    };
  }

  const decisions = await memoryCache.getDecisions();
  const flows = await memoryCache.getFlows();
  const results: string[] = [];

  for (const file of input.target_files) {
    const dConflicts = checkDecisionConflicts(file, decisions);
    const fImpact = checkFlowImpact(file, flows);

    if (dConflicts.length || fImpact.length) {
      results.push(`**${file}:**`);
      for (const d of dConflicts) {
        results.push(`  ⚠️ Decision ${d.id}: ${d.decision}`);
      }
      for (const f of fImpact) {
        results.push(`  🔒 Flow ${f.id}: ${f.name}`);
      }
    }
  }

  if (!results.length) {
    return {
      content: [{ type: 'text', text: `✅ No conflicts found for: ${input.target_files.join(', ')}` }],
    };
  }

  return {
    content: [{ type: 'text', text: `Conflicts detected:\n\n${results.join('\n')}` }],
  };
}

// ─── List ───────────────────────────────────────────────────────────────────

async function handleList(input: DecideInput) {
  const mdPath = resolveMemoryPath('DECISIONS');
  const content = await readMemoryFile(mdPath);
  const decisions = parseDecisionsMarkdown(content);
  const limit = input.limit ?? 10;

  let filtered = decisions;
  if (input.filter) {
    const keyword = input.filter.toLowerCase();
    filtered = decisions.filter(d =>
      d.decision.toLowerCase().includes(keyword) ||
      d.affected_files.some(f => f.toLowerCase().includes(keyword))
    );
  }

  const lastN = filtered.slice(-limit);

  if (!lastN.length) {
    return {
      content: [{ type: 'text', text: 'No decisions recorded yet.' }],
    };
  }

  const text = lastN.map(d =>
    `${d.id} (${d.timestamp}): ${d.decision} [${d.confidence}/10]`
  ).join('\n');

  return {
    content: [{ type: 'text', text: `Recent decisions (${lastN.length}/${decisions.length}):\n\n${text}` }],
  };
}

// ─── Why ────────────────────────────────────────────────────────────────────

async function handleWhy(input: DecideInput) {
  if (!input.file && !input.symbol) {
    return {
      content: [{ type: 'text', text: '❌ Provide file or symbol to explain constraints for' }],
      isError: true,
    };
  }

  const results: string[] = [];
  const searchTerm = (input.file || input.symbol || '').toLowerCase();

  // Search decisions
  const mdPath = resolveMemoryPath('DECISIONS');
  const dContent = await readMemoryFile(mdPath);
  const decisions = parseDecisionsMarkdown(dContent);

  const matchedDecisions = decisions.filter(d =>
    d.affected_files.some(f => f.toLowerCase().includes(searchTerm)) ||
    d.decision.toLowerCase().includes(searchTerm)
  );

  if (matchedDecisions.length) {
    results.push('### Decisions:');
    for (const d of matchedDecisions) {
      results.push(`- **${d.id}**: ${d.decision}`);
      for (const alt of d.alternatives) {
        results.push(`  - Rejected: ${alt.option} — ${alt.rejected_reason}`);
      }
    }
  }

  // Search principles
  const principles = await readMemoryFile(resolveMemoryPath('PRINCIPLES'));
  if (principles.trim()) {
    const lines = principles.split('\n');
    const matchedLines = lines.filter(l => l.toLowerCase().includes(searchTerm));
    if (matchedLines.length) {
      results.push('\n### Principles:');
      for (const line of matchedLines) {
        results.push(`- ${line.trim()}`);
      }
    }
  }

  // Search flows
  const flows = await memoryCache.getFlows();
  const matchedFlows = input.file
    ? checkFlowImpact(input.file, flows)
    : flows.filter(f => f.name.toLowerCase().includes(searchTerm));

  if (matchedFlows.length) {
    results.push('\n### Protected Flows:');
    for (const f of matchedFlows) {
      results.push(`- **${f.id}**: ${f.name} — ${f.description}`);
    }
  }

  if (!results.length) {
    return {
      content: [{ type: 'text', text: `No constraints found for "${input.file || input.symbol}"` }],
    };
  }

  return {
    content: [{ type: 'text', text: `Constraints for "${input.file || input.symbol}":\n\n${results.join('\n')}` }],
  };
}
