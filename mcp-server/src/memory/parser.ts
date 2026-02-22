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
  ExtractionPattern,
  DataStructureEntry,
  RouteEntry,
  PatternCategory,
} from '../types.js';
import { DEFAULT_PATTERNS } from '../patterns.js';
import * as path from 'path';

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

// ─── Dynamic pattern system ──────────────────────────────────────────────────

/**
 * Merge default patterns with config patterns, filter by extension & category,
 * sort by priority descending, and compile regex strings to RegExp.
 */
export function getApplicablePatterns(
  fileExtension: string,
  category: PatternCategory | null,
  configPatterns: ExtractionPattern[] = [],
): { pattern: ExtractionPattern; compiled: RegExp }[] {
  // Build merged map: config overrides defaults by ID
  const merged = new Map<string, ExtractionPattern>();
  for (const p of DEFAULT_PATTERNS) {
    merged.set(p.id, p);
  }
  for (const p of configPatterns) {
    merged.set(p.id, p);
  }

  const results: { pattern: ExtractionPattern; compiled: RegExp }[] = [];

  for (const p of merged.values()) {
    if (!p.enabled) continue;
    if (category && p.category !== category) continue;
    if (p.fileExtensions.length > 0 && !p.fileExtensions.includes(fileExtension)) continue;

    try {
      const compiled = new RegExp(p.regex, p.flags);
      results.push({ pattern: p, compiled });
    } catch {
      // Invalid regex — skip silently
    }
  }

  // Sort by priority descending (higher = checked first)
  results.sort((a, b) => (b.pattern.priority || 0) - (a.pattern.priority || 0));

  return results;
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

// ─── Parse DATASTRUCTURE.md ─────────────────────────────────────────────────

/**
 * Parse DATASTRUCTURE.md into structured entries
 * Format:
 *   ## filepath
 *   DS:Name [kind] @ line N
 *   Fields:
 *   - fieldName: fieldType
 *   Used by: func1, func2
 */
export function parseDataStructures(content: string): DataStructureEntry[] {
  const entries: DataStructureEntry[] = [];
  const lines = content.split('\n');
  let currentFile = '';
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith('## ')) {
      currentFile = line.slice(3).trim();
      i++;
      continue;
    }

    const dsMatch = line.match(/^DS:(\w+)\s+\[(\w+)\]\s+@\s+line\s+(\d+)(?:\s+extends\s+(\w+))?(?:\s+\{(\w+)\})?/);
    if (dsMatch && currentFile) {
      const entry: DataStructureEntry = {
        name: dsMatch[1],
        file: currentFile,
        line: parseInt(dsMatch[3], 10),
        kind: dsMatch[2],
        extends: dsMatch[4] || undefined,
        body: '',
        fields: [],
        patternId: dsMatch[5] || '',
        usedBy: [],
      };

      i++;

      // Read body (code block)
      if (i < lines.length && lines[i]?.startsWith('```')) {
        i++;
        const bodyLines: string[] = [];
        while (i < lines.length && !lines[i].startsWith('```')) {
          bodyLines.push(lines[i]);
          i++;
        }
        entry.body = bodyLines.join('\n');
        if (i < lines.length) i++; // skip closing ```
      }

      // Read fields
      if (i < lines.length && lines[i]?.startsWith('Fields:')) {
        i++;
        while (i < lines.length && lines[i]?.startsWith('- ')) {
          const fieldMatch = lines[i].match(/^-\s+(\w+):\s*(.+)/);
          if (fieldMatch) {
            entry.fields.push({ name: fieldMatch[1], type: fieldMatch[2].trim() });
          }
          i++;
        }
      }

      // Read usedBy
      if (i < lines.length && lines[i]?.startsWith('Used by:')) {
        const usedByStr = lines[i].slice('Used by:'.length).trim();
        entry.usedBy = usedByStr.split(',').map(s => s.trim()).filter(Boolean);
        i++;
      }

      entries.push(entry);
      continue;
    }

    i++;
  }

  return entries;
}

/**
 * Format a DataStructureEntry for DATASTRUCTURE.md
 */
export function formatDataStructureEntry(entry: DataStructureEntry): string {
  const ext = entry.extends ? ` extends ${entry.extends}` : '';
  const pid = entry.patternId ? ` {${entry.patternId}}` : '';
  let out = `DS:${entry.name} [${entry.kind}] @ line ${entry.line}${ext}${pid}\n`;

  if (entry.body) {
    out += '```\n' + entry.body + '\n```\n';
  }

  if (entry.fields.length > 0) {
    out += 'Fields:\n';
    for (const f of entry.fields) {
      out += `- ${f.name}: ${f.type}\n`;
    }
  }

  if (entry.usedBy.length > 0) {
    out += `Used by: ${entry.usedBy.join(', ')}\n`;
  }

  return out;
}

// ─── Parse routes from PROJECT_MAP.md ────────────────────────────────────────

/**
 * Parse route entries from the ## Routes section of PROJECT_MAP.md
 * Format: RT: METHOD /path -> handler @ file:line [framework]
 */
export function parseRoutes(content: string): RouteEntry[] {
  const entries: RouteEntry[] = [];
  const lines = content.split('\n');

  for (const line of lines) {
    const rtMatch = line.match(
      /^RT:\s+(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS)\s+(\S+)\s+->\s+(\w+)\s+@\s+([^:]+):(\d+)\s+\[(\w+)\]/i
    );
    if (rtMatch) {
      entries.push({
        method: rtMatch[1].toUpperCase(),
        path: rtMatch[2],
        handler: rtMatch[3],
        file: rtMatch[4],
        line: parseInt(rtMatch[5], 10),
        framework: rtMatch[6],
        patternId: '',
      });
    }
  }

  return entries;
}

/**
 * Format a RouteEntry for PROJECT_MAP.md
 */
export function formatRouteEntry(entry: RouteEntry): string {
  const handler = entry.handler || 'anonymous';
  return `RT: ${entry.method.toUpperCase()} ${entry.path} -> ${handler} @ ${entry.file}:${entry.line} [${entry.framework}]`;
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

// ─── Function extraction (class-aware, dynamic patterns) ──────────────────────

/**
 * Extract functions from source code with class context.
 * Uses dynamic patterns merged from defaults + config.
 * Methods inside class bodies get className and parentClass populated.
 */
export function extractFunctionsFromCode(
  code: string,
  filepath: string,
  configPatterns: ExtractionPattern[] = [],
): FunctionEntry[] {
  const entries: FunctionEntry[] = [];
  const lines = code.split('\n');
  const boundaries = findClassBoundaries(lines);
  const ext = path.extname(filepath).toLowerCase();

  // Get applicable function + hook patterns
  const fnPatterns = getApplicablePatterns(ext, 'function', configPatterns);
  const hookPatterns = getApplicablePatterns(ext, 'hook', configPatterns);
  const allPatterns = [...hookPatterns, ...fnPatterns]; // hooks checked first (higher priority)

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    for (const { pattern: p, compiled } of allPatterns) {
      const match = line.match(compiled);
      if (match) {
        // Use first non-undefined capture group for name (hook patterns use group 1 or 2)
        const nameIdx = p.captures.name;
        const rawName = match[nameIdx] || match[nameIdx + 1];
        if (!rawName) break; // no name captured

        const paramsIdx = p.captures.params;
        const retIdx = p.captures.returnType;

        const entry: FunctionEntry = {
          name: rawName,
          file: filepath,
          line: i + 1,
          params: (paramsIdx ? match[paramsIdx]?.trim() : '') || '',
          returnType: (retIdx ? match[retIdx]?.trim() : '') || 'void',
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

// ─── Data structure extraction ───────────────────────────────────────────────

/**
 * Extract data structures (interfaces, types, enums, structs, etc.) from source code.
 * Uses dynamic patterns to detect definition start, then extracts body via
 * brace-depth tracking (for { } languages) or indent tracking (for Python).
 */
export function extractDataStructuresFromCode(
  code: string,
  filepath: string,
  configPatterns: ExtractionPattern[] = [],
): DataStructureEntry[] {
  const entries: DataStructureEntry[] = [];
  const lines = code.split('\n');
  const ext = path.extname(filepath).toLowerCase();
  const isPython = ext === '.py';

  const dsPatterns = getApplicablePatterns(ext, 'datastructure', configPatterns);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    for (const { pattern: p, compiled } of dsPatterns) {
      const match = line.match(compiled);
      if (!match) continue;

      const nameIdx = p.captures.name;
      const name = match[nameIdx];
      if (!name) continue;

      const parentIdx = p.captures.parentName;
      const parentName = parentIdx ? match[parentIdx] : undefined;

      // Determine kind from pattern ID
      let kind = 'unknown';
      const idLower = p.id.toLowerCase();
      if (idLower.includes('interface')) kind = 'interface';
      else if (idLower.includes('type')) kind = 'type';
      else if (idLower.includes('enum')) kind = 'enum';
      else if (idLower.includes('struct')) kind = 'struct';
      else if (idLower.includes('record')) kind = 'record';
      else if (idLower.includes('dataclass') || idLower.includes('pydantic') || idLower.includes('model')) kind = 'model';
      else kind = p.category;

      // Extract body
      let body = '';
      const fields: Array<{ name: string; type: string }> = [];

      if (isPython) {
        // Python: indent-based body extraction
        const baseIndent = (line.match(/^(\s*)/)?.[1].length) || 0;
        const bodyLines: string[] = [line];
        let j = i + 1;
        while (j < lines.length) {
          if (!lines[j].trim()) { bodyLines.push(''); j++; continue; }
          const indent = (lines[j].match(/^(\s*)/)?.[1].length) || 0;
          if (indent <= baseIndent) break;
          bodyLines.push(lines[j]);
          // Extract Python fields: name: Type or name = value
          const fieldMatch = lines[j].match(/^\s+(\w+)\s*:\s*(\S+)/);
          if (fieldMatch) {
            fields.push({ name: fieldMatch[1], type: fieldMatch[2] });
          }
          j++;
        }
        body = bodyLines.join('\n');
      } else {
        // Brace-based body extraction
        let braceDepth = 0;
        let started = false;
        const bodyLines: string[] = [];

        for (let j = i; j < lines.length; j++) {
          bodyLines.push(lines[j]);
          for (const char of lines[j]) {
            if (char === '{') { braceDepth++; started = true; }
            else if (char === '}') { braceDepth--; }
          }
          if (started && braceDepth === 0) break;
          // Safety: don't go beyond 200 lines for a single definition
          if (j - i > 200) break;
        }
        body = bodyLines.join('\n');

        // Extract fields from body (TS/JS interface/type fields)
        for (const bodyLine of bodyLines) {
          // TS: fieldName: Type; or fieldName?: Type;
          const tsField = bodyLine.match(/^\s+(\w+)\??\s*:\s*([^;=]+)/);
          if (tsField) {
            fields.push({ name: tsField[1], type: tsField[2].trim().replace(/[,;]$/, '') });
          }
          // Go struct: FieldName Type `json:"..."`
          if (ext === '.go') {
            const goField = bodyLine.match(/^\s+(\w+)\s+(\S+)/);
            if (goField && goField[1][0] === goField[1][0].toUpperCase()) {
              fields.push({ name: goField[1], type: goField[2] });
            }
          }
          // Rust struct: pub field_name: Type,
          if (ext === '.rs') {
            const rsField = bodyLine.match(/^\s+(?:pub\s+)?(\w+)\s*:\s*([^,]+)/);
            if (rsField) {
              fields.push({ name: rsField[1], type: rsField[2].trim() });
            }
          }
        }
      }

      entries.push({
        name,
        file: filepath,
        line: i + 1,
        kind,
        extends: parentName || undefined,
        body,
        fields,
        patternId: p.id,
        usedBy: [],
      });

      break; // Only one pattern match per line
    }
  }

  return entries;
}

// ─── Route extraction ────────────────────────────────────────────────────────

/**
 * Extract route definitions from source code.
 * Uses dynamic patterns to detect route registrations.
 * Looks ahead for handler function name when not captured by the pattern.
 */
export function extractRoutesFromCode(
  code: string,
  filepath: string,
  configPatterns: ExtractionPattern[] = [],
): RouteEntry[] {
  const entries: RouteEntry[] = [];
  const lines = code.split('\n');
  const ext = path.extname(filepath).toLowerCase();

  const rtPatterns = getApplicablePatterns(ext, 'route', configPatterns);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    for (const { pattern: p, compiled } of rtPatterns) {
      const match = line.match(compiled);
      if (!match) continue;

      const methodIdx = p.captures.method;
      const pathIdx = p.captures.path;

      const method = (methodIdx ? match[methodIdx] : 'GET')?.toUpperCase() || 'GET';
      const routePath = (pathIdx ? match[pathIdx] : '') || '/';

      // Try to find handler function name
      let handler: string | undefined;

      // Look for handler in the same line: ..., handlerName) or ..., handlerName,
      const handlerMatch = line.match(/,\s*(\w+)\s*[),]/);
      if (handlerMatch) {
        handler = handlerMatch[1];
      }

      // For decorator-style routes (FastAPI, NestJS, Flask), look at next line for function
      if (!handler && (line.trim().startsWith('@') || line.trim().startsWith('export'))) {
        for (let j = i + 1; j < Math.min(i + 3, lines.length); j++) {
          const nextFunc = lines[j].match(/(?:async\s+)?(?:def|function)\s+(\w+)/);
          if (nextFunc) {
            handler = nextFunc[1];
            break;
          }
          // NestJS: method name before (
          const nextMethod = lines[j].match(/^\s*(?:async\s+)?(\w+)\s*\(/);
          if (nextMethod) {
            handler = nextMethod[1];
            break;
          }
        }
      }

      // For Next.js API routes, the method IS the handler name
      if (!handler && p.framework === 'nextjs') {
        handler = method;
      }

      entries.push({
        method,
        path: routePath,
        handler,
        file: filepath,
        line: i + 1,
        framework: p.framework || 'unknown',
        patternId: p.id,
      });

      break;
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

// ─── Cross-referencing: type → function linking ──────────────────────────────

/**
 * For each DataStructureEntry, scan all function signatures for references
 * to the type name. Populates the `usedBy` field.
 */
export function crossReferenceTypes(
  dataStructures: DataStructureEntry[],
  functions: FunctionEntry[],
): void {
  for (const ds of dataStructures) {
    const typeName = ds.name;
    const usedBy: string[] = [];

    for (const func of functions) {
      // Check params and return type for references to this type
      if (func.params.includes(typeName) || func.returnType.includes(typeName)) {
        usedBy.push(func.name);
      }
    }

    ds.usedBy = usedBy;
  }
}
