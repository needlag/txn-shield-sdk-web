# `@txnshield/sdk-web`

Framework-agnostic browser SDK for TxnShield.

It is responsible for:

- publishable-key initialization
- per-session and per-tab continuity context
- lightweight human-signal capture
- protected transaction preparation

Example:

```ts
import { createTxnShieldWeb } from "@txnshield/sdk-web";

const shield = createTxnShieldWeb({
  publishableKey: "txn_pub_...",
  apiBaseUrl: "http://localhost:3000",
});

await shield.start();

const prepared = await shield.prepareTransaction({
  intent: "read_customer_pii",
  resource: { type: "customer", id: "cus_1001" },
});
```
