/**
 * Memory Cache System
 * In-memory caching with hash-based invalidation
 */
import * as crypto from 'crypto';
import { readMemoryFile } from './loader.js';
import { parseFunctions, parseRules, parseAttempts, parseDiscovery } from './parser.js';
import { MEMORY_FILES, DEFAULT_CONFIG } from '../types.js';
class MemoryCache {
    functionsCache = null;
    rulesCache = null;
    attemptsCache = null;
    discoveryCache = null;
    configCache = null;
    hashContent(content) {
        return crypto.createHash('md5').update(content).digest('hex');
    }
    /**
     * Get functions from cache or reload
     */
    async getFunctions() {
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
    async getRules() {
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
    async getAttempts() {
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
    async getDiscovery() {
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
    async getConfig() {
        const content = await readMemoryFile(MEMORY_FILES.CONFIG);
        if (!content) {
            return DEFAULT_CONFIG;
        }
        const hash = this.hashContent(content);
        if (this.configCache && this.configCache.hash === hash) {
            return this.configCache.data;
        }
        try {
            const data = JSON.parse(content);
            this.configCache = { data, hash, timestamp: Date.now() };
            return data;
        }
        catch {
            return DEFAULT_CONFIG;
        }
    }
    /**
     * Invalidate functions cache (after update)
     */
    invalidateFunctions() {
        this.functionsCache = null;
    }
    /**
     * Invalidate rules cache
     */
    invalidateRules() {
        this.rulesCache = null;
    }
    /**
     * Invalidate attempts cache
     */
    invalidateAttempts() {
        this.attemptsCache = null;
    }
    /**
     * Invalidate discovery cache
     */
    invalidateDiscovery() {
        this.discoveryCache = null;
    }
    /**
     * Invalidate config cache
     */
    invalidateConfig() {
        this.configCache = null;
    }
    /**
     * Clear all caches
     */
    clearAll() {
        this.functionsCache = null;
        this.rulesCache = null;
        this.attemptsCache = null;
        this.discoveryCache = null;
        this.configCache = null;
    }
}
// Singleton instance
export const memoryCache = new MemoryCache();
//# sourceMappingURL=cache.js.map