/**
 * AgentO MCP Server Type Definitions
 */

// Memory file types
export interface FunctionEntry {
  name: string;
  file: string;
  line?: number;
  params: string;
  returnType: string;
  dependencies: string[];
  className?: string;     // Class this method belongs to (if any)
  parentClass?: string;   // Parent class name (if className extends something)
}

export interface MethodEntry {
  name: string;
  line?: number;
  params: string;
  returnType: string;
}

export interface ClassEntry {
  name: string;
  file: string;
  line?: number;
  extends?: string;
  implements?: string[];
  methods: MethodEntry[];
}

export interface RuleEntry {
  id: string;
  description: string;
  pattern: string;
  files: string;
  action: 'BLOCK' | 'WARN';
  enabled: boolean;
}

export interface ArchitecturePattern {
  path: string;
  type: string;
  rules: string[];
}

export interface AttemptEntry {
  timestamp: string;
  command: string;
  error: string;
  dontRetry: boolean;
}

export interface ErrorEntry {
  id: string;
  error: string;
  solution: string;
  files: string[];
}

// Duplicate detection types
export type DuplicateTier = 'exact' | 'cross-file' | 'override' | 'interface-impl' | 'common-name' | 'similar-sig';

export interface DuplicateResult {
  tier: DuplicateTier;
  existing: FunctionEntry;
  action: 'BLOCK' | 'WARN' | 'SKIP' | 'INFO';
}

// Flow graph types
export interface SymbolNode {
  id: string;
  name: string;
  kind: 'function' | 'method' | 'class';
  file: string;
  line?: number;
  signature?: string;
}

export interface FlowEdge {
  from: string;
  to: string;
  type: 'call' | 'import' | 'extend' | 'implement';
}

export interface FlowGraph {
  version: string;
  generated: string;
  nodes: Record<string, SymbolNode>;
  edges: FlowEdge[];
  entryPoints: string[];
}

// Tool input types
export interface WriteInput {
  path: string;
  content: string;
}

export interface ReadInput {
  path: string;
}

export interface BashInput {
  command: string;
  cwd?: string;
}

export interface MemoryInput {
  file: string;
  action: 'read' | 'write' | 'append' | 'init';
  content?: string;
}

export interface RulesInput {
  action: 'list' | 'add' | 'remove' | 'edit' | 'enable' | 'disable';
  id?: string;
  description?: string;
  pattern?: string;
  files?: string;
  ruleAction?: 'BLOCK' | 'WARN';
}

export interface FunctionsInput {
  query?: string;
  file?: string;
  checkDuplicates?: boolean;
  code?: string;
}

export interface FlowInput {
  ids: string[];
  depth?: number;
  direction?: 'in' | 'out' | 'both';
  maxNodes?: number;
  maxEdges?: number;
  includeUnresolved?: boolean;
}

export interface SymbolInput {
  ids?: string[];
  name?: string;
  file?: string;
  kind?: 'function' | 'method' | 'class';
  limit?: number;
}

export interface EntryPointsInput {
  query: string;
  kind?: 'route' | 'handler' | 'command' | 'all';
}

export interface IndexInput {
  path?: string;
  force?: boolean;
}

export interface ConfigInput {
  action: 'get' | 'set' | 'reset' | 'status';
  key?: string;
  value?: string | number | boolean;
}

export interface SearchInput {
  query: string;
  type?: 'content' | 'files' | 'functions';
  path?: string;
  include?: string;
  exclude?: string;
  maxResults?: number;
}

// Environment type (detected during init)
export interface EnvironmentInfo {
  // OS
  os: 'win32' | 'linux' | 'darwin';
  osName: string;
  arch: string;
  pathSeparator: '\\' | '/';
  lineEnding: 'CRLF' | 'LF';

  // Shell
  shell: string;
  shellType: 'powershell' | 'cmd' | 'bash' | 'zsh' | 'fish' | 'unknown';

  // Command mappings (os-specific)
  commands: {
    list: string;
    remove: string;
    copy: string;
    move: string;
    read: string;
    find: string;
    clear: string;
    mkdir: string;
    touch: string;
    grep: string;
  };

  // Dev tools (null if not installed)
  tools: {
    node: string | null;
    npm: string | null;
    yarn: string | null;
    pnpm: string | null;
    python: string | null;
    pip: string | null;
    git: string | null;
    docker: string | null;
  };

  // Project context
  project: {
    type: 'node' | 'python' | 'php' | 'rust' | 'go' | 'java' | 'mixed' | 'unknown';
    packageManager: string | null;
    hasLockfile: boolean;
    frameworks: string[];
  };

  // Runtime paths
  paths: {
    cwd: string;
    home: string;
    temp: string;
  };

  // Detected at init time
  detectedAt: string;
}

// Config type
export interface AgentOConfig {
  lineLimit: number;
  strictMode: boolean;
  autoIndex: boolean;
  autoMemoryUpdate: boolean;
  deferIndex: boolean;
  [key: string]: string | number | boolean;
}

// Tool result type
export interface ToolResult {
  success: boolean;
  message: string;
  data?: unknown;
  error?: string;
}

// Memory file paths
export const MEMORY_FILES = {
  FUNCTIONS: '.agenticMemory/FUNCTIONS.md',
  RULES: '.agenticMemory/RULES.md',
  ARCHITECTURE: '.agenticMemory/ARCHITECTURE.md',
  DISCOVERY: '.agenticMemory/DISCOVERY.md',
  ATTEMPTS: '.agenticMemory/ATTEMPTS.md',
  ERRORS: '.agenticMemory/ERRORS.md',
  VERSIONS: '.agenticMemory/VERSIONS.md',
  DATASTRUCTURE: '.agenticMemory/DATASTRUCTURE.md',
  PROJECT_MAP: '.agenticMemory/PROJECT_MAP.md',
  FLOW_GRAPH: '.agenticMemory/FLOW_GRAPH.json',
  CONFIG: '.agenticMemory/config.json',
  DIRTY: '.agenticMemory/.dirty',
} as const;

// Default config - no line limit by default, user defines rules
export const DEFAULT_CONFIG: AgentOConfig = {
  lineLimit: 0,
  strictMode: true,
  autoIndex: true,
  autoMemoryUpdate: true,
  deferIndex: true,
};
