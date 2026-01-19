/**
 * AgentO MCP Server Type Definitions
 */
export interface FunctionEntry {
    name: string;
    file: string;
    line?: number;
    params: string;
    returnType: string;
    dependencies: string[];
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
export interface LoopState {
    active: boolean;
    task: string;
    completionMarker: string;
    maxIterations: number;
    currentIteration: number;
    startedAt: string;
    history: LoopIteration[];
}
export interface LoopIteration {
    iteration: number;
    output: string;
    completed: boolean;
    timestamp: string;
}
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
export interface LoopInput {
    task: string;
    until: string;
    max?: number;
    testCommand?: string;
}
export interface TestInput {
    framework?: 'playwright' | 'jest' | 'pytest' | 'phpunit' | 'auto';
    pattern?: string;
    maxRetries?: number;
    fixOnFail?: boolean;
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
export interface AgentOConfig {
    lineLimit: number;
    strictMode: boolean;
    autoIndex: boolean;
    autoMemoryUpdate: boolean;
    testFramework: string;
    maxLoopIterations: number;
    [key: string]: string | number | boolean;
}
export interface ToolResult {
    success: boolean;
    message: string;
    data?: unknown;
    error?: string;
}
export declare const MEMORY_FILES: {
    readonly FUNCTIONS: ".agenticMemory/FUNCTIONS.md";
    readonly RULES: ".agenticMemory/RULES.md";
    readonly ARCHITECTURE: ".agenticMemory/ARCHITECTURE.md";
    readonly DISCOVERY: ".agenticMemory/DISCOVERY.md";
    readonly ATTEMPTS: ".agenticMemory/ATTEMPTS.md";
    readonly ERRORS: ".agenticMemory/ERRORS.md";
    readonly VERSIONS: ".agenticMemory/VERSIONS.md";
    readonly DATASTRUCTURE: ".agenticMemory/DATASTRUCTURE.md";
    readonly PROJECT_MAP: ".agenticMemory/PROJECT_MAP.md";
    readonly FLOW_GRAPH: ".agenticMemory/FLOW_GRAPH.json";
    readonly LOOP_STATE: ".agenticMemory/LOOP_STATE.json";
    readonly CONFIG: ".agenticMemory/config.json";
};
export declare const DEFAULT_CONFIG: AgentOConfig;
//# sourceMappingURL=types.d.ts.map