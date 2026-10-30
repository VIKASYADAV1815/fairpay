/**
 * Invite helpers — local device today; backend mints + resolves later.
 *
 * Connect path:
 *   Host: create group → inviteCode + QR(value = fairpay://join/CODE)
 *   Guest: Scan QR / enter code / open deep link → parseInvitePayload → joinByInviteCode
 *   Same AsyncStorage (same phone): finds real Trip by inviteCode
 *   Other phone (no API): creates local stub “Joined · CODE” until sync exists
 */

export function makeInviteCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < 6; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}

/** fairpay://join/ABC123 or bare code */
export function parseInvitePayload(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const deep = trimmed.match(/fairpay:\/\/join\/([A-Za-z0-9]+)/i);
  if (deep?.[1]) return deep[1].toUpperCase();

  try {
    const url = new URL(trimmed);
    const code = url.searchParams.get('code') || url.pathname.split('/').filter(Boolean).pop();
    if (code && /^[A-Za-z0-9]{4,12}$/.test(code)) return code.toUpperCase();
  } catch {
    // not a URL
  }

  const bare = trimmed.replace(/\s/g, '').toUpperCase();
  if (/^[A-Z0-9]{4,12}$/.test(bare)) return bare;
  return null;
}

export function inviteDeepLink(code: string) {
  return `fairpay://join/${code.toUpperCase()}`;
}

export function inviteShareMessage(groupName: string, code: string) {
  return `Join “${groupName}” on Fairpay\nCode: ${code}\n${inviteDeepLink(code)}`;
}
