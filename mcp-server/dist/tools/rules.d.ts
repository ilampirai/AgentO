/**
 * agento_rules - Rule management
 * Add, edit, remove, enable, disable project rules
 */
export declare const rulesToolDef: {
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
            id: {
                type: string;
                description: string;
            };
            description: {
                type: string;
                description: string;
            };
            pattern: {
                type: string;
                description: string;
            };
            files: {
                type: string;
                description: string;
            };
            ruleAction: {
                type: string;
                enum: string[];
                description: string;
            };
        };
        required: string[];
    };
};
export declare function handleRules(args: unknown): Promise<{
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
//# sourceMappingURL=rules.d.ts.map