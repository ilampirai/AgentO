#!/usr/bin/env node
/**
 * AgentO MCP Server - Main Entry Point
 *
 * Provides hard enforcement of code quality rules and memory management
 * through MCP tools that intercept all file operations.
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema, } from '@modelcontextprotocol/sdk/types.js';
// Import tools
import { handleWrite, writeToolDef } from './tools/write.js';
import { handleRead, readToolDef } from './tools/read.js';
import { handleBash, bashToolDef } from './tools/bash.js';
import { handleMemory, memoryToolDef } from './tools/memory.js';
import { handleRules, rulesToolDef } from './tools/rules.js';
import { handleFunctions, functionsToolDef } from './tools/functions.js';
import { handleIndex, indexToolDef } from './tools/indexTool.js';
import { handleLoop, loopToolDef } from './tools/loop.js';
import { handleTest, testToolDef } from './tools/test.js';
import { handleConfig, configToolDef } from './tools/config.js';
const server = new Server({
    name: 'agento-mcp',
    version: '4.0.0',
}, {
    capabilities: {
        tools: {},
    },
});
// List all available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            writeToolDef,
            readToolDef,
            bashToolDef,
            memoryToolDef,
            rulesToolDef,
            functionsToolDef,
            indexToolDef,
            loopToolDef,
            testToolDef,
            configToolDef,
        ],
    };
});
// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    try {
        switch (name) {
            case 'agento_write':
                return await handleWrite(args);
            case 'agento_read':
                return await handleRead(args);
            case 'agento_bash':
                return await handleBash(args);
            case 'agento_memory':
                return await handleMemory(args);
            case 'agento_rules':
                return await handleRules(args);
            case 'agento_functions':
                return await handleFunctions(args);
            case 'agento_index':
                return await handleIndex(args);
            case 'agento_loop':
                return await handleLoop(args);
            case 'agento_test':
                return await handleTest(args);
            case 'agento_config':
                return await handleConfig(args);
            default:
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Unknown tool: ${name}`,
                        },
                    ],
                    isError: true,
                };
        }
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
            content: [
                {
                    type: 'text',
                    text: `Error executing ${name}: ${errorMessage}`,
                },
            ],
            isError: true,
        };
    }
});
// Start the server
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('AgentO MCP Server running on stdio');
}
main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map