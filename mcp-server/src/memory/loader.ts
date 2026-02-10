/**
 * Memory File I/O Operations
 * Handles reading and writing to .agenticMemory files
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';
import { MEMORY_FILES } from '../types.js';
import type { EnvironmentInfo } from '../types.js';

const execAsync = promisify(exec);

const MEMORY_DIR = '.agenticMemory';

/**
 * Ensure memory directory exists
 */
export async function ensureMemoryDir(): Promise<void> {
  try {
    await fs.mkdir(MEMORY_DIR, { recursive: true });
  } catch {
    // Directory already exists
  }
}

/**
 * Read a memory file
 */
export async function readMemoryFile(filename: string): Promise<string> {
  try {
    const content = await fs.readFile(filename, 'utf-8');
    return content;
  } catch {
    return '';
  }
}

/**
 * Write to a memory file
 */
export async function writeMemoryFile(filename: string, content: string): Promise<void> {
  await ensureMemoryDir();
  await fs.writeFile(filename, content, 'utf-8');
}

/**
 * Append to a memory file
 */
export async function appendMemoryFile(filename: string, content: string): Promise<void> {
  await ensureMemoryDir();
  await fs.appendFile(filename, content, 'utf-8');
}

/**
 * Check if memory file exists
 */
export async function memoryFileExists(filename: string): Promise<boolean> {
  try {
    await fs.access(filename);
    return true;
  } catch {
    return false;
  }
}

/**
 * Read JSON memory file (like LOOP_STATE.json, config.json)
 */
export async function readJsonMemoryFile<T>(filename: string, defaultValue: T): Promise<T> {
  try {
    const content = await fs.readFile(filename, 'utf-8');
    return JSON.parse(content) as T;
  } catch {
    return defaultValue;
  }
}

/**
 * Write JSON memory file
 */
export async function writeJsonMemoryFile<T>(filename: string, data: T): Promise<void> {
  await ensureMemoryDir();
  await fs.writeFile(filename, JSON.stringify(data, null, 2), 'utf-8');
}

/**
 * Read any file from the project
 */
export async function readProjectFile(filepath: string): Promise<string> {
  try {
    return await fs.readFile(filepath, 'utf-8');
  } catch {
    throw new Error(`File not found: ${filepath}`);
  }
}

/**
 * Write any file to the project
 */
export async function writeProjectFile(filepath: string, content: string): Promise<void> {
  const dir = path.dirname(filepath);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(filepath, content, 'utf-8');
}

/**
 * Check if file exists
 */
export async function fileExists(filepath: string): Promise<boolean> {
  try {
    await fs.access(filepath);
    return true;
  } catch {
    return false;
  }
}

/**
 * List files in directory recursively
 */
export async function listFilesRecursive(dir: string, extensions?: string[]): Promise<string[]> {
  const files: string[] = [];
  
  async function walk(currentDir: string) {
    try {
      const entries = await fs.readdir(currentDir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);
        
        // Skip common ignored directories
        if (entry.isDirectory()) {
          if (['node_modules', '.git', 'dist', 'build', '.agenticMemory'].includes(entry.name)) {
            continue;
          }
          await walk(fullPath);
        } else if (entry.isFile()) {
          if (!extensions || extensions.some(ext => entry.name.endsWith(ext))) {
            files.push(fullPath);
          }
        }
      }
    } catch {
      // Directory not accessible
    }
  }
  
  await walk(dir);
  return files;
}

/**
 * Get file stats
 */
export async function getFileStats(filepath: string): Promise<{ lines: number; size: number } | null> {
  try {
    const content = await fs.readFile(filepath, 'utf-8');
    const stats = await fs.stat(filepath);
    return {
      lines: content.split('\n').length,
      size: stats.size,
    };
  } catch {
    return null;
  }
}

/**
 * Initialize all memory files if they don't exist
 */
export async function initializeMemoryFiles(): Promise<void> {
  await ensureMemoryDir();
  
  const templates: Record<string, string> = {
    [MEMORY_FILES.FUNCTIONS]: '# Functions Index\n\nAuto-generated function signatures with dependencies.\n\n',
    [MEMORY_FILES.RULES]: '# Project Rules\n\n## User Rules\n\nNo rules defined. Use /AgentO:rules to add project-specific rules.\n\n',
    [MEMORY_FILES.ARCHITECTURE]: '# Project Architecture\n\n## Structure\n\n## Patterns\n\n',
    [MEMORY_FILES.DISCOVERY]: '# Discovery Log\n\n## Explored Areas\n\n',
    [MEMORY_FILES.ATTEMPTS]: '# Attempted Actions\n\n## Blocked Patterns\n\n',
    [MEMORY_FILES.ERRORS]: '# Known Errors & Solutions\n\n',
    [MEMORY_FILES.VERSIONS]: '# Dependency Versions\n\n',
    [MEMORY_FILES.DATASTRUCTURE]: '# Data Structures\n\n## Schemas\n\n## API Contracts\n\n',
    [MEMORY_FILES.PROJECT_MAP]: '# Project Map\n\nAuto-generated project structure and symbol index.\n\n',
  };
  
  for (const [file, content] of Object.entries(templates)) {
    if (!(await memoryFileExists(file))) {
      await writeMemoryFile(file, content);
    }
  }
  
  // Initialize JSON files
  if (!(await memoryFileExists(MEMORY_FILES.CONFIG))) {
    await writeJsonMemoryFile(MEMORY_FILES.CONFIG, {
      lineLimit: 0,
      strictMode: true,
      autoIndex: true,
      autoMemoryUpdate: true,
      deferIndex: true,
    });
  }

  if (!(await memoryFileExists(MEMORY_FILES.FLOW_GRAPH))) {
    await writeJsonMemoryFile(MEMORY_FILES.FLOW_GRAPH, {
      version: '1.0',
      generated: new Date().toISOString(),
      nodes: {},
      edges: [],
      entryPoints: [],
    });
  }

  // Detect environment and update ARCHITECTURE.md
  const env = await detectEnvironment();
  const archContent = generateArchitectureContent(env);
  await writeMemoryFile(MEMORY_FILES.ARCHITECTURE, archContent);
}

/**
 * Detect the current environment (OS, shell, tools, project type)
 */
export async function detectEnvironment(): Promise<EnvironmentInfo> {
  const platform = os.platform() as 'win32' | 'linux' | 'darwin';
  const isWindows = platform === 'win32';

  // Get OS name
  let osName: string = platform;
  try {
    if (isWindows) {
      const { stdout } = await execAsync('ver');
      osName = stdout.trim().split('\n')[0] || 'Windows';
    } else if (platform === 'darwin') {
      const { stdout } = await execAsync('sw_vers -productVersion');
      osName = `macOS ${stdout.trim()}`;
    } else {
      const { stdout } = await execAsync('cat /etc/os-release 2>/dev/null | grep PRETTY_NAME | cut -d= -f2 | tr -d \'"\'');
      osName = stdout.trim() || 'Linux';
    }
  } catch {
    osName = platform === 'darwin' ? 'macOS' : platform === 'win32' ? 'Windows' : 'Linux';
  }

  // Detect shell
  const shell = process.env.SHELL || process.env.COMSPEC || '';
  let shellType: EnvironmentInfo['shellType'] = 'unknown';
  if (shell.includes('powershell') || shell.includes('pwsh')) shellType = 'powershell';
  else if (shell.includes('cmd')) shellType = 'cmd';
  else if (shell.includes('bash')) shellType = 'bash';
  else if (shell.includes('zsh')) shellType = 'zsh';
  else if (shell.includes('fish')) shellType = 'fish';
  else if (isWindows) shellType = 'cmd';
  else shellType = 'bash';

  // Command mappings
  const commands: EnvironmentInfo['commands'] = isWindows
    ? {
        list: 'dir',
        remove: 'del /rmdir',
        copy: 'copy',
        move: 'move',
        read: 'type',
        find: 'where',
        clear: 'cls',
        mkdir: 'mkdir',
        touch: 'type nul >',
        grep: 'findstr',
      }
    : {
        list: 'ls',
        remove: 'rm',
        copy: 'cp',
        move: 'mv',
        read: 'cat',
        find: 'which',
        clear: 'clear',
        mkdir: 'mkdir -p',
        touch: 'touch',
        grep: 'grep',
      };

  // Detect dev tools
  const tools = await detectDevTools(isWindows);

  // Detect project type
  const project = await detectProjectType();

  return {
    os: platform,
    osName,
    arch: os.arch(),
    pathSeparator: isWindows ? '\\' : '/',
    lineEnding: isWindows ? 'CRLF' : 'LF',
    shell,
    shellType,
    commands,
    tools,
    project,
    paths: {
      cwd: process.cwd(),
      home: os.homedir(),
      temp: os.tmpdir(),
    },
    detectedAt: new Date().toISOString(),
  };
}

/**
 * Detect installed dev tools and their versions
 */
async function detectDevTools(isWindows: boolean): Promise<EnvironmentInfo['tools']> {
  const getVersion = async (cmd: string): Promise<string | null> => {
    try {
      const { stdout } = await execAsync(cmd, { timeout: 5000 });
      const match = stdout.match(/\d+\.\d+\.\d+/);
      return match ? match[0] : stdout.trim().split('\n')[0];
    } catch {
      return null;
    }
  };

  const [node, npm, yarn, pnpm, python, pip, git, docker] = await Promise.all([
    getVersion('node --version'),
    getVersion('npm --version'),
    getVersion('yarn --version'),
    getVersion('pnpm --version'),
    getVersion(isWindows ? 'python --version 2>&1' : 'python3 --version 2>&1 || python --version 2>&1'),
    getVersion(isWindows ? 'pip --version' : 'pip3 --version 2>&1 || pip --version 2>&1'),
    getVersion('git --version'),
    getVersion('docker --version'),
  ]);

  return { node, npm, yarn, pnpm, python, pip, git, docker };
}

/**
 * Detect project type from project files
 */
async function detectProjectType(): Promise<EnvironmentInfo['project']> {
  const cwd = process.cwd();

  const checks = {
    'package.json': 'node',
    'requirements.txt': 'python',
    'pyproject.toml': 'python',
    'setup.py': 'python',
    'composer.json': 'php',
    'Cargo.toml': 'rust',
    'go.mod': 'go',
    'pom.xml': 'java',
    'build.gradle': 'java',
  } as const;

  const lockfiles = {
    'package-lock.json': 'npm',
    'yarn.lock': 'yarn',
    'pnpm-lock.yaml': 'pnpm',
    'Pipfile.lock': 'pipenv',
    'poetry.lock': 'poetry',
    'composer.lock': 'composer',
    'Cargo.lock': 'cargo',
    'go.sum': 'go',
  };

  let projectType: EnvironmentInfo['project']['type'] = 'unknown';
  let packageManager: string | null = null;
  let hasLockfile = false;
  const frameworks: string[] = [];
  const detected: string[] = [];

  // Check for project files
  for (const [file, type] of Object.entries(checks)) {
    try {
      await fs.access(path.join(cwd, file));
      detected.push(type);
    } catch {
      // File doesn't exist
    }
  }

  // Check for lockfiles
  for (const [file, pm] of Object.entries(lockfiles)) {
    try {
      await fs.access(path.join(cwd, file));
      hasLockfile = true;
      packageManager = pm;
      break;
    } catch {
      // File doesn't exist
    }
  }

  // Determine project type
  if (detected.length === 0) {
    projectType = 'unknown';
  } else if (detected.length === 1) {
    projectType = detected[0] as EnvironmentInfo['project']['type'];
  } else {
    projectType = 'mixed';
  }

  // Detect frameworks from package.json
  if (detected.includes('node')) {
    try {
      const pkgContent = await fs.readFile(path.join(cwd, 'package.json'), 'utf-8');
      const pkg = JSON.parse(pkgContent);
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };

      if (deps.react) frameworks.push('react');
      if (deps.vue) frameworks.push('vue');
      if (deps.angular || deps['@angular/core']) frameworks.push('angular');
      if (deps.next) frameworks.push('nextjs');
      if (deps.express) frameworks.push('express');
      if (deps.fastify) frameworks.push('fastify');
      if (deps.nest || deps['@nestjs/core']) frameworks.push('nestjs');
      if (deps.electron) frameworks.push('electron');
      if (deps.typescript) frameworks.push('typescript');
      if (deps.tailwindcss) frameworks.push('tailwind');
      if (deps.prisma || deps['@prisma/client']) frameworks.push('prisma');

      if (!packageManager) {
        packageManager = 'npm';
      }
    } catch {
      // Failed to parse package.json
    }
  }

  return { type: projectType, packageManager, hasLockfile, frameworks };
}

/**
 * Generate ARCHITECTURE.md content with environment info
 */
function generateArchitectureContent(env: EnvironmentInfo): string {
  const toolsList = Object.entries(env.tools)
    .filter(([, v]) => v !== null)
    .map(([k, v]) => `  - ${k}: ${v}`)
    .join('\n') || '  (none detected)';

  const frameworksList = env.project.frameworks.length > 0
    ? env.project.frameworks.join(', ')
    : 'none detected';

  return `# Project Architecture

> Auto-generated by AgentO on init. Provides context for Claude to understand the environment.

## Environment

| Property | Value |
|----------|-------|
| OS | ${env.osName} (${env.os}) |
| Architecture | ${env.arch} |
| Shell | ${env.shellType} |
| Path Separator | \`${env.pathSeparator}\` |
| Line Ending | ${env.lineEnding} |

## Command Reference

Use these commands for this OS (${env.os}):

| Action | Command |
|--------|---------|
| List files | \`${env.commands.list}\` |
| Remove | \`${env.commands.remove}\` |
| Copy | \`${env.commands.copy}\` |
| Move | \`${env.commands.move}\` |
| Read file | \`${env.commands.read}\` |
| Find binary | \`${env.commands.find}\` |
| Clear screen | \`${env.commands.clear}\` |
| Create dir | \`${env.commands.mkdir}\` |
| Create file | \`${env.commands.touch}\` |
| Search text | \`${env.commands.grep}\` |

## Dev Tools Available

${toolsList}

## Project Context

| Property | Value |
|----------|-------|
| Type | ${env.project.type} |
| Package Manager | ${env.project.packageManager || 'unknown'} |
| Has Lockfile | ${env.project.hasLockfile ? 'yes' : 'no'} |
| Frameworks | ${frameworksList} |

## Runtime Paths

| Path | Value |
|------|-------|
| Working Dir | \`${env.paths.cwd}\` |
| Home | \`${env.paths.home}\` |
| Temp | \`${env.paths.temp}\` |

## Project Structure

\`\`\`
(Run /AgentO:index to populate this section)
\`\`\`

## Key Files

| File | Purpose |
|------|---------|
| (indexer will populate) | |

## Modules

(Indexer will identify and document major modules)

---

*Environment detected: ${env.detectedAt}*
*Run \`/AgentO:index\` to scan the codebase*
`;
}



