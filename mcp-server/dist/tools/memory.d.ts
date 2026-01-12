/**
 * agento_memory - Direct memory file operations
 * Read, write, or append to any memory file
 */
export declare const memoryToolDef: {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            file: {
                type: string;
                description: string;
            };
            action: {
                type: string;
                enum: string[];
                description: string;
            };
            content: {
                type: string;
                description: string;
            };
        };
        required: string[];
    };
};
export declare function handleMemory(args: unknown): Promise<{
    content: {
        type: string;
        text: string;
    }[];
    isError?: undefined;
} | {
    content: {
        type: string;
        text: string;
    }[];
    isError: boolean;
}>;
//# sourceMappingURL=memory.d.ts.map