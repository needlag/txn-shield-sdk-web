import { createTxnShieldWeb } from "@txnshield/sdk-web";

const txnShield = createTxnShieldWeb({
  publishableKey: process.env.NEXT_PUBLIC_TXNSHIELD_PUBLISHABLE_KEY!,
  apiBaseUrl: process.env.NEXT_PUBLIC_TXNSHIELD_APP_URL!,
});

await txnShield.start();

export async function exportCustomer(customerId: string) {
  const prepared = await txnShield.prepareTransaction({
    intent: "export_records",
    resource: { type: "customer", id: customerId },
  });

  return fetch(`/api/customers/${customerId}/export`, {
    method: "POST",
    headers: prepared.headers,
  });
}
