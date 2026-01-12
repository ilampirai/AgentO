/**
 * agento_index - Codebase indexing
 * Scan and index all functions in the codebase
 */

import { memoryCache } from '../memory/cache.js';
import { 
  listFilesRecursive, 
  readProjectFile, 
  readMemoryFile, 
  writeMemoryFile 
} from '../memory/loader.js';
import { extractFunctionsFromCode, formatFunctionEntry } from '../memory/parser.js';
import { MEMORY_FILES } from '../types.js';
import type { IndexInput, FunctionEntry } from '../types.js';
import * as path from 'path';

export const indexToolDef = {
  name: 'agento_index',
  description: 'Index the codebase. Scans files for functions and updates FUNCTIONS.md, DISCOVERY.md, and ARCHITECTURE.md.',
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

export async function handleIndex(args: unknown) {
  const input = args as IndexInput;
  const { path: indexPath = '.', force = false } = input;
  
  try {
    const startTime = Date.now();
    const stats = {
      filesScanned: 0,
      functionsFound: 0,
      directoriesExplored: new Set<string>(),
    };
    
    // Get existing functions if not forcing
    const existingFunctions = force ? [] : await memoryCache.getFunctions();
    const existingFiles = new Set(existingFunctions.map(f => f.file));
    
    // Find all code files
    const files = await listFilesRecursive(indexPath, CODE_EXTENSIONS);
    
    const allFunctions: FunctionEntry[] = force ? [] : [...existingFunctions];
    const newFiles: string[] = [];
    
    for (const filepath of files) {
      // Skip if already indexed and not forcing
      if (!force && existingFiles.has(filepath)) {
        continue;
      }
      
      try {
        const content = await readProjectFile(filepath);
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
        
        stats.filesScanned++;
        stats.directoriesExplored.add(path.dirname(filepath));
        
      } catch {
        // Skip unreadable files
      }
    }
    
    // Update FUNCTIONS.md
    if (newFiles.length > 0 || force) {
      await rebuildFunctionsFile(allFunctions);
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


