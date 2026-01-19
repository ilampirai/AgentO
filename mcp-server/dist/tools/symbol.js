/**
 * agento_symbol - Symbol details lookup
 * Returns detailed information about functions, methods, or classes
 */
import { readJsonMemoryFile, readMemoryFile } from '../memory/loader.js';
import { memoryCache } from '../memory/cache.js';
import { MEMORY_FILES } from '../types.js';
export const symbolToolDef = {
    name: 'agento_symbol',
    description: 'Get detailed information about symbols (functions, methods, classes) by ID, name, or file.',
    inputSchema: {
        type: 'object',
        properties: {
            ids: {
                type: 'array',
                items: { type: 'string' },
                description: 'Symbol IDs to lookup',
            },
            name: {
                type: 'string',
                description: 'Symbol name to search for',
            },
            file: {
                type: 'string',
                description: 'File path to filter by',
            },
            kind: {
                type: 'string',
                enum: ['function', 'method', 'class'],
                description: 'Symbol kind to filter by',
            },
            limit: {
                type: 'number',
                description: 'Maximum results to return (default: 50)',
            },
        },
        required: [],
    },
};
export async function handleSymbol(args) {
    const input = args;
    const { ids, name, file, kind, limit = 50 } = input;
    try {
        const flowGraph = await readJsonMemoryFile(MEMORY_FILES.FLOW_GRAPH, { version: '1.0', generated: '', nodes: {}, edges: [], entryPoints: [] });
        const functions = await memoryCache.getFunctions();
        const functionsContent = await readMemoryFile(MEMORY_FILES.FUNCTIONS);
        let results = [];
        // Search by IDs
        if (ids && ids.length > 0) {
            for (const id of ids) {
                const node = flowGraph.nodes[id];
                if (node) {
                    results.push({
                        id: node.id,
                        name: node.name,
                        kind: node.kind,
                        file: node.file,
                        line: node.line,
                        signature: node.signature,
                    });
                }
            }
        }
        else {
            // Search by name/file/kind
            const allNodes = Object.values(flowGraph.nodes);
            for (const node of allNodes) {
                if (limit > 0 && results.length >= limit)
                    break;
                let matches = true;
                if (name && !node.name.toLowerCase().includes(name.toLowerCase())) {
                    matches = false;
                }
                if (file && !node.file.includes(file)) {
                    matches = false;
                }
                if (kind && node.kind !== kind) {
                    matches = false;
                }
                if (matches) {
                    results.push({
                        id: node.id,
                        name: node.name,
                        kind: node.kind,
                        file: node.file,
                        line: node.line,
                        signature: node.signature,
                    });
                }
            }
        }
        // Add detailed information from FUNCTIONS.md
        for (const result of results) {
            if (result.kind === 'function' || result.kind === 'method') {
                const func = functions.find(f => f.name === result.name && f.file === result.file);
                if (func) {
                    result.details = `Params: ${func.params}\nReturn: ${func.returnType}`;
                    if (func.dependencies.length > 0) {
                        result.details += `\nDependencies: ${func.dependencies.join(', ')}`;
                    }
                }
            }
        }
        // Format output
        let output = `📋 **Symbol Details** (${results.length} result(s))\n\n`;
        for (const result of results) {
            output += `## ${result.name} (${result.kind})\n`;
            if (result.id)
                output += `- ID: ${result.id}\n`;
            output += `- File: ${result.file}:${result.line || '?'}\n`;
            if (result.signature)
                output += `- Signature: ${result.signature}\n`;
            if (result.details)
                output += `- Details:\n  ${result.details.split('\n').join('\n  ')}\n`;
            output += '\n';
        }
        if (results.length === 0) {
            output = '🔍 No symbols found matching the criteria.';
        }
        return {
            content: [{ type: 'text', text: output }],
        };
    }
    catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        return {
            content: [{ type: 'text', text: `❌ Symbol lookup failed: ${errorMsg}` }],
            isError: true,
        };
    }
}
//# sourceMappingURL=symbol.js.map