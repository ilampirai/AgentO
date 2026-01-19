/**
 * agento_entrypoints - Entry point resolution
 * Maps user queries to relevant entry points and returns their flow
 */
import { readJsonMemoryFile, readMemoryFile } from '../memory/loader.js';
import { MEMORY_FILES } from '../types.js';
export const entrypointsToolDef = {
    name: 'agento_entrypoints',
    description: 'Resolve entry points from user query (e.g., "auth", "add to cart") and return relevant entry point IDs and flow.',
    inputSchema: {
        type: 'object',
        properties: {
            query: {
                type: 'string',
                description: 'User query to resolve (e.g., "auth", "login", "add to cart", "payment")',
            },
            kind: {
                type: 'string',
                enum: ['route', 'handler', 'command', 'all'],
                description: 'Type of entry point to search for (default: all)',
            },
        },
        required: ['query'],
    },
};
export async function handleEntryPoints(args) {
    const input = args;
    const { query, kind = 'all' } = input;
    try {
        const flowGraph = await readJsonMemoryFile(MEMORY_FILES.FLOW_GRAPH, { version: '1.0', generated: '', nodes: {}, edges: [], entryPoints: [] });
        const projectMap = await readMemoryFile(MEMORY_FILES.PROJECT_MAP);
        if (!flowGraph.nodes || Object.keys(flowGraph.nodes).length === 0) {
            return {
                content: [{
                        type: 'text',
                        text: '⚠️ Flow graph not found. Run agento_index first to generate it.'
                    }],
                isError: false,
            };
        }
        const queryLower = query.toLowerCase();
        const matches = [];
        // Search through all nodes for relevant entry points
        for (const node of Object.values(flowGraph.nodes)) {
            let score = 0;
            // Check if it's a known entry point
            if (flowGraph.entryPoints.includes(node.id)) {
                score += 10;
            }
            // Check name match
            const nameLower = node.name.toLowerCase();
            if (nameLower.includes(queryLower)) {
                score += 5;
            }
            if (nameLower === queryLower) {
                score += 10;
            }
            // Check file path match
            if (node.file.toLowerCase().includes(queryLower)) {
                score += 3;
            }
            // Check signature match
            if (node.signature && node.signature.toLowerCase().includes(queryLower)) {
                score += 2;
            }
            // Filter by kind
            if (kind !== 'all') {
                if (kind === 'route' && !node.name.toLowerCase().includes('route') &&
                    !node.file.toLowerCase().includes('route')) {
                    continue;
                }
                if (kind === 'handler' && !node.name.toLowerCase().includes('handler')) {
                    continue;
                }
                if (kind === 'command' && !node.name.toLowerCase().includes('command') &&
                    !node.file.toLowerCase().includes('cli')) {
                    continue;
                }
            }
            if (score > 0) {
                matches.push({ id: node.id, node, score });
            }
        }
        // Sort by score
        matches.sort((a, b) => b.score - a.score);
        const topMatches = matches.slice(0, 10);
        // Format output
        let output = `🎯 **Entry Points for "${query}"** (${topMatches.length} found)\n\n`;
        if (topMatches.length === 0) {
            output += 'No entry points found. Try a different query or run agento_index to update the graph.\n';
        }
        else {
            output += '## Matched Entry Points\n\n';
            for (const { id, node, score } of topMatches) {
                output += `### ${node.name} (score: ${score})\n`;
                output += `- ID: ${id}\n`;
                output += `- Kind: ${node.kind}\n`;
                output += `- File: ${node.file}:${node.line || '?'}\n`;
                if (node.signature)
                    output += `- Signature: ${node.signature}\n`;
                output += '\n';
            }
            output += '💡 **Tip**: Use agento_flow with these IDs to get the full call graph.\n';
        }
        return {
            content: [{ type: 'text', text: output }],
        };
    }
    catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        return {
            content: [{ type: 'text', text: `❌ Entry point resolution failed: ${errorMsg}` }],
            isError: true,
        };
    }
}
//# sourceMappingURL=entrypoints.js.map