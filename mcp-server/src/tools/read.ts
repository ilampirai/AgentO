/**
 * agento_read - Tracked file reading
 * Updates DISCOVERY.md and extracts functions to FUNCTIONS.md
 */

import { memoryCache } from '../memory/cache.js';
import { 
  readProjectFile, 
  readMemoryFile, 
  writeMemoryFile, 
  appendMemoryFile 
} from '../memory/loader.js';
import { extractFunctionsFromCode, formatFunctionEntry } from '../memory/parser.js';
import { MEMORY_FILES } from '../types.js';
import type { ReadInput } from '../types.js';
import * as path from 'path';

export const readToolDef = {
  name: 'agento_read',
  description: 'Read a file with AgentO tracking. Updates DISCOVERY.md and extracts functions to FUNCTIONS.md.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      path: {
        type: 'string',
        description: 'File path to read',
      },
    },
    required: ['path'],
  },
};

export async function handleRead(args: unknown) {
  const input = args as ReadInput;
  const { path: filepath } = input;
  
  if (!filepath) {
    return {
      content: [{ type: 'text', text: '❌ Missing required parameter: path' }],
      isError: true,
    };
  }
  
  // Read the file
  let content: string;
  try {
    content = await readProjectFile(filepath);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return {
      content: [{ type: 'text', text: `❌ Read failed: ${errorMsg}` }],
      isError: true,
    };
  }
  
  const config = await memoryCache.getConfig();
  const updates: string[] = [];
  
  if (config.autoMemoryUpdate) {
    // POST-ACTION 1: Update DISCOVERY.md
    try {
      const discovery = await memoryCache.getDiscovery();
      const dir = path.dirname(filepath);
      
      if (!discovery.has(dir) && !discovery.has(filepath)) {
        let discoveryContent = await readMemoryFile(MEMORY_FILES.DISCOVERY);
        
        // Add to explored areas
        if (!discoveryContent.includes(`- [x] ${dir}`)) {
          discoveryContent = discoveryContent.trimEnd() + `\n- [x] ${dir}\n`;
          await writeMemoryFile(MEMORY_FILES.DISCOVERY, discoveryContent);
          memoryCache.invalidateDiscovery();
          updates.push(`📍 Marked ${dir} as explored`);
        }
      }
    } catch {
      // Non-fatal
    }
    
    // POST-ACTION 2: Extract and add functions to FUNCTIONS.md
    const codeExtensions = ['.ts', '.js', '.tsx', '.jsx', '.py', '.php', '.go', '.rs'];
    if (codeExtensions.some(ext => filepath.endsWith(ext))) {
      try {
        const newFunctions = extractFunctionsFromCode(content, filepath);
        
        if (newFunctions.length > 0) {
          let functionsContent = await readMemoryFile(MEMORY_FILES.FUNCTIONS);
          
          // Check if file already indexed
          const fileHeader = `## ${filepath}`;
          if (!functionsContent.includes(fileHeader)) {
            // Add new section
            const newSection = `${fileHeader}\n${newFunctions.map(formatFunctionEntry).join('\n')}\n\n`;
            functionsContent = functionsContent.trimEnd() + '\n\n' + newSection;
            await writeMemoryFile(MEMORY_FILES.FUNCTIONS, functionsContent);
            memoryCache.invalidateFunctions();
            updates.push(`📝 Indexed ${newFunctions.length} function(s)`);
          }
        }
      } catch {
        // Non-fatal
      }
    }
  }
  
  // Calculate stats
  const lines = content.split('\n').length;
  const size = Buffer.byteLength(content, 'utf-8');
  
  let response = content;
  
  // Add metadata footer
  const metadata = [
    `\n---`,
    `📄 ${filepath}`,
    `📏 ${lines} lines | ${formatBytes(size)}`,
  ];
  
  if (updates.length > 0) {
    metadata.push(`🔄 ${updates.join(' | ')}`);
  }
  
  return {
    content: [{
      type: 'text',
      text: response + metadata.join('\n'),
    }],
  };
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}


