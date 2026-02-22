/**
 * agento_index - Codebase indexing with flow graph
 * Scans functions, classes, data structures, routes, builds call graph.
 * Supports dirty-file-aware incremental indexing.
 */

import { memoryCache } from '../memory/cache.js';
import {
  listFilesRecursive,
  readProjectFile,
  readMemoryFile,
  writeMemoryFile,
  writeJsonMemoryFile
} from '../memory/loader.js';
import {
  extractFunctionsFromCode,
  extractClassesFromCode,
  extractCallGraph,
  extractDataStructuresFromCode,
  extractRoutesFromCode,
  crossReferenceTypes,
  formatFunctionEntry,
  formatDataStructureEntry,
  formatRouteEntry,
} from '../memory/parser.js';
import { MEMORY_FILES } from '../types.js';
import type {
  IndexInput,
  FunctionEntry,
  ClassEntry,
  DataStructureEntry,
  RouteEntry,
  ExtractionPattern,
  FlowGraph,
  SymbolNode,
  FlowEdge
} from '../types.js';
import * as path from 'path';
import * as crypto from 'crypto';

export const indexToolDef = {
  name: 'agento_index',
  description: 'Index the codebase. Scans files for functions, classes, data structures, routes, and builds flow graph. Updates FUNCTIONS.md, PROJECT_MAP.md, DATASTRUCTURE.md, FLOW_GRAPH.json, DISCOVERY.md, and ARCHITECTURE.md.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      path: {
        type: 'string',
        description: 'Path to index (default: current directory)',
      },
      force: {
        type: 'boolean',
        description: 'Force re-index even if already indexed',
      },
    },
    required: [],
  },
};

const CODE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.py', '.php', '.go', '.rs', '.java', '.mjs', '.cjs'];
const ENTRY_POINT_PATTERNS = [
  /server\.ts$/i, /main\.ts$/i, /index\.ts$/i, /app\.ts$/i,
  /cli\.ts$/i, /start\.ts$/i, /entry\.ts$/i,
  /server\.js$/i, /main\.js$/i, /index\.js$/i, /app\.js$/i,
  /cli\.js$/i, /start\.js$/i, /entry\.js$/i,
];

function generateSymbolId(name: string, kind: string, file: string): string {
  const hash = crypto.createHash('md5')
    .update(`${kind}:${name}:${file}`)
    .digest('hex')
    .substring(0, 8);
  return `${kind[0].toUpperCase()}${hash}`;
}

export async function handleIndex(args: unknown) {
  const input = args as IndexInput;
  const { path: indexPath = '.', force = false } = input;

  try {
    const startTime = Date.now();
    const stats = {
      filesScanned: 0,
      functionsFound: 0,
      classesFound: 0,
      dataStructuresFound: 0,
      routesFound: 0,
      edgesFound: 0,
      directoriesExplored: new Set<string>(),
    };

    // Load config patterns
    const config = await memoryCache.getConfig();
    const configPatterns: ExtractionPattern[] = config.patterns || [];

    // Check for dirty files (incremental indexing)
    const dirtyFiles = await memoryCache.getDirtyFiles();
    const hasDirty = dirtyFiles.length > 0;

    const existingFunctions = force ? [] : await memoryCache.getFunctions();
    const existingFiles = new Set(existingFunctions.map(f => f.file));

    // Find all code files
    const allFiles = await listFilesRecursive(indexPath, CODE_EXTENSIONS);

    // Determine which files to process
    let filesToProcess: string[];
    if (force) {
      filesToProcess = allFiles;
    } else if (hasDirty) {
      // Dirty-aware: only reindex dirty files + any new files
      const dirtySet = new Set(dirtyFiles);
      filesToProcess = allFiles.filter(f => dirtySet.has(f) || !existingFiles.has(f));
    } else {
      filesToProcess = allFiles.filter(f => !existingFiles.has(f));
    }

    const allFunctions: FunctionEntry[] = force ? [] : [...existingFunctions];
    const allClasses: ClassEntry[] = [];
    const allDataStructures: DataStructureEntry[] = [];
    const allRoutes: RouteEntry[] = [];
    const callGraphMap = new Map<string, string[]>();
    const entryPoints: string[] = [];
    const newFiles: string[] = [];

    // Detect entry points
    for (const filepath of allFiles) {
      if (ENTRY_POINT_PATTERNS.some(pattern => pattern.test(filepath))) {
        entryPoints.push(filepath);
      }
    }

    // Process files
    for (const filepath of filesToProcess) {
      try {
        const content = await readProjectFile(filepath);

        // Remove old entries for this file before adding new ones
        const filtered = allFunctions.filter(f => f.file !== filepath);
        allFunctions.length = 0;
        allFunctions.push(...filtered);

        // Extract functions (now dynamic-pattern-aware)
        const functions = extractFunctionsFromCode(content, filepath, configPatterns);
        if (functions.length > 0) {
          allFunctions.push(...functions);
          stats.functionsFound += functions.length;
          newFiles.push(filepath);
        }

        // Extract classes
        const classes = extractClassesFromCode(content, filepath);
        if (classes.length > 0) {
          allClasses.push(...classes);
          stats.classesFound += classes.length;
          if (!newFiles.includes(filepath)) {
            newFiles.push(filepath);
          }
        }

        // Extract data structures
        const dataStructures = extractDataStructuresFromCode(content, filepath, configPatterns);
        if (dataStructures.length > 0) {
          allDataStructures.push(...dataStructures);
          stats.dataStructuresFound += dataStructures.length;
          if (!newFiles.includes(filepath)) {
            newFiles.push(filepath);
          }
        }

        // Extract routes
        const routes = extractRoutesFromCode(content, filepath, configPatterns);
        if (routes.length > 0) {
          allRoutes.push(...routes);
          stats.routesFound += routes.length;
          if (!newFiles.includes(filepath)) {
            newFiles.push(filepath);
          }
        }

        // Extract call graph
        const fileCallGraph = extractCallGraph(content, functions, classes);
        for (const [caller, callees] of fileCallGraph.entries()) {
          callGraphMap.set(caller, callees);
          stats.edgesFound += callees.length;
        }

        stats.filesScanned++;
        stats.directoriesExplored.add(path.dirname(filepath));

      } catch {
        // Skip unreadable files
      }
    }

    // For incremental indexing, also extract classes/DS/routes from non-dirty files
    if (!force && hasDirty) {
      const nonDirtyFiles = allFiles.filter(f => !filesToProcess.includes(f));
      for (const filepath of nonDirtyFiles) {
        try {
          const content = await readProjectFile(filepath);
          const classes = extractClassesFromCode(content, filepath);
          if (classes.length > 0) allClasses.push(...classes);
          const ds = extractDataStructuresFromCode(content, filepath, configPatterns);
          if (ds.length > 0) allDataStructures.push(...ds);
          const routes = extractRoutesFromCode(content, filepath, configPatterns);
          if (routes.length > 0) allRoutes.push(...routes);
        } catch {
          // Skip
        }
      }
    }

    // Cross-reference: link types to functions that use them
    crossReferenceTypes(allDataStructures, allFunctions);

    // Build flow graph (now includes routes and data structures)
    const flowGraph = buildFlowGraph(allFunctions, allClasses, allDataStructures, allRoutes, callGraphMap, entryPoints);

    // Update memory files
    if (newFiles.length > 0 || force || hasDirty) {
      await rebuildFunctionsFile(allFunctions);
      await buildProjectMap(allFunctions, allClasses, allRoutes, entryPoints);
      await rebuildDataStructuresFile(allDataStructures);
      await writeJsonMemoryFile(MEMORY_FILES.FLOW_GRAPH, flowGraph);
      memoryCache.invalidateFunctions();
    }

    // Update DISCOVERY.md
    await updateDiscovery(Array.from(stats.directoriesExplored));

    // Update ARCHITECTURE.md
    await updateArchitecture(allFiles);

    // Clear dirty tracking
    if (hasDirty) {
      await memoryCache.clearDirty();
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

    let output = `✅ **Indexing Complete** (${elapsed}s)\n\n`;
    output += `📊 Files: ${stats.filesScanned} scanned | Functions: ${stats.functionsFound} | Classes: ${stats.classesFound}\n`;
    output += `📐 Data Structures: ${stats.dataStructuresFound} | Routes: ${stats.routesFound} | Edges: ${stats.edgesFound}\n`;
    output += `📦 Total: ${allFunctions.length} functions | ${allDataStructures.length} types | ${allRoutes.length} routes | ${entryPoints.length} entry points\n`;

    if (hasDirty) {
      output += `🔄 Dirty files processed: ${dirtyFiles.length}\n`;
    }

    if (newFiles.length > 0 && newFiles.length <= 10) {
      output += `\n📝 Indexed: ${newFiles.join(', ')}\n`;
    } else if (newFiles.length > 10) {
      output += `\n📝 Indexed ${newFiles.length} files\n`;
    }

    return { content: [{ type: 'text', text: output }] };

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return {
      content: [{ type: 'text', text: `❌ Indexing failed: ${errorMsg}` }],
      isError: true,
    };
  }
}

function buildFlowGraph(
  functions: FunctionEntry[],
  classes: ClassEntry[],
  dataStructures: DataStructureEntry[],
  routes: RouteEntry[],
  callGraph: Map<string, string[]>,
  entryPoints: string[]
): FlowGraph {
  const nodes: Record<string, SymbolNode> = {};
  const edges: FlowEdge[] = [];
  const entryPointIds: string[] = [];

  // Function nodes
  for (const func of functions) {
    const id = generateSymbolId(func.name, 'function', func.file);
    nodes[id] = {
      id,
      name: func.name,
      kind: 'function',
      file: func.file,
      line: func.line,
      signature: `${func.name}(${func.params}): ${func.returnType}`,
    };

    if (entryPoints.includes(func.file) &&
        (func.name === 'main' || func.name === 'start' || func.name === 'startServer' ||
         func.name.includes('Handler') || func.name.includes('Route'))) {
      entryPointIds.push(id);
    }
  }

  // Class nodes + method nodes
  for (const cls of classes) {
    const classId = generateSymbolId(cls.name, 'class', cls.file);
    nodes[classId] = {
      id: classId,
      name: cls.name,
      kind: 'class',
      file: cls.file,
      line: cls.line,
      signature: cls.extends ? `${cls.name} extends ${cls.extends}` : cls.name,
    };

    for (const method of cls.methods) {
      const methodId = generateSymbolId(`${cls.name}.${method.name}`, 'method', cls.file);
      nodes[methodId] = {
        id: methodId,
        name: `${cls.name}.${method.name}`,
        kind: 'method',
        file: cls.file,
        line: method.line,
        signature: `${method.name}(${method.params}): ${method.returnType}`,
      };

      edges.push({ from: classId, to: methodId, type: 'call' });
    }

    // Inheritance edges
    if (cls.extends) {
      const extendsId = Object.values(nodes).find(
        n => n.name === cls.extends && n.kind === 'class'
      )?.id;
      if (extendsId) {
        edges.push({ from: classId, to: extendsId, type: 'extend' });
      }
    }
  }

  // Data structure nodes + uses edges
  for (const ds of dataStructures) {
    const dsId = generateSymbolId(ds.name, 'datastructure', ds.file);
    nodes[dsId] = {
      id: dsId,
      name: ds.name,
      kind: 'datastructure',
      file: ds.file,
      line: ds.line,
      signature: `${ds.kind} ${ds.name}${ds.extends ? ` extends ${ds.extends}` : ''}`,
    };

    // Add 'uses' edges from functions that reference this type
    for (const funcName of ds.usedBy) {
      const funcNode = Object.values(nodes).find(
        n => n.name === funcName && (n.kind === 'function' || n.kind === 'method')
      );
      if (funcNode) {
        edges.push({ from: funcNode.id, to: dsId, type: 'uses' });
      }
    }
  }

  // Route nodes
  for (const route of routes) {
    const routeName = `${route.method} ${route.path}`;
    const routeId = generateSymbolId(routeName, 'route', route.file);
    nodes[routeId] = {
      id: routeId,
      name: routeName,
      kind: 'route',
      file: route.file,
      line: route.line,
      signature: `${route.method} ${route.path} -> ${route.handler || 'anonymous'} [${route.framework}]`,
    };

    // Link route to its handler function
    if (route.handler) {
      const handlerNode = Object.values(nodes).find(
        n => n.name === route.handler && (n.kind === 'function' || n.kind === 'method')
      );
      if (handlerNode) {
        edges.push({ from: routeId, to: handlerNode.id, type: 'call' });
      }
    }

    // Routes are entry points
    entryPointIds.push(routeId);
  }

  // Call graph edges
  for (const [caller, callees] of callGraph.entries()) {
    const callerId = Object.values(nodes).find(n =>
      n.name === caller || n.name.endsWith(`.${caller}`)
    )?.id;

    if (!callerId) continue;

    for (const callee of callees) {
      const calleeId = Object.values(nodes).find(n =>
        n.name === callee || n.name.endsWith(`.${callee}`) ||
        n.name === `${caller.split('.')[0]}.${callee}`
      )?.id;

      if (calleeId) {
        edges.push({ from: callerId, to: calleeId, type: 'call' });
      }
    }
  }

  return {
    version: '1.0',
    generated: new Date().toISOString(),
    nodes,
    edges,
    entryPoints: entryPointIds,
  };
}

async function buildProjectMap(
  functions: FunctionEntry[],
  classes: ClassEntry[],
  routes: RouteEntry[],
  entryPoints: string[]
): Promise<void> {
  let content = '# Project Map\n\nAuto-generated unified structure for LLM understanding.\n\n';

  content += '## Entry Points\n\n';
  for (const ep of entryPoints) {
    content += `- ${ep}\n`;
  }
  content += '\n';

  // Routes section
  if (routes.length > 0) {
    content += '## Routes\n\n';
    for (const route of routes) {
      content += formatRouteEntry(route) + '\n';
    }
    content += '\n';
  }

  content += '## Modules\n\n';
  const modules = new Map<string, { functions: number; classes: number; files: Set<string> }>();

  for (const func of functions) {
    const dir = path.dirname(func.file);
    const mod = modules.get(dir) || { functions: 0, classes: 0, files: new Set() };
    mod.functions++;
    mod.files.add(func.file);
    modules.set(dir, mod);
  }

  for (const cls of classes) {
    const dir = path.dirname(cls.file);
    const mod = modules.get(dir) || { functions: 0, classes: 0, files: new Set() };
    mod.classes++;
    mod.files.add(cls.file);
    modules.set(dir, mod);
  }

  for (const [dir, info] of Array.from(modules.entries()).sort()) {
    content += `M: ${dir}/\n`;
    content += `- Functions: ${info.functions}, Classes: ${info.classes}, Files: ${info.files.size}\n\n`;
  }

  content += '## Classes\n\n';
  for (const cls of classes.slice(0, 50)) {
    content += `C: ${cls.name}`;
    if (cls.extends) content += ` extends ${cls.extends}`;
    if (cls.implements && cls.implements.length > 0) {
      content += ` implements ${cls.implements.join(', ')}`;
    }
    content += ` @ ${cls.file}:${cls.line || '?'}\n`;
    content += `- Methods: ${cls.methods.length}\n\n`;
  }
  if (classes.length > 50) {
    content += `... and ${classes.length - 50} more classes\n\n`;
  }

  content += '## Top Functions\n\n';
  const topFunctions = functions
    .filter(f => !f.name.startsWith('_') && f.name[0] === f.name[0].toUpperCase() ||
                 f.file.includes('index') || f.file.includes('main'))
    .slice(0, 100);

  for (const func of topFunctions) {
    const classTag = func.className ? ` [${func.className}]` : '';
    content += `F: ${func.name}(${func.params}): ${func.returnType}${classTag} @ ${func.file}:${func.line || '?'}\n`;
  }
  if (functions.length > topFunctions.length) {
    content += `... and ${functions.length - topFunctions.length} more functions\n`;
  }

  await writeMemoryFile(MEMORY_FILES.PROJECT_MAP, content);
}

async function rebuildFunctionsFile(functions: FunctionEntry[]): Promise<void> {
  const byFile = new Map<string, FunctionEntry[]>();
  for (const func of functions) {
    const existing = byFile.get(func.file) || [];
    existing.push(func);
    byFile.set(func.file, existing);
  }

  let content = '# Functions Index\n\nAuto-generated function signatures with dependencies.\n\n';

  const sortedFiles = Array.from(byFile.keys()).sort();

  for (const filepath of sortedFiles) {
    const funcs = byFile.get(filepath)!;
    content += `## ${filepath}\n`;
    for (const func of funcs) {
      content += formatFunctionEntry(func) + '\n';
    }
    content += '\n';
  }

  await writeMemoryFile(MEMORY_FILES.FUNCTIONS, content);
}

async function rebuildDataStructuresFile(dataStructures: DataStructureEntry[]): Promise<void> {
  const byFile = new Map<string, DataStructureEntry[]>();
  for (const ds of dataStructures) {
    const existing = byFile.get(ds.file) || [];
    existing.push(ds);
    byFile.set(ds.file, existing);
  }

  let content = '# Data Structures\n\nAuto-generated type/interface/enum/struct index with cross-references.\n\n';

  const sortedFiles = Array.from(byFile.keys()).sort();

  for (const filepath of sortedFiles) {
    const entries = byFile.get(filepath)!;
    content += `## ${filepath}\n\n`;
    for (const ds of entries) {
      content += formatDataStructureEntry(ds) + '\n';
    }
  }

  await writeMemoryFile(MEMORY_FILES.DATASTRUCTURE, content);
}

async function updateDiscovery(directories: string[]): Promise<void> {
  let content = await readMemoryFile(MEMORY_FILES.DISCOVERY);

  if (!content) {
    content = '# Discovery Log\n\n## Explored Areas\n\n';
  }

  for (const dir of directories) {
    const marker = `- [x] ${dir}`;
    if (!content.includes(marker)) {
      content = content.trimEnd() + `\n${marker}\n`;
    }
  }

  await writeMemoryFile(MEMORY_FILES.DISCOVERY, content);
  memoryCache.invalidateDiscovery();
}

async function updateArchitecture(files: string[]): Promise<void> {
  const structure = new Map<string, { type: string; files: string[] }>();

  for (const filepath of files) {
    const dir = path.dirname(filepath);
    const existing = structure.get(dir) || { type: 'unknown', files: [] };
    existing.files.push(path.basename(filepath));

    if (dir.includes('component') || dir.includes('ui')) existing.type = 'UI components';
    else if (dir.includes('api') || dir.includes('route')) existing.type = 'API routes';
    else if (dir.includes('service')) existing.type = 'Services';
    else if (dir.includes('util') || dir.includes('helper')) existing.type = 'Utilities';
    else if (dir.includes('hook')) existing.type = 'React hooks';
    else if (dir.includes('test') || dir.includes('spec')) existing.type = 'Tests';
    else if (dir.includes('model') || dir.includes('entity')) existing.type = 'Models';
    else if (existing.type === 'unknown') existing.type = 'Source';

    structure.set(dir, existing);
  }

  let content = '# Project Architecture\n\n## Structure\n\n';

  const sortedDirs = Array.from(structure.keys()).sort();

  for (const dir of sortedDirs) {
    const info = structure.get(dir)!;
    content += `- ${dir}/ [${info.type}] - ${info.files.length} files\n`;
  }

  content += '\n## Patterns\n\n(Add project-specific patterns here)\n';

  content += '\n## Project Context\n\n';
  content += '### Vision\n> (Use agento_memory { action: "context" } to set project vision)\n\n';
  content += '### Conventions\n> (Use agento_memory { action: "context" } to set coding conventions)\n\n';
  content += '### Known Issues\n- (Use agento_memory { action: "context" } to track known issues)\n';

  await writeMemoryFile(MEMORY_FILES.ARCHITECTURE, content);
}
