/**
 * Flow Protection System — parse, impact check, format, JSON index
 *
 * FLOWS.md format:
 *
 *   ## FLOW-001: Flow Name (2026-03-31)
 *   Description: What this flow does
 *   Steps: step1, step2, step3
 *   Files: file1.ts, file2.ts
 *   Last verified: 2026-03-15
 */

import type { FlowProtectionEntry } from '../types.js';
import { resolveMemoryPath } from './resolver.js';
import { readMemoryFile, writeMemoryFile } from './loader.js';

// ─── Parsing ────────────────────────────────────────────────────────────────

/**
 * Parse FLOWS.md content into structured FlowProtectionEntry[].
 * Splits on `## FLOW-###:` headers, extracts fields via regex.
 * Skips entries missing the required `Description:` field.
 */
export function parseFlowsMarkdown(content: string): FlowProtectionEntry[] {
  if (!content.trim()) return [];

  const entries: FlowProtectionEntry[] = [];

  const headerRegex = /^## (FLOW-\d+):\s*(.+?)\s*\((\d{4}-\d{2}-\d{2})\)/gm;
  const headers: Array<{ id: string; name: string; timestamp: string; index: number }> = [];
  let match: RegExpExecArray | null;

  while ((match = headerRegex.exec(content)) !== null) {
    headers.push({
      id: match[1],
      name: match[2],
      timestamp: match[3],
      index: match.index,
    });
  }

  for (let i = 0; i < headers.length; i++) {
    const header = headers[i];
    const start = header.index;
    const end = i + 1 < headers.length ? headers[i + 1].index : content.length;
    const section = content.slice(start, end);

    // Description is required
    const descMatch = section.match(/^Description:\s*(.+)$/m);
    if (!descMatch) continue;

    // Steps (comma-separated)
    const stepsMatch = section.match(/^Steps:\s*(.+)$/m);
    const steps = stepsMatch
      ? stepsMatch[1].split(',').map((s) => s.trim()).filter(Boolean)
      : [];

    // Files (comma-separated)
    const filesMatch = section.match(/^Files:\s*(.+)$/m);
    const files = filesMatch
      ? filesMatch[1].split(',').map((s) => s.trim()).filter(Boolean)
      : [];

    // Last verified (optional)
    const verifiedMatch = section.match(/^Last verified:\s*(.+)$/m);

    entries.push({
      id: header.id,
      name: header.name,
      description: descMatch[1].trim(),
      steps,
      files,
      ...(verifiedMatch ? { last_verified: verifiedMatch[1].trim() } : {}),
    });
  }

  return entries;
}

// ─── Impact checking ──────────────────────────────────────────────────────

/**
 * Normalize a file path to forward slashes for consistent matching.
 */
function normalizePath(p: string): string {
  return p.replace(/\\/g, '/');
}

/**
 * Check if a target file is referenced by any flow's files list.
 * Supports exact match and suffix match.
 * Normalizes Windows backslash paths to forward slashes.
 */
export function checkFlowImpact(
  targetFile: string,
  flows: FlowProtectionEntry[],
): FlowProtectionEntry[] {
  if (!flows.length) return [];

  const normalizedTarget = normalizePath(targetFile);

  return flows.filter((f) =>
    f.files.some((file) => {
      const normalizedFile = normalizePath(file);
      if (normalizedFile === normalizedTarget) return true;
      if (normalizedFile.endsWith('/' + normalizedTarget) || normalizedTarget.endsWith('/' + normalizedFile)) return true;
      if (!normalizedTarget.includes('/') && normalizedFile.endsWith('/' + normalizedTarget)) return true;
      return false;
    }),
  );
}

// ─── ID generation ──────────────────────────────────────────────────────────

/**
 * Get next flow ID by finding the max numeric part and incrementing.
 * Returns zero-padded ID like "FLOW-001", "FLOW-002", etc.
 */
export function getNextFlowId(flows: FlowProtectionEntry[]): string {
  if (!flows.length) return 'FLOW-001';

  let maxNum = 0;
  for (const f of flows) {
    const numMatch = f.id.match(/^FLOW-(\d+)$/);
    if (numMatch) {
      const num = parseInt(numMatch[1], 10);
      if (num > maxNum) maxNum = num;
    }
  }

  const next = maxNum + 1;
  return `FLOW-${String(next).padStart(3, '0')}`;
}

// ─── Formatting ─────────────────────────────────────────────────────────────

/**
 * Format a FlowProtectionEntry into markdown for FLOWS.md.
 */
export function formatFlowEntry(entry: FlowProtectionEntry): string {
  const lines: string[] = [];
  const timestamp = entry.last_verified || new Date().toISOString().slice(0, 10);

  lines.push(`## ${entry.id}: ${entry.name} (${timestamp})`);
  lines.push(`Description: ${entry.description}`);

  if (entry.steps.length) {
    lines.push(`Steps: ${entry.steps.join(', ')}`);
  }

  if (entry.files.length) {
    lines.push(`Files: ${entry.files.join(', ')}`);
  }

  if (entry.last_verified) {
    lines.push(`Last verified: ${entry.last_verified}`);
  }

  return lines.join('\n') + '\n';
}

// ─── JSON index ─────────────────────────────────────────────────────────────

/**
 * Write flows array as JSON to the FLOWS_INDEX shadow file.
 */
export async function writeFlowsIndex(flows: FlowProtectionEntry[]): Promise<void> {
  const indexPath = resolveMemoryPath('FLOWS_INDEX');
  await writeMemoryFile(indexPath, JSON.stringify(flows, null, 2));
}

// ─── Load (full pipeline) ───────────────────────────────────────────────────

/**
 * Read FLOWS.md, parse into entries, write JSON index, return entries.
 */
export async function loadFlows(): Promise<FlowProtectionEntry[]> {
  const mdPath = resolveMemoryPath('FLOWS');
  const content = await readMemoryFile(mdPath);
  const entries = parseFlowsMarkdown(content);
  await writeFlowsIndex(entries);
  return entries;
}
