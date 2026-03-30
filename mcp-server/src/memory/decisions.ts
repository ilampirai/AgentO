/**
 * Decision System — parse, conflict check, format, JSON index
 *
 * DECISIONS.md format:
 *
 *   ## D001: Short description (2026-03-31)
 *   Decision: What was decided
 *   Rejected: Alternative option
 *     Why rejected: Reason it was rejected
 *   Affected flows: FLOW-001, FLOW-002
 *   Affected files: tools/write.ts, memory/cache.ts
 *   Confidence: 9/10
 */

import type { DecisionEntry } from '../types.js';
import { resolveMemoryPath } from './resolver.js';
import { readMemoryFile, writeMemoryFile } from './loader.js';

// ─── Parsing ────────────────────────────────────────────────────────────────

/**
 * Parse DECISIONS.md content into structured DecisionEntry[].
 * Splits on `## D###:` headers, extracts fields via regex.
 * Skips entries missing the required `Decision:` field.
 */
export function parseDecisionsMarkdown(content: string): DecisionEntry[] {
  if (!content.trim()) return [];

  const entries: DecisionEntry[] = [];

  // Split on ## D###: headers — keep the header with each section
  const sectionRegex = /^## (D\d+):\s*(.+?)\s*\((\d{4}-\d{2}-\d{2})\)/gm;
  const headers: Array<{ id: string; description: string; timestamp: string; index: number }> = [];
  let match: RegExpExecArray | null;

  while ((match = sectionRegex.exec(content)) !== null) {
    headers.push({
      id: match[1],
      description: match[2],
      timestamp: match[3],
      index: match.index,
    });
  }

  for (let i = 0; i < headers.length; i++) {
    const header = headers[i];
    const start = header.index;
    const end = i + 1 < headers.length ? headers[i + 1].index : content.length;
    const section = content.slice(start, end);

    // Extract Decision: field (required)
    const decisionMatch = section.match(/^Decision:\s*(.+)$/m);
    if (!decisionMatch) continue; // skip malformed

    // Extract Rejected: / Why rejected: pairs
    const alternatives: Array<{ option: string; rejected_reason: string }> = [];
    const rejectedRegex = /^Rejected:\s*(.+)$/gm;
    const whyRegex = /^\s+Why rejected:\s*(.+)$/gm;
    const rejectedOptions: string[] = [];
    const rejectedReasons: string[] = [];

    let rm: RegExpExecArray | null;
    while ((rm = rejectedRegex.exec(section)) !== null) {
      rejectedOptions.push(rm[1].trim());
    }
    while ((rm = whyRegex.exec(section)) !== null) {
      rejectedReasons.push(rm[1].trim());
    }

    for (let j = 0; j < rejectedOptions.length; j++) {
      alternatives.push({
        option: rejectedOptions[j],
        rejected_reason: rejectedReasons[j] || '',
      });
    }

    // Extract Affected flows:
    const flowsMatch = section.match(/^Affected flows:\s*(.+)$/m);
    const affected_flows = flowsMatch
      ? flowsMatch[1].split(',').map((s) => s.trim()).filter(Boolean)
      : [];

    // Extract Affected files:
    const filesMatch = section.match(/^Affected files:\s*(.+)$/m);
    const affected_files = filesMatch
      ? filesMatch[1].split(',').map((s) => s.trim()).filter(Boolean)
      : [];

    // Extract Confidence: N/10
    const confMatch = section.match(/^Confidence:\s*(\d+)\/10$/m);
    const confidence = confMatch ? parseInt(confMatch[1], 10) : 5;

    // Extract optional Branch:
    const branchMatch = section.match(/^Branch:\s*(.+)$/m);

    // Extract optional Override of:
    const overrideMatch = section.match(/^Override of:\s*(.+)$/m);

    entries.push({
      id: header.id,
      timestamp: header.timestamp,
      decision: decisionMatch[1].trim(),
      alternatives,
      affected_flows,
      affected_files,
      confidence,
      ...(branchMatch ? { branch: branchMatch[1].trim() } : {}),
      ...(overrideMatch ? { override_of: overrideMatch[1].trim() } : {}),
    });
  }

  return entries;
}

// ─── Conflict checking ──────────────────────────────────────────────────────

/**
 * Normalize a file path to forward slashes for consistent matching.
 */
function normalizePath(p: string): string {
  return p.replace(/\\/g, '/');
}

/**
 * Check if a target file is referenced by any decision's affected_files.
 * Supports exact match and suffix match (e.g., "write.ts" matches "tools/write.ts").
 * Normalizes Windows backslash paths to forward slashes.
 */
export function checkDecisionConflicts(
  targetFile: string,
  decisions: DecisionEntry[],
): DecisionEntry[] {
  if (!decisions.length) return [];

  const normalizedTarget = normalizePath(targetFile);

  return decisions.filter((d) =>
    d.affected_files.some((af) => {
      const normalizedAf = normalizePath(af);
      // Exact match
      if (normalizedAf === normalizedTarget) return true;
      // Suffix match: target is a suffix of affected_file or vice versa
      if (normalizedAf.endsWith('/' + normalizedTarget) || normalizedTarget.endsWith('/' + normalizedAf)) return true;
      // Target without directory matches affected file's basename
      if (!normalizedTarget.includes('/') && normalizedAf.endsWith('/' + normalizedTarget)) return true;
      return false;
    }),
  );
}

// ─── ID generation ──────────────────────────────────────────────────────────

/**
 * Get next decision ID by finding the max numeric part and incrementing.
 * Returns zero-padded ID like "D001", "D002", etc.
 */
export function getNextDecisionId(decisions: DecisionEntry[]): string {
  if (!decisions.length) return 'D001';

  let maxNum = 0;
  for (const d of decisions) {
    const numMatch = d.id.match(/^D(\d+)$/);
    if (numMatch) {
      const num = parseInt(numMatch[1], 10);
      if (num > maxNum) maxNum = num;
    }
  }

  const next = maxNum + 1;
  return `D${String(next).padStart(3, '0')}`;
}

// ─── Formatting ─────────────────────────────────────────────────────────────

/**
 * Format a DecisionEntry into markdown for DECISIONS.md.
 */
export function formatDecisionEntry(entry: DecisionEntry): string {
  const lines: string[] = [];

  // Header: ## D001: description (timestamp)
  lines.push(`## ${entry.id}: ${entry.decision} (${entry.timestamp})`);
  lines.push(`Decision: ${entry.decision}`);

  // Alternatives
  for (const alt of entry.alternatives) {
    lines.push(`Rejected: ${alt.option}`);
    lines.push(`  Why rejected: ${alt.rejected_reason}`);
  }

  // Affected flows
  if (entry.affected_flows.length) {
    lines.push(`Affected flows: ${entry.affected_flows.join(', ')}`);
  }

  // Affected files
  if (entry.affected_files.length) {
    lines.push(`Affected files: ${entry.affected_files.join(', ')}`);
  }

  // Confidence
  lines.push(`Confidence: ${entry.confidence}/10`);

  // Optional fields
  if (entry.branch) {
    lines.push(`Branch: ${entry.branch}`);
  }
  if (entry.override_of) {
    lines.push(`Override of: ${entry.override_of}`);
  }

  return lines.join('\n') + '\n';
}

// ─── JSON index ─────────────────────────────────────────────────────────────

/**
 * Write decisions array as JSON to the DECISIONS_INDEX shadow file.
 */
export async function writeDecisionsIndex(decisions: DecisionEntry[]): Promise<void> {
  const indexPath = resolveMemoryPath('DECISIONS_INDEX');
  await writeMemoryFile(indexPath, JSON.stringify(decisions, null, 2));
}

// ─── Load (full pipeline) ───────────────────────────────────────────────────

/**
 * Read DECISIONS.md, parse into entries, write JSON index, return entries.
 */
export async function loadDecisions(): Promise<DecisionEntry[]> {
  const mdPath = resolveMemoryPath('DECISIONS');
  const content = await readMemoryFile(mdPath);
  const entries = parseDecisionsMarkdown(content);
  await writeDecisionsIndex(entries);
  return entries;
}
