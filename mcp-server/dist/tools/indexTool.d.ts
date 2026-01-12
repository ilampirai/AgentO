/**
 * agento_index - Codebase indexing
 * Scan and index all functions in the codebase
 */
export declare const indexToolDef: {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            path: {
                type: string;
                description: string;
            };
            force: {
                type: string;
                description: string;
            };
        };
        required: never[];
    };
};
export declare function handleIndex(args: unknown): Promise<{
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
//# sourceMappingURL=indexTool.d.ts.map