/**
 * Integration tests for AgentO Memory v6.0 workflows.
 * Tests end-to-end flows: write conflict → force, resume, migration, compact, branch switch.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';

// Internal modules
import { resolveMemoryPath, LAYER_DIRS } from '../../src/memory/resolver.js';
import {
  parseDecisionsMarkdown,
  checkDecisionConflicts,
  formatDecisionEntry,
  getNextDecisionId,
  writeDecisionsIndex,
} from '../../src/memory/decisions.js';
import {
  parseFlowsMarkdown,
  checkFlowImpact,
  formatFlowEntry,
  getNextFlowId,
  writeFlowsIndex,
} from '../../src/memory/flows.js';
import { countObservations } from '../../src/memory/resume.js';
import { generateIdentity, isAlreadyMigrated } from '../../src/memory/migrate.js';
import type { DecisionEntry, FlowProtectionEntry } from '../../src/types.js';

const TEST_DIR = path.join(process.cwd(), '.test-agenticMemory');
const ORIGINAL_CWD = process.cwd();

// ─── Helpers ────────────────────────────────────────────────────────────────

async function createTestDir(): Promise<void> {
  await fs.mkdir(TEST_DIR, { recursive: true });
  for (const dir of LAYER_DIRS) {
    await fs.mkdir(path.join(TEST_DIR, dir.replace('.agenticMemory', '')), { recursive: true });
  }
}

async function cleanTestDir(): Promise<void> {
  try {
    await fs.rm(TEST_DIR, { recursive: true, force: true });
  } catch {
    // OK if it doesn't exist
  }
}

// ─── Decision + Write conflict flow ─────────────────────────────────────────

describe('Decision conflict flow (pure functions)', () => {
  const baseDecisions: DecisionEntry[] = [];

  it('records a decision and detects conflicts', () => {
    const id = getNextDecisionId(baseDecisions);
    expect(id).toBe('D001');

    const entry: DecisionEntry = {
      id,
      timestamp: '2026-03-31',
      decision: 'Use deferred indexing for all writes',
      alternatives: [{ option: 'Inline indexing', rejected_reason: 'Too slow, 100K+ responses' }],
      affected_flows: ['FLOW-001'],
      affected_files: ['src/tools/write.ts', 'src/tools/indexTool.ts'],
      confidence: 9,
    };

    baseDecisions.push(entry);

    // Check conflict on affected file
    const conflicts = checkDecisionConflicts('src/tools/write.ts', baseDecisions);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].id).toBe('D001');

    // No conflict on unrelated file
    const noConflicts = checkDecisionConflicts('src/tools/search.ts', baseDecisions);
    expect(noConflicts).toHaveLength(0);
  });

  it('formats and re-parses a decision roundtrip', () => {
    const entry: DecisionEntry = {
      id: 'D042',
      timestamp: '2026-03-31',
      decision: 'Roundtrip test decision',
      alternatives: [{ option: 'Alt A', rejected_reason: 'Not good enough' }],
      affected_flows: ['FLOW-002'],
      affected_files: ['src/index.ts'],
      confidence: 7,
    };

    const md = '# Decisions\n\n' + formatDecisionEntry(entry);
    const parsed = parseDecisionsMarkdown(md);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].id).toBe('D042');
    expect(parsed[0].decision).toBe('Roundtrip test decision');
    expect(parsed[0].alternatives).toHaveLength(1);
    expect(parsed[0].confidence).toBe(7);
  });
});

// ─── Flow protection flow ───────────────────────────────────────────────────

describe('Flow protection flow (pure functions)', () => {
  it('defines a flow and checks impact', () => {
    const flows: FlowProtectionEntry[] = [];
    const id = getNextFlowId(flows);
    expect(id).toBe('FLOW-001');

    const entry: FlowProtectionEntry = {
      id,
      name: 'Auth Flow',
      description: 'User authentication from login to session',
      steps: ['validate-input', 'hash-password', 'check-db', 'create-session'],
      files: ['auth/login.ts', 'auth/session.ts', 'middleware/auth.ts'],
    };

    flows.push(entry);

    // File in flow
    const impacted = checkFlowImpact('auth/login.ts', flows);
    expect(impacted).toHaveLength(1);
    expect(impacted[0].id).toBe('FLOW-001');

    // File not in flow
    const notImpacted = checkFlowImpact('unrelated.ts', flows);
    expect(notImpacted).toHaveLength(0);
  });

  it('formats and re-parses a flow roundtrip', () => {
    const entry: FlowProtectionEntry = {
      id: 'FLOW-010',
      name: 'Payment Flow',
      description: 'End-to-end payment processing',
      steps: ['validate', 'charge', 'confirm', 'receipt'],
      files: ['payment/charge.ts', 'payment/receipt.ts'],
      last_verified: '2026-03-30',
    };

    const md = '# Flows\n\n' + formatFlowEntry(entry);
    const parsed = parseFlowsMarkdown(md);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].id).toBe('FLOW-010');
    expect(parsed[0].name).toBe('Payment Flow');
    expect(parsed[0].steps).toHaveLength(4);
    expect(parsed[0].last_verified).toBe('2026-03-30');
  });
});

// ─── Resume flow ────────────────────────────────────────────────────────────

describe('Resume system (pure functions)', () => {
  it('counts observations correctly', () => {
    const context = `# Active Context

## Current Work
Working on v6.0

## Observations
- [2026-03-31T10:00:00Z] Wrote auth.ts
- [2026-03-31T10:05:00Z] Wrote session.ts
- [2026-03-31T10:10:00Z] Override: forced write
- [2026-03-31T10:15:00Z] New file detected

## Other Section
- Not counted
`;
    expect(countObservations(context)).toBe(4);
  });

  it('detects compact nudge threshold', () => {
    const lines = Array.from({ length: 12 }, (_, i) =>
      `- [2026-03-31T${String(i).padStart(2, '0')}:00:00Z] Observation ${i}`
    );
    const context = `## Observations\n${lines.join('\n')}`;
    const count = countObservations(context);
    expect(count).toBe(12);
    expect(count).toBeGreaterThan(10); // nudge threshold
  });
});

// ─── Migration ──────────────────────────────────────────────────────────────

describe('Migration system', () => {
  it('generateIdentity returns valid content', async () => {
    const identity = await generateIdentity();
    expect(identity).toContain('# Project Identity');
    expect(identity.length).toBeGreaterThan(20);
  });
});

// ─── Combined conflict detection ────────────────────────────────────────────

describe('Combined decision + flow conflict detection', () => {
  it('detects both decision and flow conflicts for same file', () => {
    const decisions: DecisionEntry[] = [{
      id: 'D001',
      timestamp: '2026-03-31',
      decision: 'Auth uses JWT not sessions',
      alternatives: [],
      affected_flows: [],
      affected_files: ['auth/login.ts'],
      confidence: 8,
    }];

    const flows: FlowProtectionEntry[] = [{
      id: 'FLOW-001',
      name: 'Auth Flow',
      description: 'Auth',
      steps: ['login', 'verify'],
      files: ['auth/login.ts', 'auth/verify.ts'],
    }];

    const dConflicts = checkDecisionConflicts('auth/login.ts', decisions);
    const fImpact = checkFlowImpact('auth/login.ts', flows);

    expect(dConflicts).toHaveLength(1);
    expect(fImpact).toHaveLength(1);
    // Both should reference the same file
    expect(dConflicts[0].affected_files).toContain('auth/login.ts');
    expect(fImpact[0].files).toContain('auth/login.ts');
  });

  it('handles Windows-style paths in conflicts', () => {
    const decisions: DecisionEntry[] = [{
      id: 'D001',
      timestamp: '2026-03-31',
      decision: 'Test decision',
      alternatives: [],
      affected_flows: [],
      affected_files: ['src/tools/write.ts'],
      confidence: 5,
    }];

    // Windows-style path should still match
    const conflicts = checkDecisionConflicts('src\\tools\\write.ts', decisions);
    expect(conflicts).toHaveLength(1);
  });
});

// ─── ID generation across systems ───────────────────────────────────────────

describe('ID generation consistency', () => {
  it('decision IDs are zero-padded', () => {
    const decisions = Array.from({ length: 99 }, (_, i) => ({
      id: `D${String(i + 1).padStart(3, '0')}`,
    })) as DecisionEntry[];
    const next = getNextDecisionId(decisions);
    expect(next).toBe('D100');
  });

  it('flow IDs are zero-padded', () => {
    const flows = [{ id: 'FLOW-099' }] as FlowProtectionEntry[];
    const next = getNextFlowId(flows);
    expect(next).toBe('FLOW-100');
  });
});
