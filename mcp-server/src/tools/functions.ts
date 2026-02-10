/**
 * agento_functions - Query function index
 * Search, list, and check for duplicates with tiered detection
 */

import { memoryCache } from '../memory/cache.js';
import { extractFunctionsFromCode, findDuplicates } from '../memory/parser.js';
import type { FunctionsInput, FunctionEntry } from '../types.js';

export const functionsToolDef = {
  name: 'agento_functions',
  description: 'Query the function index. Search by name/keyword, list by file, or check for duplicates.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      query: {
        type: 'string',
        description: 'Search query (function name or keyword)',
      },
      file: {
        type: 'string',
        description: 'Filter by file path',
      },
      checkDuplicates: {
        type: 'boolean',
        description: 'Check if code contains duplicate functions',
      },
      code: {
        type: 'string',
        description: 'Code to check for duplicates (required if checkDuplicates=true)',
      },
    },
    required: [],
  },
};

export async function handleFunctions(args: unknown) {
  const input = args as FunctionsInput;
  const { query, file, checkDuplicates, code } = input;

  try {
    const functions = await memoryCache.getFunctions();

    // ─── Duplicate check mode ─────────────────────────────────────────────
    if (checkDuplicates) {
      if (!code) {
        return {
          content: [{ type: 'text', text: '❌ Missing required parameter: code (for duplicate check)' }],
          isError: true,
        };
      }

      const newFunctions = extractFunctionsFromCode(code, '(input)');
      const allDuplicates: { newFunc: FunctionEntry; results: ReturnType<typeof findDuplicates> }[] = [];

      for (const newFunc of newFunctions) {
        const results = findDuplicates(newFunc, functions);
        // Only include if there are actionable results (WARN or BLOCK)
        const actionable = results.filter(r => r.action === 'WARN' || r.action === 'BLOCK');
        if (actionable.length > 0) {
          allDuplicates.push({ newFunc, results: actionable });
        }
      }

      if (allDuplicates.length === 0) {
        return {
          content: [{
            type: 'text',
            text: `✅ No duplicates found. ${newFunctions.length} function(s) are unique.`,
          }],
        };
      }

      let output = `⚠️ Found ${allDuplicates.length} potential duplicate(s):\n\n`;
      for (const dup of allDuplicates) {
        const classInfo = dup.newFunc.className ? ` [${dup.newFunc.className}]` : '';
        output += `**${dup.newFunc.name}**(${dup.newFunc.params})${classInfo}\n`;
        for (const result of dup.results) {
          const tierLabel = result.tier === 'cross-file' ? 'cross-file' : result.tier;
          const existClassInfo = result.existing.className ? ` [${result.existing.className}]` : '';
          output += `  - [${tierLabel}] ${result.existing.name}${existClassInfo} in ${result.existing.file}${result.existing.line ? `:${result.existing.line}` : ''}\n`;
        }
        output += '\n';
      }

      return { content: [{ type: 'text', text: output }] };
    }

    // ─── Filter mode ──────────────────────────────────────────────────────
    let filtered = functions;

    if (file) {
      filtered = filtered.filter(f => f.file.includes(file));
    }

    if (query) {
      const lowerQuery = query.toLowerCase();
      filtered = filtered.filter(f =>
        f.name.toLowerCase().includes(lowerQuery) ||
        f.file.toLowerCase().includes(lowerQuery) ||
        f.params.toLowerCase().includes(lowerQuery) ||
        f.returnType.toLowerCase().includes(lowerQuery) ||
        (f.className && f.className.toLowerCase().includes(lowerQuery))
      );
    }

    // ─── No filters: show summary ─────────────────────────────────────────
    if (!file && !query) {
      const byFile = new Map<string, FunctionEntry[]>();
      for (const func of functions) {
        const existing = byFile.get(func.file) || [];
        existing.push(func);
        byFile.set(func.file, existing);
      }

      let output = `📚 **Function Index** (${functions.length} functions in ${byFile.size} files)\n\n`;

      for (const [filepath, funcs] of byFile.entries()) {
        output += `**${filepath}** (${funcs.length})\n`;
        for (const func of funcs.slice(0, 5)) {
          const classInfo = func.className ? ` [${func.className}]` : '';
          output += `  - ${func.name}(${func.params}): ${func.returnType}${classInfo}\n`;
        }
        if (funcs.length > 5) {
          output += `  - ... and ${funcs.length - 5} more\n`;
        }
        output += '\n';
      }

      return { content: [{ type: 'text', text: output }] };
    }

    // ─── Filtered results ─────────────────────────────────────────────────
    if (filtered.length === 0) {
      return {
        content: [{
          type: 'text',
          text: `🔍 No functions found matching: ${query || ''} ${file ? `in ${file}` : ''}`,
        }],
      };
    }

    let output = `🔍 **Found ${filtered.length} function(s)**\n\n`;

    for (const func of filtered) {
      const classInfo = func.className ? ` [${func.className}]` : '';
      output += `**${func.name}**(${func.params}): ${func.returnType}${classInfo}\n`;
      output += `  📄 ${func.file}${func.line ? `:${func.line}` : ''}\n`;
      if (func.dependencies.length > 0) {
        output += `  📦 Dependencies: ${func.dependencies.join(', ')}\n`;
      }
      output += '\n';
    }

    return { content: [{ type: 'text', text: output }] };

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return {
      content: [{ type: 'text', text: `❌ Operation failed: ${errorMsg}` }],
      isError: true,
    };
  }
}
