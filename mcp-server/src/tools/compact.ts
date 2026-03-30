/**
 * agento_compact — Memory compaction tool
 *
 * Actions:
 *   analyze  — Scan working layer for stale observations
 *   propose  — Generate a compaction proposal (promotions + archives)
 *   approve  — Execute an approved proposal
 *   reject   — Reject a proposal with reason
 *   status   — Show token estimates, staleness, pending proposals
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { readMemoryFile, writeMemoryFile, appendMemoryFile } from '../memory/loader.js';
import { resolveMemoryPath } from '../memory/resolver.js';
import { memoryCache } from '../memory/cache.js';
import type { CompactInput } from '../types.js';

const ARCHIVE_DIR = '.agenticMemory/.archive';

interface CompactionProposal {
  id: string;
  created: string;
  promotions: Array<{ content: string; from: string; to: string; reason: string }>;
  archives: Array<{ content: string; from: string; reason: string }>;
  estimatedTokensSaved: number;
}

// In-memory proposal store (one active proposal at a time)
let activeProposal: CompactionProposal | null = null;

export const compactToolDef = {
  name: 'agento_compact',
  description: 'Memory compaction — analyze stale observations, propose promotions/archives, approve or reject. Keeps memory lean.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      action: {
        type: 'string',
        enum: ['analyze', 'propose', 'approve', 'reject', 'status'],
        description: 'Action: analyze staleness, propose compaction, approve/reject proposal, or show status',
      },
      proposal_id: {
        type: 'string',
        description: '[approve/reject] ID of proposal to act on',
      },
      reject_reason: {
        type: 'string',
        description: '[reject] Reason for rejecting the proposal',
      },
    },
    required: ['action'],
  },
};

export async function handleCompact(args: unknown) {
  const input = args as CompactInput;

  switch (input.action) {
    case 'analyze':
      return handleAnalyze();
    case 'propose':
      return handlePropose();
    case 'approve':
      return handleApprove(input);
    case 'reject':
      return handleReject(input);
    case 'status':
      return handleStatus();
    default:
      return {
        content: [{ type: 'text', text: `❌ Unknown action: ${input.action}. Use: analyze, propose, approve, reject, status` }],
        isError: true,
      };
  }
}

// ─── Analyze ────────────────────────────────────────────────────────────────

async function handleAnalyze() {
  const config = await memoryCache.getConfig();
  const ttlDays = config.memory?.compactionTTLDays ?? 14;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - ttlDays);

  const context = await readMemoryFile(resolveMemoryPath('ACTIVE_CONTEXT'));
  const discovery = await readMemoryFile(resolveMemoryPath('DISCOVERY'));
  const attempts = await readMemoryFile(resolveMemoryPath('ATTEMPTS'));

  const staleObservations = countStaleEntries(context, cutoff);
  const staleDiscoveries = countStaleEntries(discovery, cutoff);
  const staleAttempts = countStaleEntries(attempts, cutoff);

  const totalStale = staleObservations + staleDiscoveries + staleAttempts;
  const contextTokens = estimateTokens(context);
  const discoveryTokens = estimateTokens(discovery);
  const attemptsTokens = estimateTokens(attempts);
  const totalTokens = contextTokens + discoveryTokens + attemptsTokens;

  const tokenBudget = config.memory?.tokenBudgetWarn ?? 8000;
  const overBudget = totalTokens > tokenBudget;

  let text = `## Memory Analysis\n\n`;
  text += `| Layer | Tokens | Stale entries |\n`;
  text += `|-------|--------|---------------|\n`;
  text += `| ACTIVE_CONTEXT | ~${contextTokens} | ${staleObservations} |\n`;
  text += `| DISCOVERY | ~${discoveryTokens} | ${staleDiscoveries} |\n`;
  text += `| ATTEMPTS | ~${attemptsTokens} | ${staleAttempts} |\n`;
  text += `| **Total** | **~${totalTokens}** | **${totalStale}** |\n\n`;
  text += `Token budget: ${tokenBudget} ${overBudget ? '⚠️ OVER BUDGET' : '✅ within budget'}\n`;
  text += `Compaction TTL: ${ttlDays} days\n`;

  if (totalStale > 0) {
    text += `\n💡 Run \`agento_compact { action: "propose" }\` to generate a compaction proposal.`;
  } else {
    text += `\n✅ No stale entries. Memory is lean.`;
  }

  return { content: [{ type: 'text', text }] };
}

// ─── Propose ────────────────────────────────────────────────────────────────

async function handlePropose() {
  const config = await memoryCache.getConfig();
  const ttlDays = config.memory?.compactionTTLDays ?? 14;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - ttlDays);

  const context = await readMemoryFile(resolveMemoryPath('ACTIVE_CONTEXT'));
  const staleLines = extractStaleLines(context, cutoff);

  if (!staleLines.length) {
    return {
      content: [{ type: 'text', text: '✅ No stale entries to compact.' }],
    };
  }

  // Categorize: things that look like decisions → promote to core
  // Everything else → archive
  const promotions: CompactionProposal['promotions'] = [];
  const archives: CompactionProposal['archives'] = [];

  for (const line of staleLines) {
    if (line.includes('WRITE_OVERRIDE') || line.includes('REPEATED_DECISION')) {
      promotions.push({
        content: line,
        from: 'working/ACTIVE_CONTEXT.md',
        to: 'core/DECISIONS.md',
        reason: 'Override/decision pattern — promote to decisions log',
      });
    } else {
      archives.push({
        content: line,
        from: 'working/ACTIVE_CONTEXT.md',
        reason: `Older than ${ttlDays} days`,
      });
    }
  }

  const proposalId = `CP-${Date.now().toString(36)}`;
  const estimatedTokensSaved = staleLines.reduce((sum, l) => sum + estimateTokens(l), 0);

  activeProposal = {
    id: proposalId,
    created: new Date().toISOString(),
    promotions,
    archives,
    estimatedTokensSaved,
  };

  let text = `## Compaction Proposal: ${proposalId}\n\n`;
  if (promotions.length) {
    text += `### Promote to core (${promotions.length}):\n`;
    for (const p of promotions) {
      text += `- ${p.content.slice(0, 80)}... → ${p.to}\n`;
    }
  }
  if (archives.length) {
    text += `\n### Archive (${archives.length}):\n`;
    for (const a of archives) {
      text += `- ${a.content.slice(0, 80)}...\n`;
    }
  }
  text += `\nEstimated tokens saved: ~${estimatedTokensSaved}\n`;
  text += `\nRun \`agento_compact { action: "approve", proposal_id: "${proposalId}" }\` to execute.`;

  return { content: [{ type: 'text', text }] };
}

// ─── Approve ────────────────────────────────────────────────────────────────

async function handleApprove(input: CompactInput) {
  if (!activeProposal) {
    return {
      content: [{ type: 'text', text: '❌ No active proposal. Run propose first.' }],
      isError: true,
    };
  }

  if (input.proposal_id && input.proposal_id !== activeProposal.id) {
    return {
      content: [{ type: 'text', text: `❌ Proposal ${input.proposal_id} not found. Active: ${activeProposal.id}` }],
      isError: true,
    };
  }

  const timestamp = new Date().toISOString().slice(0, 10);
  let promoted = 0;
  let archived = 0;

  // Execute promotions
  for (const p of activeProposal.promotions) {
    try {
      const targetPath = resolveMemoryPath('DECISIONS');
      await appendMemoryFile(targetPath, `\n<!-- Promoted from ${p.from} on ${timestamp} -->\n${p.content}\n`);
      promoted++;
    } catch { /* non-fatal */ }
  }

  // Archive stale entries
  await fs.mkdir(ARCHIVE_DIR, { recursive: true });
  const archiveFile = path.join(ARCHIVE_DIR, `${timestamp}.md`);
  const archiveContent = activeProposal.archives.map(a => a.content).join('\n');
  try {
    await fs.appendFile(archiveFile, `\n## Archived ${timestamp}\n${archiveContent}\n`, 'utf-8');
    archived = activeProposal.archives.length;
  } catch { /* non-fatal */ }

  // Remove compacted lines from ACTIVE_CONTEXT
  const allCompacted = [
    ...activeProposal.promotions.map(p => p.content),
    ...activeProposal.archives.map(a => a.content),
  ];
  const context = await readMemoryFile(resolveMemoryPath('ACTIVE_CONTEXT'));
  const cleaned = context.split('\n')
    .filter(line => !allCompacted.some(c => line.includes(c.trim())))
    .join('\n');
  await writeMemoryFile(resolveMemoryPath('ACTIVE_CONTEXT'), cleaned);

  const proposalId = activeProposal.id;
  activeProposal = null;
  memoryCache.invalidateDecisions();

  return {
    content: [{
      type: 'text',
      text: `✅ Proposal ${proposalId} executed: ${promoted} promoted, ${archived} archived, ~${allCompacted.length} lines removed from ACTIVE_CONTEXT`,
    }],
  };
}

// ─── Reject ─────────────────────────────────────────────────────────────────

async function handleReject(input: CompactInput) {
  if (!activeProposal) {
    return {
      content: [{ type: 'text', text: '❌ No active proposal to reject.' }],
      isError: true,
    };
  }

  const proposalId = activeProposal.id;
  const reason = input.reject_reason || 'No reason given';
  activeProposal = null;

  return {
    content: [{ type: 'text', text: `Proposal ${proposalId} rejected. Reason: ${reason}` }],
  };
}

// ─── Status ─────────────────────────────────────────────────────────────────

async function handleStatus() {
  const layers = ['IDENTITY', 'PRINCIPLES', 'ARCHITECTURE', 'DECISIONS', 'FLOWS',
    'ACTIVE_CONTEXT', 'DISCOVERY', 'ATTEMPTS', 'FUNCTIONS', 'DATASTRUCTURE',
    'PROJECT_MAP', 'RULES'] as const;

  let text = '## Memory Status\n\n| File | Tokens | Last Modified |\n|------|--------|---------------|\n';

  for (const key of layers) {
    try {
      const filePath = resolveMemoryPath(key);
      const content = await readMemoryFile(filePath);
      const tokens = estimateTokens(content);
      const stat = await fs.stat(filePath).catch(() => null);
      const modified = stat ? stat.mtime.toISOString().slice(0, 10) : 'n/a';
      text += `| ${key} | ~${tokens} | ${modified} |\n`;
    } catch {
      text += `| ${key} | - | missing |\n`;
    }
  }

  if (activeProposal) {
    text += `\n**Pending proposal:** ${activeProposal.id} (${activeProposal.promotions.length} promotions, ${activeProposal.archives.length} archives)`;
  }

  return { content: [{ type: 'text', text }] };
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Rough token estimate: ~4 chars per token.
 */
function estimateTokens(content: string): number {
  return Math.ceil(content.length / 4);
}

/**
 * Count lines with timestamps older than cutoff.
 */
function countStaleEntries(content: string, cutoff: Date): number {
  if (!content) return 0;
  let count = 0;
  const lines = content.split('\n');
  for (const line of lines) {
    const dateMatch = line.match(/\[(\d{4}-\d{2}-\d{2}T[\d:.Z+-]+)\]/);
    if (dateMatch) {
      const entryDate = new Date(dateMatch[1]);
      if (entryDate < cutoff) count++;
    }
  }
  return count;
}

/**
 * Extract lines with timestamps older than cutoff.
 */
function extractStaleLines(content: string, cutoff: Date): string[] {
  if (!content) return [];
  const stale: string[] = [];
  const lines = content.split('\n');
  for (const line of lines) {
    const dateMatch = line.match(/\[(\d{4}-\d{2}-\d{2}T[\d:.Z+-]+)\]/);
    if (dateMatch) {
      const entryDate = new Date(dateMatch[1]);
      if (entryDate < cutoff) stale.push(line.trim());
    }
  }
  return stale;
}
