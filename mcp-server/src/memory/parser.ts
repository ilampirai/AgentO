/**
 * Memory File Parsers
 * Parse markdown formats into structured data
 */

import type { FunctionEntry, RuleEntry, AttemptEntry, ArchitecturePattern, ClassEntry, MethodEntry } from '../types.js';

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
 * Extract classes and methods from source code
 */
export function extractClassesFromCode(code: string, filepath: string): ClassEntry[] {
  const entries: ClassEntry[] = [];
  const lines = code.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    const jsClassMatch = line.match(/\bclass\s+(\w+)(?:\s+extends\s+(\w+))?(?:\s+implements\s+([^{]+))?/);
    if (jsClassMatch) {
      const className = jsClassMatch[1];
      const extendsName = jsClassMatch[2];
      const implementsList = jsClassMatch[3]
        ? jsClassMatch[3].split(',').map(item => item.trim()).filter(Boolean)
        : [];
      const methodEntries: MethodEntry[] = [];

      let braceDepth = 0;
      let started = false;
      let endLine = lines.length - 1;

      for (let j = i; j < lines.length; j++) {
        const current = lines[j];
        for (const char of current) {
          if (char === '{') {
            braceDepth++;
            started = true;
          } else if (char === '}') {
            braceDepth--;
          }
        }
        if (started && braceDepth === 0) {
          endLine = j;
          break;
        }
      }

      for (let j = i + 1; j <= endLine; j++) {
        const methodLine = lines[j];
        const methodMatch = methodLine.match(
          /^\s*(?:public|private|protected)?\s*(?:static\s+)?(?:async\s+)?(\w+)\s*\(([^)]*)\)(?:\s*:\s*([^\s{]+))?\s*\{/
        );
        if (methodMatch) {
          methodEntries.push({
            name: methodMatch[1],
            line: j + 1,
            params: methodMatch[2]?.trim() || '',
            returnType: methodMatch[3]?.trim() || 'void',
          });
        }
      }

      entries.push({
        name: className,
        file: filepath,
        line: i + 1,
        extends: extendsName,
        implements: implementsList,
        methods: methodEntries,
      });

      i = endLine;
      continue;
    }

    const pyClassMatch = line.match(/^(\s*)class\s+(\w+)(?:\(([^)]*)\))?:/);
    if (pyClassMatch) {
      const classIndent = pyClassMatch[1].length;
      const className = pyClassMatch[2];
      const baseClass = pyClassMatch[3]?.split(',')[0]?.trim();
      const methodEntries: MethodEntry[] = [];

      for (let j = i + 1; j < lines.length; j++) {
        const nextLine = lines[j];
        if (!nextLine.trim()) continue;
        const indent = nextLine.match(/^(\s*)/)?.[1].length || 0;
        if (indent <= classIndent) {
          break;
        }
        const defMatch = nextLine.match(/^\s*def\s+(\w+)\s*\(([^)]*)\)(?:\s*->\s*(\S+))?:/);
        if (defMatch) {
          methodEntries.push({
            name: defMatch[1],
            line: j + 1,
            params: defMatch[2]?.trim() || '',
            returnType: defMatch[3]?.trim() || 'void',
          });
        }
      }

      entries.push({
        name: className,
        file: filepath,
        line: i + 1,
        extends: baseClass,
        implements: [],
        methods: methodEntries,
      });
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

/**
 * Extract function calls from code
 * Returns map of function name -> array of called function names
 */
export function extractCallGraph(
  code: string,
  functions: FunctionEntry[],
  classes: ClassEntry[]
): Map<string, string[]> {
  const callMap = new Map<string, string[]>();
  const lines = code.split('\n');
  
  // Build lookup maps
  const funcNames = new Set(functions.map(f => f.name));
  const classNames = new Set(classes.map(c => c.name));
  const methodNames = new Set<string>();
  for (const cls of classes) {
    for (const method of cls.methods) {
      methodNames.add(`${cls.name}.${method.name}`);
      methodNames.add(method.name);
    }
  }
  
  // Track current function/class context
  let currentFunction: string | null = null;
  let currentClass: string | null = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Detect function start
    const funcMatch = line.match(/(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\(/);
    if (funcMatch) {
      currentFunction = funcMatch[1];
      callMap.set(currentFunction, []);
      continue;
    }
    
    const arrowFuncMatch = line.match(/(?:export\s+)?const\s+(\w+)\s*=\s*(?:async\s+)?\(/);
    if (arrowFuncMatch) {
      currentFunction = arrowFuncMatch[1];
      callMap.set(currentFunction, []);
      continue;
    }
    
    // Detect class start
    const classMatch = line.match(/\bclass\s+(\w+)/);
    if (classMatch) {
      currentClass = classMatch[1];
      continue;
    }
    
    // Detect method start
    const methodMatch = line.match(/(?:public|private|protected)?\s*(?:static\s+)?(?:async\s+)?(\w+)\s*\(/);
    if (methodMatch && currentClass) {
      currentFunction = `${currentClass}.${methodMatch[1]}`;
      callMap.set(currentFunction, []);
      continue;
    }
    
    // Extract function calls
    if (currentFunction) {
      // Match function calls: name(...) or obj.name(...) or this.name(...)
      const callPatterns = [
        /\b(\w+)\s*\(/g,  // direct call
        /\.(\w+)\s*\(/g,  // method call
        /this\.(\w+)\s*\(/g,  // this method
      ];
      
      for (const pattern of callPatterns) {
        let match;
        while ((match = pattern.exec(line)) !== null) {
          const calledName = match[1];
          
          // Check if it's a known function/method
          if (funcNames.has(calledName) || methodNames.has(calledName)) {
            const existing = callMap.get(currentFunction) || [];
            if (!existing.includes(calledName)) {
              existing.push(calledName);
              callMap.set(currentFunction, existing);
            }
          }
        }
      }
    }
  }
  
  return callMap;
}



