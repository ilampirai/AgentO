/**
 * agento_test - Test runner with auto-detection
 * Detects test framework and runs tests with retry
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { fileExists, readProjectFile } from '../memory/loader.js';
import type { TestInput } from '../types.js';

const execAsync = promisify(exec);

export const testToolDef = {
  name: 'agento_test',
  description: 'Run tests with optional auto-retry. Auto-detects test framework (Playwright, Jest, pytest, PHPUnit) from project files.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      framework: {
        type: 'string',
        enum: ['playwright', 'jest', 'pytest', 'phpunit', 'auto'],
        description: 'Test framework to use (default: auto-detect)',
      },
      pattern: {
        type: 'string',
        description: 'Test file pattern or specific test to run',
      },
      maxRetries: {
        type: 'number',
        description: 'Maximum retry attempts on failure (default: 0)',
      },
      fixOnFail: {
        type: 'boolean',
        description: 'If true, returns failure details for fixing',
      },
    },
    required: [],
  },
};

interface TestFramework {
  name: string;
  command: string;
  patternFlag: string;
  successMarkers: string[];
  failureMarkers: string[];
}

const FRAMEWORKS: Record<string, TestFramework> = {
  playwright: {
    name: 'Playwright',
    command: 'npx playwright test',
    patternFlag: '',
    successMarkers: ['passed', 'All tests passed'],
    failureMarkers: ['failed', 'Error'],
  },
  jest: {
    name: 'Jest',
    command: 'npx jest',
    patternFlag: '--testPathPattern=',
    successMarkers: ['Tests:', 'passed'],
    failureMarkers: ['failed', 'FAIL'],
  },
  pytest: {
    name: 'pytest',
    command: 'pytest',
    patternFlag: '-k ',
    successMarkers: ['passed', 'PASSED'],
    failureMarkers: ['failed', 'FAILED', 'ERROR'],
  },
  phpunit: {
    name: 'PHPUnit',
    command: 'vendor/bin/phpunit',
    patternFlag: '--filter ',
    successMarkers: ['OK'],
    failureMarkers: ['FAILURES!', 'ERRORS!'],
  },
};

export async function handleTest(args: unknown) {
  const input = args as TestInput;
  const { framework = 'auto', pattern, maxRetries = 0, fixOnFail = false } = input;
  
  try {
    // Detect framework
    let detectedFramework: TestFramework | null = null;
    
    if (framework === 'auto') {
      detectedFramework = await detectFramework();
      if (!detectedFramework) {
        return {
          content: [{
            type: 'text',
            text: '❌ Could not auto-detect test framework.\n\n' +
                  'Searched for: playwright.config.*, jest.config.*, pytest.ini, phpunit.xml\n\n' +
                  'Specify framework manually with framework parameter.',
          }],
          isError: true,
        };
      }
    } else {
      detectedFramework = FRAMEWORKS[framework];
      if (!detectedFramework) {
        return {
          content: [{
            type: 'text',
            text: `❌ Unknown framework: ${framework}\n\n` +
                  'Available: playwright, jest, pytest, phpunit',
          }],
          isError: true,
        };
      }
    }
    
    // Build command
    let command = detectedFramework.command;
    if (pattern) {
      command += ` ${detectedFramework.patternFlag}${pattern}`;
    }
    
    // Run tests with retries
    let attempt = 0;
    let lastOutput = '';
    let success = false;
    
    while (attempt <= maxRetries && !success) {
      attempt++;
      
      try {
        const { stdout, stderr } = await execAsync(command, {
          timeout: 600000, // 10 minute timeout
          maxBuffer: 50 * 1024 * 1024, // 50MB buffer
        });
        
        lastOutput = stdout + (stderr ? '\n' + stderr : '');
        
        // Check for success markers
        const lowerOutput = lastOutput.toLowerCase();
        success = detectedFramework.successMarkers.some(marker => 
          lowerOutput.includes(marker.toLowerCase())
        );
        
        // Also check no failure markers
        const hasFailure = detectedFramework.failureMarkers.some(marker =>
          lowerOutput.includes(marker.toLowerCase())
        );
        
        if (hasFailure) {
          success = false;
        }
        
      } catch (error) {
        const err = error as { stdout?: string; stderr?: string; message?: string };
        lastOutput = (err.stdout || '') + '\n' + (err.stderr || '') + '\n' + (err.message || '');
        success = false;
      }
      
      if (!success && attempt <= maxRetries) {
        // Will retry
      }
    }
    
    if (success) {
      return {
        content: [{
          type: 'text',
          text: `✅ **Tests Passed** (${detectedFramework.name})\n\n` +
                (attempt > 1 ? `Passed on attempt ${attempt}/${maxRetries + 1}\n\n` : '') +
                `\`\`\`\n${lastOutput.slice(-2000)}\n\`\`\``,
        }],
      };
    }
    
    // Tests failed
    let response = `❌ **Tests Failed** (${detectedFramework.name})\n\n`;
    
    if (maxRetries > 0) {
      response += `Failed after ${attempt} attempt(s)\n\n`;
    }
    
    response += `\`\`\`\n${lastOutput.slice(-3000)}\n\`\`\`\n\n`;
    
    if (fixOnFail) {
      // Extract failure details for AI fixing
      const failures = extractFailures(lastOutput);
      
      if (failures.length > 0) {
        response += `**Failures to Fix:**\n`;
        for (const failure of failures) {
          response += `\n${failure}\n`;
        }
      }
      
      response += `\nFix the issues and run agento_test again.`;
    }
    
    return {
      content: [{ type: 'text', text: response }],
      isError: true,
    };
    
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return {
      content: [{ type: 'text', text: `❌ Test execution failed: ${errorMsg}` }],
      isError: true,
    };
  }
}

async function detectFramework(): Promise<TestFramework | null> {
  // Check for Playwright
  if (await fileExists('playwright.config.ts') || 
      await fileExists('playwright.config.js')) {
    return FRAMEWORKS.playwright;
  }
  
  // Check for Jest
  if (await fileExists('jest.config.js') || 
      await fileExists('jest.config.ts') ||
      await fileExists('jest.config.json')) {
    return FRAMEWORKS.jest;
  }
  
  // Check package.json for test scripts
  if (await fileExists('package.json')) {
    try {
      const pkgContent = await readProjectFile('package.json');
      const pkg = JSON.parse(pkgContent);
      
      if (pkg.devDependencies?.playwright || pkg.dependencies?.playwright) {
        return FRAMEWORKS.playwright;
      }
      if (pkg.devDependencies?.jest || pkg.dependencies?.jest) {
        return FRAMEWORKS.jest;
      }
    } catch {
      // Ignore parse errors
    }
  }
  
  // Check for pytest
  if (await fileExists('pytest.ini') || 
      await fileExists('pyproject.toml') ||
      await fileExists('setup.py')) {
    return FRAMEWORKS.pytest;
  }
  
  // Check for PHPUnit
  if (await fileExists('phpunit.xml') || 
      await fileExists('phpunit.xml.dist')) {
    return FRAMEWORKS.phpunit;
  }
  
  return null;
}

function extractFailures(output: string): string[] {
  const failures: string[] = [];
  const lines = output.split('\n');
  
  let inFailure = false;
  let currentFailure = '';
  
  for (const line of lines) {
    // Common failure indicators
    if (line.includes('FAIL') || 
        line.includes('Error:') || 
        line.includes('AssertionError') ||
        line.includes('expect(') ||
        line.includes('assert ')) {
      inFailure = true;
      currentFailure = line;
    } else if (inFailure) {
      if (line.trim() === '' || line.startsWith('    at ')) {
        if (currentFailure) {
          failures.push(currentFailure);
          currentFailure = '';
        }
        inFailure = false;
      } else {
        currentFailure += '\n' + line;
      }
    }
  }
  
  if (currentFailure) {
    failures.push(currentFailure);
  }
  
  return failures.slice(0, 10); // Limit to 10 failures
}

