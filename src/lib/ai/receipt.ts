/**
 * AI receipt → expense (Phase AI-1 stub).
 * See AI.md — wire vision model via EAS secrets later.
 */

export type ReceiptDraft = {
  title: string;
  amount: number;
  currencyHint?: string;
  tip?: number;
  confidence: number;
};

export async function scanReceiptToExpense(_imageUri: string): Promise<
  | { ok: true; draft: ReceiptDraft }
  | { ok: false; reason: string }
> {
  return {
    ok: false,
    reason: 'AI receipt scan isn’t wired yet. Add amount manually — see AI.md.',
  };
}
