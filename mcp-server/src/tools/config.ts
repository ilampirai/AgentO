/**
 * agento_config - Configuration management
 * Get, set, reset config values and show status
 */

import { memoryCache } from '../memory/cache.js';
import {
  writeJsonMemoryFile,
  memoryFileExists,
  readMemoryFile
} from '../memory/loader.js';
import { resolveMemoryPath } from '../memory/resolver.js';
import { MEMORY_FILES, DEFAULT_CONFIG } from '../types.js';
import type { ConfigInput, AgentOConfig } from '../types.js';
import { parseFunctions, parseRules, parseAttempts, parseDiscovery } from '../memory/parser.js';

export const configToolDef = {
  name: 'agento_config',
  description: 'View or modify AgentO configuration. Also provides status overview of all memory files.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      action: {
        type: 'string',
        enum: ['get', 'set', 'reset', 'status'],
        description: 'Action to perform (default: get)',
      },
      key: {
        type: 'string',
        description: 'Config key: lineLimit, strictMode, autoIndex, autoMemoryUpdate',
      },
      value: {
        type: ['string', 'number', 'boolean'],
        description: 'Value to set',
      },
    },
    required: [],
  },
};

export async function handleConfig(args: unknown) {
  const input = args as ConfigInput & { action?: 'get' | 'set' | 'reset' | 'status' };
  const { action = 'get', key, value } = input;
  
  try {
    switch (action) {
      case 'status': {
        return await getStatus();
      }
      
      case 'get': {
        const config = await memoryCache.getConfig();
        
        if (key) {
          if (!(key in config)) {
            return {
              content: [{
                type: 'text',
                text: `❌ Unknown config key: ${key}\n\n` +
                      `Available keys: ${Object.keys(DEFAULT_CONFIG).join(', ')}`,
              }],
              isError: true,
            };
          }
          
          return {
            content: [{
              type: 'text',
              text: `⚙️ ${key} = ${JSON.stringify(config[key as keyof AgentOConfig])}`,
            }],
          };
        }
        
        // Show all config
        let output = '⚙️ **AgentO Configuration**\n\n';
        for (const [k, v] of Object.entries(config)) {
          const defaultVal = DEFAULT_CONFIG[k as keyof AgentOConfig];
          const isDefault = v === defaultVal;
          output += `- **${k}**: ${JSON.stringify(v)}${isDefault ? ' (default)' : ''}\n`;
        }
        
        return {
          content: [{ type: 'text', text: output }],
        };
      }
      
      case 'set': {
        if (!key) {
          return {
            content: [{ type: 'text', text: '❌ Missing required parameter: key' }],
            isError: true,
          };
        }
        
        if (value === undefined) {
          return {
            content: [{ type: 'text', text: '❌ Missing required parameter: value' }],
            isError: true,
          };
        }
        
        if (!(key in DEFAULT_CONFIG)) {
          return {
            content: [{
              type: 'text',
              text: `❌ Unknown config key: ${key}\n\n` +
                    `Available keys: ${Object.keys(DEFAULT_CONFIG).join(', ')}`,
            }],
            isError: true,
          };
        }
        
        const config = await memoryCache.getConfig();
        
        // Type coercion based on default value type
        let typedValue: string | number | boolean = value;
        const defaultType = typeof DEFAULT_CONFIG[key as keyof AgentOConfig];
        
        if (defaultType === 'number' && typeof value === 'string') {
          typedValue = parseInt(value, 10);
          if (isNaN(typedValue as number)) {
            return {
              content: [{ type: 'text', text: `❌ Invalid number value: ${value}` }],
              isError: true,
            };
          }
        } else if (defaultType === 'boolean' && typeof value === 'string') {
          typedValue = value.toLowerCase() === 'true';
        }
        
        (config as Record<string, unknown>)[key] = typedValue;
        await writeJsonMemoryFile(MEMORY_FILES.CONFIG, config);
        memoryCache.invalidateConfig();
        
        return {
          content: [{
            type: 'text',
            text: `✅ Set ${key} = ${JSON.stringify(typedValue)}`,
          }],
        };
      }
      
      case 'reset': {
        if (key) {
          // Reset single key
          if (!(key in DEFAULT_CONFIG)) {
            return {
              content: [{
                type: 'text',
                text: `❌ Unknown config key: ${key}`,
              }],
              isError: true,
            };
          }
          
          const config = await memoryCache.getConfig();
          (config as Record<string, unknown>)[key] = DEFAULT_CONFIG[key as keyof AgentOConfig];
          await writeJsonMemoryFile(MEMORY_FILES.CONFIG, config);
          memoryCache.invalidateConfig();
          
          return {
            content: [{
              type: 'text',
              text: `✅ Reset ${key} to default: ${JSON.stringify(DEFAULT_CONFIG[key as keyof AgentOConfig])}`,
            }],
          };
        }
        
        // Reset all
        await writeJsonMemoryFile(MEMORY_FILES.CONFIG, DEFAULT_CONFIG);
        memoryCache.invalidateConfig();
        
        return {
          content: [{
            type: 'text',
            text: '✅ Reset all configuration to defaults.',
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

async function getStatus() {
  let output = '📊 **AgentO Status**\n\n';

  // Config
  const config = await memoryCache.getConfig();
  output += `⚙️ **Configuration**\n`;
  output += `- Strict mode: ${config.strictMode ? 'ON' : 'OFF'}\n`;
  output += `- Auto-index: ${config.autoIndex ? 'ON' : 'OFF'}\n`;
  output += `- Auto memory update: ${config.autoMemoryUpdate ? 'ON' : 'OFF'}\n`;
  output += `- Deferred index: ${config.deferIndex ? 'ON' : 'OFF'}\n\n`;
  
  // Functions
  try {
    const functionsContent = await readMemoryFile(MEMORY_FILES.FUNCTIONS);
    const functions = parseFunctions(functionsContent);
    const files = new Set(functions.map(f => f.file));
    output += `📚 **Functions Index**\n`;
    output += `- Total functions: ${functions.length}\n`;
    output += `- Files indexed: ${files.size}\n\n`;
  } catch {
    output += `📚 **Functions Index**: Not initialized\n\n`;
  }
  
  // Rules
  try {
    const rulesContent = await readMemoryFile(MEMORY_FILES.RULES);
    const rules = parseRules(rulesContent);
    const enabled = rules.filter(r => r.enabled).length;
    output += `📋 **Rules**\n`;
    output += `- Total rules: ${rules.length}\n`;
    output += `- Enabled: ${enabled}\n\n`;
  } catch {
    output += `📋 **Rules**: Not initialized\n\n`;
  }
  
  // Discovery
  try {
    const discoveryContent = await readMemoryFile(MEMORY_FILES.DISCOVERY);
    const discovered = parseDiscovery(discoveryContent);
    output += `🔍 **Discovery**\n`;
    output += `- Areas explored: ${discovered.size}\n\n`;
  } catch {
    output += `🔍 **Discovery**: Not initialized\n\n`;
  }
  
  // Attempts
  try {
    const attemptsContent = await readMemoryFile(MEMORY_FILES.ATTEMPTS);
    const attempts = parseAttempts(attemptsContent);
    const blocked = attempts.filter(a => a.dontRetry).length;
    output += `⚠️ **Attempts**\n`;
    output += `- Total logged: ${attempts.length}\n`;
    output += `- Blocked patterns: ${blocked}\n\n`;
  } catch {
    output += `⚠️ **Attempts**: Not initialized\n\n`;
  }
  
  // Memory files existence
  output += `📁 **Memory Files**\n`;
  const memoryFiles = [
    MEMORY_FILES.FUNCTIONS,
    MEMORY_FILES.RULES,
    MEMORY_FILES.ARCHITECTURE,
    MEMORY_FILES.DISCOVERY,
    MEMORY_FILES.ATTEMPTS,
    MEMORY_FILES.ERRORS,
    MEMORY_FILES.VERSIONS,
    MEMORY_FILES.DATASTRUCTURE,
  ];

  for (const file of memoryFiles) {
    const exists = await memoryFileExists(file);
    output += `- ${file}: ${exists ? '✅' : '❌'}\n`;
  }

  // Memory health (v6.0)
  output += '\n🧠 **Memory Health**\n';
  try {
    const decisions = await memoryCache.getDecisions();
    output += `- Decisions: ${decisions.length}\n`;
  } catch {
    output += `- Decisions: n/a\n`;
  }
  try {
    const flows = await memoryCache.getFlows();
    output += `- Protected flows: ${flows.length}\n`;
  } catch {
    output += `- Protected flows: n/a\n`;
  }
  try {
    const context = await readMemoryFile(resolveMemoryPath('ACTIVE_CONTEXT'));
    const tokens = Math.ceil(context.length / 4);
    const budget = config.memory?.tokenBudgetWarn ?? 8000;
    output += `- Working memory: ~${tokens} tokens${tokens > budget ? ' ⚠️ OVER BUDGET' : ''}\n`;
  } catch {
    output += `- Working memory: n/a\n`;
  }

  const isDirty = await memoryCache.isDirty();
  output += `- Dirty files pending index: ${isDirty ? 'yes' : 'no'}\n`;

  // Check layered structure
  const layeredFiles = ['IDENTITY', 'PRINCIPLES', 'DECISIONS', 'FLOWS', 'ACTIVE_CONTEXT'] as const;
  let layeredCount = 0;
  for (const key of layeredFiles) {
    if (await memoryFileExists(resolveMemoryPath(key))) layeredCount++;
  }
  output += `- Layered structure: ${layeredCount}/${layeredFiles.length} files\n`;

  return {
    content: [{ type: 'text', text: output }],
  };
}



