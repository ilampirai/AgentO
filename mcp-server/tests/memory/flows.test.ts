import { describe, it, expect } from 'vitest';
import {
  parseFlowsMarkdown,
  checkFlowImpact,
  formatFlowEntry,
  getNextFlowId,
} from '../../src/memory/flows.js';
import type { FlowProtectionEntry } from '../../src/types.js';

// ─── parseFlowsMarkdown ───────────────────────────────────────────────────

describe('parseFlowsMarkdown', () => {
  it('parses well-formed FLOWS.md', () => {
    const md = `# Protected Flows

## FLOW-001: User Authentication (2026-03-01)
Description: Login flow from form submission to session creation
Steps: validate-input, hash-password, check-db, create-session, set-cookie
Files: auth/login.ts, auth/session.ts, middleware/auth.ts
Last verified: 2026-03-15
`;
    const result = parseFlowsMarkdown(md);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('FLOW-001');
    expect(result[0].name).toBe('User Authentication');
    expect(result[0].steps).toHaveLength(5);
    expect(result[0].steps[0]).toBe('validate-input');
    expect(result[0].files).toContain('auth/login.ts');
    expect(result[0].files).toContain('middleware/auth.ts');
    expect(result[0].last_verified).toBe('2026-03-15');
  });

  it('parses multiple flows', () => {
    const md = `# Protected Flows

## FLOW-001: Auth Flow (2026-01-01)
Description: Authentication
Steps: login, verify
Files: auth.ts

## FLOW-002: Payment Flow (2026-02-01)
Description: Payment processing
Steps: validate, charge, confirm
Files: payment.ts, billing.ts
`;
    const result = parseFlowsMarkdown(md);
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('FLOW-001');
    expect(result[1].id).toBe('FLOW-002');
    expect(result[1].files).toHaveLength(2);
  });

  it('returns empty for empty file', () => {
    expect(parseFlowsMarkdown('')).toEqual([]);
  });

  it('returns empty for whitespace-only', () => {
    expect(parseFlowsMarkdown('   \n\n  ')).toEqual([]);
  });

  it('skips entries missing Description field', () => {
    const md = `# Flows

## FLOW-001: Good (2026-01-01)
Description: A good flow
Steps: step1
Files: file.ts

## FLOW-002: Bad (2026-01-01)
Steps: step1
Files: file2.ts
`;
    const result = parseFlowsMarkdown(md);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('FLOW-001');
  });

  it('handles flow with no Last verified field', () => {
    const md = `# Flows

## FLOW-001: Test (2026-01-01)
Description: A test flow
Steps: step1, step2
Files: test.ts
`;
    const result = parseFlowsMarkdown(md);
    expect(result).toHaveLength(1);
    expect(result[0].last_verified).toBeUndefined();
  });

  it('handles single-step single-file flow', () => {
    const md = `## FLOW-001: Simple (2026-01-01)
Description: Minimal flow
Steps: only-step
Files: only-file.ts
`;
    const result = parseFlowsMarkdown(md);
    expect(result).toHaveLength(1);
    expect(result[0].steps).toEqual(['only-step']);
    expect(result[0].files).toEqual(['only-file.ts']);
  });
});

// ─── checkFlowImpact ──────────────────────────────────────────────────────

describe('checkFlowImpact', () => {
  const flows: FlowProtectionEntry[] = [
    {
      id: 'FLOW-001',
      name: 'Auth Flow',
      description: 'Authentication',
      steps: ['login', 'verify'],
      files: ['auth/login.ts', 'auth/session.ts'],
    },
    {
      id: 'FLOW-002',
      name: 'Payment Flow',
      description: 'Payment processing',
      steps: ['validate', 'charge'],
      files: ['payment/charge.ts', 'payment/validate.ts'],
    },
  ];

  it('finds impact when file matches exactly', () => {
    const result = checkFlowImpact('auth/login.ts', flows);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('FLOW-001');
  });

  it('finds impact with suffix match', () => {
    const result = checkFlowImpact('login.ts', flows);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('FLOW-001');
  });

  it('returns empty when no file matches', () => {
    const result = checkFlowImpact('unrelated/file.ts', flows);
    expect(result).toHaveLength(0);
  });

  it('finds multiple flows when file appears in several', () => {
    const multiFlows: FlowProtectionEntry[] = [
      { id: 'FLOW-001', name: 'A', description: '', steps: [], files: ['shared.ts'] },
      { id: 'FLOW-002', name: 'B', description: '', steps: [], files: ['shared.ts'] },
    ];
    const result = checkFlowImpact('shared.ts', multiFlows);
    expect(result).toHaveLength(2);
  });

  it('returns empty for empty flows', () => {
    expect(checkFlowImpact('anything.ts', [])).toEqual([]);
  });

  it('normalizes Windows backslash paths', () => {
    const result = checkFlowImpact('auth\\login.ts', flows);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('FLOW-001');
  });

  it('handles prefix match (target longer than flow file)', () => {
    const result = checkFlowImpact('src/auth/login.ts', flows);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('FLOW-001');
  });
});

// ─── formatFlowEntry ──────────────────────────────────────────────────────

describe('formatFlowEntry', () => {
  it('formats complete flow entry', () => {
    const entry: FlowProtectionEntry = {
      id: 'FLOW-001',
      name: 'Auth Flow',
      description: 'Authentication flow',
      steps: ['login', 'verify', 'session'],
      files: ['auth.ts', 'session.ts'],
      last_verified: '2026-03-15',
    };
    const result = formatFlowEntry(entry);
    expect(result).toContain('## FLOW-001: Auth Flow');
    expect(result).toContain('Description: Authentication flow');
    expect(result).toContain('Steps: login, verify, session');
    expect(result).toContain('Files: auth.ts, session.ts');
    expect(result).toContain('Last verified: 2026-03-15');
  });

  it('omits Last verified when not set', () => {
    const entry: FlowProtectionEntry = {
      id: 'FLOW-002',
      name: 'Test',
      description: 'Test flow',
      steps: ['step1'],
      files: ['test.ts'],
    };
    const result = formatFlowEntry(entry);
    expect(result).not.toContain('Last verified');
  });
});

// ─── getNextFlowId ────────────────────────────────────────────────────────

describe('getNextFlowId', () => {
  it('returns FLOW-001 for empty list', () => {
    expect(getNextFlowId([])).toBe('FLOW-001');
  });

  it('increments past highest ID', () => {
    const flows = [
      { id: 'FLOW-005' },
      { id: 'FLOW-003' },
    ] as FlowProtectionEntry[];
    expect(getNextFlowId(flows)).toBe('FLOW-006');
  });

  it('handles single entry', () => {
    const flows = [{ id: 'FLOW-001' }] as FlowProtectionEntry[];
    expect(getNextFlowId(flows)).toBe('FLOW-002');
  });

  it('handles non-contiguous IDs', () => {
    const flows = [
      { id: 'FLOW-001' },
      { id: 'FLOW-010' },
    ] as FlowProtectionEntry[];
    expect(getNextFlowId(flows)).toBe('FLOW-011');
  });
});
