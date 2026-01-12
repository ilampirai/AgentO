/**
 * agento_read - Tracked file reading
 * Updates DISCOVERY.md and extracts functions to FUNCTIONS.md
 */
export declare const readToolDef: {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            path: {
                type: string;
                description: string;
            };
        };
        required: string[];
    };
};
export declare function handleRead(args: unknown): Promise<{
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
//# sourceMappingURL=read.d.ts.map