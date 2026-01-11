#!/usr/bin/env node
/**
 * AgentO Initialization Script
 * Run this in any project to set up .agenticMemory structure
 * 
 * Usage: npx agento-init
 * Or: node path/to/AgentO/scripts/init.js
 */

const fs = require('fs');
const path = require('path');

const MEMORY_DIR = '.agenticMemory';

// CLAUDE.md goes in project root for auto-routing
const CLAUDE_MD = `# AgentO Project Rules

**This project uses AgentO orchestrator. ALL prompts route through AgentO.**

## Mandatory Routing

You are operating as **AgentO** - the orchestrator agent. Every user prompt goes through you.

On EVERY prompt:
1. Check \`.agenticMemory/DISCOVERY.md\` - is this area indexed?
2. If not indexed → run focused index first
3. Check \`.agenticMemory/RULES.md\` for project rules
4. Check \`.agenticMemory/ATTEMPTS.md\` for blocked patterns
5. Route to appropriate sub-agent
6. Update memory after changes

## MANDATORY RULES (NOT OPTIONAL - VIOLATION = STOP)

### MAX_FILE_LINES: 500 (Auto-Split)
- **BEFORE writing**: Check if file will exceed 500 lines
- **IF exceeded**: AUTO-SPLIT immediately (no asking):
  1. Find a class/function group to extract
  2. Create new module file
  3. Move code + add exports
  4. Add import in original file
  5. Report: \`📦 Auto-split: X.js → Y.js (N lines moved)\`
- **NO EXCEPTIONS**: Never create files over 500 lines

### NO_DUPLICATE_CODE
- Check FUNCTIONS.md before writing
- REUSE existing functions

### UPDATE_MEMORY
- Update FUNCTIONS.md after changes
- Update DISCOVERY.md after exploring

## Rule Violation = HARD STOP

If about to violate ANY rule:
1. STOP IMMEDIATELY
2. Auto-fix (split file, refactor, etc.)
3. Then continue

**NO EXCEPTIONS. NO ASKING TO ALLOW VIOLATION.**

## Output Style
- **ALWAYS show agent**: \`🤖 AgentO → [Agent] | [Task]\`
- Concise (bullets, not paragraphs)
- 5-min updates on long tasks

---
*AgentO v2.1.0 - Auto-routing enabled*
`;

const FILES = {
  'config.json': JSON.stringify({
    routing: {
      coder: "coder-ts",
      "coder-py": "coder-py",
      "coder-php": "coder-php",
      "coder-general": "coder-general",
      designer: "designer",
      reviewer: "reviewer",
      debugger: "debugger",
      tester: "tester",
      indexer: "indexer"
    },
    lastIndexed: null,
    fileCount: 0,
    functionCount: 0
  }, null, 2),

  'RULES.md': `# Project Rules

All agents must follow these rules.

## System Rules
- MAX_FILE_LINES: 500
- NO_DUPLICATE_CODE: true
- REQUIRE_TYPES: true
- UPDATE_MEMORY_AFTER_CHANGES: true

## Custom Rules
(Add your project-specific rules here)

## Disabled Rules
(Temporarily disabled rules go here)

---
*Run /AgentO:rules to manage rules*
`,

  'ARCHITECTURE.md': `# Architecture

Project structure overview.

## Directory Tree
\`\`\`
(Run /AgentO:index to populate)
\`\`\`

## Key Files
| File | Purpose |
|------|---------|
| | |

---
*Last indexed: Never*
`,

  'FUNCTIONS.md': `# Function Index

Compressed index with dependency levels.

## Format
\`\`\`
F:name(params):return [L1:deps]
C:Class{methods} [L1:deps]
T:Type{fields}
\`\`\`

## Index
\`\`\`
(Run /AgentO:index to populate)
\`\`\`

---
*Last indexed: Never*
`,

  'DATASTRUCTURE.md': `# Data Structure Map

Database schemas, models, and data flow.

## Tables
\`\`\`
(Run /AgentO:index --data to populate)
\`\`\`

## Models
\`\`\`
(Run /AgentO:index --data to populate)
\`\`\`

---
*Last indexed: Never*
`,

  'ERRORS.md': `# Known Errors & Solutions

Track errors and their fixes.

## Format
\`\`\`
## ERR001: Error description
FIX: How to fix it
FILES: Affected files
\`\`\`

## Errors
(Add solved errors here for future reference)

---
`,

  'ATTEMPTS.md': `# Attempted Actions

Track failed attempts to avoid repeating.

## Format
\`\`\`
## [timestamp] Action description
RESULT: failed
REASON: Why it failed
DONT_RETRY: true/false
\`\`\`

## Blocked Patterns
(Actions marked DONT_RETRY:true)

## Attempts Log
(Recent attempts)

---
`,

  'DISCOVERY.md': `# Discovery Tracking

Track explored areas of the codebase.

## Format
\`\`\`
AREA:name [coverage:X%] [last:timestamp]
  FILES: file1, file2
  FUNCTIONS: count
\`\`\`

## Explored Areas
(Auto-populated as AgentO explores)

## Coverage Summary
| Area | Files | Functions | Coverage |
|------|-------|-----------|----------|
| | | | |

---
*Auto-updated by AgentO*
`,

  'VERSIONS.md': `# Dependency Versions

Track package versions.

## Format
\`\`\`
PKG:name@version [file]
\`\`\`

## Dependencies
(Auto-populated when package files change)

## Change Log
| Date | Package | From | To |
|------|---------|------|-----|
| | | | |

---
*Auto-updated by AgentO*
`
};

const DIRS = ['agents', 'templates', 'styles'];

function init() {
  const cwd = process.cwd();
  const memoryPath = path.join(cwd, MEMORY_DIR);

  console.log('🚀 AgentO Initializing...\n');

  // Create main directory
  if (!fs.existsSync(memoryPath)) {
    fs.mkdirSync(memoryPath);
    console.log(`✓ Created ${MEMORY_DIR}/`);
  } else {
    console.log(`• ${MEMORY_DIR}/ already exists`);
  }

  // Create subdirectories
  for (const dir of DIRS) {
    const dirPath = path.join(memoryPath, dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath);
      console.log(`✓ Created ${MEMORY_DIR}/${dir}/`);
    }
  }

  // Create files
  console.log('\n📁 Creating memory files...\n');
  
  for (const [filename, content] of Object.entries(FILES)) {
    const filePath = path.join(memoryPath, filename);
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, content);
      console.log(`✓ Created ${filename}`);
    } else {
      console.log(`• ${filename} already exists (preserved)`);
    }
  }

  // Create CLAUDE.md for auto-routing
  const claudeMdPath = path.join(cwd, 'CLAUDE.md');
  if (!fs.existsSync(claudeMdPath)) {
    fs.writeFileSync(claudeMdPath, CLAUDE_MD);
    console.log('\n✓ Created CLAUDE.md (auto-routing enabled)');
  } else {
    console.log('\n• CLAUDE.md already exists (preserved)');
  }

  // Update .gitignore if exists
  const gitignorePath = path.join(cwd, '.gitignore');
  const gitignoreEntry = '\n# AgentO session data\n.agenticMemory/session.json\n';
  
  if (fs.existsSync(gitignorePath)) {
    const content = fs.readFileSync(gitignorePath, 'utf8');
    if (!content.includes('.agenticMemory/session.json')) {
      fs.appendFileSync(gitignorePath, gitignoreEntry);
      console.log('✓ Updated .gitignore');
    }
  }

  console.log('\n✅ AgentO Ready!\n');
  console.log('Next steps:');
  console.log('  1. Review .agenticMemory/RULES.md');
  console.log('  2. Run /AgentO:index to scan codebase');
  console.log('  3. Start coding with AgentO!\n');
}

init();

