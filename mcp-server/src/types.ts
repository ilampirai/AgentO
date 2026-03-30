/**
 * AgentO MCP Server Type Definitions
 */

// ─── Pattern system types ────────────────────────────────────────────────────

export type PatternCategory = 'function' | 'class' | 'datastructure' | 'route' | 'constant' | 'decorator' | 'hook';

export interface ExtractionPattern {
  id: string;                    // e.g., "fn-js-arrow", "rt-express-get"
  description: string;           // Human readable
  category: PatternCategory;
  regex: string;                 // JSON-serializable string (not RegExp)
  flags: string;                 // e.g., "" or "i"
  captures: {                    // Which capture groups map to what
    name: number;                // Required: group index for symbol name
    params?: number;
    returnType?: number;
    parentName?: number;         // For extends/parent
    path?: number;               // For route path
    method?: number;             // For HTTP method
  };
  fileExtensions: string[];      // e.g., [".ts", ".tsx"] — empty = all
  source: 'default' | 'discovered' | 'user';
  enabled: boolean;
  framework?: string;            // e.g., "express", "nestjs"
  priority?: number;             // Higher = checked first (default 0)
}

export interface DataStructureEntry {
  name: string;
  file: string;
  line: number;
  kind: string;                  // interface | type | enum | struct | model | record
  extends?: string;
  body: string;                  // Raw source of the definition
  fields: Array<{ name: string; type: string; description?: string }>;
  patternId: string;             // Which pattern found this
  usedBy: string[];              // Cross-ref: function names that reference this type
}

export interface RouteEntry {
  method: string;                // GET, POST, etc.
  path: string;                  // /api/users/:id
  handler?: string;              // Handler function name
  file: string;
  line: number;
  framework: string;
  patternId: string;
}

// ─── Memory file types ───────────────────────────────────────────────────────

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
  kind: 'function' | 'method' | 'class' | 'route' | 'datastructure';
  file: string;
  line?: number;
  signature?: string;
}

export interface FlowEdge {
  from: string;
  to: string;
  type: 'call' | 'import' | 'extend' | 'implement' | 'uses';
}

export interface FlowGraph {
  version: string;
  generated: string;
  nodes: Record<string, SymbolNode>;
  edges: FlowEdge[];
  entryPoints: string[];
}

// ─── Memory v6.0 types ──────────────────────────────────────────────────────

export interface DecisionEntry {
  id: string;
  timestamp: string;
  decision: string;
  alternatives: Array<{ option: string; rejected_reason: string }>;
  affected_flows: string[];
  affected_files: string[];
  confidence: number;
  branch?: string;
  override_of?: string;
}

export interface FlowProtectionEntry {
  id: string;
  name: string;
  description: string;
  steps: string[];
  files: string[];
  last_verified?: string;
}

export interface ObservationEntry {
  timestamp: string;
  type: 'WRITE_OVERRIDE' | 'NEW_FILE' | 'REPEATED_DECISION' | 'FLOW_CHECK';
  content: string;
  references?: string[];
}

export interface BranchContext {
  branch: string;
  base_branch: string;
  created: string;
  last_session: string;
  active_context: {
    working_on: string;
    recent_changes: string[];
    open_questions: string[];
    decisions_made_on_branch: string[];
  };
}

export interface MemoryConfig {
  compactionTTLDays: number;
  maxDecisionsLoaded: number;
  maxDecisionsStored: number;
  tokenBudgetWarn: number;
  autoContextOnWrite: boolean;
}

// Tool input types
export interface WriteInput {
  path: string;
  content: string;
  force?: boolean;
}

export interface ReadInput {
  path: string;
}

export interface BashInput {
  command: string;
  cwd?: string;
}

export interface MemoryInput {
  file?: string;
  action: 'read' | 'write' | 'append' | 'init' | 'context' | 'resume' | 'migrate';
  content?: string;
  resume_action?: 'start' | 'end' | 'switch_branch';
  branch?: string;
  summary?: string;
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
  ids?: string[];
  depth?: number;
  direction?: 'in' | 'out' | 'both';
  maxNodes?: number;
  maxEdges?: number;
  includeUnresolved?: boolean;
  protect_action?: 'define' | 'check' | 'verify' | 'list' | 'update';
  flow_name?: string;
  description?: string;
  steps?: string[];
  files?: string[];
  target_file?: string;
  flow_id?: string;
}

export interface SymbolInput {
  ids?: string[];
  name?: string;
  file?: string;
  kind?: 'function' | 'method' | 'class' | 'route' | 'datastructure';
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

export interface PatternsInput {
  action: 'list' | 'add' | 'remove' | 'test' | 'suggest' | 'approve' | 'reject';
  category?: PatternCategory;
  id?: string;
  pattern?: Partial<ExtractionPattern>;
  testCode?: string;
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

export interface DecideInput {
  action: 'record' | 'query' | 'check' | 'list' | 'why';
  decision?: string;
  alternatives?: Array<{ option: string; rejected_reason: string }>;
  affected_flows?: string[];
  affected_files?: string[];
  confidence?: number;
  question?: string;
  target_files?: string[];
  filter?: string;
  limit?: number;
  file?: string;
  symbol?: string;
}

export interface CompactInput {
  action: 'analyze' | 'propose' | 'approve' | 'reject' | 'status';
  proposal_id?: string;
  reject_reason?: string;
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
  strictMode: boolean;
  autoIndex: boolean;
  autoMemoryUpdate: boolean;
  deferIndex: boolean;
  patterns: ExtractionPattern[];
  memory: MemoryConfig;
  language?: string;
  [key: string]: string | number | boolean | ExtractionPattern[] | MemoryConfig | undefined;
}

// Tool result type
export interface ToolResult {
  success: boolean;
  message: string;
  data?: unknown;
  error?: string;
}

// DEPRECATED: Use resolveMemoryPath() from memory/resolver.ts for new code.
// Kept for backward compat during migration. Will be removed in v7.0.
export const MEMORY_FILES = {
  FUNCTIONS: '.agenticMemory/surface/FUNCTIONS.md',
  RULES: '.agenticMemory/RULES.md',
  ARCHITECTURE: '.agenticMemory/core/ARCHITECTURE.md',
  DISCOVERY: '.agenticMemory/working/DISCOVERY.md',
  ATTEMPTS: '.agenticMemory/working/ATTEMPTS.md',
  ERRORS: '.agenticMemory/surface/ERRORS.md',
  VERSIONS: '.agenticMemory/surface/VERSIONS.md',
  DATASTRUCTURE: '.agenticMemory/surface/DATASTRUCTURE.md',
  PROJECT_MAP: '.agenticMemory/surface/PROJECT_MAP.md',
  FLOW_GRAPH: '.agenticMemory/surface/FLOW_GRAPH.json',
  CONFIG: '.agenticMemory/config.json',
  DIRTY: '.agenticMemory/.dirty',
} as const;

// Default config - user defines rules
export const DEFAULT_CONFIG: AgentOConfig = {
  strictMode: true,
  autoIndex: true,
  autoMemoryUpdate: true,
  deferIndex: true,
  patterns: [],
  memory: {
    compactionTTLDays: 14,
    maxDecisionsLoaded: 10,
    maxDecisionsStored: 0,
    tokenBudgetWarn: 8000,
    autoContextOnWrite: true,
  },
};
