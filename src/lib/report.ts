import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Asset } from 'expo-asset';
import { readAsStringAsync, EncodingType } from 'expo-file-system/legacy';
import type { Trip } from '@/store/trips';
import { memberPayMethod } from '@/store/trips';
import { computeBalances, minimizeTransfers } from '@/lib/settle';
import { formatMoney, getCurrency } from '@/lib/currency';
import { useAuthStore } from '@/store/auth';
import { PAYMENT_PNGS } from '@/lib/paymentIconData';

/* ═══ Official High-Resolution Payment Brand PNG Images ═══ */
function payIcon(rail?: string, sz = 14): string {
  const r = (rail || '').toLowerCase();
  let src = '';
  if (r.includes('whatsapp')) src = PAYMENT_PNGS.whatsapp;
  else if (r.includes('phonepe') || r === 'phone_pe') src = PAYMENT_PNGS.phonepe;
  else if (r.includes('gpay') || r.includes('google')) src = PAYMENT_PNGS.gpay;
  else if (r.includes('paytm')) src = PAYMENT_PNGS.paytm;
  else if (r.includes('paypal')) src = PAYMENT_PNGS.paypal;
  else if (r.includes('upi')) src = PAYMENT_PNGS.upi;

  if (src) {
    return `<img src="${src}" style="height:${sz}px;max-width:${Math.round(sz * 2.2)}px;object-fit:contain;vertical-align:middle;display:inline-block;margin-right:4px" />`;
  }

  // Bank fallback
  return `<svg width="${sz}" height="${sz}" viewBox="0 0 32 32" style="vertical-align:middle;margin-right:4px"><circle cx="16" cy="16" r="15.5" fill="#F2F2F7" stroke="#E5E5EA" stroke-width="1"/><path d="M16 8l9 6H7l9-6z" fill="#000"/><rect x="8" y="15" width="16" height="1.8" rx="0.6" fill="#000"/><rect x="9.5" y="17.2" width="2" height="7" rx="0.5" fill="#8E8E93"/><rect x="15" y="17.2" width="2" height="7" rx="0.5" fill="#8E8E93"/><rect x="20.5" y="17.2" width="2" height="7" rx="0.5" fill="#8E8E93"/><rect x="8" y="24.5" width="16" height="2" rx="0.6" fill="#000"/></svg>`;
}

function getPayRailLabel(rail?: string): string {
  const r = (rail || '').toLowerCase();
  if (r.includes('whatsapp')) return 'WhatsApp';
  if (r.includes('phonepe')) return 'PhonePe';
  if (r.includes('gpay') || r.includes('google')) return 'GPay';
  if (r.includes('paytm')) return 'Paytm';
  if (r.includes('paypal')) return 'PayPal';
  if (r.includes('venmo')) return 'Venmo';
  if (r.includes('cash')) return 'Cash App';
  if (r.includes('upi')) return 'UPI';
  return 'Bank / Cash';
}

function getTripMessage(trip: Trip, done: boolean): string {
  const n = trip.members.length;
  const t = trip.name;
  if (done) {
    const m = [
      `${t} — all squared up! Zero drama, zero dues.`,
      `${t} wrapped up beautifully. ${n} friends, zero friction.`,
      `All settled for ${t}! Money managed, memories kept.`,
      `${t} — Fairpay made it effortless for all ${n} of you.`,
    ];
    return m[t.length % m.length];
  }
  const m = [
    `${t} — settle up in 1 tap on WhatsApp & UPI.`,
    `${n} friends, 1 group, zero hassle. Settle ${t} now.`,
    `Fairpay simplified ${t} for ${n} people. Time to settle!`,
    `${t} expenses tracked. 1-tap settlement awaits.`,
  ];
  return m[t.length % m.length];
}

/* ═══ Load iPhone frame as base64 ═══ */
async function loadPhoneFrame(): Promise<string> {
  try {
    const asset = Asset.fromModule(require('@/assets/Transparent iPhone Frame Mockup.png'));
    await asset.downloadAsync();
    if (asset.localUri) {
      const b64 = await readAsStringAsync(asset.localUri, {
        encoding: EncodingType.Base64,
      });
      return `data:image/png;base64,${b64}`;
    }
  } catch (e) {
    console.log('[Report] Could not load phone frame:', e);
  }
  return '';
}

/* ═══ Fetch image and convert to base64 data URI ═══ */
async function fetchImageBase64(url: string, timeoutMs = 2500): Promise<string> {
  try {
    if (url.startsWith('data:')) return url;
    if (url.startsWith('file://')) {
      const b64 = await readAsStringAsync(url, { encoding: EncodingType.Base64 });
      return `data:image/jpeg;base64,${b64}`;
    }
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    const res = await fetch(url, { signal: ctrl.signal });
    clearTimeout(timer);
    if (!res.ok) return url;
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') resolve(reader.result);
        else resolve(url);
      };
      reader.onerror = () => resolve(url);
      reader.readAsDataURL(blob);
    });
  } catch {
    return url;
  }
}

/* ═══ Load user & member profile avatars ═══ */
async function loadMemberAvatars(
  members: Trip['members'],
): Promise<{ memberAvatars: Record<string, string>; userAvatar: string | null }> {
  const authState = useAuthStore.getState();
  const authUser = authState.user;
  const authName = (authState.name || '').trim().toLowerCase();

  let currentUserAvatarUrl: string | undefined = authUser?.avatar;
  if (!currentUserAvatarUrl) {
    try {
      const session = authState.session;
      const meta = session?.user?.user_metadata;
      currentUserAvatarUrl = meta?.avatar_url || meta?.picture;
    } catch {
      // ignore
    }
  }

  let loadedUserAvatar: string | null = null;
  if (currentUserAvatarUrl) {
    try {
      loadedUserAvatar = await fetchImageBase64(currentUserAvatarUrl, 2000);
    } catch {
      loadedUserAvatar = currentUserAvatarUrl;
    }
  }

  const memberAvatars: Record<string, string> = {};

  await Promise.all(
    members.slice(0, 5).map(async (m) => {
      const mNameLower = m.name.trim().toLowerCase();
      const isCurrentUser =
        mNameLower === 'you' ||
        (authName && mNameLower === authName) ||
        (authUser?.name && mNameLower === authUser.name.trim().toLowerCase()) ||
        (authUser?.id && m.id === authUser.id);

      if (isCurrentUser && loadedUserAvatar) {
        memberAvatars[m.id] = loadedUserAvatar;
        return;
      }

      const customAvatar = (m as any).avatar || (m as any).photoUrl;
      const targetUrl =
        customAvatar ||
        (isCurrentUser && currentUserAvatarUrl
          ? currentUserAvatarUrl
          : `https://i.pravatar.cc/150?u=${encodeURIComponent(m.id || m.name)}`);

      try {
        const b64 = await fetchImageBase64(targetUrl, 2000);
        memberAvatars[m.id] = b64;
      } catch {
        memberAvatars[m.id] = targetUrl;
      }
    }),
  );

  return {
    memberAvatars,
    userAvatar: loadedUserAvatar,
  };
}

export async function shareTripPdf(trip: Trip) {
  const currency = trip.currency ?? 'INR';
  const sym = getCurrency(currency).symbol;
  const total = trip.expenses.reduce((a, e) => a + e.amount, 0);
  const balances = computeBalances(trip.members, trip.expenses);
  const transfers = minimizeTransfers(balances);
  const now = new Date();
  const fDate = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const fTime = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  const avg = trip.members.length > 0 ? total / trip.members.length : 0;
  const done = transfers.length === 0 || transfers.every((t) => t.amount <= 0.01);
  const pendingAmt = transfers.reduce((a, t) => a + t.amount, 0);
  const msg = getTripMessage(trip, done);

  // Load phone mockup frame and member avatars concurrently
  const [phoneImg, avatarData] = await Promise.all([
    loadPhoneFrame(),
    loadMemberAvatars(trip.members),
  ]);

  // ── Build expense rows ──
  const expRows = trip.expenses.map((e, i) => {
    const payer = trip.members.find((m) => m.id === e.paidById);
    const pName = payer?.name || 'Member';
    const pm = payer ? memberPayMethod(payer) : undefined;
    const dt = e.createdAt ? new Date(e.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : fDate;
    const sc = e.splits?.length || trip.members.length || 1;
    const sa = sc > 0 ? e.amount / sc : e.amount;
    const bg = i % 2 === 0 ? '#FFFFFF' : '#F9F9F9';
    return `<tr>
      <td style="background-color:${bg};padding:7px 12px;border-bottom:1px solid #E5E5EA;color:#3A3A3C;font-size:9.5px;white-space:nowrap">${esc(dt)}</td>
      <td style="background-color:${bg};padding:7px 12px;border-bottom:1px solid #E5E5EA;font-size:9.5px"><span style="color:#000;font-weight:400">${esc(e.title)}</span>${e.tag ? `<br><span style="font-size:7px;color:#8E8E93;background-color:#F2F2F7;padding:1px 5px;border-radius:3px;display:inline-block;margin-top:2px">${esc(e.tag)}</span>` : ''}${e.recurring ? ` <span style="font-size:7px;color:#92400E;background:#FEF3C7;padding:1px 4px;border-radius:3px;font-weight:400">recurring</span>` : ''}</td>
      <td style="background-color:${bg};padding:7px 12px;border-bottom:1px solid #E5E5EA;font-size:9.5px"><span style="display:inline-block;background-color:#B2FF24;color:#000;padding:2px 7px;border-radius:4px;font-size:8.5px;font-weight:400" class="green">${pm ? payIcon(pm.rail, 11) : ''}${esc(pName)}</span></td>
      <td style="background-color:${bg};padding:7px 12px;border-bottom:1px solid #E5E5EA;text-align:right;font-size:10.5px"><span style="color:#000;font-weight:400">${esc(formatMoney(e.amount, currency))}</span></td>
      <td style="background-color:${bg};padding:7px 12px;border-bottom:1px solid #E5E5EA;text-align:right;font-size:8.5px;color:#8E8E93">${esc(formatMoney(sa, currency))}/ea</td>
    </tr>`;
  }).join('');

  // ── Build balance rows ──
  const balRows = balances.map((b, i) => {
    const m = trip.members.find((p) => p.id === b.memberId);
    const method = m ? memberPayMethod(m) : undefined;
    const bg = i % 2 === 0 ? '#FFFFFF' : '#F9F9F9';
    const clr = b.net > 0.01 ? '#1A7D35' : b.net < -0.01 ? '#C0392B' : '#8E8E93';
    const lbl = b.net > 0.01 ? 'gets back' : b.net < -0.01 ? 'owes' : 'settled';
    const lbl_bg = b.net > 0.01 ? '#D4EDDA' : b.net < -0.01 ? '#FAE0DD' : '#F2F2F7';
    const lbl_clr = b.net > 0.01 ? '#1A7D35' : b.net < -0.01 ? '#C0392B' : '#8E8E93';
    return `<tr>
      <td style="background-color:${bg};padding:7px 12px;border-bottom:1px solid #E5E5EA;font-size:9.5px"><span style="color:#000;font-weight:400">${esc(b.name)}</span></td>
      <td style="background-color:${bg};padding:7px 12px;border-bottom:1px solid #E5E5EA;text-align:right;font-size:10.5px;font-weight:400;color:${clr}">${esc(formatMoney(b.net, currency))}</td>
      <td style="background-color:${bg};padding:7px 12px;border-bottom:1px solid #E5E5EA;font-size:8.5px"><span style="display:inline-block;background-color:${lbl_bg};color:${lbl_clr};padding:2px 6px;border-radius:4px;font-weight:400;font-size:8px">${lbl}</span></td>
      <td style="background-color:${bg};padding:7px 12px;border-bottom:1px solid #E5E5EA;font-size:8.5px">${method ? `${payIcon(method.rail, 12)}<span style="font-family:monospace;color:#000;font-size:8px;font-weight:400">${esc(getPayRailLabel(method.rail))}: ${esc(method.handle)}</span>` : '<span style="color:#C7C7CC">—</span>'}</td>
    </tr>`;
  }).join('');

  // ── Build settlement rows ──
  const setRows = transfers.map((t, i) => {
    const to = trip.members.find((m) => m.name === t.toName);
    const pm = to ? memberPayMethod(to) : undefined;
    const handle = pm?.handle || to?.upiId || '';
    const rl = getPayRailLabel(pm?.rail);
    const icon = payIcon(pm?.rail || 'bank', 12);
    const bg = i % 2 === 0 ? '#FFFFFF' : '#F9F9F9';
    return `<tr>
      <td style="background-color:${bg};padding:7px 12px;border-bottom:1px solid #E5E5EA;font-size:9.5px;color:#C0392B;font-weight:400">${esc(t.fromName)}</td>
      <td style="background-color:${bg};padding:7px 12px;border-bottom:1px solid #E5E5EA;font-size:9.5px;color:#1A7D35;font-weight:400">${esc(t.toName)}</td>
      <td style="background-color:${bg};padding:7px 12px;border-bottom:1px solid #E5E5EA;text-align:right;font-size:10.5px;font-weight:400;color:#000">${esc(formatMoney(t.amount, currency))}</td>
      <td style="background-color:${bg};padding:7px 12px;border-bottom:1px solid #E5E5EA;font-size:8.5px">${icon}<span style="font-weight:400;color:#000;font-size:8.5px">${esc(rl)}</span>${handle ? ` <span style="font-family:monospace;color:#8E8E93;font-size:7.5px">${esc(handle)}</span>` : ''}</td>
      <td style="background-color:${bg};padding:7px 12px;border-bottom:1px solid #E5E5EA;text-align:center"><span style="display:inline-block;background-color:#B2FF24;color:#000;padding:2px 6px;border-radius:4px;font-size:7px;font-weight:400" class="green">pending</span></td>
    </tr>`;
  }).join('');

  // ── Mockup member circles with real avatars ──
  const circles = trip.members.slice(0, 5).map((m) => {
    const avatarSrc = avatarData.memberAvatars[m.id];
    if (avatarSrc) {
      return `<img src="${avatarSrc}" alt="${esc(m.name)}" style="width:28px;height:28px;border-radius:50%;object-fit:cover;border:2px solid #0A0A0A;margin-right:-5px;display:inline-block;vertical-align:middle" />`;
    }
    const ini = m.name.charAt(0).toUpperCase();
    const hue = (m.name.charCodeAt(0) * 37) % 360;
    return `<div style="display:inline-block;width:28px;height:28px;border-radius:50%;background:hsl(${hue},55%,38%);color:#fff;text-align:center;line-height:28px;font-size:11px;font-weight:500;border:2px solid #0A0A0A;margin-right:-5px;vertical-align:middle">${ini}</div>`;
  }).join('');
  const extraM = trip.members.length > 5 ? `<div style="display:inline-block;width:28px;height:28px;border-radius:50%;background:#222;color:#B2FF24;text-align:center;line-height:28px;font-size:9.5px;font-weight:500;border:2px solid #0A0A0A;margin-right:-5px;vertical-align:middle">+${trip.members.length - 5}</div>` : '';

  // ── Mockup settlement lines ──
  const mockSettle = transfers.slice(0, 3).map((t) =>
    `<div style="display:table;width:100%;padding:3px 0;border-bottom:1px solid #3A3A3C">
      <div style="display:table-cell;color:#FF6B6B;font-weight:400;font-size:9.5px">${esc(t.fromName)}</div>
      <div style="display:table-cell;text-align:center;color:#8E8E93;width:16px;font-size:9.5px">&rarr;</div>
      <div style="display:table-cell;color:#34C759;font-weight:400;font-size:9.5px">${esc(t.toName)}</div>
      <div style="display:table-cell;text-align:right;color:#FFFFFF;font-weight:400;font-size:9.5px">${esc(formatMoney(t.amount, currency))}</div>
    </div>`
  ).join('');

  // ── Mockup recent expense lines ──
  const mockExpenses = trip.expenses.slice(0, 2).map((e) => {
    const payer = trip.members.find((m) => m.id === e.paidById);
    const pName = payer?.name || 'Member';
    return `<div style="display:table;width:100%;padding:3px 0;border-bottom:1px solid #3A3A3C">
      <div style="display:table-cell;vertical-align:middle">
        <div style="color:#FFFFFF;font-weight:400;font-size:9px">${esc(e.title)}</div>
        <div style="color:#8E8E93;font-size:7px;font-weight:300">Paid by ${esc(pName)}${e.tag ? ` &middot; ${esc(e.tag)}` : ''}</div>
      </div>
      <div style="display:table-cell;vertical-align:middle;text-align:right">
        <div style="color:#FFFFFF;font-weight:400;font-size:9px">${esc(formatMoney(e.amount, currency))}</div>
      </div>
    </div>`;
  }).join('');

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/>
<title>${esc(trip.name)} — Fairpay</title>
<style>
@page {
  size: 595pt 842pt;
  margin: 0;
}
* {
  -webkit-print-color-adjust: exact !important;
  print-color-adjust: exact !important;
  box-sizing: border-box;
}
html, body {
  width: 595pt;
  margin: 0;
  padding: 0;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Arial, sans-serif;
  color: #111111;
  background: #FFFFFF;
  line-height: 1.4;
  font-size: 10px;
  font-weight: 400;
  -webkit-print-color-adjust: exact !important;
  print-color-adjust: exact !important;
}
b, strong { font-weight: 600; }
table { border-collapse: collapse; }
.fill { background-color: #F2F2F7 !important; -webkit-print-color-adjust: exact !important; }
.white { background-color: #FFFFFF !important; -webkit-print-color-adjust: exact !important; }
.green { background-color: #B2FF24 !important; -webkit-print-color-adjust: exact !important; }
.th-fill { background-color: #F2F2F7 !important; -webkit-print-color-adjust: exact !important; }
.sep { background-color: #E5E5EA !important; -webkit-print-color-adjust: exact !important; }
.row-alt { background-color: #F9F9F9 !important; -webkit-print-color-adjust: exact !important; }
.page2bg { background-color: #F2F2F7 !important; -webkit-print-color-adjust: exact !important; }
.phonebg { background-color: #1C1C1E !important; -webkit-print-color-adjust: exact !important; }
.phonegreen { background-color: #B2FF24 !important; -webkit-print-color-adjust: exact !important; }
.phonedark { background-color: #2C2C2E !important; -webkit-print-color-adjust: exact !important; }
.hdgray { background-color: #E8E8ED !important; -webkit-print-color-adjust: exact !important; }

/* Strictly 820pt container — leaves safety margin under 842pt A4 limit, preventing blank overflow pages */
.page {
  width: 595pt;
  height: 820pt;
  max-height: 820pt;
  position: relative;
  page-break-after: always;
  break-after: page;
  page-break-inside: avoid;
  break-inside: avoid;
  overflow: hidden;
  box-sizing: border-box;
  background-color: #FFFFFF;
}
.page-2 {
  width: 595pt;
  height: 820pt;
  max-height: 820pt;
  position: relative;
  page-break-before: auto;
  break-before: auto;
  page-break-after: avoid;
  break-after: avoid;
  page-break-inside: avoid;
  break-inside: avoid;
  overflow: hidden;
  box-sizing: border-box;
  background-color: #F2F2F7 !important;
}
</style></head><body>

<!-- ═══════ PAGE 1: STATEMENT ═══════ -->
<div class="page white">

  <div style="padding:22px 30px 0 30px">

    <!-- HEADER (BOLD LOGO + POLISHED TYPO) -->
    <table style="width:100%"><tr>
      <td style="vertical-align:top">
        <div style="display:table;margin-bottom:5px">
          <div style="display:table-cell;vertical-align:middle;padding-right:9px">
            <svg width="25" height="25" viewBox="0 0 44 64"><rect x="8" y="12" width="10" height="40" rx="4" fill="#000"/><rect x="8" y="12" width="28" height="10" rx="4" fill="#000"/><rect x="8" y="27" width="22" height="10" rx="4" fill="#B2FF24"/></svg>
          </div>
          <div style="display:table-cell;vertical-align:middle">
            <div style="font-size:24px;font-weight:700;color:#000;letter-spacing:-0.5px;line-height:1">Fairpay</div>
          </div>
          <div style="display:table-cell;vertical-align:middle;padding-left:10px">
            <span style="display:inline-block;background-color:#F2F2F7;color:#3A3A3C;padding:2px 8px;border-radius:4px;font-size:7.5px;font-weight:500;letter-spacing:0.02em">Statement</span>
          </div>
        </div>
        <div style="font-size:8px;color:#8E8E93;line-height:1.6;font-weight:300">
          Ref: <b style="color:#000;font-weight:500">FP-${esc(trip.inviteCode)}</b> &nbsp;&middot;&nbsp; ${fDate} at ${fTime} &nbsp;&middot;&nbsp; fairpay.app
        </div>
      </td>
      <td style="vertical-align:top;text-align:right">
        <div style="font-size:20px;font-weight:300;color:#000;letter-spacing:-0.5px;margin-bottom:3px">${esc(trip.name)}</div>
        <div style="font-size:8px;color:#8E8E93;line-height:1.6;font-weight:300">
          Trip Code: <span style="display:inline-block;background-color:#B2FF24;color:#000;padding:1px 6px;border-radius:4px;font-size:8px;font-weight:500" class="green">${esc(trip.inviteCode)}</span>
          &nbsp;&middot;&nbsp; Currency: <b style="color:#000;font-weight:500">${currency} (${sym})</b>
        </div>
        <div style="font-size:8px;color:#8E8E93;line-height:1.6;font-weight:300">
          Members (${trip.members.length}): <span style="color:#000;font-weight:400">${trip.members.map((m) => esc(m.name)).join(', ')}</span>
        </div>
      </td>
    </tr></table>

  </div>

  <div style="height:1px;background-color:#E5E5EA;margin-top:10px" class="sep"></div>

  <!-- SUMMARY CARDS (BORDER-FREE, SOFT RADIUS) -->
  <table style="width:100%;background-color:#F2F2F7" class="fill"><tr><td style="padding:10px 30px">
    <table style="width:100%;border-spacing:8px;border-collapse:separate"><tr>
      <td style="background-color:#E8E8ED;border-radius:8px;padding:9px 13px;vertical-align:top;width:25%" class="hdgray">
        <div style="font-size:7px;font-weight:500;color:#8E8E93;letter-spacing:0.06em;text-transform:uppercase;margin-bottom:3px">Total Spent</div>
        <div style="font-size:18px;font-weight:300;color:#000;letter-spacing:-0.6px;margin-bottom:2px">${esc(formatMoney(total, currency))}</div>
        <div style="height:1px;background-color:rgba(0,0,0,0.06);margin-bottom:3px"></div>
        <div style="font-size:7.5px;color:#8E8E93;font-weight:300">${trip.expenses.length} expense(s) tracked</div>
      </td>
      <td style="background-color:#FFFFFF;border-radius:8px;padding:9px 13px;vertical-align:top;width:25%" class="white">
        <div style="font-size:7px;font-weight:500;color:#8E8E93;letter-spacing:0.06em;text-transform:uppercase;margin-bottom:3px">Per Person</div>
        <div style="font-size:18px;font-weight:300;color:#000;letter-spacing:-0.6px;margin-bottom:2px">${esc(formatMoney(avg, currency))}</div>
        <div style="height:1px;background-color:#F2F2F7;margin-bottom:3px"></div>
        <div style="font-size:7.5px;color:#8E8E93;font-weight:300">Fair split for ${trip.members.length} people</div>
      </td>
      <td style="background-color:#FFFFFF;border-radius:8px;padding:9px 13px;vertical-align:top;width:25%" class="white">
        <div style="font-size:7px;font-weight:500;color:#8E8E93;letter-spacing:0.06em;text-transform:uppercase;margin-bottom:3px">Members</div>
        <div style="font-size:18px;font-weight:300;color:#000;letter-spacing:-0.6px;margin-bottom:2px">${trip.members.length}</div>
        <div style="height:1px;background-color:#F2F2F7;margin-bottom:3px"></div>
        <div style="font-size:7.5px;color:#8E8E93;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:105px;font-weight:300">${trip.members.map((m) => esc(m.name)).join(' · ')}</div>
      </td>
      <td style="background-color:#B2FF24;border-radius:8px;padding:9px 13px;vertical-align:top;width:25%" class="green">
        <div style="font-size:7px;font-weight:500;color:#2a4a00;letter-spacing:0.06em;text-transform:uppercase;margin-bottom:3px">${done ? 'Status' : 'Pending'}</div>
        <div style="font-size:18px;font-weight:300;color:#000;letter-spacing:-0.6px;margin-bottom:2px">${done ? '✓ Settled' : esc(formatMoney(pendingAmt, currency))}</div>
        <div style="height:1px;background-color:rgba(0,0,0,0.12);margin-bottom:3px"></div>
        <div style="font-size:7.5px;color:#2a4a00;font-weight:300">${done ? 'All clear — zero dues' : `${transfers.length} transfer(s) pending`}</div>
      </td>
    </tr></table>
  </td></tr></table>

  <!-- BODY TABLES & NOTE (BORDER FREE) -->
  <div style="padding:2px 30px 10px;background-color:#FFFFFF">

    <!-- ── EXPENSES ── -->
    <div style="margin:10px 0 0">
      <table style="width:100%;margin-bottom:4px"><tr>
        <td style="vertical-align:middle">
          <span style="display:inline-block;width:3px;height:10px;background-color:#B2FF24;border-radius:1.5px;vertical-align:middle;margin-right:6px" class="green"></span>
          <span style="font-size:11px;font-weight:400;color:#000;vertical-align:middle;letter-spacing:-0.2px">Expenses</span>
          <span style="font-size:7.5px;color:#8E8E93;margin-left:6px;font-weight:300">— all amounts in ${currency}</span>
        </td>
        <td style="text-align:right;vertical-align:middle">
          <span style="font-size:7px;color:#8E8E93;background-color:#F2F2F7;padding:1.5px 6px;border-radius:3px" class="fill">${trip.expenses.length} item(s)</span>
        </td>
      </tr></table>
      <table style="width:100%">
        <tr class="th-fill" style="background-color:#F2F2F7">
          <th style="padding:5px 12px;text-align:left;color:#8E8E93;font-size:7.5px;font-weight:400;width:65px;border-bottom:1px solid #E5E5EA;letter-spacing:0.04em">DATE</th>
          <th style="padding:5px 12px;text-align:left;color:#8E8E93;font-size:7.5px;font-weight:400;border-bottom:1px solid #E5E5EA;letter-spacing:0.04em">DESCRIPTION</th>
          <th style="padding:5px 12px;text-align:left;color:#8E8E93;font-size:7.5px;font-weight:400;border-bottom:1px solid #E5E5EA;letter-spacing:0.04em">PAID BY</th>
          <th style="padding:5px 12px;text-align:right;color:#8E8E93;font-size:7.5px;font-weight:400;border-bottom:1px solid #E5E5EA;letter-spacing:0.04em">AMOUNT</th>
          <th style="padding:5px 12px;text-align:right;color:#8E8E93;font-size:7.5px;font-weight:400;border-bottom:1px solid #E5E5EA;letter-spacing:0.04em">SPLIT/EA</th>
        </tr>
        ${expRows || '<tr><td colspan="5" style="padding:10px;text-align:center;color:#8E8E93;font-style:italic;font-size:8.5px;border-bottom:1px solid #E5E5EA">No expenses recorded yet.</td></tr>'}
      </table>
    </div>

    <!-- ── MEMBER BALANCES ── -->
    <div style="margin:10px 0 0">
      <table style="width:100%;margin-bottom:4px"><tr>
        <td style="vertical-align:middle">
          <span style="display:inline-block;width:3px;height:10px;background-color:#B2FF24;border-radius:1.5px;vertical-align:middle;margin-right:6px" class="green"></span>
          <span style="font-size:11px;font-weight:400;color:#000;vertical-align:middle;letter-spacing:-0.2px">Member Balances</span>
          <span style="font-size:7.5px;color:#8E8E93;margin-left:6px;font-weight:300">— net amounts after expense splits</span>
        </td>
        <td style="text-align:right;vertical-align:middle">
          <span style="font-size:7px;color:#8E8E93;background-color:#F2F2F7;padding:1.5px 6px;border-radius:3px" class="fill">${balances.length} member(s)</span>
        </td>
      </tr></table>
      <table style="width:100%">
        <tr class="th-fill" style="background-color:#F2F2F7">
          <th style="padding:5px 12px;text-align:left;color:#8E8E93;font-size:7.5px;font-weight:400;border-bottom:1px solid #E5E5EA;letter-spacing:0.04em">MEMBER</th>
          <th style="padding:5px 12px;text-align:right;color:#8E8E93;font-size:7.5px;font-weight:400;border-bottom:1px solid #E5E5EA;letter-spacing:0.04em">NET BALANCE</th>
          <th style="padding:5px 12px;text-align:left;color:#8E8E93;font-size:7.5px;font-weight:400;border-bottom:1px solid #E5E5EA;letter-spacing:0.04em">STATUS</th>
          <th style="padding:5px 12px;text-align:left;color:#8E8E93;font-size:7.5px;font-weight:400;border-bottom:1px solid #E5E5EA;letter-spacing:0.04em">PAYMENT HANDLE</th>
        </tr>
        ${balRows}
      </table>
    </div>

    <!-- ── SETTLEMENTS ── -->
    <div style="margin:10px 0 0">
      <table style="width:100%;margin-bottom:4px"><tr>
        <td style="vertical-align:middle">
          <span style="display:inline-block;width:3px;height:10px;background-color:#B2FF24;border-radius:1.5px;vertical-align:middle;margin-right:6px" class="green"></span>
          <span style="font-size:11px;font-weight:400;color:#000;vertical-align:middle;letter-spacing:-0.2px">Settlements</span>
          <span style="font-size:7.5px;color:#8E8E93;margin-left:6px;font-weight:300">— optimised to minimise transfers</span>
        </td>
        <td style="text-align:right;vertical-align:middle">
          <span style="font-size:7px;color:#8E8E93;background-color:#F2F2F7;padding:1.5px 6px;border-radius:3px" class="fill">${transfers.length} transfer(s)</span>
        </td>
      </tr></table>
      <table style="width:100%">
        <tr class="th-fill" style="background-color:#F2F2F7">
          <th style="padding:5px 12px;text-align:left;color:#8E8E93;font-size:7.5px;font-weight:400;border-bottom:1px solid #E5E5EA;letter-spacing:0.04em">FROM</th>
          <th style="padding:5px 12px;text-align:left;color:#8E8E93;font-size:7.5px;font-weight:400;border-bottom:1px solid #E5E5EA;letter-spacing:0.04em">TO</th>
          <th style="padding:5px 12px;text-align:right;color:#8E8E93;font-size:7.5px;font-weight:400;border-bottom:1px solid #E5E5EA;letter-spacing:0.04em">AMOUNT</th>
          <th style="padding:5px 12px;text-align:left;color:#8E8E93;font-size:7.5px;font-weight:400;border-bottom:1px solid #E5E5EA;letter-spacing:0.04em">PAY VIA</th>
          <th style="padding:5px 12px;text-align:center;color:#8E8E93;font-size:7.5px;font-weight:400;border-bottom:1px solid #E5E5EA;letter-spacing:0.04em">STATUS</th>
        </tr>
        ${setRows || '<tr><td colspan="5" style="padding:9px;text-align:center;border-bottom:1px solid #E5E5EA"><span style="display:inline-block;background-color:#B2FF24;color:#000;padding:2px 8px;border-radius:4px;font-size:7.5px;font-weight:400" class="green">✓ All settled — zero dues</span></td></tr>'}
      </table>
    </div>

    <!-- Note strip with official downloaded brand PNGs -->
    <div style="margin:12px 0 0;padding:8px 14px;background-color:#F2F2F7;border-left:3.5px solid #B2FF24;border-radius:6px" class="fill">
      <table style="width:100%"><tr>
        <td style="vertical-align:middle;font-size:8.5px;color:#3A3A3C;line-height:1.4">
          <b style="color:#000;font-weight:600">ⓘ Note:</b> &nbsp;Balances computed from split amounts. Settle instantly via:
        </td>
        <td style="vertical-align:middle;text-align:right;white-space:nowrap">
          <span style="display:inline-block;vertical-align:middle">
            <img src="${PAYMENT_PNGS.upi}" style="height:15px;max-width:35px;object-fit:contain;vertical-align:middle;margin:0 3px;display:inline-block" alt="UPI" />
            <img src="${PAYMENT_PNGS.whatsapp}" style="height:16px;max-width:22px;object-fit:contain;vertical-align:middle;margin:0 3px;display:inline-block" alt="WhatsApp" />
            <img src="${PAYMENT_PNGS.gpay}" style="height:15px;max-width:35px;object-fit:contain;vertical-align:middle;margin:0 3px;display:inline-block" alt="GPay" />
            <img src="${PAYMENT_PNGS.phonepe}" style="height:16px;max-width:22px;object-fit:contain;vertical-align:middle;margin:0 3px;display:inline-block" alt="PhonePe" />
            <img src="${PAYMENT_PNGS.paytm}" style="height:15px;max-width:35px;object-fit:contain;vertical-align:middle;margin:0 3px;display:inline-block" alt="Paytm" />
            <img src="${PAYMENT_PNGS.paypal}" style="height:15px;max-width:30px;object-fit:contain;vertical-align:middle;margin:0 3px;display:inline-block" alt="PayPal" />
          </span>
          <span style="font-size:7.5px;color:#8E8E93;margin-left:6px;vertical-align:middle;font-weight:300">&middot; fairpay.app</span>
        </td>
      </tr></table>
    </div>

  </div>

  <!-- PAGE 1 FOOTER (LOCKED AT BOTTOM OF PAGE 1) -->
  <div style="position:absolute;bottom:0;left:0;right:0;width:100%;background-color:#F2F2F7;border-top:1px solid #E5E5EA" class="fill">
    <table style="width:100%"><tr>
      <td style="padding:8px 30px;font-size:7.5px;color:#8E8E93;vertical-align:middle;font-weight:300">
        <svg width="10" height="10" viewBox="0 0 44 64" style="vertical-align:middle;margin-right:4px"><rect x="8" y="12" width="10" height="40" rx="4" fill="#8E8E93"/><rect x="8" y="12" width="28" height="10" rx="4" fill="#8E8E93"/><rect x="8" y="27" width="22" height="10" rx="4" fill="#B2FF24"/></svg>
        Powered by <b style="color:#000;font-weight:700">Fairpay</b> &nbsp;&middot;&nbsp; Page 1 of 2 &nbsp;&middot;&nbsp; ${fDate} &nbsp;&middot;&nbsp; ${fTime}
      </td>
      <td style="padding:8px 30px;text-align:right;font-size:7.5px;color:#8E8E93;vertical-align:middle;font-weight:300">
        <b style="color:#000;font-weight:500">${esc(trip.name)}</b> &nbsp;&middot;&nbsp; ${trip.members.length} members &nbsp;&middot;&nbsp; fairpay.app
      </td>
    </tr></table>
  </div>

</div>

<!-- ═══════ PAGE 2: IPHONE MOCKUP (PERFECT NATIVE RATIO, ZERO LEAKAGE) ═══════ -->
<div class="page-2 page2bg" style="padding:24px 30px 14px;text-align:center">

  <!-- Top meta bar -->
  <table style="width:100%;margin-bottom:12px"><tr>
    <td style="vertical-align:middle;text-align:left">
      <svg width="12" height="12" viewBox="0 0 44 64" style="vertical-align:middle;margin-right:4px"><rect x="8" y="12" width="10" height="40" rx="4" fill="#000"/><rect x="8" y="12" width="28" height="10" rx="4" fill="#000"/><rect x="8" y="27" width="22" height="10" rx="4" fill="#B2FF24"/></svg>
      <span style="font-size:10px;color:#000;vertical-align:middle;font-weight:700">Fairpay</span>
      <span style="font-size:8.5px;color:#8E8E93;margin-left:4px;font-weight:300">&middot; Group Statement</span>
    </td>
    <td style="text-align:right;vertical-align:middle">
      <span style="font-size:8px;color:#8E8E93;font-weight:300">${fDate} &nbsp;&middot;&nbsp; Page 2 of 2</span>
    </td>
  </tr></table>

  <!-- Label badge (MINIMAL TITLE CASE) -->
  <div style="margin-top:6px;margin-bottom:6px">
    <span style="display:inline-block;background-color:#E5E5EA;color:#1C1C1E;padding:2.5px 9px;border-radius:4px;font-size:7.5px;font-weight:500;letter-spacing:0.02em">Trip summary</span>
  </div>

  <!-- Main title — single line, airy, light weight -->
  <div style="font-size:36px;font-weight:200;color:#000;letter-spacing:-1.3px;margin-bottom:4px;line-height:1">Your trip, at a glance</div>

  <!-- Sub-info lines -->
  <div style="font-size:11px;color:#3A3A3C;margin-bottom:3px;font-weight:400">
    Powered by <b style="color:#000;font-weight:700">Fairpay</b> &nbsp;&middot;&nbsp; Zero-friction settlements
  </div>
  <div style="font-size:9px;color:#8E8E93;margin-bottom:16px;font-weight:300">
    <b style="color:#000;font-weight:500">${esc(trip.name)}</b> &nbsp;&bull;&nbsp; ${fDate} &nbsp;&bull;&nbsp; ${currency} (${sym}) &nbsp;&bull;&nbsp; ${trip.members.length} member${trip.members.length !== 1 ? 's' : ''}
  </div>

  <!-- Phone mockup container (310x642, TRUE IPHONE 15 RATIO ~2.07:1, ZERO LEAKAGE) -->
  <div style="position:relative;width:310px;height:642px;margin:0 auto">
    ${phoneImg ? `<img src="${phoneImg}" style="position:absolute;top:0;left:0;width:310px;height:642px;z-index:2;pointer-events:none" />` : ''}
    <!-- Dark screen interior (calibrated exactly inside the bezel, zero leakage) -->
    <div style="position:absolute;top:28px;left:27px;right:27px;bottom:28px;background-color:#1C1C1E;border-radius:36px;z-index:1;overflow:hidden;padding:40px 14px 12px;text-align:left" class="phonebg">
      
      <!-- Status bar (spaced inward from curved corners to prevent time cutting) -->
      <div style="position:absolute;top:11px;left:20px;right:20px;display:table;width:calc(100% - 40px)">
        <div style="display:table-cell;vertical-align:middle;font-weight:600;color:#FFF;font-size:10px;letter-spacing:-0.2px">9:41</div>
        <div style="display:table-cell;text-align:right;vertical-align:middle;color:#FFF">
          <!-- Cellular signal -->
          <svg width="13" height="9" viewBox="0 0 17 11" style="vertical-align:middle;margin-right:3px"><rect x="1" y="8" width="2.5" height="3" rx="0.5" fill="#FFF"/><rect x="5" y="5.5" width="2.5" height="5.5" rx="0.5" fill="#FFF"/><rect x="9" y="3" width="2.5" height="8" rx="0.5" fill="#FFF"/><rect x="13" y="0.5" width="2.5" height="10.5" rx="0.5" fill="#FFF"/></svg>
          <!-- Wifi -->
          <svg width="12" height="9" viewBox="0 0 16 12" style="vertical-align:middle;margin-right:3px"><path d="M8 9.5a1.5 1.5 0 100 3 1.5 1.5 0 000-3zm-4.2-3.2a6 6 0 018.4 0l-1.2 1.2a4.3 4.3 0 00-6 0L3.8 6.3zm-2.8-2.8a10 10 0 0114 0L13.8 4.7a8 8 0 00-11.6 0L1 3.5z" fill="#FFF"/></svg>
          <!-- Battery -->
          <svg width="15" height="9" viewBox="0 0 25 12" style="vertical-align:middle"><rect x="1" y="1" width="20" height="10" rx="3" fill="none" stroke="#FFFFFF" stroke-width="1.2"/><rect x="2.5" y="2.5" width="13" height="7" rx="1.5" fill="#FFFFFF"/><path d="M22 4.5v3c.8-.3 1.2-.9 1.2-1.5s-.4-1.2-1.2-1.5z" fill="#FFFFFF"/></svg>
        </div>
      </div>

      <!-- App bar -->
      <div style="display:table;width:100%;margin-bottom:7px">
        <div style="display:table-cell;vertical-align:middle">
          <svg width="12" height="12" viewBox="0 0 44 64" style="vertical-align:middle;margin-right:4px"><rect x="8" y="12" width="10" height="40" rx="4" fill="#fff"/><rect x="8" y="12" width="28" height="10" rx="4" fill="#fff"/><rect x="8" y="27" width="22" height="10" rx="4" fill="#B2FF24"/></svg>
          <span style="font-size:11.5px;font-weight:700;color:#FFF;vertical-align:middle">Fairpay</span>
        </div>
        <div style="display:table-cell;text-align:right;vertical-align:middle">
          ${avatarData.userAvatar ? `<img src="${avatarData.userAvatar}" style="width:18px;height:18px;border-radius:50%;border:1.5px solid #B2FF24;vertical-align:middle;object-fit:cover;display:inline-block" />` : `<span style="font-size:7px;color:#8E8E93;background-color:#2C2C2E;padding:2px 5px;border-radius:3.5px;font-weight:600" class="phonedark">GROUP</span>`}
        </div>
      </div>

      <!-- Thin separator line -->
      <div style="height:1px;background-color:#2C2C2E;margin-bottom:7px"></div>

      <!-- Trip name pill -->
      <div style="display:table;width:100%;margin-bottom:5px">
        <div style="display:table-cell;vertical-align:middle">
          <span style="display:inline-block;background-color:#B2FF24;color:#000;padding:2px 8px;border-radius:4.5px;font-size:8.5px;font-weight:500" class="phonegreen">${esc(trip.name)}</span>
        </div>
        <div style="display:table-cell;text-align:right;vertical-align:middle;color:#8E8E93;font-size:7.5px;font-weight:300">
          ${trip.members.length} members &middot; ${currency}
        </div>
      </div>

      <!-- Total amount & micro breakdown -->
      <div style="font-size:23px;font-weight:300;color:#FFF;letter-spacing:-0.6px;margin-bottom:2px">${esc(formatMoney(total, currency))}</div>
      <div style="display:table;width:100%;margin-bottom:7px">
        <div style="display:table-cell;font-size:8px;color:#8E8E93;font-weight:300">Your share: <b style="color:#FFF;font-weight:500">${esc(formatMoney(avg, currency))}</b></div>
        <div style="display:table-cell;text-align:right;font-size:8px;color:#8E8E93;font-weight:300">${trip.expenses.length} expense${trip.expenses.length !== 1 ? 's' : ''}</div>
      </div>

      <!-- Member avatars -->
      <div style="margin-bottom:7px">${circles}${extraM}</div>

      <!-- Green pending card -->
      <div style="background-color:#B2FF24;border-radius:7px;padding:8px 11px;margin-bottom:7px" class="phonegreen">
        <div style="font-size:7.5px;color:#2a4a00;font-weight:600;letter-spacing:0.06em;margin-bottom:1.5px">${done ? '✓ ALL SETTLED' : 'PENDING SETTLEMENT'}</div>
        <div style="font-size:14px;font-weight:500;color:#000;letter-spacing:-0.3px">${done ? 'Zero dues — everyone clear' : esc(formatMoney(pendingAmt, currency)) + ' to go'}</div>
      </div>

      <!-- Quick Action Buttons -->
      <div style="display:table;width:100%;margin-bottom:7px">
        <div style="display:table-cell;width:32%;padding-right:3px">
          <div style="background-color:#2C2C2E;color:#FFFFFF;padding:4.5px 0;border-radius:4.5px;font-size:7.5px;font-weight:400;text-align:center" class="phonedark">&#x26A1; Remind</div>
        </div>
        <div style="display:table-cell;width:32%;padding:0 2px">
          <div style="background-color:#2C2C2E;color:#FFFFFF;padding:4.5px 0;border-radius:4.5px;font-size:7.5px;font-weight:400;text-align:center" class="phonedark">&#x2197; Share link</div>
        </div>
        <div style="display:table-cell;width:32%;padding-left:3px">
          <div style="background-color:#B2FF24;color:#000000;padding:4.5px 0;border-radius:4.5px;font-size:7.5px;font-weight:600;text-align:center" class="phonegreen">&#x2713; Settle UPI</div>
        </div>
      </div>

      ${transfers.length > 0 ? `
      <!-- Who pays whom card -->
      <div style="background-color:#2C2C2E;border-radius:7px;padding:7px 10px;margin-bottom:7px" class="phonedark">
        <div style="font-size:7.5px;color:#8E8E93;font-weight:500;letter-spacing:0.08em;margin-bottom:3px">WHO PAYS WHOM</div>
        ${mockSettle}
        ${transfers.length > 3 ? `<div style="font-size:7.5px;color:#636366;text-align:center;margin-top:2px">+${transfers.length - 3} more transfer${transfers.length - 3 !== 1 ? 's' : ''}</div>` : ''}
      </div>
      ` : ''}

      ${mockExpenses ? `
      <!-- Recent Expenses card -->
      <div style="background-color:#2C2C2E;border-radius:7px;padding:7px 10px;margin-bottom:7px" class="phonedark">
        <div style="font-size:7.5px;color:#8E8E93;font-weight:500;letter-spacing:0.08em;margin-bottom:3px">RECENT ACTIVITY</div>
        ${mockExpenses}
      </div>
      ` : ''}

      <!-- Security & Tagline -->
      ${msg ? `<div style="font-size:7.5px;color:#8E8E93;text-align:center;line-height:1.3;margin-top:5px;font-style:italic;font-weight:300">"${esc(msg)}"</div>` : ''}
      <div style="font-size:7px;color:#636366;text-align:center;line-height:1.3;margin-top:2px;font-weight:300">
        &#x1F512; End-to-end encrypted &middot; Smart split engine
      </div>

      <!-- Home indicator -->
      <div style="position:absolute;bottom:6px;left:50%;margin-left:-25px;width:50px;height:3px;background-color:#3A3A3C;border-radius:2px"></div>
    </div>
  </div>

  <!-- PAGE 2 FOOTER (LOCKED AT BOTTOM OF PAGE 2) -->
  <div style="position:absolute;bottom:0;left:0;right:0;width:100%;padding:0 30px 14px;text-align:center">
    <div style="border-top:1px solid #D1D1D6;padding-top:7px">
      <div style="font-size:8px;color:#8E8E93;margin-bottom:2px;font-weight:300">
        <svg width="10" height="10" viewBox="0 0 44 64" style="vertical-align:middle;margin-right:4px"><rect x="8" y="12" width="10" height="40" rx="4" fill="#8E8E93"/><rect x="8" y="12" width="28" height="10" rx="4" fill="#8E8E93"/><rect x="8" y="27" width="22" height="10" rx="4" fill="#B2FF24"/></svg>
        Generated by <b style="color:#000;font-weight:700">Fairpay</b> &nbsp;&middot;&nbsp; ${fDate} &nbsp;&middot;&nbsp; ${fTime}
      </div>
      <div style="font-size:7.5px;color:#8E8E93;font-weight:300">fairpay.app &nbsp;&bull;&nbsp; Settle smarter &nbsp;&bull;&nbsp; Zero-friction group expenses &nbsp;&bull;&nbsp; v1.0</div>
    </div>
  </div>

</div>

</body></html>`;

  const { uri } = await Print.printToFileAsync({
    html,
    width: 595,
    height: 842,
    margins: { top: 0, bottom: 0, left: 0, right: 0 },
  });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: `${trip.name} — Fairpay Statement`,
      UTI: 'com.adobe.pdf',
    });
  }
  return uri;
}

function esc(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
