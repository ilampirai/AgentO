/**
 * agento_test - Test runner with auto-detection
 * Detects test framework and runs tests with retry
 */
export declare const testToolDef: {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            framework: {
                type: string;
                enum: string[];
                description: string;
            };
            pattern: {
                type: string;
                description: string;
            };
            maxRetries: {
                type: string;
                description: string;
            };
            fixOnFail: {
                type: string;
                description: string;
            };
        };
        required: never[];
    };
};
export declare function handleTest(args: unknown): Promise<{
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
//# sourceMappingURL=test.d.ts.map