/**
 * Path Resolver — single source of truth for memory file locations.
 * Always returns layered paths. No flat mode.
 */

const LAYERED_PATHS: Record<string, string> = {
  // Soul layer
  IDENTITY: '.agenticMemory/soul/IDENTITY.md',
  PRINCIPLES: '.agenticMemory/soul/PRINCIPLES.md',

  // Core layer
  ARCHITECTURE: '.agenticMemory/core/ARCHITECTURE.md',
  DECISIONS: '.agenticMemory/core/DECISIONS.md',
  FLOWS: '.agenticMemory/core/FLOWS.md',
  DECISIONS_INDEX: '.agenticMemory/core/.decisions.json',
  FLOWS_INDEX: '.agenticMemory/core/.flows.json',

  // Working layer
  ACTIVE_CONTEXT: '.agenticMemory/working/ACTIVE_CONTEXT.md',
  DISCOVERY: '.agenticMemory/working/DISCOVERY.md',
  ATTEMPTS: '.agenticMemory/working/ATTEMPTS.md',

  // Surface layer
  FUNCTIONS: '.agenticMemory/surface/FUNCTIONS.md',
  DATASTRUCTURE: '.agenticMemory/surface/DATASTRUCTURE.md',
  PROJECT_MAP: '.agenticMemory/surface/PROJECT_MAP.md',
  FLOW_GRAPH: '.agenticMemory/surface/FLOW_GRAPH.json',
  ERRORS: '.agenticMemory/surface/ERRORS.md',
  VERSIONS: '.agenticMemory/surface/VERSIONS.md',

  // Root level (not layered)
  CONFIG: '.agenticMemory/config.json',
  RULES: '.agenticMemory/RULES.md',
  DIRTY: '.agenticMemory/.dirty',
};

export const MEMORY_KEYS = Object.keys(LAYERED_PATHS);

export function resolveMemoryPath(key: string): string {
  const path = LAYERED_PATHS[key];
  if (!path) {
    throw new Error(`Unknown memory key: ${key}. Valid keys: ${MEMORY_KEYS.join(', ')}`);
  }
  return path;
}

export const LAYER_DIRS = [
  '.agenticMemory/soul',
  '.agenticMemory/core',
  '.agenticMemory/working',
  '.agenticMemory/surface',
  '.agenticMemory/.branch-context',
  '.agenticMemory/.archive',
];
