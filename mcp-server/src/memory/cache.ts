/**
 * Memory Cache System
 * In-memory caching with hash-based invalidation + dirty file tracking
 */

import * as crypto from 'crypto';
import { readMemoryFile, writeMemoryFile, appendMemoryFile, ensureMemoryDir } from './loader.js';
import { parseFunctions, parseRules, parseAttempts, parseDiscovery } from './parser.js';
import type { FunctionEntry, RuleEntry, AttemptEntry, AgentOConfig, DecisionEntry, FlowProtectionEntry } from '../types.js';
import { DEFAULT_CONFIG } from '../types.js';
import { resolveMemoryPath } from './resolver.js';

interface CacheEntry<T> {
  data: T;
  hash: string;
  timestamp: number;
}

class MemoryCache {
  private functionsCache: CacheEntry<FunctionEntry[]> | null = null;
  private rulesCache: CacheEntry<RuleEntry[]> | null = null;
  private attemptsCache: CacheEntry<AttemptEntry[]> | null = null;
  private discoveryCache: CacheEntry<Set<string>> | null = null;
  private configCache: CacheEntry<AgentOConfig> | null = null;
  private decisionsCache: CacheEntry<DecisionEntry[]> | null = null;
  private flowsCache: CacheEntry<FlowProtectionEntry[]> | null = null;

  // In-memory dirty file tracking (also persisted to .dirty file)
  private dirtyFiles: Set<string> = new Set();

  private hashContent(content: string): string {
    return crypto.createHash('md5').update(content).digest('hex');
  }

  async getFunctions(): Promise<FunctionEntry[]> {
    const content = await readMemoryFile(resolveMemoryPath('FUNCTIONS'));
    const hash = this.hashContent(content);

    if (this.functionsCache && this.functionsCache.hash === hash) {
      return this.functionsCache.data;
    }

    const data = parseFunctions(content);
    this.functionsCache = { data, hash, timestamp: Date.now() };
    return data;
  }

  async getRules(): Promise<RuleEntry[]> {
    const content = await readMemoryFile(resolveMemoryPath('RULES'));
    const hash = this.hashContent(content);

    if (this.rulesCache && this.rulesCache.hash === hash) {
      return this.rulesCache.data;
    }

    const data = parseRules(content);
    this.rulesCache = { data, hash, timestamp: Date.now() };
    return data;
  }

  async getAttempts(): Promise<AttemptEntry[]> {
    const content = await readMemoryFile(resolveMemoryPath('ATTEMPTS'));
    const hash = this.hashContent(content);

    if (this.attemptsCache && this.attemptsCache.hash === hash) {
      return this.attemptsCache.data;
    }

    const data = parseAttempts(content);
    this.attemptsCache = { data, hash, timestamp: Date.now() };
    return data;
  }

  async getDiscovery(): Promise<Set<string>> {
    const content = await readMemoryFile(resolveMemoryPath('DISCOVERY'));
    const hash = this.hashContent(content);

    if (this.discoveryCache && this.discoveryCache.hash === hash) {
      return this.discoveryCache.data;
    }

    const data = parseDiscovery(content);
    this.discoveryCache = { data, hash, timestamp: Date.now() };
    return data;
  }

  async getConfig(): Promise<AgentOConfig> {
    const content = await readMemoryFile(resolveMemoryPath('CONFIG'));

    if (!content) {
      return DEFAULT_CONFIG;
    }

    const hash = this.hashContent(content);

    if (this.configCache && this.configCache.hash === hash) {
      return this.configCache.data;
    }

    try {
      const parsed = JSON.parse(content) as Partial<AgentOConfig>;
      const data = { ...DEFAULT_CONFIG, ...parsed } as AgentOConfig;
      this.configCache = { data, hash, timestamp: Date.now() };
      return data;
    } catch {
      return DEFAULT_CONFIG;
    }
  }

  async getDecisions(): Promise<DecisionEntry[]> {
    const content = await readMemoryFile(resolveMemoryPath('DECISIONS_INDEX'));
    if (!content) return [];

    const hash = this.hashContent(content);

    if (this.decisionsCache && this.decisionsCache.hash === hash) {
      return this.decisionsCache.data;
    }

    try {
      const data = JSON.parse(content) as DecisionEntry[];
      this.decisionsCache = { data, hash, timestamp: Date.now() };
      return data;
    } catch {
      return [];
    }
  }

  async getFlows(): Promise<FlowProtectionEntry[]> {
    const content = await readMemoryFile(resolveMemoryPath('FLOWS_INDEX'));
    if (!content) return [];

    const hash = this.hashContent(content);

    if (this.flowsCache && this.flowsCache.hash === hash) {
      return this.flowsCache.data;
    }

    try {
      const data = JSON.parse(content) as FlowProtectionEntry[];
      this.flowsCache = { data, hash, timestamp: Date.now() };
      return data;
    } catch {
      return [];
    }
  }

  // ─── Dirty file tracking ─────────────────────────────────────────────────

  /**
   * Mark a file as needing reindexing.
   * Tracks in-memory and persists to .dirty file.
   */
  async markDirty(filepath: string): Promise<void> {
    if (this.dirtyFiles.has(filepath)) return;
    this.dirtyFiles.add(filepath);
    try {
      await ensureMemoryDir();
      await appendMemoryFile(resolveMemoryPath('DIRTY'), filepath + '\n');
    } catch {
      // Non-fatal
    }
  }

  /**
   * Get all dirty files (merges in-memory + persisted).
   */
  async getDirtyFiles(): Promise<string[]> {
    try {
      const content = await readMemoryFile(resolveMemoryPath('DIRTY'));
      if (content) {
        const fromFile = content.split('\n').map(l => l.trim()).filter(Boolean);
        for (const f of fromFile) {
          this.dirtyFiles.add(f);
        }
      }
    } catch {
      // Non-fatal
    }
    return Array.from(this.dirtyFiles);
  }

  /**
   * Check if there are any dirty files pending reindex.
   */
  async isDirty(): Promise<boolean> {
    if (this.dirtyFiles.size > 0) return true;
    const files = await this.getDirtyFiles();
    return files.length > 0;
  }

  /**
   * Clear all dirty tracking (call after successful reindex).
   */
  async clearDirty(): Promise<void> {
    this.dirtyFiles.clear();
    try {
      await writeMemoryFile(resolveMemoryPath('DIRTY'), '');
    } catch {
      // Non-fatal
    }
  }

  // ─── Cache invalidation ──────────────────────────────────────────────────

  invalidateFunctions(): void { this.functionsCache = null; }
  invalidateRules(): void { this.rulesCache = null; }
  invalidateAttempts(): void { this.attemptsCache = null; }
  invalidateDiscovery(): void { this.discoveryCache = null; }
  invalidateConfig(): void { this.configCache = null; }
  invalidateDecisions(): void { this.decisionsCache = null; }
  invalidateFlows(): void { this.flowsCache = null; }

  clearAll(): void {
    this.functionsCache = null;
    this.rulesCache = null;
    this.attemptsCache = null;
    this.discoveryCache = null;
    this.configCache = null;
    this.decisionsCache = null;
    this.flowsCache = null;
  }
}

export const memoryCache = new MemoryCache();
