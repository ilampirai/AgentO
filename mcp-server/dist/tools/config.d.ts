/**
 * agento_config - Configuration management
 * Get, set, reset config values and show status
 */
export declare const configToolDef: {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            action: {
                type: string;
                enum: string[];
                description: string;
            };
            key: {
                type: string;
                description: string;
            };
            value: {
                type: string[];
                description: string;
            };
        };
        required: never[];
    };
};
export declare function handleConfig(args: unknown): Promise<{
    content: {
        type: string;
        text: string;
    }[];
} | {
    content: {
        type: string;
        text: string;
    }[];
    isError: boolean;
}>;
//# sourceMappingURL=config.d.ts.map