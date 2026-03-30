/**
 * Migration Tool — flat-to-layered migration + IDENTITY.md auto-generation
 *
 * Migrates the old flat .agenticMemory/ layout to the new layered structure:
 *   soul/    — IDENTITY.md, PRINCIPLES.md
 *   core/    — ARCHITECTURE.md, DECISIONS.md, FLOWS.md, shadow indexes
 *   working/ — ACTIVE_CONTEXT.md, DISCOVERY.md, ATTEMPTS.md
 *   surface/ — FUNCTIONS.md, DATASTRUCTURE.md, PROJECT_MAP.md, etc.
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { LAYER_DIRS } from './resolver.js';
import { memoryFileExists, readMemoryFile, writeMemoryFile } from './loader.js';

const MEMORY_DIR = '.agenticMemory';

// ─── File migration mapping (old flat → new layered) ────────────────────────

const MIGRATION_MAP: Record<string, string> = {
  // Files that move to a layer
  'ARCHITECTURE.md': 'core/ARCHITECTURE.md',
  'FUNCTIONS.md': 'surface/FUNCTIONS.md',
  'DATASTRUCTURE.md': 'surface/DATASTRUCTURE.md',
  'PROJECT_MAP.md': 'surface/PROJECT_MAP.md',
  'FLOW_GRAPH.json': 'surface/FLOW_GRAPH.json',
  'ERRORS.md': 'surface/ERRORS.md',
  'VERSIONS.md': 'surface/VERSIONS.md',
  'DISCOVERY.md': 'working/DISCOVERY.md',
  'ATTEMPTS.md': 'working/ATTEMPTS.md',
};

// Files that stay at root level (no migration needed)
const ROOT_FILES = ['config.json', 'RULES.md', '.dirty'];

// ─── Migration ──────────────────────────────────────────────────────────────

/**
 * Check if the memory directory has already been migrated to layered layout.
 */
export async function isAlreadyMigrated(): Promise<boolean> {
  // If soul/ directory exists, we've already migrated
  try {
    await fs.access(path.join(MEMORY_DIR, 'soul'));
    return true;
  } catch {
    return false;
  }
}

/**
 * Migrate from flat .agenticMemory/ to layered structure.
 * Uses atomic copy-first approach: copy all, verify, then clean up originals.
 * Returns a summary of what was migrated.
 */
export async function migrateToLayered(): Promise<string> {
  if (await isAlreadyMigrated()) {
    return 'Already migrated to layered layout. No changes made.';
  }

  const results: string[] = [];
  const copied: Array<{ from: string; to: string }> = [];

  // Step 1: Create all layer directories
  for (const dir of LAYER_DIRS) {
    await fs.mkdir(dir, { recursive: true });
  }
  results.push(`Created ${LAYER_DIRS.length} layer directories`);

  // Step 2: Copy files to new locations
  for (const [oldName, newRelPath] of Object.entries(MIGRATION_MAP)) {
    const oldPath = path.join(MEMORY_DIR, oldName);
    const newPath = path.join(MEMORY_DIR, newRelPath);

    try {
      await fs.access(oldPath);
      // Ensure target directory exists
      await fs.mkdir(path.dirname(newPath), { recursive: true });
      // Copy file
      const content = await fs.readFile(oldPath, 'utf-8');
      await fs.writeFile(newPath, content, 'utf-8');
      copied.push({ from: oldPath, to: newPath });
    } catch {
      // Source file doesn't exist — skip
    }
  }

  results.push(`Copied ${copied.length} files to layered locations`);

  // Step 3: Verify all copies
  let verified = 0;
  for (const { from, to } of copied) {
    try {
      const srcContent = await fs.readFile(from, 'utf-8');
      const dstContent = await fs.readFile(to, 'utf-8');
      if (srcContent === dstContent) {
        verified++;
      } else {
        results.push(`⚠️ Verification failed for ${from} → ${to}`);
      }
    } catch (e) {
      results.push(`⚠️ Could not verify ${from} → ${to}`);
    }
  }

  if (verified < copied.length) {
    results.push(`⚠️ Only ${verified}/${copied.length} files verified. Keeping originals as backup.`);
    return results.join('\n');
  }

  // Step 4: Remove originals (only if all verified)
  let removed = 0;
  for (const { from } of copied) {
    try {
      await fs.unlink(from);
      removed++;
    } catch {
      // Non-fatal
    }
  }

  results.push(`Removed ${removed} original files`);

  // Step 5: Generate new layer files
  await generateNewLayerFiles();
  results.push('Generated new layer files (IDENTITY.md, PRINCIPLES.md, DECISIONS.md, FLOWS.md, ACTIVE_CONTEXT.md)');

  return results.join('\n');
}

// ─── New layer file generation ──────────────────────────────────────────────

/**
 * Generate template files for layers that didn't exist in the flat layout.
 */
async function generateNewLayerFiles(): Promise<void> {
  const templates: Record<string, string> = {
    '.agenticMemory/soul/IDENTITY.md': await generateIdentity(),
    '.agenticMemory/soul/PRINCIPLES.md': `# Project Principles

## Engineering Principles

(Add project-specific principles here. These persist across all sessions.)

## Design Principles

(Add design guidelines here.)
`,
    '.agenticMemory/core/DECISIONS.md': `# Decisions

Tracked decisions with rationale and alternatives.
`,
    '.agenticMemory/core/FLOWS.md': `# Protected Flows

Defined critical flows that require review before modification.
`,
    '.agenticMemory/working/ACTIVE_CONTEXT.md': `# Active Context

## Current Work

(Auto-updated during sessions)

## Observations

(Auto-populated with significant events)
`,
  };

  for (const [filePath, content] of Object.entries(templates)) {
    try {
      await fs.access(filePath);
      // File already exists — don't overwrite
    } catch {
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, content, 'utf-8');
    }
  }
}

// ─── IDENTITY.md generation ─────────────────────────────────────────────────

/**
 * Auto-generate IDENTITY.md from package.json + README + ARCHITECTURE.md.
 * Falls back to minimal template if sources are unavailable.
 */
export async function generateIdentity(): Promise<string> {
  const parts: string[] = ['# Project Identity\n'];

  // Try package.json
  try {
    const pkgContent = await fs.readFile('package.json', 'utf-8');
    const pkg = JSON.parse(pkgContent);
    if (pkg.name) parts.push(`**Name:** ${pkg.name}`);
    if (pkg.description) parts.push(`**Description:** ${pkg.description}`);
    if (pkg.version) parts.push(`**Version:** ${pkg.version}`);
    if (pkg.license) parts.push(`**License:** ${pkg.license}`);
  } catch {
    // No package.json — try other sources
  }

  // Try README first paragraph
  try {
    const readme = await fs.readFile('README.md', 'utf-8');
    const firstParagraph = extractFirstParagraph(readme);
    if (firstParagraph) {
      parts.push('\n## About\n');
      parts.push(firstParagraph);
    }
  } catch {
    // No README
  }

  // Pull from ARCHITECTURE.md project context if available
  try {
    const archPath = '.agenticMemory/core/ARCHITECTURE.md';
    const arch = await fs.readFile(archPath, 'utf-8');
    const projectType = arch.match(/\| Type \| (.+?) \|/);
    const frameworks = arch.match(/\| Frameworks \| (.+?) \|/);
    if (projectType || frameworks) {
      parts.push('\n## Tech Stack\n');
      if (projectType) parts.push(`- **Type:** ${projectType[1]}`);
      if (frameworks) parts.push(`- **Frameworks:** ${frameworks[1]}`);
    }
  } catch {
    // No architecture file
  }

  if (parts.length <= 1) {
    parts.push('\n(Auto-generated placeholder. Edit to describe your project.)');
  }

  return parts.join('\n');
}

/**
 * Extract the first non-heading, non-empty paragraph from markdown.
 */
function extractFirstParagraph(markdown: string): string {
  const lines = markdown.split('\n');
  const paragraphLines: string[] = [];
  let inParagraph = false;

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip headings, badges, and empty lines before paragraph
    if (!inParagraph) {
      if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('!') || trimmed.startsWith('[!')) {
        continue;
      }
      inParagraph = true;
    }

    // End of paragraph
    if (inParagraph && !trimmed) {
      break;
    }

    if (inParagraph) {
      paragraphLines.push(trimmed);
    }
  }

  return paragraphLines.join(' ');
}
