/**
 * Billing scaffold — wire RevenueCat when ready.
 * Keep unlock path behind this module so UI stays stable.
 */

export type PurchaseResult = { ok: true } | { ok: false; reason: string };

export async function purchasePro(): Promise<PurchaseResult> {
  // TODO: Purchases.purchasePackage(...)
  return { ok: true };
}

export async function restorePurchases(): Promise<PurchaseResult> {
  // TODO: Purchases.restorePurchases()
  return { ok: false, reason: 'Not connected to store yet' };
}

export const BILLING_NOTE =
  'Demo unlock on-device. RevenueCat / Play Billing plugs in here.';
