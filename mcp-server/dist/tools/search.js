/**
 * agento_search - Smart codebase search with memory integration
 * Leverages memory files for faster, context-aware results
 */
import { memoryCache } from '../memory/cache.js';
import { readMemoryFile, appendMemoryFile, listFilesRecursive, readProjectFile, } from '../memory/loader.js';
import { extractFunctionsFromCode, } from '../memory/parser.js';
import { MEMORY_FILES } from '../types.js';
export const searchToolDef = {
    name: 'agento_search',
    description: 'Smart codebase search with memory integration. Checks FUNCTIONS.md first for function searches, tracks discoveries, warns on repeat failed searches.',
    inputSchema: {
        type: 'object',
        properties: {
            query: {
                type: 'string',
                description: 'Search term (text, regex pattern, or glob for file search)',
            },
            type: {
                type: 'string',
                enum: ['content', 'files', 'functions'],
                description: 'Search type: content (grep), files (glob), functions (memory-first). Default: content',
            },
            path: {
                type: 'string',
                description: 'Directory scope to search in. Default: current working directory',
            },
            include: {
                type: 'string',
                description: 'File patterns to include, comma-separated (e.g., "*.ts,*.js")',
            },
            exclude: {
                type: 'string',
                description: 'File patterns to exclude, comma-separated (e.g., "node_modules,dist")',
            },
            maxResults: {
                type: 'number',
                description: 'Maximum number of results to return. Default: 50',
            },
        },
        required: ['query'],
    },
};
export async function handleSearch(args) {
    const input = args;
    const { query, type = 'content', path = '.', include, exclude, maxResults = 50, } = input;
    if (!query) {
        return {
            content: [{ type: 'text', text: '❌ Missing required parameter: query' }],
            isError: true,
        };
    }
    const warnings = [];
    const hints = [];
    let results = [];
    // PRE-CHECK 1: For function searches, check FUNCTIONS.md first (fastest)
    if (type === 'functions') {
        const functionResults = await searchFunctionsMemory(query);
        if (functionResults.length > 0) {
            hints.push(`💡 Found ${functionResults.length} match(es) in FUNCTIONS.md index`);
            results = functionResults.slice(0, maxResults);
            // Still continue to file search for completeness, but we have fast results
        }
    }
    // PRE-CHECK 2: Check ATTEMPTS.md for similar failed searches
    const attempts = await memoryCache.getAttempts();
    const similarFailedSearch = attempts.find(a => a.dontRetry &&
        a.command.startsWith('search:') &&
        a.command.includes(query));
    if (similarFailedSearch) {
        warnings.push(`⚠️ Similar search "${query}" returned 0 results before (${similarFailedSearch.timestamp})`);
    }
    // PRE-CHECK 3: Check ARCHITECTURE.md for path hints
    const architectureHints = await getArchitectureHints(query);
    if (architectureHints.length > 0) {
        hints.push(`💡 Architecture suggests: ${architectureHints.join(', ')}`);
    }
    // PRE-CHECK 4: Check DISCOVERY.md for exploration status
    const discovery = await memoryCache.getDiscovery();
    const searchPath = path === '.' ? 'src/' : path;
    const isExplored = discovery.has(searchPath) ||
        Array.from(discovery).some(d => searchPath.startsWith(d) || d.startsWith(searchPath));
    if (!isExplored && path !== '.') {
        warnings.push(`⚠️ Directory "${path}" has not been explored yet`);
    }
    // EXECUTE: Perform the actual search based on type
    try {
        let fileResults = [];
        switch (type) {
            case 'functions':
                // Already searched memory, now also search files for completeness
                fileResults = await searchInFiles(query, path, include, exclude, maxResults, 'functions');
                // Merge with memory results, deduplicate
                results = mergeResults(results, fileResults, maxResults);
                break;
            case 'files':
                results = await searchFiles(query, path, include, exclude, maxResults);
                break;
            case 'content':
            default:
                results = await searchInFiles(query, path, include, exclude, maxResults, 'content');
                break;
        }
    }
    catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        return {
            content: [{ type: 'text', text: `❌ Search failed: ${errorMsg}` }],
            isError: true,
        };
    }
    // POST-ACTION 1: Update DISCOVERY.md with searched paths
    if (results.length > 0) {
        try {
            const searchedDirs = new Set();
            for (const result of results) {
                const dir = result.file.split('/').slice(0, -1).join('/');
                if (dir)
                    searchedDirs.add(dir);
            }
            const discoveryContent = await readMemoryFile(MEMORY_FILES.DISCOVERY);
            let updated = false;
            let newContent = discoveryContent;
            for (const dir of searchedDirs) {
                if (!discoveryContent.includes(`[x] ${dir}`)) {
                    newContent += `\n- [x] ${dir}/`;
                    updated = true;
                }
            }
            if (updated) {
                const { writeMemoryFile } = await import('../memory/loader.js');
                await writeMemoryFile(MEMORY_FILES.DISCOVERY, newContent);
                memoryCache.invalidateDiscovery();
            }
        }
        catch {
            // Non-fatal
        }
    }
    // POST-ACTION 2: Index any new functions found (for content/function searches)
    if ((type === 'content' || type === 'functions') && results.length > 0) {
        try {
            const config = await memoryCache.getConfig();
            if (config.autoIndex) {
                let indexedCount = 0;
                const codeExtensions = ['.ts', '.js', '.tsx', '.jsx', '.py', '.go', '.rs', '.java'];
                for (const result of results.slice(0, 10)) { // Limit indexing to first 10 files
                    const isCodeFile = codeExtensions.some(ext => result.file.endsWith(ext));
                    if (isCodeFile && result.content) {
                        const functions = extractFunctionsFromCode(result.content, result.file);
                        if (functions.length > 0) {
                            indexedCount += functions.length;
                        }
                    }
                }
                if (indexedCount > 0) {
                    hints.push(`📝 Auto-indexed ${indexedCount} function(s) from search results`);
                }
            }
        }
        catch {
            // Non-fatal
        }
    }
    // POST-ACTION 3: Log to ATTEMPTS.md if no results
    if (results.length === 0) {
        try {
            const timestamp = new Date().toISOString();
            const attemptEntry = `\n### [${timestamp}] search:${type}:${query}\nNo results found in path: ${path}\nDONT_RETRY: false\n`;
            await appendMemoryFile(MEMORY_FILES.ATTEMPTS, attemptEntry);
            memoryCache.invalidateAttempts();
        }
        catch {
            // Non-fatal
        }
    }
    // Build response
    let response = '';
    if (hints.length > 0) {
        response += hints.join('\n') + '\n\n';
    }
    if (warnings.length > 0) {
        response += warnings.join('\n') + '\n\n';
    }
    if (results.length === 0) {
        response += `🔍 No results found for "${query}" (type: ${type}, path: ${path})`;
    }
    else {
        response += `🔍 Found ${results.length} result(s) for "${query}":\n\n`;
        response += formatResults(results, type);
    }
    return {
        content: [{ type: 'text', text: response }],
    };
}
// Helper: Search FUNCTIONS.md memory
async function searchFunctionsMemory(query) {
    const functions = await memoryCache.getFunctions();
    const queryLower = query.toLowerCase();
    const matches = functions.filter(f => f.name.toLowerCase().includes(queryLower) ||
        f.params.toLowerCase().includes(queryLower) ||
        f.returnType.toLowerCase().includes(queryLower));
    return matches.map(f => ({
        file: f.file,
        line: f.line,
        match: `${f.name}(${f.params}): ${f.returnType}`,
        type: 'function',
    }));
}
// Helper: Get architecture hints
async function getArchitectureHints(query) {
    try {
        const archContent = await readMemoryFile(MEMORY_FILES.ARCHITECTURE);
        const hints = [];
        const queryLower = query.toLowerCase();
        // Parse architecture patterns and suggest relevant paths
        const patterns = [
            { keywords: ['auth', 'login', 'user', 'session'], paths: ['src/auth/', 'src/users/', 'lib/auth/'] },
            { keywords: ['api', 'endpoint', 'route', 'handler'], paths: ['src/api/', 'src/routes/', 'src/handlers/'] },
            { keywords: ['test', 'spec', 'mock'], paths: ['tests/', '__tests__/', 'spec/'] },
            { keywords: ['util', 'helper', 'common'], paths: ['src/utils/', 'src/helpers/', 'lib/'] },
            { keywords: ['config', 'env', 'setting'], paths: ['config/', 'src/config/'] },
            { keywords: ['model', 'schema', 'entity'], paths: ['src/models/', 'src/entities/', 'src/schemas/'] },
            { keywords: ['component', 'view', 'page'], paths: ['src/components/', 'src/views/', 'src/pages/'] },
        ];
        for (const pattern of patterns) {
            if (pattern.keywords.some(k => queryLower.includes(k))) {
                hints.push(...pattern.paths);
            }
        }
        // Also check actual architecture content for custom patterns
        const lines = archContent.split('\n');
        for (const line of lines) {
            if (line.toLowerCase().includes(queryLower) && line.includes('/')) {
                const pathMatch = line.match(/([a-zA-Z0-9_\-./]+\/)/);
                if (pathMatch)
                    hints.push(pathMatch[1]);
            }
        }
        return [...new Set(hints)].slice(0, 3);
    }
    catch {
        return [];
    }
}
// Helper: Search for files by glob pattern
async function searchFiles(pattern, basePath, include, exclude, maxResults = 50) {
    const extensions = include
        ? include.split(',').map(p => p.trim().replace('*', ''))
        : undefined;
    const excludePatterns = exclude
        ? exclude.split(',').map(p => p.trim())
        : ['node_modules', 'dist', '.git', '.agenticMemory'];
    const allFiles = await listFilesRecursive(basePath, extensions);
    const results = [];
    const patternLower = pattern.toLowerCase();
    for (const file of allFiles) {
        // Check exclusions
        if (excludePatterns.some(ex => file.includes(ex)))
            continue;
        // Match pattern against filename
        const fileName = file.split('/').pop() || file;
        if (fileName.toLowerCase().includes(patternLower) || matchGlob(fileName, pattern)) {
            results.push({
                file,
                type: 'file',
            });
            if (results.length >= maxResults)
                break;
        }
    }
    return results;
}
// Helper: Search content in files
async function searchInFiles(query, basePath, include, exclude, maxResults = 50, searchType = 'content') {
    const extensions = include
        ? include.split(',').map(p => p.trim().replace('*', ''))
        : ['.ts', '.js', '.tsx', '.jsx', '.py', '.go', '.rs', '.java', '.md', '.json'];
    const excludePatterns = exclude
        ? exclude.split(',').map(p => p.trim())
        : ['node_modules', 'dist', '.git', '.agenticMemory'];
    const allFiles = await listFilesRecursive(basePath, extensions);
    const results = [];
    let regex;
    try {
        regex = new RegExp(query, 'gi');
    }
    catch {
        // If not valid regex, escape and use as literal
        regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    }
    for (const file of allFiles) {
        // Check exclusions
        if (excludePatterns.some(ex => file.includes(ex)))
            continue;
        try {
            const content = await readProjectFile(file);
            const lines = content.split('\n');
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                if (regex.test(line)) {
                    regex.lastIndex = 0; // Reset regex state
                    results.push({
                        file,
                        line: i + 1,
                        match: line.trim().substring(0, 200),
                        content: searchType === 'functions' ? content : undefined,
                        type: searchType === 'functions' ? 'function' : 'content',
                    });
                    if (results.length >= maxResults)
                        return results;
                    // For content search, only show first match per file to reduce noise
                    if (searchType === 'content')
                        break;
                }
            }
        }
        catch {
            // Skip files that can't be read
            continue;
        }
    }
    return results;
}
// Helper: Merge and deduplicate results
function mergeResults(memoryResults, fileResults, maxResults) {
    const seen = new Set();
    const merged = [];
    // Memory results first (they're from the index)
    for (const result of memoryResults) {
        const key = `${result.file}:${result.line || 0}`;
        if (!seen.has(key)) {
            seen.add(key);
            merged.push(result);
        }
    }
    // Then file results
    for (const result of fileResults) {
        const key = `${result.file}:${result.line || 0}`;
        if (!seen.has(key)) {
            seen.add(key);
            merged.push(result);
        }
    }
    return merged.slice(0, maxResults);
}
// Helper: Simple glob matching
function matchGlob(filename, pattern) {
    const regexPattern = pattern
        .replace(/\./g, '\\.')
        .replace(/\*/g, '.*')
        .replace(/\?/g, '.');
    try {
        return new RegExp(`^${regexPattern}$`, 'i').test(filename);
    }
    catch {
        return false;
    }
}
// Helper: Format results for display
function formatResults(results, type) {
    const lines = [];
    for (const result of results) {
        switch (result.type) {
            case 'function':
                lines.push(`📦 ${result.file}${result.line ? `:${result.line}` : ''}`);
                if (result.match)
                    lines.push(`   └─ ${result.match}`);
                break;
            case 'file':
                lines.push(`📄 ${result.file}`);
                break;
            case 'content':
            default:
                lines.push(`📍 ${result.file}:${result.line}`);
                if (result.match)
                    lines.push(`   └─ ${result.match}`);
                break;
        }
    }
    return lines.join('\n');
}
//# sourceMappingURL=search.js.map