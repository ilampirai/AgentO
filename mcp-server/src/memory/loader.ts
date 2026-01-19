/**
 * Memory File I/O Operations
 * Handles reading and writing to .agenticMemory files
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { MEMORY_FILES } from '../types.js';

const MEMORY_DIR = '.agenticMemory';

/**
 * Ensure memory directory exists
 */
export async function ensureMemoryDir(): Promise<void> {
  try {
    await fs.mkdir(MEMORY_DIR, { recursive: true });
  } catch {
    // Directory already exists
  }
}

/**
 * Read a memory file
 */
export async function readMemoryFile(filename: string): Promise<string> {
  try {
    const content = await fs.readFile(filename, 'utf-8');
    return content;
  } catch {
    return '';
  }
}

/**
 * Write to a memory file
 */
export async function writeMemoryFile(filename: string, content: string): Promise<void> {
  await ensureMemoryDir();
  await fs.writeFile(filename, content, 'utf-8');
}

/**
 * Append to a memory file
 */
export async function appendMemoryFile(filename: string, content: string): Promise<void> {
  await ensureMemoryDir();
  await fs.appendFile(filename, content, 'utf-8');
}

/**
 * Check if memory file exists
 */
export async function memoryFileExists(filename: string): Promise<boolean> {
  try {
    await fs.access(filename);
    return true;
  } catch {
    return false;
  }
}

/**
 * Read JSON memory file (like LOOP_STATE.json, config.json)
 */
export async function readJsonMemoryFile<T>(filename: string, defaultValue: T): Promise<T> {
  try {
    const content = await fs.readFile(filename, 'utf-8');
    return JSON.parse(content) as T;
  } catch {
    return defaultValue;
  }
}

/**
 * Write JSON memory file
 */
export async function writeJsonMemoryFile<T>(filename: string, data: T): Promise<void> {
  await ensureMemoryDir();
  await fs.writeFile(filename, JSON.stringify(data, null, 2), 'utf-8');
}

/**
 * Read any file from the project
 */
export async function readProjectFile(filepath: string): Promise<string> {
  try {
    return await fs.readFile(filepath, 'utf-8');
  } catch {
    throw new Error(`File not found: ${filepath}`);
  }
}

/**
 * Write any file to the project
 */
export async function writeProjectFile(filepath: string, content: string): Promise<void> {
  const dir = path.dirname(filepath);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(filepath, content, 'utf-8');
}

/**
 * Check if file exists
 */
export async function fileExists(filepath: string): Promise<boolean> {
  try {
    await fs.access(filepath);
    return true;
  } catch {
    return false;
  }
}

/**
 * List files in directory recursively
 */
export async function listFilesRecursive(dir: string, extensions?: string[]): Promise<string[]> {
  const files: string[] = [];
  
  async function walk(currentDir: string) {
    try {
      const entries = await fs.readdir(currentDir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);
        
        // Skip common ignored directories
        if (entry.isDirectory()) {
          if (['node_modules', '.git', 'dist', 'build', '.agenticMemory'].includes(entry.name)) {
            continue;
          }
          await walk(fullPath);
        } else if (entry.isFile()) {
          if (!extensions || extensions.some(ext => entry.name.endsWith(ext))) {
            files.push(fullPath);
          }
        }
      }
    } catch {
      // Directory not accessible
    }
  }
  
  await walk(dir);
  return files;
}

/**
 * Get file stats
 */
export async function getFileStats(filepath: string): Promise<{ lines: number; size: number } | null> {
  try {
    const content = await fs.readFile(filepath, 'utf-8');
    const stats = await fs.stat(filepath);
    return {
      lines: content.split('\n').length,
      size: stats.size,
    };
  } catch {
    return null;
  }
}

/**
 * Initialize all memory files if they don't exist
 */
export async function initializeMemoryFiles(): Promise<void> {
  await ensureMemoryDir();
  
  const templates: Record<string, string> = {
    [MEMORY_FILES.FUNCTIONS]: '# Functions Index\n\nAuto-generated function signatures with dependencies.\n\n',
    [MEMORY_FILES.RULES]: '# Project Rules\n\n## System Rules\n\n- [SYS001] Max 500 lines per file\n- [SYS002] No duplicate functions\n\n## User Rules\n\n',
    [MEMORY_FILES.ARCHITECTURE]: '# Project Architecture\n\n## Structure\n\n## Patterns\n\n',
    [MEMORY_FILES.DISCOVERY]: '# Discovery Log\n\n## Explored Areas\n\n',
    [MEMORY_FILES.ATTEMPTS]: '# Attempted Actions\n\n## Blocked Patterns\n\n',
    [MEMORY_FILES.ERRORS]: '# Known Errors & Solutions\n\n',
    [MEMORY_FILES.VERSIONS]: '# Dependency Versions\n\n',
    [MEMORY_FILES.DATASTRUCTURE]: '# Data Structures\n\n## Schemas\n\n## API Contracts\n\n',
    [MEMORY_FILES.PROJECT_MAP]: '# Project Map\n\nAuto-generated project structure and symbol index.\n\n',
  };
  
  for (const [file, content] of Object.entries(templates)) {
    if (!(await memoryFileExists(file))) {
      await writeMemoryFile(file, content);
    }
  }
  
  // Initialize JSON files
  if (!(await memoryFileExists(MEMORY_FILES.LOOP_STATE))) {
    await writeJsonMemoryFile(MEMORY_FILES.LOOP_STATE, {
      active: false,
      task: '',
      completionMarker: '',
      maxIterations: 10,
      currentIteration: 0,
      startedAt: '',
      history: [],
    });
  }
  
  if (!(await memoryFileExists(MEMORY_FILES.CONFIG))) {
    await writeJsonMemoryFile(MEMORY_FILES.CONFIG, {
      lineLimit: 500,
      strictMode: true,
      autoIndex: true,
      autoMemoryUpdate: true,
      testFramework: 'auto',
      maxLoopIterations: 10,
    });
  }

  if (!(await memoryFileExists(MEMORY_FILES.FLOW_GRAPH))) {
    await writeJsonMemoryFile(MEMORY_FILES.FLOW_GRAPH, {
      version: '1.0',
      generated: new Date().toISOString(),
      nodes: {},
      edges: [],
      entryPoints: [],
    });
  }
}



