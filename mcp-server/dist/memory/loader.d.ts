/**
 * Memory File I/O Operations
 * Handles reading and writing to .agenticMemory files
 */
/**
 * Ensure memory directory exists
 */
export declare function ensureMemoryDir(): Promise<void>;
/**
 * Read a memory file
 */
export declare function readMemoryFile(filename: string): Promise<string>;
/**
 * Write to a memory file
 */
export declare function writeMemoryFile(filename: string, content: string): Promise<void>;
/**
 * Append to a memory file
 */
export declare function appendMemoryFile(filename: string, content: string): Promise<void>;
/**
 * Check if memory file exists
 */
export declare function memoryFileExists(filename: string): Promise<boolean>;
/**
 * Read JSON memory file (like LOOP_STATE.json, config.json)
 */
export declare function readJsonMemoryFile<T>(filename: string, defaultValue: T): Promise<T>;
/**
 * Write JSON memory file
 */
export declare function writeJsonMemoryFile<T>(filename: string, data: T): Promise<void>;
/**
 * Read any file from the project
 */
export declare function readProjectFile(filepath: string): Promise<string>;
/**
 * Write any file to the project
 */
export declare function writeProjectFile(filepath: string, content: string): Promise<void>;
/**
 * Check if file exists
 */
export declare function fileExists(filepath: string): Promise<boolean>;
/**
 * List files in directory recursively
 */
export declare function listFilesRecursive(dir: string, extensions?: string[]): Promise<string[]>;
/**
 * Get file stats
 */
export declare function getFileStats(filepath: string): Promise<{
    lines: number;
    size: number;
} | null>;
/**
 * Initialize all memory files if they don't exist
 */
export declare function initializeMemoryFiles(): Promise<void>;
//# sourceMappingURL=loader.d.ts.map