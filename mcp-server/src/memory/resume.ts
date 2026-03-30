/**
 * Session Resume System — briefing, snapshot, branch context
 *
 * Provides session lifecycle management:
 * - loadSessionBriefing(): Generate a compact briefing from all memory layers
 * - snapshotSession(): Save current working state before session ends
 * - switchBranch(): Save/load branch-specific context
 * - detectBranch(): Get current git branch name
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { resolveMemoryPath, LAYER_DIRS } from './resolver.js';
import { readMemoryFile, writeMemoryFile, memoryFileExists } from './loader.js';
import { parseDecisionsMarkdown, formatDecisionEntry } from './decisions.js';
import { parseFlowsMarkdown } from './flows.js';
import { memoryCache } from './cache.js';
import type { BranchContext } from '../types.js';

const execAsync = promisify(exec);

const BRANCH_CONTEXT_DIR = '.agenticMemory/.branch-context';

// ─── Branch detection ───────────────────────────────────────────────────────

/**
 * Detect the current git branch name.
 * Returns "default" if git is unavailable or HEAD is detached.
 */
export async function detectBranch(): Promise<string> {
  try {
    const { stdout } = await execAsync('git rev-parse --abbrev-ref HEAD', { timeout: 5000 });
    const branch = stdout.trim();
    if (!branch || branch === 'HEAD') return 'default';
    return branch;
  } catch {
    return 'default';
  }
}

// ─── Session Briefing ───────────────────────────────────────────────────────

/**
 * Safe file read — returns empty string on error.
 */
async function safeRead(filePath: string): Promise<string> {
  try {
    return await readMemoryFile(filePath);
  } catch {
    return '';
  }
}

/**
 * Count observations in ACTIVE_CONTEXT.md content.
 * Observations are lines starting with "- " in the "## Observations" section,
 * or any line starting with a timestamp pattern like "[2026-".
 */
export function countObservations(content: string): number {
  if (!content) return 0;
  const lines = content.split('\n');
  let count = 0;
  let inObservations = false;

  for (const line of lines) {
    if (line.startsWith('## Observations') || line.startsWith('## Recent')) {
      inObservations = true;
      continue;
    }
    if (line.startsWith('## ') && inObservations) {
      inObservations = false;
    }
    if (inObservations && line.trim().startsWith('- ')) {
      count++;
    }
  }
  return count;
}

/**
 * Generate a session briefing from all memory layers.
 * Used at session start to bring the AI up to speed.
 */
export async function loadSessionBriefing(): Promise<string> {
  const parts: string[] = [];
  const branch = await detectBranch();

  // ── Soul layer (always load) ────────────────────────────────────────────
  const identity = await safeRead(resolveMemoryPath('IDENTITY'));
  if (identity.trim()) parts.push('## Project Identity\n' + identity.trim());

  const principles = await safeRead(resolveMemoryPath('PRINCIPLES'));
  if (principles.trim()) parts.push('## Principles\n' + principles.trim());

  // ── Core layer (always load) ────────────────────────────────────────────
  const decisions = await safeRead(resolveMemoryPath('DECISIONS'));
  if (decisions.trim()) {
    const entries = parseDecisionsMarkdown(decisions);
    const config = await memoryCache.getConfig();
    const maxLoad = config.memory?.maxDecisionsLoaded ?? 10;
    const lastN = entries.slice(-maxLoad);
    if (lastN.length) {
      parts.push('## Recent Decisions\n' + lastN.map(formatDecisionEntry).join('\n'));
    }
  }

  const flows = await safeRead(resolveMemoryPath('FLOWS'));
  if (flows.trim()) {
    parts.push('## Protected Flows\n' + flows.trim());
  }

  // ── Working layer (always load) ─────────────────────────────────────────
  const context = await safeRead(resolveMemoryPath('ACTIVE_CONTEXT'));
  if (context.trim()) {
    parts.push('## Active Context\n' + context.trim());

    // Compact nudge
    const obsCount = countObservations(context);
    if (obsCount > 10) {
      parts.push(
        `\n⚡ You have ${obsCount} unreviewed observations. ` +
        'Run: agento_compact { action: "analyze" } to review.'
      );
    }
  }

  // ── Branch context ──────────────────────────────────────────────────────
  const branchCtx = await loadBranchContext(branch);
  if (branchCtx) {
    const ctxLines = [
      `## Branch: ${branch}`,
      `Working on: ${branchCtx.active_context.working_on}`,
    ];
    if (branchCtx.active_context.recent_changes.length) {
      ctxLines.push('Recent changes:');
      for (const c of branchCtx.active_context.recent_changes) {
        ctxLines.push(`  - ${c}`);
      }
    }
    if (branchCtx.active_context.open_questions.length) {
      ctxLines.push('Open questions:');
      for (const q of branchCtx.active_context.open_questions) {
        ctxLines.push(`  - ${q}`);
      }
    }
    parts.push(ctxLines.join('\n'));
  }

  if (!parts.length) {
    return 'No memory found. Run agento_memory { action: "init" } to initialize, or agento_memory { action: "migrate" } to migrate from flat layout.';
  }

  return parts.join('\n\n---\n\n');
}

// ─── Session Snapshot ───────────────────────────────────────────────────────

/**
 * Snapshot current session state into ACTIVE_CONTEXT.md and branch context.
 */
export async function snapshotSession(summary?: string): Promise<string> {
  const branch = await detectBranch();
  const timestamp = new Date().toISOString();

  // Update ACTIVE_CONTEXT.md with session end marker
  const contextPath = resolveMemoryPath('ACTIVE_CONTEXT');
  const existing = await safeRead(contextPath);
  const endMarker = `\n\n## Session End (${timestamp})\n${summary || 'Session ended.'}\n`;
  await writeMemoryFile(contextPath, existing + endMarker);

  // Save branch context
  const branchCtx = await loadBranchContext(branch);
  const updatedCtx: BranchContext = branchCtx || {
    branch,
    base_branch: 'main',
    created: timestamp,
    last_session: timestamp,
    active_context: {
      working_on: summary || '',
      recent_changes: [],
      open_questions: [],
      decisions_made_on_branch: [],
    },
  };
  updatedCtx.last_session = timestamp;
  if (summary) {
    updatedCtx.active_context.working_on = summary;
  }
  await saveBranchContext(branch, updatedCtx);

  return `Session snapshot saved for branch "${branch}" at ${timestamp}`;
}

// ─── Branch Context ─────────────────────────────────────────────────────────

/**
 * Load branch-specific context from .branch-context/<branch>.json
 */
export async function loadBranchContext(branch: string): Promise<BranchContext | null> {
  const filePath = path.join(BRANCH_CONTEXT_DIR, `${sanitizeBranchName(branch)}.json`);
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content) as BranchContext;
  } catch {
    return null;
  }
}

/**
 * Save branch-specific context to .branch-context/<branch>.json
 */
export async function saveBranchContext(branch: string, ctx: BranchContext): Promise<void> {
  await fs.mkdir(BRANCH_CONTEXT_DIR, { recursive: true });
  const filePath = path.join(BRANCH_CONTEXT_DIR, `${sanitizeBranchName(branch)}.json`);
  await fs.writeFile(filePath, JSON.stringify(ctx, null, 2), 'utf-8');
}

/**
 * Switch branch context — save current, load target.
 * If target has no context, creates a fresh one.
 */
export async function switchBranch(targetBranch: string): Promise<string> {
  const currentBranch = await detectBranch();
  const timestamp = new Date().toISOString();

  // Save current branch context
  const currentCtx = await loadBranchContext(currentBranch);
  if (currentCtx) {
    currentCtx.last_session = timestamp;
    await saveBranchContext(currentBranch, currentCtx);
  }

  // Load target branch context
  let targetCtx = await loadBranchContext(targetBranch);
  if (!targetCtx) {
    targetCtx = {
      branch: targetBranch,
      base_branch: currentBranch,
      created: timestamp,
      last_session: timestamp,
      active_context: {
        working_on: '',
        recent_changes: [],
        open_questions: [],
        decisions_made_on_branch: [],
      },
    };
    await saveBranchContext(targetBranch, targetCtx);
    return `Created fresh context for branch "${targetBranch}" (based on "${currentBranch}")`;
  }

  return `Switched to branch context "${targetBranch}" (last session: ${targetCtx.last_session})`;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Sanitize branch name for use as filename.
 * Replaces path separators and special chars with dashes.
 */
function sanitizeBranchName(branch: string): string {
  return branch.replace(/[/\\:*?"<>|]/g, '-');
}
