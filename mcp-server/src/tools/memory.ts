/**
 * agento_memory - Direct memory file operations
 * Read, write, or append to any memory file
 */

import {
  readMemoryFile,
  writeMemoryFile,
  appendMemoryFile,
  initializeMemoryFiles
} from '../memory/loader.js';
import { memoryCache } from '../memory/cache.js';
import { MEMORY_FILES } from '../types.js';
import type { MemoryInput } from '../types.js';
import { loadSessionBriefing, snapshotSession, switchBranch } from '../memory/resume.js';
import { migrateToLayered } from '../memory/migrate.js';

export const memoryToolDef = {
  name: 'agento_memory',
  description: 'Direct access to AgentO memory files. Read, write, or append to FUNCTIONS.md, PROJECT_MAP.md, FLOW_GRAPH.json, etc.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      file: {
        type: 'string',
        description: 'Memory file name: FUNCTIONS, PROJECT_MAP, FLOW_GRAPH, RULES, ARCHITECTURE, DISCOVERY, ATTEMPTS, ERRORS, VERSIONS, DATASTRUCTURE',
      },
      action: {
        type: 'string',
        enum: ['read', 'write', 'append', 'init', 'context', 'resume', 'migrate'],
        description: 'Action: read/write/append memory files, init (create), context (update ARCHITECTURE.md), resume (session start/end/switch), migrate (flat to layered)',
      },
      resume_action: {
        type: 'string',
        enum: ['start', 'end', 'switch_branch'],
        description: '[resume] Sub-action: start (load briefing), end (snapshot), switch_branch',
      },
      branch: {
        type: 'string',
        description: '[resume switch_branch] Target branch name',
      },
      summary: {
        type: 'string',
        description: '[resume end] Session summary',
      },
      content: {
        type: 'string',
        description: 'Content to write/append (required for write/append actions)',
      },
    },
    required: ['action'],
  },
};

export async function handleMemory(args: unknown) {
  const input = args as MemoryInput;
  const { file, action, content } = input;

  // Special case: context action — update Project Context section in ARCHITECTURE.md
  if (action === 'context') {
    if (!content) {
      return {
        content: [{ type: 'text', text: '❌ Missing content for context action. Provide key:value like "vision: My project is..." or "conventions: Use camelCase..."' }],
        isError: true,
      };
    }
    try {
      const targetFile = file?.toUpperCase() === 'ARCHITECTURE' ? MEMORY_FILES.ARCHITECTURE : MEMORY_FILES.ARCHITECTURE;
      let archContent = await readMemoryFile(targetFile);

      if (!archContent) {
        archContent = '# Project Architecture\n\n## Project Context\n\n';
      }

      // Ensure ## Project Context section exists
      if (!archContent.includes('## Project Context')) {
        archContent = archContent.trimEnd() + '\n\n## Project Context\n\n';
      }

      // Parse the content key: value
      const colonIdx = content.indexOf(':');
      if (colonIdx < 0) {
        // Append as-is to Project Context section
        const insertPoint = archContent.indexOf('## Project Context');
        const sectionEnd = archContent.indexOf('\n## ', insertPoint + 1);
        const endIdx = sectionEnd > 0 ? sectionEnd : archContent.length;
        archContent = archContent.slice(0, endIdx).trimEnd() + '\n' + content + '\n' + archContent.slice(endIdx);
      } else {
        const key = content.slice(0, colonIdx).trim().toLowerCase();
        const value = content.slice(colonIdx + 1).trim();

        // Map known keys to subsection headers
        const sectionMap: Record<string, string> = {
          vision: '### Vision',
          conventions: '### Conventions',
          issues: '### Known Issues',
          notes: '### Notes',
        };
        const header = sectionMap[key] || `### ${key.charAt(0).toUpperCase() + key.slice(1)}`;

        // Replace or add subsection
        const headerIdx = archContent.indexOf(header);
        if (headerIdx >= 0) {
          // Find next ### or ## to determine section end
          const nextHeader = archContent.indexOf('\n###', headerIdx + header.length);
          const nextSection = archContent.indexOf('\n## ', headerIdx + header.length);
          let endIdx: number;
          if (nextHeader > 0 && (nextSection < 0 || nextHeader < nextSection)) {
            endIdx = nextHeader;
          } else if (nextSection > 0) {
            endIdx = nextSection;
          } else {
            endIdx = archContent.length;
          }
          archContent = archContent.slice(0, headerIdx) + `${header}\n> ${value}\n` + archContent.slice(endIdx);
        } else {
          // Add new subsection at end of Project Context
          const ctxIdx = archContent.indexOf('## Project Context');
          const nextSection = archContent.indexOf('\n## ', ctxIdx + 1);
          const endIdx = nextSection > 0 ? nextSection : archContent.length;
          archContent = archContent.slice(0, endIdx).trimEnd() + `\n\n${header}\n> ${value}\n` + archContent.slice(endIdx);
        }
      }

      await writeMemoryFile(targetFile, archContent);
      return {
        content: [{ type: 'text', text: `✅ Project context updated in ARCHITECTURE.md` }],
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      return {
        content: [{ type: 'text', text: `❌ Context update failed: ${errorMsg}` }],
        isError: true,
      };
    }
  }

  // Resume action — session lifecycle
  if (action === 'resume') {
    try {
      switch (input.resume_action) {
        case 'start': {
          const briefing = await loadSessionBriefing();
          return { content: [{ type: 'text', text: briefing }] };
        }
        case 'end': {
          const result = await snapshotSession(input.summary);
          return { content: [{ type: 'text', text: result }] };
        }
        case 'switch_branch': {
          if (!input.branch) {
            return {
              content: [{ type: 'text', text: '❌ Missing branch parameter for switch_branch' }],
              isError: true,
            };
          }
          const result = await switchBranch(input.branch);
          return { content: [{ type: 'text', text: result }] };
        }
        default:
          return {
            content: [{ type: 'text', text: '❌ Missing resume_action. Use: start, end, switch_branch' }],
            isError: true,
          };
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      return {
        content: [{ type: 'text', text: `❌ Resume failed: ${errorMsg}` }],
        isError: true,
      };
    }
  }

  // Migrate action — flat to layered
  if (action === 'migrate') {
    try {
      const result = await migrateToLayered();
      return { content: [{ type: 'text', text: result }] };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      return {
        content: [{ type: 'text', text: `❌ Migration failed: ${errorMsg}` }],
        isError: true,
      };
    }
  }

  // Special case: init action
  if (action === 'init') {
    try {
      await initializeMemoryFiles();
      return {
        content: [{
          type: 'text',
          text: '✅ Memory files initialized:\n' +
                Object.values(MEMORY_FILES).map(f => `  - ${f}`).join('\n'),
        }],
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      return {
        content: [{ type: 'text', text: `❌ Failed to initialize: ${errorMsg}` }],
        isError: true,
      };
    }
  }
  
  if (!file) {
    return {
      content: [{ 
        type: 'text', 
        text: '❌ Missing required parameter: file\n\n' +
              'Available files: FUNCTIONS, PROJECT_MAP, FLOW_GRAPH, RULES, ARCHITECTURE, DISCOVERY, ATTEMPTS, ERRORS, VERSIONS, DATASTRUCTURE' 
      }],
      isError: true,
    };
  }
  
  // Map file name to path
  const fileKey = file.toUpperCase().replace('.MD', '').replace('.JSON', '') as keyof typeof MEMORY_FILES;
  const filepath = MEMORY_FILES[fileKey];
  
  if (!filepath) {
    return {
      content: [{ 
        type: 'text', 
        text: `❌ Unknown memory file: ${file}\n\n` +
              'Available files: FUNCTIONS, PROJECT_MAP, FLOW_GRAPH, RULES, ARCHITECTURE, DISCOVERY, ATTEMPTS, ERRORS, VERSIONS, DATASTRUCTURE'
      }],
      isError: true,
    };
  }
  
  try {
    switch (action) {
      case 'read': {
        const fileContent = await readMemoryFile(filepath);
        return {
          content: [{
            type: 'text',
            text: fileContent || `(${filepath} is empty)`,
          }],
        };
      }
      
      case 'write': {
        if (content === undefined) {
          return {
            content: [{ type: 'text', text: '❌ Missing content for write action' }],
            isError: true,
          };
        }
        await writeMemoryFile(filepath, content);
        invalidateCacheFor(fileKey);
        return {
          content: [{
            type: 'text',
            text: `✅ Written to ${filepath}`,
          }],
        };
      }
      
      case 'append': {
        if (content === undefined) {
          return {
            content: [{ type: 'text', text: '❌ Missing content for append action' }],
            isError: true,
          };
        }
        await appendMemoryFile(filepath, content);
        invalidateCacheFor(fileKey);
        return {
          content: [{
            type: 'text',
            text: `✅ Appended to ${filepath}`,
          }],
        };
      }
      
      default:
        return {
          content: [{ type: 'text', text: `❌ Unknown action: ${action}` }],
          isError: true,
        };
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return {
      content: [{ type: 'text', text: `❌ Operation failed: ${errorMsg}` }],
      isError: true,
    };
  }
}

function invalidateCacheFor(fileKey: string): void {
  switch (fileKey) {
    case 'FUNCTIONS':
      memoryCache.invalidateFunctions();
      break;
    case 'RULES':
      memoryCache.invalidateRules();
      break;
    case 'ATTEMPTS':
      memoryCache.invalidateAttempts();
      break;
    case 'DISCOVERY':
      memoryCache.invalidateDiscovery();
      break;
    case 'CONFIG':
      memoryCache.invalidateConfig();
      break;
  }
}



