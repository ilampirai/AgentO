/**
 * agento_flow - Flow graph subgraph retrieval
 * Returns relevant flow subgraph for given symbol IDs
 */
export declare const flowToolDef: {
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
            depth: {
                type: string;
                description: string;
            };
            direction: {
                type: string;
                enum: string[];
                description: string;
            };
            maxNodes: {
                type: string;
                description: string;
            };
            maxEdges: {
                type: string;
                description: string;
            };
        };
        required: string[];
    };
};
export declare function handleFlow(args: unknown): Promise<{
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
//# sourceMappingURL=flow.d.ts.map