/**
 * agento_index - Enhanced Codebase indexing with flow graph
 * Scans and indexes functions, classes, and builds call graph
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
  formatFunctionEntry 
} from '../memory/parser.js';
import { MEMORY_FILES } from '../types.js';
import type { 
  IndexInput, 
  FunctionEntry, 
  ClassEntry,
  FlowGraph,
  SymbolNode,
  FlowEdge
} from '../types.js';
import * as path from 'path';
import * as crypto from 'crypto';

export const indexToolDef = {
  name: 'agento_index',
  description: 'Index the codebase. Scans files for functions, classes, and builds flow graph. Updates FUNCTIONS.md, PROJECT_MAP.md, FLOW_GRAPH.json, DISCOVERY.md, and ARCHITECTURE.md.',
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

const CODE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.py', '.php', '.go', '.rs', '.java'];
const ENTRY_POINT_PATTERNS = [
  /server\.ts$/i,
  /main\.ts$/i,
  /index\.ts$/i,
  /app\.ts$/i,
  /cli\.ts$/i,
  /start\.ts$/i,
  /entry\.ts$/i,
  /server\.js$/i,
  /main\.js$/i,
  /index\.js$/i,
  /app\.js$/i,
  /cli\.js$/i,
  /start\.js$/i,
  /entry\.js$/i,
];

// Generate unique ID for symbol
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
      edgesFound: 0,
      directoriesExplored: new Set<string>(),
    };
    
    // Get existing data if not forcing
    const existingFunctions = force ? [] : await memoryCache.getFunctions();
    const existingFiles = new Set(existingFunctions.map(f => f.file));
    
    // Find all code files
    const files = await listFilesRecursive(indexPath, CODE_EXTENSIONS);
    
    const allFunctions: FunctionEntry[] = force ? [] : [...existingFunctions];
    const allClasses: ClassEntry[] = [];
    const callGraphMap = new Map<string, string[]>();
    const entryPoints: string[] = [];
    const newFiles: string[] = [];
    
    // Detect entry points
    for (const filepath of files) {
      if (ENTRY_POINT_PATTERNS.some(pattern => pattern.test(filepath))) {
        entryPoints.push(filepath);
      }
    }
    
    // Process each file
    for (const filepath of files) {
      // Skip if already indexed and not forcing
      if (!force && existingFiles.has(filepath)) {
        continue;
      }
      
      try {
        const content = await readProjectFile(filepath);
        
        // Extract functions
        const functions = extractFunctionsFromCode(content, filepath);
        if (functions.length > 0) {
          // Remove old entries for this file if forcing
          if (force) {
            const index = allFunctions.findIndex(f => f.file === filepath);
            if (index !== -1) {
              allFunctions.splice(index, allFunctions.filter(f => f.file === filepath).length);
            }
          }
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
        
        // Extract call graph for this file
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
    
    // Build flow graph with IDs
    const flowGraph = await buildFlowGraph(allFunctions, allClasses, callGraphMap, entryPoints);
    
    // Update all memory files
    if (newFiles.length > 0 || force) {
      await rebuildFunctionsFile(allFunctions);
      await buildProjectMap(allFunctions, allClasses, entryPoints);
      await writeJsonMemoryFile(MEMORY_FILES.FLOW_GRAPH, flowGraph);
      memoryCache.invalidateFunctions();
    }
    
    // Update DISCOVERY.md
    await updateDiscovery(Array.from(stats.directoriesExplored));
    
    // Update ARCHITECTURE.md with structure
    await updateArchitecture(files);
    
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    
    let output = `✅ **Indexing Complete** (${elapsed}s)\n\n`;
    output += `📊 **Stats**\n`;
    output += `- Files scanned: ${stats.filesScanned}\n`;
    output += `- Functions indexed: ${stats.functionsFound}\n`;
    output += `- Classes indexed: ${stats.classesFound}\n`;
    output += `- Call graph edges: ${stats.edgesFound}\n`;
    output += `- Entry points: ${entryPoints.length}\n`;
    output += `- Directories explored: ${stats.directoriesExplored.size}\n`;
    output += `- Total functions in index: ${allFunctions.length}\n\n`;
    
    if (newFiles.length > 0) {
      output += `📝 **Newly Indexed Files**\n`;
      for (const file of newFiles.slice(0, 10)) {
        output += `- ${file}\n`;
      }
      if (newFiles.length > 10) {
        output += `- ... and ${newFiles.length - 10} more\n`;
      }
    }
    
    return {
      content: [{ type: 'text', text: output }],
    };
    
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return {
      content: [{ type: 'text', text: `❌ Indexing failed: ${errorMsg}` }],
      isError: true,
    };
  }
}

async function buildFlowGraph(
  functions: FunctionEntry[],
  classes: ClassEntry[],
  callGraph: Map<string, string[]>,
  entryPoints: string[]
): Promise<FlowGraph> {
  const nodes: Record<string, SymbolNode> = {};
  const edges: FlowEdge[] = [];
  const entryPointIds: string[] = [];
  
  // Build function nodes
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
    
    // Check if it's an entry point
    if (entryPoints.includes(func.file) && 
        (func.name === 'main' || func.name === 'start' || func.name === 'startServer' || 
         func.name.includes('Handler') || func.name.includes('Route'))) {
      entryPointIds.push(id);
    }
  }
  
  // Build class nodes
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
    
    // Build method nodes
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
      
      // Add class -> method edge
      edges.push({
        from: classId,
        to: methodId,
        type: 'call',
      });
    }
    
    // Add inheritance edges
    if (cls.extends) {
      const extendsId = Object.values(nodes).find(n => n.name === cls.extends && n.kind === 'class')?.id;
      if (extendsId) {
        edges.push({
          from: classId,
          to: extendsId,
          type: 'extend',
        });
      }
    }
  }
  
  // Build call graph edges
  for (const [caller, callees] of callGraph.entries()) {
    const callerId = Object.values(nodes).find(n => 
      n.name === caller || n.name.endsWith(`.${caller}`)
    )?.id;
    
    if (!callerId) continue;
    
    for (const callee of callees) {
      const calleeId = Object.values(nodes).find(n => 
        n.name === callee || n.name.endsWith(`.${callee}`) || n.name === `${caller.split('.')[0]}.${callee}`
      )?.id;
      
      if (calleeId) {
        edges.push({
          from: callerId,
          to: calleeId,
          type: 'call',
        });
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
  entryPoints: string[]
): Promise<void> {
  let content = '# Project Map\n\n';
  content += 'Auto-generated unified structure for LLM understanding.\n\n';
  
  // Entry points
  content += '## Entry Points\n\n';
  for (const ep of entryPoints) {
    content += `- ${ep}\n`;
  }
  content += '\n';
  
  // Modules summary
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
  
  // Classes summary
  content += '## Classes\n\n';
  for (const cls of classes.slice(0, 50)) { // Limit for token efficiency
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
  
  // Functions summary (top level only)
  content += '## Top Functions\n\n';
  const topFunctions = functions
    .filter(f => !f.name.startsWith('_') && f.name[0] === f.name[0].toUpperCase() || 
                 f.file.includes('index') || f.file.includes('main'))
    .slice(0, 100);
  
  for (const func of topFunctions) {
    content += `F: ${func.name}(${func.params}): ${func.returnType} @ ${func.file}:${func.line || '?'}\n`;
  }
  if (functions.length > topFunctions.length) {
    content += `... and ${functions.length - topFunctions.length} more functions\n`;
  }
  
  await writeMemoryFile(MEMORY_FILES.PROJECT_MAP, content);
}

async function rebuildFunctionsFile(functions: FunctionEntry[]): Promise<void> {
  // Group by file
  const byFile = new Map<string, FunctionEntry[]>();
  for (const func of functions) {
    const existing = byFile.get(func.file) || [];
    existing.push(func);
    byFile.set(func.file, existing);
  }
  
  let content = '# Functions Index\n\n';
  content += 'Auto-generated function signatures with dependencies.\n\n';
  
  // Sort files alphabetically
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
  // Build directory structure
  const structure = new Map<string, { type: string; files: string[] }>();
  
  for (const filepath of files) {
    const dir = path.dirname(filepath);
    const existing = structure.get(dir) || { type: 'unknown', files: [] };
    existing.files.push(path.basename(filepath));
    
    // Detect type based on path
    if (dir.includes('component') || dir.includes('ui')) {
      existing.type = 'UI components';
    } else if (dir.includes('api') || dir.includes('route')) {
      existing.type = 'API routes';
    } else if (dir.includes('service')) {
      existing.type = 'Services';
    } else if (dir.includes('util') || dir.includes('helper')) {
      existing.type = 'Utilities';
    } else if (dir.includes('hook')) {
      existing.type = 'React hooks';
    } else if (dir.includes('test') || dir.includes('spec')) {
      existing.type = 'Tests';
    } else if (dir.includes('model') || dir.includes('entity')) {
      existing.type = 'Models';
    } else if (existing.type === 'unknown') {
      existing.type = 'Source';
    }
    
    structure.set(dir, existing);
  }
  
  let content = '# Project Architecture\n\n';
  content += '## Structure\n\n';
  
  const sortedDirs = Array.from(structure.keys()).sort();
  
  for (const dir of sortedDirs) {
    const info = structure.get(dir)!;
    content += `- ${dir}/ [${info.type}] - ${info.files.length} files\n`;
  }
  
  content += '\n## Patterns\n\n';
  content += '(Add project-specific patterns here)\n';
  
  await writeMemoryFile(MEMORY_FILES.ARCHITECTURE, content);
}
