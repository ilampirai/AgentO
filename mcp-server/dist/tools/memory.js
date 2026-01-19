/**
 * agento_memory - Direct memory file operations
 * Read, write, or append to any memory file
 */
import { readMemoryFile, writeMemoryFile, appendMemoryFile, initializeMemoryFiles } from '../memory/loader.js';
import { memoryCache } from '../memory/cache.js';
import { MEMORY_FILES } from '../types.js';
export const memoryToolDef = {
    name: 'agento_memory',
    description: 'Direct access to AgentO memory files. Read, write, or append to FUNCTIONS.md, PROJECT_MAP.md, FLOW_GRAPH.json, etc.',
    inputSchema: {
        type: 'object',
        properties: {
            file: {
                type: 'string',
                description: 'Memory file name: FUNCTIONS, PROJECT_MAP, FLOW_GRAPH, RULES, ARCHITECTURE, DISCOVERY, ATTEMPTS, ERRORS, VERSIONS, DATASTRUCTURE',
            },
            action: {
                type: 'string',
                enum: ['read', 'write', 'append', 'init'],
                description: 'Action to perform',
            },
            content: {
                type: 'string',
                description: 'Content to write/append (required for write/append actions)',
            },
        },
        required: ['action'],
    },
};
export async function handleMemory(args) {
    const input = args;
    const { file, action, content } = input;
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
        }
        catch (error) {
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
    const fileKey = file.toUpperCase().replace('.MD', '').replace('.JSON', '');
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
    }
    catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        return {
            content: [{ type: 'text', text: `❌ Operation failed: ${errorMsg}` }],
            isError: true,
        };
    }
}
function invalidateCacheFor(fileKey) {
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
//# sourceMappingURL=memory.js.map