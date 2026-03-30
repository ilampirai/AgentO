import { describe, it, expect } from 'vitest';
import {
  parseDecisionsMarkdown,
  checkDecisionConflicts,
  getNextDecisionId,
  formatDecisionEntry,
} from '../../src/memory/decisions.js';
import type { DecisionEntry } from '../../src/types.js';

// ─── Test fixtures ──────────────────────────────────────────────────────────

const WELL_FORMED_MD = `# Decisions

## D001: Use PostgreSQL over MongoDB (2026-03-28)
Decision: Use PostgreSQL as the primary database for structured data
Rejected: MongoDB
  Why rejected: Schema flexibility not needed; relational queries are critical
Rejected: SQLite
  Why rejected: Cannot handle concurrent writes at expected scale
Affected flows: FLOW-001, FLOW-002
Affected files: tools/write.ts, memory/cache.ts
Confidence: 8/10

## D002: Adopt vitest over jest (2026-03-29)
Decision: Use vitest for all unit and integration tests
Rejected: Jest
  Why rejected: Slower startup, requires more config for ESM
Affected flows: FLOW-003
Affected files: package.json, vitest.config.ts
Confidence: 9/10
`;

const MALFORMED_MD = `# Decisions

## D001: Good entry (2026-03-28)
Decision: This entry is well-formed
Rejected: Option A
  Why rejected: Reason A
Affected flows: FLOW-001
Affected files: src/index.ts
Confidence: 7/10

## D002: Missing decision field (2026-03-28)
Rejected: Option B
  Why rejected: Reason B
Affected flows: FLOW-002
Affected files: src/bad.ts
Confidence: 5/10

## D003: Another good entry (2026-03-29)
Decision: This one is also fine
Rejected: Option C
  Why rejected: Reason C
Affected flows: FLOW-003
Affected files: src/good.ts
Confidence: 6/10
`;

function makeEntry(overrides: Partial<DecisionEntry> = {}): DecisionEntry {
  return {
    id: 'D001',
    timestamp: '2026-03-28',
    decision: 'Use PostgreSQL',
    alternatives: [{ option: 'MongoDB', rejected_reason: 'Not needed' }],
    affected_flows: ['FLOW-001'],
    affected_files: ['tools/write.ts', 'memory/cache.ts'],
    confidence: 8,
    ...overrides,
  };
}

// ─── parseDecisionsMarkdown ─────────────────────────────────────────────────

describe('parseDecisionsMarkdown', () => {
  it('parses well-formed DECISIONS.md with 2 entries', () => {
    const entries = parseDecisionsMarkdown(WELL_FORMED_MD);
    expect(entries).toHaveLength(2);
  });

  it('extracts correct id and timestamp', () => {
    const entries = parseDecisionsMarkdown(WELL_FORMED_MD);
    expect(entries[0].id).toBe('D001');
    expect(entries[0].timestamp).toBe('2026-03-28');
    expect(entries[1].id).toBe('D002');
    expect(entries[1].timestamp).toBe('2026-03-29');
  });

  it('extracts decision text', () => {
    const entries = parseDecisionsMarkdown(WELL_FORMED_MD);
    expect(entries[0].decision).toBe('Use PostgreSQL as the primary database for structured data');
    expect(entries[1].decision).toBe('Use vitest for all unit and integration tests');
  });

  it('extracts alternatives with rejected reasons', () => {
    const entries = parseDecisionsMarkdown(WELL_FORMED_MD);
    expect(entries[0].alternatives).toHaveLength(2);
    expect(entries[0].alternatives[0]).toEqual({
      option: 'MongoDB',
      rejected_reason: 'Schema flexibility not needed; relational queries are critical',
    });
    expect(entries[0].alternatives[1]).toEqual({
      option: 'SQLite',
      rejected_reason: 'Cannot handle concurrent writes at expected scale',
    });
    expect(entries[1].alternatives).toHaveLength(1);
    expect(entries[1].alternatives[0].option).toBe('Jest');
  });

  it('extracts affected_flows', () => {
    const entries = parseDecisionsMarkdown(WELL_FORMED_MD);
    expect(entries[0].affected_flows).toEqual(['FLOW-001', 'FLOW-002']);
    expect(entries[1].affected_flows).toEqual(['FLOW-003']);
  });

  it('extracts affected_files', () => {
    const entries = parseDecisionsMarkdown(WELL_FORMED_MD);
    expect(entries[0].affected_files).toEqual(['tools/write.ts', 'memory/cache.ts']);
    expect(entries[1].affected_files).toEqual(['package.json', 'vitest.config.ts']);
  });

  it('extracts confidence as a number', () => {
    const entries = parseDecisionsMarkdown(WELL_FORMED_MD);
    expect(entries[0].confidence).toBe(8);
    expect(entries[1].confidence).toBe(9);
  });

  it('returns empty array for empty string', () => {
    expect(parseDecisionsMarkdown('')).toEqual([]);
  });

  it('returns empty array for header-only content', () => {
    expect(parseDecisionsMarkdown('# Decisions\n\n')).toEqual([]);
  });

  it('skips malformed entries, returns good ones', () => {
    const entries = parseDecisionsMarkdown(MALFORMED_MD);
    // D002 is missing the Decision: field — should be skipped
    expect(entries).toHaveLength(2);
    expect(entries[0].id).toBe('D001');
    expect(entries[1].id).toBe('D003');
  });
});

// ─── checkDecisionConflicts ─────────────────────────────────────────────────

describe('checkDecisionConflicts', () => {
  const decisions: DecisionEntry[] = [
    makeEntry({ id: 'D001', affected_files: ['tools/write.ts', 'memory/cache.ts'] }),
    makeEntry({ id: 'D002', affected_files: ['src/index.ts'] }),
    makeEntry({ id: 'D003', affected_files: ['memory/parser.ts'] }),
  ];

  it('returns matching decision when file matches exactly', () => {
    const result = checkDecisionConflicts('tools/write.ts', decisions);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('D001');
  });

  it('returns match when target is suffix of affected_file', () => {
    // "write.ts" should match "tools/write.ts"
    const result = checkDecisionConflicts('write.ts', decisions);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('D001');
  });

  it('returns empty array when no match', () => {
    const result = checkDecisionConflicts('unrelated/file.ts', decisions);
    expect(result).toEqual([]);
  });

  it('returns empty array for empty decisions', () => {
    const result = checkDecisionConflicts('tools/write.ts', []);
    expect(result).toEqual([]);
  });

  it('normalizes Windows backslash paths', () => {
    const result = checkDecisionConflicts('tools\\write.ts', decisions);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('D001');
  });

  it('returns multiple decisions when file matches several', () => {
    const multiDecisions: DecisionEntry[] = [
      makeEntry({ id: 'D001', affected_files: ['tools/write.ts'] }),
      makeEntry({ id: 'D002', affected_files: ['tools/write.ts', 'other.ts'] }),
    ];
    const result = checkDecisionConflicts('tools/write.ts', multiDecisions);
    expect(result).toHaveLength(2);
  });
});

// ─── getNextDecisionId ──────────────────────────────────────────────────────

describe('getNextDecisionId', () => {
  it('returns D001 for empty array', () => {
    expect(getNextDecisionId([])).toBe('D001');
  });

  it('returns D002 for array with D001', () => {
    const decisions = [makeEntry({ id: 'D001' })];
    expect(getNextDecisionId(decisions)).toBe('D002');
  });

  it('returns D006 for array with D003 and D005', () => {
    const decisions = [
      makeEntry({ id: 'D003' }),
      makeEntry({ id: 'D005' }),
    ];
    expect(getNextDecisionId(decisions)).toBe('D006');
  });

  it('pads single digits to 3 digits', () => {
    const decisions = [makeEntry({ id: 'D001' })];
    expect(getNextDecisionId(decisions)).toBe('D002');
  });

  it('handles high numbers', () => {
    const decisions = [makeEntry({ id: 'D099' })];
    expect(getNextDecisionId(decisions)).toBe('D100');
  });
});

// ─── formatDecisionEntry ────────────────────────────────────────────────────

describe('formatDecisionEntry', () => {
  it('formats a full entry with all fields', () => {
    const entry = makeEntry({
      id: 'D001',
      timestamp: '2026-03-28',
      decision: 'Use PostgreSQL',
      alternatives: [
        { option: 'MongoDB', rejected_reason: 'Not needed' },
        { option: 'SQLite', rejected_reason: 'Too limited' },
      ],
      affected_flows: ['FLOW-001', 'FLOW-002'],
      affected_files: ['tools/write.ts', 'memory/cache.ts'],
      confidence: 8,
    });

    const result = formatDecisionEntry(entry);

    expect(result).toContain('## D001:');
    expect(result).toContain('(2026-03-28)');
    expect(result).toContain('Decision: Use PostgreSQL');
    expect(result).toContain('Rejected: MongoDB');
    expect(result).toContain('Why rejected: Not needed');
    expect(result).toContain('Rejected: SQLite');
    expect(result).toContain('Why rejected: Too limited');
    expect(result).toContain('Affected flows: FLOW-001, FLOW-002');
    expect(result).toContain('Affected files: tools/write.ts, memory/cache.ts');
    expect(result).toContain('Confidence: 8/10');
  });

  it('formats entry with no alternatives', () => {
    const entry = makeEntry({ alternatives: [] });
    const result = formatDecisionEntry(entry);
    expect(result).toContain('Decision:');
    expect(result).not.toContain('Rejected:');
  });

  it('roundtrips through parse', () => {
    const entry = makeEntry({
      id: 'D010',
      timestamp: '2026-03-30',
      decision: 'Use TDD approach for all new modules',
      alternatives: [
        { option: 'Write code first', rejected_reason: 'Harder to verify correctness' },
      ],
      affected_flows: ['FLOW-005'],
      affected_files: ['src/memory/decisions.ts'],
      confidence: 10,
    });

    const formatted = formatDecisionEntry(entry);
    const header = '# Decisions\n\n';
    const parsed = parseDecisionsMarkdown(header + formatted);

    expect(parsed).toHaveLength(1);
    expect(parsed[0].id).toBe('D010');
    expect(parsed[0].decision).toBe('Use TDD approach for all new modules');
    expect(parsed[0].alternatives).toHaveLength(1);
    expect(parsed[0].confidence).toBe(10);
  });
});
