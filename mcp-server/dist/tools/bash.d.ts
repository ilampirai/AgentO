/**
 * agento_bash - Safe command execution
 * Checks ATTEMPTS.md for blocked patterns before execution
 */
export declare const bashToolDef: {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            command: {
                type: string;
                description: string;
            };
            cwd: {
                type: string;
                description: string;
            };
        };
        required: string[];
    };
};
export declare function handleBash(args: unknown): Promise<{
    content: {
        type: string;
        text: string;
    }[];
    isError: boolean;
} | {
    content: {
        type: string;
        text: string;
    }[];
    isError?: undefined;
}>;
//# sourceMappingURL=bash.d.ts.map