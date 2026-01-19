/**
 * agento_write - The most critical tool
 * Enforces all rules before allowing file writes
 */

import { memoryCache } from '../memory/cache.js';
import { 
  writeProjectFile, 
  readMemoryFile, 
  writeMemoryFile, 
  appendMemoryFile 
} from '../memory/loader.js';
import { 
  extractFunctionsFromCode, 
  findSimilarFunctions, 
  formatFunctionEntry 
} from '../memory/parser.js';
import { MEMORY_FILES } from '../types.js';
import type { WriteInput } from '../types.js';

export const writeToolDef = {
  name: 'agento_write',
  description: 'Write a file with AgentO enforcement. Checks rules, line limits, duplicates before writing. Auto-updates FUNCTIONS.md after write.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      path: {
        type: 'string',
        description: 'File path to write to',
      },
      content: {
        type: 'string',
        description: 'Content to write',
      },
    },
    required: ['path', 'content'],
  },
};

export async function handleWrite(args: unknown) {
  const input = args as WriteInput;
  const { path, content } = input;
  
  if (!path || content === undefined) {
    return {
      content: [{ type: 'text', text: '❌ Missing required parameters: path and content' }],
      isError: true,
    };
  }
  
  const violations: string[] = [];
  const warnings: string[] = [];
  
  // Get config
  const config = await memoryCache.getConfig();
  
  // PRE-CHECK 1: Line count
  const lines = content.split('\n').length;
  if (lines > config.lineLimit) {
    violations.push(
      `⛔ LINE LIMIT EXCEEDED: File would have ${lines} lines (max ${config.lineLimit}).\n` +
      `   Split this file into smaller modules before writing.`
    );
  }
  
  // PRE-CHECK 2: User Rules
  const rules = await memoryCache.getRules();
  for (const rule of rules) {
    if (!rule.enabled) continue;
    
    // Check if rule applies to this file
    const filePatterns = rule.files.split(',').map(p => p.trim());
    const matchesFile = filePatterns.some(pattern => {
      if (pattern === '*') return true;
      const ext = pattern.replace('*', '');
      return path.endsWith(ext);
    });
    
    if (!matchesFile) continue;
    
    // Apply rule checks based on pattern
    let violated = false;
    let message = '';
    
    switch (rule.pattern) {
      case 'no-inline-css':
        if (content.includes('<style') || content.includes('style="')) {
          violated = true;
          message = 'Found inline CSS. Move styles to separate .css file.';
        }
        break;
      
      case 'no-console':
        if (content.includes('console.log')) {
          violated = true;
          message = 'Found console.log. Use proper logging.';
        }
        break;
      
      case 'no-any':
        if (content.includes(': any') || content.includes(':any')) {
          violated = true;
          message = 'Found "any" type. Use specific types.';
        }
        break;
      
      case 'max-lines':
        // Already handled by line limit
        break;
      
      default:
        // Custom pattern - check if content matches
        if (rule.pattern && content.includes(rule.pattern)) {
          violated = true;
          message = `Found forbidden pattern: ${rule.pattern}`;
        }
    }
    
    if (violated) {
      const msg = `[${rule.id}] ${rule.description}: ${message}`;
      if (rule.action === 'BLOCK') {
        violations.push(`⛔ ${msg}`);
      } else {
        warnings.push(`⚠️ ${msg}`);
      }
    }
  }
  
  // PRE-CHECK 3: Duplicate functions
  const existingFunctions = await memoryCache.getFunctions();
  const newFunctions = extractFunctionsFromCode(content, path);
  
  for (const newFunc of newFunctions) {
    const similar = findSimilarFunctions(newFunc, existingFunctions);
    // Filter out functions from the same file (we're overwriting)
    const duplicates = similar.filter(f => f.file !== path);
    
    if (duplicates.length > 0) {
      const dupList = duplicates.map(d => `${d.name} in ${d.file}`).join(', ');
      warnings.push(`⚠️ POTENTIAL DUPLICATE: ${newFunc.name} - similar to: ${dupList}`);
    }
  }
  
  // If violations in strict mode, block the write
  if (violations.length > 0 && config.strictMode) {
    return {
      content: [{
        type: 'text',
        text: `❌ WRITE BLOCKED\n\n${violations.join('\n\n')}\n\n` +
              (warnings.length > 0 ? `Warnings:\n${warnings.join('\n')}` : ''),
      }],
      isError: true,
    };
  }
  
  // EXECUTE: Write the file
  try {
    await writeProjectFile(path, content);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return {
      content: [{ type: 'text', text: `❌ Write failed: ${errorMsg}` }],
      isError: true,
    };
  }
  
  // POST-ACTION 1: Update FUNCTIONS.md
  if (newFunctions.length > 0 && config.autoMemoryUpdate) {
    try {
      // Read current FUNCTIONS.md
      let functionsContent = await readMemoryFile(MEMORY_FILES.FUNCTIONS);
      
      // Remove old entries for this file
      const fileHeader = `## ${path}`;
      const headerIndex = functionsContent.indexOf(fileHeader);
      if (headerIndex !== -1) {
        // Find next file header or end
        const nextHeaderMatch = functionsContent.slice(headerIndex + fileHeader.length).match(/\n## /);
        const endIndex = nextHeaderMatch 
          ? headerIndex + fileHeader.length + nextHeaderMatch.index!
          : functionsContent.length;
        functionsContent = functionsContent.slice(0, headerIndex) + functionsContent.slice(endIndex);
      }
      
      // Add new entries
      const newSection = `## ${path}\n${newFunctions.map(formatFunctionEntry).join('\n')}\n\n`;
      functionsContent = functionsContent.trimEnd() + '\n\n' + newSection;
      
      await writeMemoryFile(MEMORY_FILES.FUNCTIONS, functionsContent);
      memoryCache.invalidateFunctions();
    } catch {
      // Non-fatal - continue
    }
  }
  
  // POST-ACTION 2: Update VERSIONS.md if package file
  const packageFiles = ['package.json', 'requirements.txt', 'go.mod', 'Cargo.toml', 'composer.json'];
  if (packageFiles.some(pf => path.endsWith(pf))) {
    try {
      const timestamp = new Date().toISOString();
      await appendMemoryFile(
        MEMORY_FILES.VERSIONS,
        `\n### ${timestamp}\nUpdated: ${path}\n`
      );
    } catch {
      // Non-fatal
    }
  }
  
  // Build response
  let response = `✅ File written: ${path} (${lines} lines)`;
  
  if (newFunctions.length > 0) {
    response += `\n📝 Indexed ${newFunctions.length} function(s) to FUNCTIONS.md`;
  }
  
  if (warnings.length > 0) {
    response += `\n\n${warnings.join('\n')}`;
  }
  
  if (violations.length > 0) {
    response += `\n\n⚠️ Violations (not in strict mode):\n${violations.join('\n')}`;
  }
  
  return {
    content: [{ type: 'text', text: response }],
  };
}



