type CreateTxnShieldWebOptions = {
  publishableKey: string;
  apiBaseUrl: string;
  captureHumanSignals?: boolean;
};

type PrepareTransactionInput = {
  operation?: string;
  operationKey?: string;
  resource: { type: string; id: string };
  metadata?: Record<string, unknown>;
};

function generateId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `txn_${Math.random().toString(36).slice(2)}`;
}

export function createTxnShieldWeb(options: CreateTxnShieldWebOptions) {
  if (!options.publishableKey.startsWith("txn_pub_")) {
    throw new Error("TxnShield publishable keys must start with txn_pub_.");
  }

  const captureHumanSignals = options.captureHumanSignals ?? true;
  const sessionStorageKey = `txnshield:session:${options.publishableKey}`;
  const tabStorageKey = `txnshield:tab:${options.publishableKey}`;
  const humanStorageKey = `txnshield:human:${options.publishableKey}`;

  let started = false;
  let isNewDevice = false;

  const ensureSession = () => {
    const existing = window.localStorage.getItem(sessionStorageKey);
    if (existing) {
      return existing;
    }

    const created = generateId();
    window.localStorage.setItem(sessionStorageKey, created);
    isNewDevice = true;
    return created;
  };

  const ensureTab = () => {
    const existing = window.sessionStorage.getItem(tabStorageKey);
    if (existing) {
      return existing;
    }

    const created = generateId();
    window.sessionStorage.setItem(tabStorageKey, created);
    return created;
  };

  const touchHumanSignal = () => {
    window.localStorage.setItem(humanStorageKey, new Date().toISOString());
  };

  const start = async () => {
    if (started || typeof window === "undefined") {
      return;
    }

    ensureSession();
    ensureTab();

    if (captureHumanSignals) {
      for (const eventName of ["pointerdown", "keydown", "touchstart"]) {
        window.addEventListener(eventName, touchHumanSignal, { passive: true });
      }
      touchHumanSignal();
    }

    started = true;
  };

  const getSessionContext = () => {
    const sessionId = ensureSession();
    const tabId = ensureTab();
    const recentHumanSignalAt = window.localStorage.getItem(humanStorageKey) ?? undefined;
    const recentHumanSignalAgeSeconds = recentHumanSignalAt
      ? Math.max(0, Math.round((Date.now() - new Date(recentHumanSignalAt).getTime()) / 1000))
      : undefined;

    return {
      sessionId,
      tabId,
      isNewDevice,
      continuityStrength: isNewDevice ? 0.55 : 0.95,
      recentHumanSignalAt,
      recentHumanSignalAgeSeconds,
    };
  };

  return {
    start,
    touchHumanSignal,
    getSessionContext,
    async prepareTransaction(input: PrepareTransactionInput) {
      await start();

      const session = getSessionContext();
      const operationKey = input.operationKey ?? input.operation;
      if (!operationKey) {
        throw new Error("TxnShield prepareTransaction requires operationKey.");
      }
      return {
        ...input,
        operationKey,
        session,
        headers: {
          "x-txnshield-session-id": session.sessionId,
          "x-txnshield-tab-id": session.tabId,
          "x-txnshield-operation-key": operationKey,
          "x-txnshield-recent-human-signal": session.recentHumanSignalAt ?? "",
        },
      };
    },
  };
}
