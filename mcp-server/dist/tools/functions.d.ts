/**
 * agento_functions - Query function index
 * Search, list, and check for duplicates
 */
export declare const functionsToolDef: {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            query: {
                type: string;
                description: string;
            };
            file: {
                type: string;
                description: string;
            };
            checkDuplicates: {
                type: string;
                description: string;
            };
            code: {
                type: string;
                description: string;
            };
        };
        required: never[];
    };
};
export declare function handleFunctions(args: unknown): Promise<{
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
//# sourceMappingURL=functions.d.ts.map