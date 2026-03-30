import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import { countObservations } from '../../src/memory/resume.js';

// ─── countObservations (pure function, no mocking needed) ─────────────────

describe('countObservations', () => {
  it('returns 0 for empty content', () => {
    expect(countObservations('')).toBe(0);
  });

  it('returns 0 for content with no observations section', () => {
    const content = `# Active Context

## Current Work
- Working on feature X
`;
    expect(countObservations(content)).toBe(0);
  });

  it('counts observations in Observations section', () => {
    const content = `# Active Context

## Observations
- Wrote auth/login.ts: Added password validation
- Wrote auth/session.ts: Session creation
- Override: Forced write to config.ts
`;
    expect(countObservations(content)).toBe(3);
  });

  it('counts observations in Recent section', () => {
    const content = `# Active Context

## Recent
- Change 1
- Change 2
`;
    expect(countObservations(content)).toBe(2);
  });

  it('stops counting at next section heading', () => {
    const content = `# Active Context

## Observations
- Obs 1
- Obs 2

## Other Section
- Not an observation
`;
    expect(countObservations(content)).toBe(2);
  });

  it('handles mixed content in observations', () => {
    const content = `## Observations
- Real observation
Some text that is not a list item
- Another observation
  continuation text
- Third one
`;
    expect(countObservations(content)).toBe(3);
  });

  it('returns 0 for null-ish input', () => {
    expect(countObservations('')).toBe(0);
  });

  it('handles more than 10 observations', () => {
    const lines = Array.from({ length: 15 }, (_, i) => `- Observation ${i + 1}`);
    const content = `## Observations\n${lines.join('\n')}`;
    expect(countObservations(content)).toBe(15);
  });
});
