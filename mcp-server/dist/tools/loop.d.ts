/**
 * agento_loop - Iteration loop (Ralph Wiggum pattern)
 * Run a task repeatedly until completion marker found
 */
export declare const loopToolDef: {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            task: {
                type: string;
                description: string;
            };
            until: {
                type: string;
                description: string;
            };
            max: {
                type: string;
                description: string;
            };
            testCommand: {
                type: string;
                description: string;
            };
            action: {
                type: string;
                enum: string[];
                description: string;
            };
        };
        required: string[];
    };
};
export declare function handleLoop(args: unknown): Promise<{
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
//# sourceMappingURL=loop.d.ts.map