import { useNotificationStore } from '@/store/notifications';

export function getFirstName(fullName?: string | null): string {
  if (!fullName) return 'there';
  const clean = fullName.trim();
  if (!clean) return 'there';
  const first = clean.split(/\s+/)[0];
  return first.charAt(0).toUpperCase() + first.slice(1);
}

/**
 * Generates an ultra-premium, minimalist HTML welcome email for Fairpay users.
 * Apple-inspired typography, border-free cards, soft lime accents.
 */
export function getWelcomeEmailHtml(name: string, email: string): string {
  const firstName = getFirstName(name);
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welcome to Fairpay</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #F8F9FA;
      font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #111111;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      max-width: 560px;
      margin: 40px auto;
      background-color: #FFFFFF;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 4px 24px rgba(0,0,0,0.04);
    }
    .header {
      padding: 36px 36px 20px;
      background: #FFFFFF;
    }
    .badge {
      display: inline-block;
      background-color: #F2F2F7;
      color: #3A3A3C;
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      padding: 4px 10px;
      border-radius: 6px;
      margin-bottom: 18px;
    }
    .title {
      font-size: 32px;
      font-weight: 300;
      letter-spacing: -1px;
      color: #000000;
      line-height: 1.15;
      margin: 0 0 12px;
    }
    .subtitle {
      font-size: 15px;
      color: #636366;
      line-height: 1.5;
      font-weight: 400;
      margin: 0 0 24px;
    }
    .card-grid {
      padding: 0 36px 24px;
    }
    .feature-card {
      background-color: #F9F9FB;
      border-radius: 12px;
      padding: 16px 18px;
      margin-bottom: 12px;
    }
    .feature-title {
      font-size: 13px;
      font-weight: 600;
      color: #000000;
      margin-bottom: 4px;
      display: flex;
      align-items: center;
    }
    .feature-desc {
      font-size: 12px;
      color: #8E8E93;
      line-height: 1.45;
      margin: 0;
    }
    .accent-pill {
      display: inline-block;
      width: 7px;
      height: 7px;
      background-color: #B2FF24;
      border-radius: 50%;
      margin-right: 8px;
    }
    .cta-wrap {
      padding: 12px 36px 32px;
      text-align: center;
    }
    .cta-btn {
      display: inline-block;
      background-color: #000000;
      color: #FFFFFF !important;
      text-decoration: none;
      font-size: 14px;
      font-weight: 500;
      padding: 14px 28px;
      border-radius: 10px;
      letter-spacing: -0.2px;
    }
    .footer {
      background-color: #F2F2F7;
      padding: 24px 36px;
      text-align: center;
      font-size: 11px;
      color: #8E8E93;
      line-height: 1.6;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div style="display:flex;align-items:center;margin-bottom:20px;">
        <div style="width:28px;height:28px;background:#000;border-radius:6px;display:flex;align-items:center;justify-content:center;margin-right:10px;">
          <span style="color:#B2FF24;font-weight:800;font-size:15px;line-height:1">F</span>
        </div>
        <span style="font-size:18px;font-weight:700;color:#000;letter-spacing:-0.5px">Fairpay</span>
      </div>
      <div class="badge">Account Verified</div>
      <h1 class="title">Welcome, ${firstName}.</h1>
      <p class="subtitle">
        Your Fairpay account is ready. Zero-friction group expense management designed with clarity and precision.
      </p>
    </div>

    <div class="card-grid">
      <div class="feature-card">
        <div class="feature-title"><span class="accent-pill"></span>Smart Split Engine</div>
        <p class="feature-desc">Our settlement algorithm computes net balances and reduces dozens of complex cross-debts into the minimum possible transfers.</p>
      </div>

      <div class="feature-card">
        <div class="feature-title"><span class="accent-pill"></span>1-Tap Settlements</div>
        <p class="feature-desc">Pay directly via UPI, WhatsApp, Google Pay, PhonePe, and Paytm with zero fees and immediate confirmation.</p>
      </div>

      <div class="feature-card">
        <div class="feature-title"><span class="accent-pill"></span>Apple-Grade Statements</div>
        <p class="feature-desc">Generate beautiful 2-page PDF statements with complete transaction histories, payer tags, and interactive phone previews.</p>
      </div>
    </div>

    <div class="cta-wrap">
      <a href="https://fairpay.app" class="cta-btn">Open Fairpay App &rarr;</a>
    </div>

    <div class="footer">
      <div>This greeting was prepared for <b>${email}</b> &middot; ${dateStr}</div>
      <div style="margin-top:6px">Fairpay &bull; Settle smarter &bull; Zero-friction group expenses &bull; v1.0</div>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Dispatches the customized welcome greeting experience.
 * Records the greeting in the user's notifications and prepares the preview.
 */
export async function sendWelcomeGreeting(
  name: string,
  email: string,
): Promise<{ success: boolean; previewHtml: string }> {
  const firstName = getFirstName(name);
  const emailHtml = getWelcomeEmailHtml(name, email);

  try {
    // Record into notification store for in-app history
    useNotificationStore.getState().addConfirmation({
      tripId: 'welcome',
      expenseId: 'welcome_greeting',
      memberId: 'fairpay_system',
      memberName: 'Fairpay Team',
      amount: 0,
      expenseTitle: `Welcome to Fairpay, ${firstName}! A greeting mail has been prepared for ${email}`,
    });
  } catch (e) {
    console.log('[WelcomeEmail] Failed to record in notification store:', e);
  }

  return {
    success: true,
    previewHtml: emailHtml,
  };
}
