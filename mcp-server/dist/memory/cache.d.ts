/**
 * Memory Cache System
 * In-memory caching with hash-based invalidation
 */
import type { FunctionEntry, RuleEntry, AttemptEntry, AgentOConfig } from '../types.js';
declare class MemoryCache {
    private functionsCache;
    private rulesCache;
    private attemptsCache;
    private discoveryCache;
    private configCache;
    private hashContent;
    /**
     * Get functions from cache or reload
     */
    getFunctions(): Promise<FunctionEntry[]>;
    /**
     * Get rules from cache or reload
     */
    getRules(): Promise<RuleEntry[]>;
    /**
     * Get attempts from cache or reload
     */
    getAttempts(): Promise<AttemptEntry[]>;
    /**
     * Get discovery from cache or reload
     */
    getDiscovery(): Promise<Set<string>>;
    /**
     * Get config from cache or reload
     */
    getConfig(): Promise<AgentOConfig>;
    /**
     * Invalidate functions cache (after update)
     */
    invalidateFunctions(): void;
    /**
     * Invalidate rules cache
     */
    invalidateRules(): void;
    /**
     * Invalidate attempts cache
     */
    invalidateAttempts(): void;
    /**
     * Invalidate discovery cache
     */
    invalidateDiscovery(): void;
    /**
     * Invalidate config cache
     */
    invalidateConfig(): void;
    /**
     * Clear all caches
     */
    clearAll(): void;
}
export declare const memoryCache: MemoryCache;
export {};
//# sourceMappingURL=cache.d.ts.map