"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  createTxnShieldWeb: () => createTxnShieldWeb
});
module.exports = __toCommonJS(index_exports);
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  createTxnShieldWeb
});
