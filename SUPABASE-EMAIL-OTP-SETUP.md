# 🔐 Fairpay Supabase Email & OTP Configuration Guide

To ensure all signup and login emails are sent with **Fairpay** branding and a **6-digit OTP code** (instead of a default link from Supabase), update these settings in your Supabase dashboard.

---

## 1. Set Sender Name to "Fairpay"

1. Open your [Supabase Dashboard](https://supabase.com/dashboard).
2. Select your project (`hfyhnqdhjkmusfhjvfax`).
3. In the left sidebar, navigate to **Project Settings** → **Authentication** (or **Authentication** → **Email Settings**).
4. Update the sender details:
   - **Sender Name**: `Fairpay`
   - **Sender Email**: `noreply@fairpay.app` (or your domain / custom SMTP via Resend/SendGrid)
5. Click **Save Changes**.

---

## 2. Configure 6-Digit Code for Signup (Confirm signup)

By default, Supabase sends a confirmation link (`{{ .ConfirmationURL }}`). To send a **6-digit OTP code** instead:

1. In the Supabase Dashboard, go to **Authentication** → **Email Templates**.
2. Click on **Confirm signup**.
3. Set **Subject**:
   ```
   {{ .Token }} is your Fairpay verification code
   ```
4. Replace the **Body** with this clean, minimal Apple-grade template:
   ```html
   <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 500px; margin: 0 auto; padding: 32px 24px; background: #ffffff;">
     <div style="display: flex; align-items: center; margin-bottom: 24px;">
       <div style="width: 28px; height: 28px; background: #000000; border-radius: 6px; text-align: center; line-height: 28px; color: #B2FF24; font-weight: 800; font-size: 16px; margin-right: 10px;">F</div>
       <span style="font-size: 20px; font-weight: 700; color: #000000; letter-spacing: -0.5px;">Fairpay</span>
     </div>

     <h2 style="font-size: 24px; font-weight: 600; color: #111111; margin: 0 0 10px;">Verification Code</h2>
     <p style="font-size: 14px; color: #636366; line-height: 1.5; margin: 0 0 24px;">
       Enter this 6-digit code in the Fairpay app to complete your account verification.
     </p>

     <div style="background: #F2F2F7; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px;">
       <span style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #000000; font-family: monospace;">{{ .Token }}</span>
     </div>

     <p style="font-size: 12px; color: #8E8E93; line-height: 1.5; margin: 0 0 8px;">
       This code expires in 10 minutes. If you did not request this code, you can safely ignore this email.
     </p>
     <div style="border-top: 1px solid #E5E5EA; margin-top: 24px; padding-top: 16px; font-size: 11px; color: #8E8E93; text-align: center;">
       Fairpay &bull; Settle smarter &bull; Zero-friction group expenses &bull; fairpay.app
     </div>
   </div>
   ```
5. Click **Save**.

---

## 3. Configure 6-Digit Code for Sign-In (Magic Link)

1. Under **Authentication** → **Email Templates**, click on **Magic Link**.
2. Set **Subject**:
   ```
   {{ .Token }} is your Fairpay sign-in code
   ```
3. Replace the **Body** with:
   ```html
   <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 500px; margin: 0 auto; padding: 32px 24px; background: #ffffff;">
     <div style="display: flex; align-items: center; margin-bottom: 24px;">
       <div style="width: 28px; height: 28px; background: #000000; border-radius: 6px; text-align: center; line-height: 28px; color: #B2FF24; font-weight: 800; font-size: 16px; margin-right: 10px;">F</div>
       <span style="font-size: 20px; font-weight: 700; color: #000000; letter-spacing: -0.5px;">Fairpay</span>
     </div>

     <h2 style="font-size: 24px; font-weight: 600; color: #111111; margin: 0 0 10px;">Sign-in Code</h2>
     <p style="font-size: 14px; color: #636366; line-height: 1.5; margin: 0 0 24px;">
       Enter this 6-digit code in the Fairpay app to sign in to your account.
     </p>

     <div style="background: #F2F2F7; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px;">
       <span style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #000000; font-family: monospace;">{{ .Token }}</span>
     </div>

     <p style="font-size: 12px; color: #8E8E93; line-height: 1.5; margin: 0 0 8px;">
       This code expires in 10 minutes. If you did not request this code, you can safely ignore this email.
     </p>
     <div style="border-top: 1px solid #E5E5EA; margin-top: 24px; padding-top: 16px; font-size: 11px; color: #8E8E93; text-align: center;">
       Fairpay &bull; Settle smarter &bull; Zero-friction group expenses &bull; fairpay.app
     </div>
   </div>
   ```
4. Click **Save**.

---

## 4. In-App Dual Verification Support

The Fairpay app now supports both verification modes seamlessly:
- **6-digit OTP verification**: Users type the 6 digits and tap Continue.
- **Email Link Auto-Detection**: If a user clicks a confirmation link in their email, the app's real-time authentication listener and deep link handler detect the session automatically, show the customized welcoming modal, and complete login without getting stuck.
