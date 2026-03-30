import { describe, it, expect } from 'vitest';
import { resolveMemoryPath, MEMORY_KEYS, LAYER_DIRS } from '../../src/memory/resolver.js';

describe('resolveMemoryPath', () => {
  it('returns layered path for FUNCTIONS', () => {
    expect(resolveMemoryPath('FUNCTIONS')).toBe('.agenticMemory/surface/FUNCTIONS.md');
  });

  it('returns layered path for DECISIONS', () => {
    expect(resolveMemoryPath('DECISIONS')).toBe('.agenticMemory/core/DECISIONS.md');
  });

  it('returns layered path for IDENTITY', () => {
    expect(resolveMemoryPath('IDENTITY')).toBe('.agenticMemory/soul/IDENTITY.md');
  });

  it('returns layered path for ACTIVE_CONTEXT', () => {
    expect(resolveMemoryPath('ACTIVE_CONTEXT')).toBe('.agenticMemory/working/ACTIVE_CONTEXT.md');
  });

  it('returns root path for CONFIG', () => {
    expect(resolveMemoryPath('CONFIG')).toBe('.agenticMemory/config.json');
  });

  it('returns root path for RULES', () => {
    expect(resolveMemoryPath('RULES')).toBe('.agenticMemory/RULES.md');
  });

  it('throws for unknown key', () => {
    expect(() => resolveMemoryPath('NONEXISTENT')).toThrow('Unknown memory key');
  });

  it('has JSON shadow index paths', () => {
    expect(resolveMemoryPath('DECISIONS_INDEX')).toBe('.agenticMemory/core/.decisions.json');
    expect(resolveMemoryPath('FLOWS_INDEX')).toBe('.agenticMemory/core/.flows.json');
  });

  it('MEMORY_KEYS contains all expected keys', () => {
    const expected = [
      'IDENTITY', 'PRINCIPLES', 'ARCHITECTURE', 'DECISIONS', 'FLOWS',
      'DECISIONS_INDEX', 'FLOWS_INDEX', 'ACTIVE_CONTEXT', 'DISCOVERY', 'ATTEMPTS',
      'FUNCTIONS', 'DATASTRUCTURE', 'PROJECT_MAP', 'FLOW_GRAPH', 'ERRORS', 'VERSIONS',
      'CONFIG', 'RULES', 'DIRTY',
    ];
    for (const key of expected) {
      expect(MEMORY_KEYS).toContain(key);
    }
  });

  it('LAYER_DIRS has all layer directories', () => {
    expect(LAYER_DIRS).toContain('.agenticMemory/soul');
    expect(LAYER_DIRS).toContain('.agenticMemory/core');
    expect(LAYER_DIRS).toContain('.agenticMemory/working');
    expect(LAYER_DIRS).toContain('.agenticMemory/surface');
    expect(LAYER_DIRS).toContain('.agenticMemory/.branch-context');
    expect(LAYER_DIRS).toContain('.agenticMemory/.archive');
  });
});
