/**
 * Memory File Parsers
 * Parse markdown formats into structured data
 */

import type { FunctionEntry, RuleEntry, AttemptEntry, ArchitecturePattern } from '../types.js';

/**
 * Parse FUNCTIONS.md into structured entries
 * Format: F:functionName(params):returnType [L1:dep1,dep2]
 */
export function parseFunctions(content: string): FunctionEntry[] {
  const entries: FunctionEntry[] = [];
  const lines = content.split('\n');
  let currentFile = '';
  
  for (const line of lines) {
    // File header: ## path/to/file.ts
    if (line.startsWith('## ')) {
      currentFile = line.slice(3).trim();
      continue;
    }
    
    // Function entry: F:name(params):return [L1:deps]
    const funcMatch = line.match(/^F:(\w+)\(([^)]*)\):(\S+)(?:\s+\[L1:([^\]]*)\])?/);
    if (funcMatch && currentFile) {
      entries.push({
        name: funcMatch[1],
        file: currentFile,
        params: funcMatch[2],
        returnType: funcMatch[3],
        dependencies: funcMatch[4] ? funcMatch[4].split(',').map(d => d.trim()) : [],
      });
    }
  }
  
  return entries;
}

/**
 * Format a function entry for FUNCTIONS.md
 */
export function formatFunctionEntry(entry: FunctionEntry): string {
  const deps = entry.dependencies.length > 0 
    ? ` [L1:${entry.dependencies.join(',')}]` 
    : '';
  return `F:${entry.name}(${entry.params}):${entry.returnType}${deps}`;
}

/**
 * Parse RULES.md into structured entries
 * Format:
 * ### [USR001] Description
 * - Pattern: `pattern-name`
 * - Files: `*.ts, *.js`
 * - Action: BLOCK
 */
export function parseRules(content: string): RuleEntry[] {
  const entries: RuleEntry[] = [];
  const ruleBlocks = content.split(/###\s+\[/);
  
  for (const block of ruleBlocks) {
    if (!block.trim()) continue;
    
    const idMatch = block.match(/^(\w+)\]\s+(.+)/);
    if (!idMatch) continue;
    
    const id = idMatch[1];
    const description = idMatch[2].split('\n')[0].trim();
    
    const patternMatch = block.match(/Pattern:\s*`([^`]+)`/);
    const filesMatch = block.match(/Files:\s*`([^`]+)`/);
    const actionMatch = block.match(/Action:\s*(BLOCK|WARN)/i);
    const enabledMatch = block.match(/Enabled:\s*(true|false)/i);
    
    entries.push({
      id,
      description,
      pattern: patternMatch?.[1] || '',
      files: filesMatch?.[1] || '*',
      action: (actionMatch?.[1]?.toUpperCase() as 'BLOCK' | 'WARN') || 'WARN',
      enabled: enabledMatch ? enabledMatch[1].toLowerCase() === 'true' : true,
    });
  }
  
  return entries;
}

/**
 * Format a rule entry for RULES.md
 */
export function formatRuleEntry(entry: RuleEntry): string {
  return `### [${entry.id}] ${entry.description}
- Pattern: \`${entry.pattern}\`
- Files: \`${entry.files}\`
- Action: ${entry.action}
- Enabled: ${entry.enabled}
`;
}

/**
 * Parse ATTEMPTS.md for blocked patterns
 * Format:
 * ### [timestamp] command
 * Error: message
 * DONT_RETRY: true/false
 */
export function parseAttempts(content: string): AttemptEntry[] {
  const entries: AttemptEntry[] = [];
  const blocks = content.split(/###\s+\[/);
  
  for (const block of blocks) {
    if (!block.trim()) continue;
    
    const headerMatch = block.match(/^([^\]]+)\]\s+(.+)/);
    if (!headerMatch) continue;
    
    const timestamp = headerMatch[1];
    const command = headerMatch[2].split('\n')[0].trim();
    
    const errorMatch = block.match(/Error:\s*(.+)/);
    const dontRetryMatch = block.match(/DONT_RETRY:\s*(true|false)/i);
    
    entries.push({
      timestamp,
      command,
      error: errorMatch?.[1] || '',
      dontRetry: dontRetryMatch?.[1]?.toLowerCase() === 'true',
    });
  }
  
  return entries;
}

/**
 * Format an attempt entry for ATTEMPTS.md
 */
export function formatAttemptEntry(entry: AttemptEntry): string {
  return `### [${entry.timestamp}] ${entry.command}
Error: ${entry.error}
DONT_RETRY: ${entry.dontRetry}
`;
}

/**
 * Parse ARCHITECTURE.md for patterns
 */
export function parseArchitecture(content: string): ArchitecturePattern[] {
  const patterns: ArchitecturePattern[] = [];
  const lines = content.split('\n');
  let currentSection = '';
  
  for (const line of lines) {
    if (line.startsWith('## ')) {
      currentSection = line.slice(3).trim().toLowerCase();
      continue;
    }
    
    // Pattern: - path/ [type] - rule1, rule2
    const patternMatch = line.match(/^-\s+(\S+)\s+\[([^\]]+)\](?:\s+-\s+(.+))?/);
    if (patternMatch) {
      patterns.push({
        path: patternMatch[1],
        type: patternMatch[2],
        rules: patternMatch[3] ? patternMatch[3].split(',').map(r => r.trim()) : [],
      });
    }
  }
  
  return patterns;
}

/**
 * Parse DISCOVERY.md for explored areas
 */
export function parseDiscovery(content: string): Set<string> {
  const explored = new Set<string>();
  const lines = content.split('\n');
  
  for (const line of lines) {
    // Format: - [x] path/to/area
    const match = line.match(/^-\s+\[x\]\s+(.+)/i);
    if (match) {
      explored.add(match[1].trim());
    }
  }
  
  return explored;
}

/**
 * Extract functions from source code
 */
export function extractFunctionsFromCode(code: string, filepath: string): FunctionEntry[] {
  const entries: FunctionEntry[] = [];
  const lines = code.split('\n');
  
  // TypeScript/JavaScript function patterns
  const patterns = [
    // function name(params): return
    /(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\(([^)]*)\)(?:\s*:\s*(\S+))?/,
    // const name = (params): return =>
    /(?:export\s+)?const\s+(\w+)\s*=\s*(?:async\s+)?\(([^)]*)\)(?:\s*:\s*(\S+))?\s*=>/,
    // name(params): return { (method)
    /^\s*(?:async\s+)?(\w+)\s*\(([^)]*)\)(?:\s*:\s*(\S+))?\s*\{/,
    // Python: def name(params) -> return:
    /def\s+(\w+)\s*\(([^)]*)\)(?:\s*->\s*(\S+))?:/,
    // PHP: function name(params): return
    /(?:public|private|protected)?\s*function\s+(\w+)\s*\(([^)]*)\)(?:\s*:\s*(\S+))?/,
  ];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    for (const pattern of patterns) {
      const match = line.match(pattern);
      if (match) {
        entries.push({
          name: match[1],
          file: filepath,
          line: i + 1,
          params: match[2]?.trim() || '',
          returnType: match[3]?.trim() || 'void',
          dependencies: [],
        });
        break;
      }
    }
  }
  
  return entries;
}

/**
 * Check for similar function signatures (duplicate detection)
 */
export function findSimilarFunctions(
  newFunc: FunctionEntry,
  existing: FunctionEntry[]
): FunctionEntry[] {
  return existing.filter(f => {
    // Same name is a potential duplicate
    if (f.name === newFunc.name) {
      return true;
    }
    
    // Similar params might indicate duplicate logic
    const newParams = newFunc.params.replace(/\s/g, '').toLowerCase();
    const existingParams = f.params.replace(/\s/g, '').toLowerCase();
    
    if (newParams === existingParams && newFunc.returnType === f.returnType) {
      return true;
    }
    
    return false;
  });
}


