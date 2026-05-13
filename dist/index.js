// src/index.ts
function generateId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `txn_${Math.random().toString(36).slice(2)}`;
}
function createTxnShieldWeb(options) {
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
    window.localStorage.setItem(humanStorageKey, (/* @__PURE__ */ new Date()).toISOString());
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
    const recentHumanSignalAt = window.localStorage.getItem(humanStorageKey) ?? void 0;
    const recentHumanSignalAgeSeconds = recentHumanSignalAt ? Math.max(0, Math.round((Date.now() - new Date(recentHumanSignalAt).getTime()) / 1e3)) : void 0;
    return {
      sessionId,
      tabId,
      isNewDevice,
      continuityStrength: isNewDevice ? 0.55 : 0.95,
      recentHumanSignalAt,
      recentHumanSignalAgeSeconds
    };
  };
  return {
    start,
    touchHumanSignal,
    getSessionContext,
    async prepareTransaction(input) {
      await start();
      const session = getSessionContext();
      return {
        ...input,
        session,
        headers: {
          "x-txnshield-session-id": session.sessionId,
          "x-txnshield-tab-id": session.tabId,
          "x-txnshield-intent": input.intent,
          "x-txnshield-recent-human-signal": session.recentHumanSignalAt ?? ""
        }
      };
    }
  };
}
export {
  createTxnShieldWeb
};
