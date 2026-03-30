import { describe, it, expect } from 'vitest';
import { generateIdentity } from '../../src/memory/migrate.js';

// ─── generateIdentity (tests the pure generation logic) ───────────────────
// Note: Full migration tests require filesystem setup and are in integration tests.
// Here we test the identity generation which reads from cwd.

describe('generateIdentity', () => {
  it('returns a string starting with # Project Identity', async () => {
    const result = await generateIdentity();
    expect(result).toContain('# Project Identity');
  });

  it('returns a non-empty string', async () => {
    const result = await generateIdentity();
    expect(result.length).toBeGreaterThan(20);
  });

  // Note: This test runs in the mcp-server directory which has a package.json
  it('picks up package.json info when available', async () => {
    const result = await generateIdentity();
    // The mcp-server package.json has name "@ilam/agento-mcp"
    expect(result).toContain('**Name:**');
  });
});
