/**
 * agento_patterns - Dynamic pattern management tool
 * List, add, remove, test, suggest, approve, reject extraction patterns.
 */

import { memoryCache } from '../memory/cache.js';
import { getApplicablePatterns } from '../memory/parser.js';
import { DEFAULT_PATTERNS } from '../patterns.js';
import { readJsonMemoryFile, writeJsonMemoryFile } from '../memory/loader.js';
import { MEMORY_FILES } from '../types.js';
import type { PatternsInput, ExtractionPattern, AgentOConfig, PatternCategory } from '../types.js';

export const patternsToolDef = {
  name: 'agento_patterns',
  description: 'Manage extraction patterns. List, add, remove, test, suggest patterns for function/class/datastructure/route/hook extraction.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      action: {
        type: 'string',
        enum: ['list', 'add', 'remove', 'test', 'suggest', 'approve', 'reject'],
        description: 'Action to perform',
      },
      category: {
        type: 'string',
        enum: ['function', 'class', 'datastructure', 'route', 'constant', 'decorator', 'hook'],
        description: 'Filter by pattern category (for list) or set category (for add/suggest)',
      },
      id: {
        type: 'string',
        description: 'Pattern ID (for remove, approve, reject)',
      },
      pattern: {
        type: 'object',
        description: 'Pattern definition (for add, suggest, test). Object with: id, description, category, regex, flags, captures, fileExtensions, framework, priority',
      },
      testCode: {
        type: 'string',
        description: 'Sample code to test a pattern against (for test action)',
      },
    },
    required: ['action'],
  },
};

export async function handlePatterns(args: unknown) {
  const input = args as PatternsInput;
  const { action } = input;

  try {
    switch (action) {
      case 'list':
        return await listPatterns(input);
      case 'add':
        return await addPattern(input);
      case 'remove':
        return await removePattern(input);
      case 'test':
        return await testPattern(input);
      case 'suggest':
        return await suggestPattern(input);
      case 'approve':
        return await approvePattern(input);
      case 'reject':
        return await rejectPattern(input);
      default:
        return {
          content: [{ type: 'text', text: `❌ Unknown action: ${action}` }],
          isError: true,
        };
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return {
      content: [{ type: 'text', text: `❌ Pattern operation failed: ${msg}` }],
      isError: true,
    };
  }
}

async function listPatterns(input: PatternsInput) {
  const config = await memoryCache.getConfig();
  const configPatterns = config.patterns || [];
  const category = input.category || null;

  // Merge defaults + config
  const merged = new Map<string, ExtractionPattern>();
  for (const p of DEFAULT_PATTERNS) {
    merged.set(p.id, p);
  }
  for (const p of configPatterns) {
    merged.set(p.id, p);
  }

  let patterns = Array.from(merged.values());
  if (category) {
    patterns = patterns.filter(p => p.category === category);
  }

  // Sort by category then priority
  patterns.sort((a, b) => {
    if (a.category !== b.category) return a.category.localeCompare(b.category);
    return (b.priority || 0) - (a.priority || 0);
  });

  if (patterns.length === 0) {
    return {
      content: [{ type: 'text', text: `No patterns found${category ? ` for category: ${category}` : ''}.` }],
    };
  }

  let output = `**Extraction Patterns** (${patterns.length})\n\n`;
  let currentCat = '';

  for (const p of patterns) {
    if (p.category !== currentCat) {
      currentCat = p.category;
      output += `### ${currentCat.toUpperCase()}\n\n`;
    }

    const status = p.enabled ? '✅' : '❌';
    const src = p.source === 'default' ? 'built-in' : p.source;
    const fw = p.framework ? ` [${p.framework}]` : '';
    const ext = p.fileExtensions.length > 0 ? p.fileExtensions.join(', ') : '*';
    output += `${status} **${p.id}** — ${p.description}${fw}\n`;
    output += `   Extensions: ${ext} | Source: ${src} | Priority: ${p.priority || 0}\n\n`;
  }

  return { content: [{ type: 'text', text: output }] };
}

async function addPattern(input: PatternsInput) {
  if (!input.pattern) {
    return {
      content: [{ type: 'text', text: '❌ Missing pattern definition. Provide: id, description, category, regex, captures, fileExtensions' }],
      isError: true,
    };
  }

  const p = input.pattern as Partial<ExtractionPattern>;
  if (!p.id || !p.regex || !p.captures?.name) {
    return {
      content: [{ type: 'text', text: '❌ Pattern must have: id, regex, captures.name (at minimum)' }],
      isError: true,
    };
  }

  // Validate regex
  try {
    new RegExp(p.regex, p.flags || '');
  } catch (e) {
    return {
      content: [{ type: 'text', text: `❌ Invalid regex: ${e instanceof Error ? e.message : String(e)}` }],
      isError: true,
    };
  }

  const newPattern: ExtractionPattern = {
    id: p.id,
    description: p.description || p.id,
    category: (p.category || input.category || 'function') as PatternCategory,
    regex: p.regex,
    flags: p.flags || '',
    captures: { ...p.captures, name: p.captures.name },
    fileExtensions: p.fileExtensions || [],
    source: 'user',
    enabled: p.enabled !== false,
    framework: p.framework,
    priority: p.priority || 0,
  };

  // Save to config
  const config = await readJsonMemoryFile<AgentOConfig>(MEMORY_FILES.CONFIG, { patterns: [] } as unknown as AgentOConfig);
  const patterns = config.patterns || [];
  const existingIdx = patterns.findIndex(ep => ep.id === newPattern.id);
  if (existingIdx >= 0) {
    patterns[existingIdx] = newPattern;
  } else {
    patterns.push(newPattern);
  }
  config.patterns = patterns;
  await writeJsonMemoryFile(MEMORY_FILES.CONFIG, config);
  memoryCache.invalidateConfig();

  return {
    content: [{ type: 'text', text: `✅ Pattern added: ${newPattern.id} (${newPattern.category})` }],
  };
}

async function removePattern(input: PatternsInput) {
  if (!input.id) {
    return {
      content: [{ type: 'text', text: '❌ Missing pattern ID to remove' }],
      isError: true,
    };
  }

  // Check if it's a default pattern
  const isDefault = DEFAULT_PATTERNS.some(p => p.id === input.id);

  const config = await readJsonMemoryFile<AgentOConfig>(MEMORY_FILES.CONFIG, { patterns: [] } as unknown as AgentOConfig);
  const patterns = config.patterns || [];

  if (isDefault) {
    // For defaults, add a disabled override
    const existingIdx = patterns.findIndex(p => p.id === input.id);
    const defaultP = DEFAULT_PATTERNS.find(p => p.id === input.id)!;
    const disabled = { ...defaultP, enabled: false };
    if (existingIdx >= 0) {
      patterns[existingIdx] = disabled;
    } else {
      patterns.push(disabled);
    }
    config.patterns = patterns;
    await writeJsonMemoryFile(MEMORY_FILES.CONFIG, config);
    memoryCache.invalidateConfig();
    return {
      content: [{ type: 'text', text: `✅ Default pattern disabled: ${input.id}` }],
    };
  }

  // For user/discovered patterns, remove entirely
  const newPatterns = patterns.filter(p => p.id !== input.id);
  if (newPatterns.length === patterns.length) {
    return {
      content: [{ type: 'text', text: `❌ Pattern not found: ${input.id}` }],
      isError: true,
    };
  }

  config.patterns = newPatterns;
  await writeJsonMemoryFile(MEMORY_FILES.CONFIG, config);
  memoryCache.invalidateConfig();

  return {
    content: [{ type: 'text', text: `✅ Pattern removed: ${input.id}` }],
  };
}

async function testPattern(input: PatternsInput) {
  if (!input.pattern?.regex || !input.testCode) {
    return {
      content: [{ type: 'text', text: '❌ Test requires: pattern.regex, pattern.captures.name, and testCode' }],
      isError: true,
    };
  }

  const p = input.pattern as Partial<ExtractionPattern>;

  let compiled: RegExp;
  try {
    compiled = new RegExp(p.regex!, p.flags || '');
  } catch (e) {
    return {
      content: [{ type: 'text', text: `❌ Invalid regex: ${e instanceof Error ? e.message : String(e)}` }],
      isError: true,
    };
  }

  const lines = input.testCode.split('\n');
  const matches: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(compiled);
    if (match) {
      const captures: string[] = [];
      if (p.captures?.name) captures.push(`name=${match[p.captures.name] || '?'}`);
      if (p.captures?.params) captures.push(`params=${match[p.captures.params] || '?'}`);
      if (p.captures?.returnType) captures.push(`returnType=${match[p.captures.returnType] || '?'}`);
      if (p.captures?.path) captures.push(`path=${match[p.captures.path] || '?'}`);
      if (p.captures?.method) captures.push(`method=${match[p.captures.method] || '?'}`);
      if (p.captures?.parentName) captures.push(`parent=${match[p.captures.parentName] || '?'}`);

      matches.push(`  line ${i + 1} → ${captures.join(', ')}`);
    }
  }

  if (matches.length === 0) {
    return {
      content: [{ type: 'text', text: '0 matches found. Check your regex and test code.' }],
    };
  }

  return {
    content: [{ type: 'text', text: `**${matches.length} match(es) found:**\n${matches.join('\n')}` }],
  };
}

async function suggestPattern(input: PatternsInput) {
  if (!input.pattern) {
    return {
      content: [{ type: 'text', text: '❌ Missing pattern definition for suggestion' }],
      isError: true,
    };
  }

  const p = input.pattern as Partial<ExtractionPattern>;
  if (!p.id || !p.regex || !p.captures?.name) {
    return {
      content: [{ type: 'text', text: '❌ Suggestion must have: id, regex, captures.name' }],
      isError: true,
    };
  }

  // Validate regex
  try {
    new RegExp(p.regex, p.flags || '');
  } catch (e) {
    return {
      content: [{ type: 'text', text: `❌ Invalid regex: ${e instanceof Error ? e.message : String(e)}` }],
      isError: true,
    };
  }

  const newPattern: ExtractionPattern = {
    id: p.id,
    description: p.description || p.id,
    category: (p.category || input.category || 'function') as PatternCategory,
    regex: p.regex,
    flags: p.flags || '',
    captures: { ...p.captures, name: p.captures.name },
    fileExtensions: p.fileExtensions || [],
    source: 'discovered',
    enabled: false, // Not enabled until approved
    framework: p.framework,
    priority: p.priority || 0,
  };

  // Save as discovered (disabled)
  const config = await readJsonMemoryFile<AgentOConfig>(MEMORY_FILES.CONFIG, { patterns: [] } as unknown as AgentOConfig);
  const patterns = config.patterns || [];
  const existingIdx = patterns.findIndex(ep => ep.id === newPattern.id);
  if (existingIdx >= 0) {
    patterns[existingIdx] = newPattern;
  } else {
    patterns.push(newPattern);
  }
  config.patterns = patterns;
  await writeJsonMemoryFile(MEMORY_FILES.CONFIG, config);
  memoryCache.invalidateConfig();

  return {
    content: [{ type: 'text', text: `💡 Pattern suggested: ${newPattern.id} (${newPattern.category})\nStatus: pending approval. Use { action: "approve", id: "${newPattern.id}" } to enable.` }],
  };
}

async function approvePattern(input: PatternsInput) {
  if (!input.id) {
    return {
      content: [{ type: 'text', text: '❌ Missing pattern ID to approve' }],
      isError: true,
    };
  }

  const config = await readJsonMemoryFile<AgentOConfig>(MEMORY_FILES.CONFIG, { patterns: [] } as unknown as AgentOConfig);
  const patterns = config.patterns || [];
  const pattern = patterns.find(p => p.id === input.id);

  if (!pattern) {
    return {
      content: [{ type: 'text', text: `❌ Pattern not found in config: ${input.id}` }],
      isError: true,
    };
  }

  pattern.enabled = true;
  if (pattern.source === 'discovered') {
    // Keep as discovered but now enabled
  }

  config.patterns = patterns;
  await writeJsonMemoryFile(MEMORY_FILES.CONFIG, config);
  memoryCache.invalidateConfig();

  return {
    content: [{ type: 'text', text: `✅ Pattern approved and enabled: ${input.id}` }],
  };
}

async function rejectPattern(input: PatternsInput) {
  if (!input.id) {
    return {
      content: [{ type: 'text', text: '❌ Missing pattern ID to reject' }],
      isError: true,
    };
  }

  const config = await readJsonMemoryFile<AgentOConfig>(MEMORY_FILES.CONFIG, { patterns: [] } as unknown as AgentOConfig);
  const patterns = config.patterns || [];
  const idx = patterns.findIndex(p => p.id === input.id);

  if (idx < 0) {
    return {
      content: [{ type: 'text', text: `❌ Pattern not found in config: ${input.id}` }],
      isError: true,
    };
  }

  patterns.splice(idx, 1);
  config.patterns = patterns;
  await writeJsonMemoryFile(MEMORY_FILES.CONFIG, config);
  memoryCache.invalidateConfig();

  return {
    content: [{ type: 'text', text: `✅ Pattern rejected and removed: ${input.id}` }],
  };
}
