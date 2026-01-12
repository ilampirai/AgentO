/**
 * agento_rules - Rule management
 * Add, edit, remove, enable, disable project rules
 */

import { memoryCache } from '../memory/cache.js';
import { readMemoryFile, writeMemoryFile } from '../memory/loader.js';
import { parseRules, formatRuleEntry } from '../memory/parser.js';
import { MEMORY_FILES } from '../types.js';
import type { RulesInput, RuleEntry } from '../types.js';

export const rulesToolDef = {
  name: 'agento_rules',
  description: 'Manage project rules. List, add, remove, edit, enable, or disable rules that are enforced by agento_write.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      action: {
        type: 'string',
        enum: ['list', 'add', 'remove', 'edit', 'enable', 'disable'],
        description: 'Action to perform',
      },
      id: {
        type: 'string',
        description: 'Rule ID (required for remove, edit, enable, disable)',
      },
      description: {
        type: 'string',
        description: 'Rule description (required for add)',
      },
      pattern: {
        type: 'string',
        description: 'Pattern to check: no-inline-css, no-console, no-any, or custom string',
      },
      files: {
        type: 'string',
        description: 'File patterns to apply rule to (e.g., "*.ts, *.js")',
      },
      ruleAction: {
        type: 'string',
        enum: ['BLOCK', 'WARN'],
        description: 'Action when rule is violated',
      },
    },
    required: ['action'],
  },
};

export async function handleRules(args: unknown) {
  const input = args as RulesInput;
  const { action, id, description, pattern, files, ruleAction } = input;
  
  try {
    const content = await readMemoryFile(MEMORY_FILES.RULES);
    const rules = parseRules(content);
    
    switch (action) {
      case 'list': {
        if (rules.length === 0) {
          return {
            content: [{
              type: 'text',
              text: '📋 No rules configured.\n\nAdd a rule with: agento_rules action=add description="..." pattern="..."',
            }],
          };
        }
        
        const systemRules = rules.filter(r => r.id.startsWith('SYS'));
        const userRules = rules.filter(r => r.id.startsWith('USR'));
        
        let output = '📋 **Project Rules**\n\n';
        
        if (systemRules.length > 0) {
          output += '## System Rules\n';
          for (const rule of systemRules) {
            const status = rule.enabled ? '✅' : '❌';
            output += `${status} [${rule.id}] ${rule.description} (${rule.action})\n`;
          }
          output += '\n';
        }
        
        if (userRules.length > 0) {
          output += '## User Rules\n';
          for (const rule of userRules) {
            const status = rule.enabled ? '✅' : '❌';
            output += `${status} [${rule.id}] ${rule.description}\n`;
            output += `   Pattern: ${rule.pattern} | Files: ${rule.files} | Action: ${rule.action}\n`;
          }
        }
        
        return {
          content: [{ type: 'text', text: output }],
        };
      }
      
      case 'add': {
        if (!description) {
          return {
            content: [{ type: 'text', text: '❌ Missing required parameter: description' }],
            isError: true,
          };
        }
        
        // Generate next USR ID
        const userRules = rules.filter(r => r.id.startsWith('USR'));
        const nextNum = userRules.length + 1;
        const newId = `USR${String(nextNum).padStart(3, '0')}`;
        
        const newRule: RuleEntry = {
          id: newId,
          description,
          pattern: pattern || '',
          files: files || '*',
          action: (ruleAction as 'BLOCK' | 'WARN') || 'WARN',
          enabled: true,
        };
        
        // Append to RULES.md
        let rulesContent = await readMemoryFile(MEMORY_FILES.RULES);
        rulesContent = rulesContent.trimEnd() + '\n\n' + formatRuleEntry(newRule);
        await writeMemoryFile(MEMORY_FILES.RULES, rulesContent);
        memoryCache.invalidateRules();
        
        return {
          content: [{
            type: 'text',
            text: `✅ Added rule [${newId}]: ${description}\n` +
                  `   Pattern: ${newRule.pattern || '(custom)'}\n` +
                  `   Files: ${newRule.files}\n` +
                  `   Action: ${newRule.action}`,
          }],
        };
      }
      
      case 'remove': {
        if (!id) {
          return {
            content: [{ type: 'text', text: '❌ Missing required parameter: id' }],
            isError: true,
          };
        }
        
        const ruleIndex = rules.findIndex(r => r.id === id);
        if (ruleIndex === -1) {
          return {
            content: [{ type: 'text', text: `❌ Rule not found: ${id}` }],
            isError: true,
          };
        }
        
        // Remove rule and rebuild file
        rules.splice(ruleIndex, 1);
        await rebuildRulesFile(rules);
        
        return {
          content: [{ type: 'text', text: `✅ Removed rule [${id}]` }],
        };
      }
      
      case 'edit': {
        if (!id) {
          return {
            content: [{ type: 'text', text: '❌ Missing required parameter: id' }],
            isError: true,
          };
        }
        
        const rule = rules.find(r => r.id === id);
        if (!rule) {
          return {
            content: [{ type: 'text', text: `❌ Rule not found: ${id}` }],
            isError: true,
          };
        }
        
        // Update fields if provided
        if (description) rule.description = description;
        if (pattern) rule.pattern = pattern;
        if (files) rule.files = files;
        if (ruleAction) rule.action = ruleAction as 'BLOCK' | 'WARN';
        
        await rebuildRulesFile(rules);
        
        return {
          content: [{
            type: 'text',
            text: `✅ Updated rule [${id}]\n` +
                  `   Description: ${rule.description}\n` +
                  `   Pattern: ${rule.pattern}\n` +
                  `   Files: ${rule.files}\n` +
                  `   Action: ${rule.action}`,
          }],
        };
      }
      
      case 'enable': {
        if (!id) {
          return {
            content: [{ type: 'text', text: '❌ Missing required parameter: id' }],
            isError: true,
          };
        }
        
        const rule = rules.find(r => r.id === id);
        if (!rule) {
          return {
            content: [{ type: 'text', text: `❌ Rule not found: ${id}` }],
            isError: true,
          };
        }
        
        rule.enabled = true;
        await rebuildRulesFile(rules);
        
        return {
          content: [{ type: 'text', text: `✅ Enabled rule [${id}]` }],
        };
      }
      
      case 'disable': {
        if (!id) {
          return {
            content: [{ type: 'text', text: '❌ Missing required parameter: id' }],
            isError: true,
          };
        }
        
        const rule = rules.find(r => r.id === id);
        if (!rule) {
          return {
            content: [{ type: 'text', text: `❌ Rule not found: ${id}` }],
            isError: true,
          };
        }
        
        rule.enabled = false;
        await rebuildRulesFile(rules);
        
        return {
          content: [{ type: 'text', text: `✅ Disabled rule [${id}]` }],
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

async function rebuildRulesFile(rules: RuleEntry[]): Promise<void> {
  const systemRules = rules.filter(r => r.id.startsWith('SYS'));
  const userRules = rules.filter(r => r.id.startsWith('USR'));
  
  let content = '# Project Rules\n\n';
  
  if (systemRules.length > 0) {
    content += '## System Rules\n\n';
    for (const rule of systemRules) {
      content += formatRuleEntry(rule) + '\n';
    }
  }
  
  content += '## User Rules\n\n';
  for (const rule of userRules) {
    content += formatRuleEntry(rule) + '\n';
  }
  
  await writeMemoryFile(MEMORY_FILES.RULES, content);
  memoryCache.invalidateRules();
}

