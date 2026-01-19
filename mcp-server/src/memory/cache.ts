/**
 * Memory Cache System
 * In-memory caching with hash-based invalidation
 */

import * as crypto from 'crypto';
import { readMemoryFile } from './loader.js';
import { parseFunctions, parseRules, parseAttempts, parseDiscovery } from './parser.js';
import type { FunctionEntry, RuleEntry, AttemptEntry, AgentOConfig } from '../types.js';
import { MEMORY_FILES, DEFAULT_CONFIG } from '../types.js';

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
  
  private hashContent(content: string): string {
    return crypto.createHash('md5').update(content).digest('hex');
  }
  
  /**
   * Get functions from cache or reload
   */
  async getFunctions(): Promise<FunctionEntry[]> {
    const content = await readMemoryFile(MEMORY_FILES.FUNCTIONS);
    const hash = this.hashContent(content);
    
    if (this.functionsCache && this.functionsCache.hash === hash) {
      return this.functionsCache.data;
    }
    
    const data = parseFunctions(content);
    this.functionsCache = { data, hash, timestamp: Date.now() };
    return data;
  }
  
  /**
   * Get rules from cache or reload
   */
  async getRules(): Promise<RuleEntry[]> {
    const content = await readMemoryFile(MEMORY_FILES.RULES);
    const hash = this.hashContent(content);
    
    if (this.rulesCache && this.rulesCache.hash === hash) {
      return this.rulesCache.data;
    }
    
    const data = parseRules(content);
    this.rulesCache = { data, hash, timestamp: Date.now() };
    return data;
  }
  
  /**
   * Get attempts from cache or reload
   */
  async getAttempts(): Promise<AttemptEntry[]> {
    const content = await readMemoryFile(MEMORY_FILES.ATTEMPTS);
    const hash = this.hashContent(content);
    
    if (this.attemptsCache && this.attemptsCache.hash === hash) {
      return this.attemptsCache.data;
    }
    
    const data = parseAttempts(content);
    this.attemptsCache = { data, hash, timestamp: Date.now() };
    return data;
  }
  
  /**
   * Get discovery from cache or reload
   */
  async getDiscovery(): Promise<Set<string>> {
    const content = await readMemoryFile(MEMORY_FILES.DISCOVERY);
    const hash = this.hashContent(content);
    
    if (this.discoveryCache && this.discoveryCache.hash === hash) {
      return this.discoveryCache.data;
    }
    
    const data = parseDiscovery(content);
    this.discoveryCache = { data, hash, timestamp: Date.now() };
    return data;
  }
  
  /**
   * Get config from cache or reload
   */
  async getConfig(): Promise<AgentOConfig> {
    const content = await readMemoryFile(MEMORY_FILES.CONFIG);
    
    if (!content) {
      return DEFAULT_CONFIG;
    }
    
    const hash = this.hashContent(content);
    
    if (this.configCache && this.configCache.hash === hash) {
      return this.configCache.data;
    }
    
    try {
      const data = JSON.parse(content) as AgentOConfig;
      this.configCache = { data, hash, timestamp: Date.now() };
      return data;
    } catch {
      return DEFAULT_CONFIG;
    }
  }
  
  /**
   * Invalidate functions cache (after update)
   */
  invalidateFunctions(): void {
    this.functionsCache = null;
  }
  
  /**
   * Invalidate rules cache
   */
  invalidateRules(): void {
    this.rulesCache = null;
  }
  
  /**
   * Invalidate attempts cache
   */
  invalidateAttempts(): void {
    this.attemptsCache = null;
  }
  
  /**
   * Invalidate discovery cache
   */
  invalidateDiscovery(): void {
    this.discoveryCache = null;
  }
  
  /**
   * Invalidate config cache
   */
  invalidateConfig(): void {
    this.configCache = null;
  }
  
  /**
   * Clear all caches
   */
  clearAll(): void {
    this.functionsCache = null;
    this.rulesCache = null;
    this.attemptsCache = null;
    this.discoveryCache = null;
    this.configCache = null;
  }
}

// Singleton instance
export const memoryCache = new MemoryCache();



