type CreateTxnShieldWebOptions = {
    publishableKey: string;
    apiBaseUrl: string;
    captureHumanSignals?: boolean;
};
type PrepareTransactionInput = {
    intent: string;
    resource: {
        type: string;
        id: string;
    };
    metadata?: Record<string, unknown>;
};
declare function createTxnShieldWeb(options: CreateTxnShieldWebOptions): {
    start: () => Promise<void>;
    touchHumanSignal: () => void;
    getSessionContext: () => {
        sessionId: string;
        tabId: string;
        isNewDevice: boolean;
        continuityStrength: number;
        recentHumanSignalAt: string | undefined;
        recentHumanSignalAgeSeconds: number | undefined;
    };
    prepareTransaction(input: PrepareTransactionInput): Promise<{
        session: {
            sessionId: string;
            tabId: string;
            isNewDevice: boolean;
            continuityStrength: number;
            recentHumanSignalAt: string | undefined;
            recentHumanSignalAgeSeconds: number | undefined;
        };
        headers: {
            "x-txnshield-session-id": string;
            "x-txnshield-tab-id": string;
            "x-txnshield-intent": string;
            "x-txnshield-recent-human-signal": string;
        };
        intent: string;
        resource: {
            type: string;
            id: string;
        };
        metadata?: Record<string, unknown>;
    }>;
};

export { createTxnShieldWeb };
