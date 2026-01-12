/**
 * agento_loop - Iteration loop (Ralph Wiggum pattern)
 * Run a task repeatedly until completion marker found
 */
import { exec } from 'child_process';
import { promisify } from 'util';
import { readJsonMemoryFile, writeJsonMemoryFile } from '../memory/loader.js';
import { MEMORY_FILES } from '../types.js';
const execAsync = promisify(exec);
export const loopToolDef = {
    name: 'agento_loop',
    description: 'Start an iteration loop. Runs a command repeatedly until completion marker is found or max iterations reached.',
    inputSchema: {
        type: 'object',
        properties: {
            task: {
                type: 'string',
                description: 'Description of the task being looped',
            },
            until: {
                type: 'string',
                description: 'Text that indicates completion (e.g., "All tests passed", "0 errors")',
            },
            max: {
                type: 'number',
                description: 'Maximum iterations (default: 5)',
            },
            testCommand: {
                type: 'string',
                description: 'Command to run for testing (e.g., "npm test", "npx playwright test")',
            },
            action: {
                type: 'string',
                enum: ['start', 'status', 'cancel', 'iterate'],
                description: 'Loop action (default: start)',
            },
        },
        required: ['task', 'until'],
    },
};
export async function handleLoop(args) {
    const input = args;
    const { task, until, max = 5, testCommand, action = 'start' } = input;
    // Get current loop state
    const defaultState = {
        active: false,
        task: '',
        completionMarker: '',
        maxIterations: 5,
        currentIteration: 0,
        startedAt: '',
        history: [],
    };
    const state = await readJsonMemoryFile(MEMORY_FILES.LOOP_STATE, defaultState);
    switch (action) {
        case 'status': {
            if (!state.active) {
                return {
                    content: [{ type: 'text', text: '📊 No active loop.' }],
                };
            }
            let output = `📊 **Loop Status**\n\n`;
            output += `Task: ${state.task}\n`;
            output += `Completion marker: "${state.completionMarker}"\n`;
            output += `Progress: ${state.currentIteration}/${state.maxIterations}\n`;
            output += `Started: ${state.startedAt}\n\n`;
            if (state.history.length > 0) {
                output += `**History**\n`;
                for (const iter of state.history.slice(-5)) {
                    const status = iter.completed ? '✅' : '❌';
                    output += `${status} Iteration ${iter.iteration}: ${iter.output.slice(0, 100)}...\n`;
                }
            }
            return {
                content: [{ type: 'text', text: output }],
            };
        }
        case 'cancel': {
            if (!state.active) {
                return {
                    content: [{ type: 'text', text: '📊 No active loop to cancel.' }],
                };
            }
            state.active = false;
            await writeJsonMemoryFile(MEMORY_FILES.LOOP_STATE, state);
            return {
                content: [{
                        type: 'text',
                        text: `⏹️ Loop cancelled after ${state.currentIteration} iteration(s).`,
                    }],
            };
        }
        case 'iterate': {
            if (!state.active) {
                return {
                    content: [{ type: 'text', text: '❌ No active loop. Start one first.' }],
                    isError: true,
                };
            }
            // Run the test command
            if (testCommand) {
                try {
                    const { stdout, stderr } = await execAsync(testCommand, {
                        timeout: 300000, // 5 minute timeout
                        maxBuffer: 10 * 1024 * 1024,
                    });
                    const output = stdout + (stderr ? '\n' + stderr : '');
                    const completed = output.toLowerCase().includes(state.completionMarker.toLowerCase());
                    // Record iteration
                    const iteration = {
                        iteration: state.currentIteration + 1,
                        output: output.slice(0, 1000),
                        completed,
                        timestamp: new Date().toISOString(),
                    };
                    state.currentIteration++;
                    state.history.push(iteration);
                    if (completed) {
                        state.active = false;
                        await writeJsonMemoryFile(MEMORY_FILES.LOOP_STATE, state);
                        return {
                            content: [{
                                    type: 'text',
                                    text: `✅ **Loop Complete!**\n\n` +
                                        `Completion marker "${state.completionMarker}" found after ${state.currentIteration} iteration(s).\n\n` +
                                        `Output:\n${output.slice(0, 500)}...`,
                                }],
                        };
                    }
                    if (state.currentIteration >= state.maxIterations) {
                        state.active = false;
                        await writeJsonMemoryFile(MEMORY_FILES.LOOP_STATE, state);
                        return {
                            content: [{
                                    type: 'text',
                                    text: `⚠️ **Max Iterations Reached**\n\n` +
                                        `Ran ${state.maxIterations} iterations without finding "${state.completionMarker}".\n\n` +
                                        `Last output:\n${output.slice(0, 500)}...`,
                                }],
                        };
                    }
                    await writeJsonMemoryFile(MEMORY_FILES.LOOP_STATE, state);
                    return {
                        content: [{
                                type: 'text',
                                text: `🔄 **Iteration ${state.currentIteration}/${state.maxIterations}**\n\n` +
                                    `Marker "${state.completionMarker}" not found.\n\n` +
                                    `Output:\n${output.slice(0, 500)}...\n\n` +
                                    `Fix the issues and run agento_loop with action="iterate" to continue.`,
                            }],
                    };
                }
                catch (error) {
                    const errorMsg = error instanceof Error ? error.message : String(error);
                    state.currentIteration++;
                    state.history.push({
                        iteration: state.currentIteration,
                        output: `Error: ${errorMsg}`,
                        completed: false,
                        timestamp: new Date().toISOString(),
                    });
                    if (state.currentIteration >= state.maxIterations) {
                        state.active = false;
                    }
                    await writeJsonMemoryFile(MEMORY_FILES.LOOP_STATE, state);
                    return {
                        content: [{
                                type: 'text',
                                text: `❌ **Iteration ${state.currentIteration} Failed**\n\n` +
                                    `Error: ${errorMsg}\n\n` +
                                    (state.active
                                        ? `Fix the issues and run agento_loop with action="iterate" to continue.`
                                        : `Max iterations reached.`),
                            }],
                        isError: true,
                    };
                }
            }
            return {
                content: [{
                        type: 'text',
                        text: '❌ No test command configured for this loop.',
                    }],
                isError: true,
            };
        }
        case 'start':
        default: {
            if (state.active) {
                return {
                    content: [{
                            type: 'text',
                            text: `⚠️ A loop is already active.\n\n` +
                                `Task: ${state.task}\n` +
                                `Progress: ${state.currentIteration}/${state.maxIterations}\n\n` +
                                `Use action="cancel" to stop it, or action="iterate" to continue.`,
                        }],
                };
            }
            if (!task || !until) {
                return {
                    content: [{
                            type: 'text',
                            text: '❌ Missing required parameters: task and until',
                        }],
                    isError: true,
                };
            }
            // Start new loop
            const newState = {
                active: true,
                task,
                completionMarker: until,
                maxIterations: max,
                currentIteration: 0,
                startedAt: new Date().toISOString(),
                history: [],
            };
            await writeJsonMemoryFile(MEMORY_FILES.LOOP_STATE, newState);
            let output = `🔄 **Loop Started**\n\n`;
            output += `Task: ${task}\n`;
            output += `Completion marker: "${until}"\n`;
            output += `Max iterations: ${max}\n`;
            if (testCommand) {
                output += `Test command: ${testCommand}\n\n`;
                output += `Run agento_loop with action="iterate" to execute the first iteration.`;
            }
            else {
                output += `\nNo test command specified. Add testCommand parameter to auto-run tests.`;
            }
            return {
                content: [{ type: 'text', text: output }],
            };
        }
    }
}
//# sourceMappingURL=loop.js.map