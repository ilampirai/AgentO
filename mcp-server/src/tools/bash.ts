/**
 * agento_bash - Safe command execution
 * Checks ATTEMPTS.md for blocked patterns before execution
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { memoryCache } from '../memory/cache.js';
import { appendMemoryFile } from '../memory/loader.js';
import { formatAttemptEntry } from '../memory/parser.js';
import { MEMORY_FILES } from '../types.js';
import type { BashInput, AttemptEntry } from '../types.js';

const execAsync = promisify(exec);

export const bashToolDef = {
  name: 'agento_bash',
  description: 'Execute shell command with AgentO safety. Checks ATTEMPTS.md for blocked patterns. Logs failures for future prevention.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      command: {
        type: 'string',
        description: 'Shell command to execute',
      },
      cwd: {
        type: 'string',
        description: 'Working directory (optional)',
      },
    },
    required: ['command'],
  },
};

export async function handleBash(args: unknown) {
  const input = args as BashInput;
  const { command, cwd } = input;
  
  if (!command) {
    return {
      content: [{ type: 'text', text: '❌ Missing required parameter: command' }],
      isError: true,
    };
  }
  
  // PRE-CHECK: Look for blocked patterns in ATTEMPTS.md
  const attempts = await memoryCache.getAttempts();
  
  for (const attempt of attempts) {
    if (!attempt.dontRetry) continue;
    
    // Check if command matches a blocked pattern
    const blockedCommand = attempt.command.toLowerCase();
    const currentCommand = command.toLowerCase();
    
    // Exact match or similar command
    if (currentCommand === blockedCommand || 
        currentCommand.includes(blockedCommand) ||
        isSimilarCommand(currentCommand, blockedCommand)) {
      return {
        content: [{
          type: 'text',
          text: `⛔ BLOCKED: This command was previously marked as DONT_RETRY.\n\n` +
                `Previous attempt: ${attempt.command}\n` +
                `Error: ${attempt.error}\n` +
                `Timestamp: ${attempt.timestamp}\n\n` +
                `Find an alternative approach.`,
        }],
        isError: true,
      };
    }
  }
  
  // EXECUTE: Run the command
  try {
    const { stdout, stderr } = await execAsync(command, {
      cwd: cwd || process.cwd(),
      timeout: 60000, // 1 minute timeout
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer
    });
    
    let output = '';
    if (stdout) output += stdout;
    if (stderr) output += (output ? '\n' : '') + stderr;
    
    return {
      content: [{
        type: 'text',
        text: `✅ Command executed: ${command}\n\n${output || '(no output)'}`,
      }],
    };
    
  } catch (error) {
    const err = error as { message?: string; code?: string; killed?: boolean; signal?: string };
    const errorMsg = err.message || String(error);
    
    // Determine if this should be marked as DONT_RETRY
    const dontRetry = shouldMarkDontRetry(errorMsg);
    
    // Log to ATTEMPTS.md
    const entry: AttemptEntry = {
      timestamp: new Date().toISOString(),
      command,
      error: errorMsg.slice(0, 500), // Truncate long errors
      dontRetry,
    };
    
    try {
      await appendMemoryFile(MEMORY_FILES.ATTEMPTS, '\n' + formatAttemptEntry(entry));
      memoryCache.invalidateAttempts();
    } catch {
      // Non-fatal
    }
    
    let response = `❌ Command failed: ${command}\n\nError: ${errorMsg}`;
    
    if (dontRetry) {
      response += `\n\n⛔ Marked as DONT_RETRY - this command pattern will be blocked in future attempts.`;
    } else {
      response += `\n\n📝 Logged to ATTEMPTS.md for tracking.`;
    }
    
    return {
      content: [{ type: 'text', text: response }],
      isError: true,
    };
  }
}

/**
 * Check if two commands are similar (for blocking related commands)
 */
function isSimilarCommand(cmd1: string, cmd2: string): boolean {
  // Extract base command (first word)
  const base1 = cmd1.split(/\s+/)[0];
  const base2 = cmd2.split(/\s+/)[0];
  
  if (base1 !== base2) return false;
  
  // For same base command, check if args are similar
  const args1 = cmd1.slice(base1.length).trim();
  const args2 = cmd2.slice(base2.length).trim();
  
  // If one is a substring of the other
  if (args1.includes(args2) || args2.includes(args1)) {
    return true;
  }
  
  return false;
}

/**
 * Determine if an error should mark the command as DONT_RETRY
 */
function shouldMarkDontRetry(errorMsg: string): boolean {
  const dontRetryPatterns = [
    'permission denied',
    'access denied',
    'not permitted',
    'operation not allowed',
    'command not found',
    'no such file or directory',
    'eacces',
    'eperm',
    'cannot be run',
    'requires administrator',
    'requires root',
    'sudo',
  ];
  
  const lowerError = errorMsg.toLowerCase();
  return dontRetryPatterns.some(pattern => lowerError.includes(pattern));
}


