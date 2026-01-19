/**
 * agento_symbol - Symbol details lookup
 * Returns detailed information about functions, methods, or classes
 */
export declare const symbolToolDef: {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            ids: {
                type: string;
                items: {
                    type: string;
                };
                description: string;
            };
            name: {
                type: string;
                description: string;
            };
            file: {
                type: string;
                description: string;
            };
            kind: {
                type: string;
                enum: string[];
                description: string;
            };
            limit: {
                type: string;
                description: string;
            };
        };
        required: never[];
    };
};
export declare function handleSymbol(args: unknown): Promise<{
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
//# sourceMappingURL=symbol.d.ts.map