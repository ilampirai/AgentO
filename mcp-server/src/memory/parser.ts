/**
 * Memory File Parsers
 * Parse markdown formats into structured data
 */

import type {
  FunctionEntry,
  RuleEntry,
  AttemptEntry,
  ArchitecturePattern,
  ClassEntry,
  MethodEntry,
  DuplicateResult,
} from '../types.js';

// ─── Common method names that should NEVER trigger duplicate warnings ─────────
const COMMON_METHOD_NAMES = new Set([
  'constructor', 'toString', 'toJSON', 'valueOf', 'render',
  'componentDidMount', 'componentDidUpdate', 'componentWillUnmount',
  'setUp', 'tearDown', 'beforeEach', 'afterEach', 'beforeAll', 'afterAll',
  'get', 'set', 'init', 'destroy', 'reset', 'handle', 'dispose',
  'connect', 'disconnect', 'start', 'stop', 'open', 'close',
  'serialize', 'deserialize', 'validate', 'parse', 'format',
  'clone', 'equals', 'compare', 'hash', 'update', 'delete',
  'create', 'read', 'find', 'save', 'remove', 'clear',
  'send', 'receive', 'emit', 'on', 'off', 'once',
  'map', 'filter', 'reduce', 'forEach',
  'setup', 'cleanup', 'configure', 'initialize',
  'build', 'run', 'execute', 'process', 'transform',
  'load', 'fetch', 'refresh', 'apply', 'register',
  'mount', 'unmount', 'attach', 'detach',
  'enable', 'disable', 'show', 'hide', 'toggle',
  'test', 'describe', 'it', 'expect',
]);

// ─── Class boundary detection (used by extractFunctionsFromCode) ──────────────

interface ClassBoundary {
  name: string;
  parentClass?: string;
  implements?: string[];
  startLine: number;
  endLine: number;
}

function findClassBoundaries(lines: string[]): ClassBoundary[] {
  const boundaries: ClassBoundary[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // JS/TS class
    const jsMatch = line.match(
      /\bclass\s+(\w+)(?:\s+extends\s+(\w+))?(?:\s+implements\s+([^{]+))?/
    );
    if (jsMatch) {
      const name = jsMatch[1];
      const parentClass = jsMatch[2];
      const implementsList = jsMatch[3]
        ? jsMatch[3].split(',').map(s => s.trim()).filter(Boolean)
        : [];

      let braceDepth = 0;
      let started = false;
      let endLine = lines.length - 1;

      for (let j = i; j < lines.length; j++) {
        for (const char of lines[j]) {
          if (char === '{') { braceDepth++; started = true; }
          else if (char === '}') { braceDepth--; }
        }
        if (started && braceDepth === 0) { endLine = j; break; }
      }

      boundaries.push({ name, parentClass, implements: implementsList, startLine: i, endLine });
      continue;
    }

    // Python class
    const pyMatch = line.match(/^(\s*)class\s+(\w+)(?:\(([^)]*)\))?:/);
    if (pyMatch) {
      const indent = pyMatch[1].length;
      const name = pyMatch[2];
      const baseClass = pyMatch[3]?.split(',')[0]?.trim();

      let endLine = lines.length - 1;
      for (let j = i + 1; j < lines.length; j++) {
        if (!lines[j].trim()) continue;
        const nextIndent = lines[j].match(/^(\s*)/)?.[1].length || 0;
        if (nextIndent <= indent) { endLine = j - 1; break; }
      }

      boundaries.push({ name, parentClass: baseClass, startLine: i, endLine });
    }
  }

  return boundaries;
}

// ─── Parse FUNCTIONS.md ───────────────────────────────────────────────────────

/**
 * Parse FUNCTIONS.md into structured entries
 * Format: F:functionName(params):returnType [C:ClassName] [L1:dep1,dep2]
 * The [C:...] tag is optional (backward compatible)
 */
export function parseFunctions(content: string): FunctionEntry[] {
  const entries: FunctionEntry[] = [];
  const lines = content.split('\n');
  let currentFile = '';

  for (const line of lines) {
    if (line.startsWith('## ')) {
      currentFile = line.slice(3).trim();
      continue;
    }

    const funcMatch = line.match(
      /^F:(\w+)\(([^)]*)\):(\S+)(?:\s+\[C:([^\]]*)\])?(?:\s+\[L1:([^\]]*)\])?/
    );
    if (funcMatch && currentFile) {
      const className = funcMatch[4] || undefined;
      entries.push({
        name: funcMatch[1],
        file: currentFile,
        params: funcMatch[2],
        returnType: funcMatch[3],
        className,
        parentClass: undefined,
        dependencies: funcMatch[5] ? funcMatch[5].split(',').map(d => d.trim()) : [],
      });
    }
  }

  return entries;
}

/**
 * Format a function entry for FUNCTIONS.md
 * Includes [C:ClassName] when the function belongs to a class
 */
export function formatFunctionEntry(entry: FunctionEntry): string {
  const classTag = entry.className ? ` [C:${entry.className}]` : '';
  const deps = entry.dependencies.length > 0
    ? ` [L1:${entry.dependencies.join(',')}]`
    : '';
  return `F:${entry.name}(${entry.params}):${entry.returnType}${classTag}${deps}`;
}

// ─── Rules parsing ────────────────────────────────────────────────────────────

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

export function formatRuleEntry(entry: RuleEntry): string {
  return `### [${entry.id}] ${entry.description}
- Pattern: \`${entry.pattern}\`
- Files: \`${entry.files}\`
- Action: ${entry.action}
- Enabled: ${entry.enabled}
`;
}

// ─── Attempts parsing ─────────────────────────────────────────────────────────

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

export function formatAttemptEntry(entry: AttemptEntry): string {
  return `### [${entry.timestamp}] ${entry.command}
Error: ${entry.error}
DONT_RETRY: ${entry.dontRetry}
`;
}

// ─── Architecture parsing ─────────────────────────────────────────────────────

export function parseArchitecture(content: string): ArchitecturePattern[] {
  const patterns: ArchitecturePattern[] = [];
  const lines = content.split('\n');

  for (const line of lines) {
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

// ─── Discovery parsing ───────────────────────────────────────────────────────

export function parseDiscovery(content: string): Set<string> {
  const explored = new Set<string>();
  const lines = content.split('\n');

  for (const line of lines) {
    const match = line.match(/^-\s+\[x\]\s+(.+)/i);
    if (match) {
      explored.add(match[1].trim());
    }
  }

  return explored;
}

// ─── Function extraction (class-aware) ────────────────────────────────────────

/**
 * Extract functions from source code with class context.
 * Methods inside class bodies get className and parentClass populated.
 */
export function extractFunctionsFromCode(code: string, filepath: string): FunctionEntry[] {
  const entries: FunctionEntry[] = [];
  const lines = code.split('\n');
  const boundaries = findClassBoundaries(lines);

  const patterns = [
    // function name(params): return
    /(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\(([^)]*)\)(?:\s*:\s*(\S+))?/,
    // const name = (params): return =>
    /(?:export\s+)?const\s+(\w+)\s*=\s*(?:async\s+)?\(([^)]*)\)(?:\s*:\s*(\S+))?\s*=>/,
    // name(params): return { (method in class body)
    /^\s*(?:public\s+|private\s+|protected\s+)?(?:static\s+)?(?:async\s+)?(\w+)\s*\(([^)]*)\)(?:\s*:\s*(\S+))?\s*\{/,
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
        const entry: FunctionEntry = {
          name: match[1],
          file: filepath,
          line: i + 1,
          params: match[2]?.trim() || '',
          returnType: match[3]?.trim() || 'void',
          dependencies: [],
        };

        // Check if this line falls within a class boundary
        const classBoundary = boundaries.find(b => i >= b.startLine && i <= b.endLine);
        if (classBoundary) {
          entry.className = classBoundary.name;
          entry.parentClass = classBoundary.parentClass;
        }

        entries.push(entry);
        break;
      }
    }
  }

  return entries;
}

// ─── Class extraction ─────────────────────────────────────────────────────────

export function extractClassesFromCode(code: string, filepath: string): ClassEntry[] {
  const entries: ClassEntry[] = [];
  const lines = code.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    const jsClassMatch = line.match(
      /\bclass\s+(\w+)(?:\s+extends\s+(\w+))?(?:\s+implements\s+([^{]+))?/
    );
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
        for (const char of lines[j]) {
          if (char === '{') { braceDepth++; started = true; }
          else if (char === '}') { braceDepth--; }
        }
        if (started && braceDepth === 0) { endLine = j; break; }
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
        if (indent <= classIndent) break;
        const defMatch = nextLine.match(
          /^\s*def\s+(\w+)\s*\(([^)]*)\)(?:\s*->\s*(\S+))?:/
        );
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

// ─── Tiered duplicate detection ───────────────────────────────────────────────

/**
 * Check if two classes are related through inheritance.
 */
function isInheritanceRelated(
  classA: string,
  classB: string,
  parentA: string | undefined,
  parentB: string | undefined,
  allEntries: FunctionEntry[],
): boolean {
  if (parentA === classB || parentB === classA) return true;

  const visitedA = new Set<string>();
  let current = parentA;
  while (current && !visitedA.has(current)) {
    visitedA.add(current);
    if (current === classB) return true;
    const entry = allEntries.find(e => e.className === current && e.parentClass);
    current = entry?.parentClass;
  }

  const visitedB = new Set<string>();
  current = parentB;
  while (current && !visitedB.has(current)) {
    visitedB.add(current);
    if (current === classA) return true;
    const entry = allEntries.find(e => e.className === current && e.parentClass);
    current = entry?.parentClass;
  }

  return false;
}

/**
 * Tiered duplicate detection.
 * Skips overrides, common names. Only returns actionable results.
 */
export function findDuplicates(
  newFunc: FunctionEntry,
  existing: FunctionEntry[],
): DuplicateResult[] {
  if (COMMON_METHOD_NAMES.has(newFunc.name)) {
    return [];
  }

  const results: DuplicateResult[] = [];

  for (const f of existing) {
    if (f.file === newFunc.file) continue;

    if (f.name === newFunc.name) {
      if (newFunc.className && f.className) {
        if (newFunc.className === f.className) continue;

        if (isInheritanceRelated(
          newFunc.className, f.className,
          newFunc.parentClass, f.parentClass,
          existing,
        )) {
          continue;
        }

        results.push({ tier: 'cross-file', existing: f, action: 'INFO' });
        continue;
      }

      if (newFunc.className || f.className) {
        results.push({ tier: 'cross-file', existing: f, action: 'INFO' });
        continue;
      }

      results.push({ tier: 'cross-file', existing: f, action: 'WARN' });
      continue;
    }

    if (newFunc.params && f.params) {
      const newParams = newFunc.params.replace(/\s/g, '').toLowerCase();
      const existingParams = f.params.replace(/\s/g, '').toLowerCase();
      if (newParams === existingParams && newFunc.returnType === f.returnType && newParams.length > 0) {
        results.push({ tier: 'similar-sig', existing: f, action: 'INFO' });
      }
    }
  }

  return results;
}

/**
 * Legacy wrapper for backward compatibility.
 */
export function findSimilarFunctions(
  newFunc: FunctionEntry,
  existing: FunctionEntry[],
): FunctionEntry[] {
  const results = findDuplicates(newFunc, existing);
  return results
    .filter(r => r.action === 'WARN' || r.action === 'BLOCK')
    .map(r => r.existing);
}

// ─── Call graph extraction ────────────────────────────────────────────────────

export function extractCallGraph(
  code: string,
  functions: FunctionEntry[],
  classes: ClassEntry[],
): Map<string, string[]> {
  const callMap = new Map<string, string[]>();
  const lines = code.split('\n');

  const funcNames = new Set(functions.map(f => f.name));
  const methodNames = new Set<string>();
  for (const cls of classes) {
    for (const method of cls.methods) {
      methodNames.add(`${cls.name}.${method.name}`);
      methodNames.add(method.name);
    }
  }

  let currentFunction: string | null = null;
  let currentClass: string | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

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

    const classMatch = line.match(/\bclass\s+(\w+)/);
    if (classMatch) {
      currentClass = classMatch[1];
      continue;
    }

    const methodMatch = line.match(
      /(?:public|private|protected)?\s*(?:static\s+)?(?:async\s+)?(\w+)\s*\(/
    );
    if (methodMatch && currentClass) {
      currentFunction = `${currentClass}.${methodMatch[1]}`;
      callMap.set(currentFunction, []);
      continue;
    }

    if (currentFunction) {
      const callPatterns = [
        /\b(\w+)\s*\(/g,
        /\.(\w+)\s*\(/g,
        /this\.(\w+)\s*\(/g,
      ];

      for (const pattern of callPatterns) {
        let match;
        while ((match = pattern.exec(line)) !== null) {
          const calledName = match[1];
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
