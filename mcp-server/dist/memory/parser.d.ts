/**
 * Memory File Parsers
 * Parse markdown formats into structured data
 */
import type { FunctionEntry, RuleEntry, AttemptEntry, ArchitecturePattern } from '../types.js';
/**
 * Parse FUNCTIONS.md into structured entries
 * Format: F:functionName(params):returnType [L1:dep1,dep2]
 */
export declare function parseFunctions(content: string): FunctionEntry[];
/**
 * Format a function entry for FUNCTIONS.md
 */
export declare function formatFunctionEntry(entry: FunctionEntry): string;
/**
 * Parse RULES.md into structured entries
 * Format:
 * ### [USR001] Description
 * - Pattern: `pattern-name`
 * - Files: `*.ts, *.js`
 * - Action: BLOCK
 */
export declare function parseRules(content: string): RuleEntry[];
/**
 * Format a rule entry for RULES.md
 */
export declare function formatRuleEntry(entry: RuleEntry): string;
/**
 * Parse ATTEMPTS.md for blocked patterns
 * Format:
 * ### [timestamp] command
 * Error: message
 * DONT_RETRY: true/false
 */
export declare function parseAttempts(content: string): AttemptEntry[];
/**
 * Format an attempt entry for ATTEMPTS.md
 */
export declare function formatAttemptEntry(entry: AttemptEntry): string;
/**
 * Parse ARCHITECTURE.md for patterns
 */
export declare function parseArchitecture(content: string): ArchitecturePattern[];
/**
 * Parse DISCOVERY.md for explored areas
 */
export declare function parseDiscovery(content: string): Set<string>;
/**
 * Extract functions from source code
 */
export declare function extractFunctionsFromCode(code: string, filepath: string): FunctionEntry[];
/**
 * Check for similar function signatures (duplicate detection)
 */
export declare function findSimilarFunctions(newFunc: FunctionEntry, existing: FunctionEntry[]): FunctionEntry[];
//# sourceMappingURL=parser.d.ts.map