# 📞 Enable Phone Authentication in Supabase

## ❌ Current Error:
```
ERROR: [AuthApiError: Unsupported phone provider]
```

This means Phone authentication is **not enabled** in your Supabase project.

---

## ✅ Solution: Enable Phone Auth (5 minutes)

### Step 1: Go to Supabase Dashboard
1. Open: https://supabase.com/dashboard
2. Select your project: `hfyhnqdhjkmusfhjvfax`

### Step 2: Navigate to Authentication
1. Click **Authentication** in the left sidebar
2. Click **Providers** tab

### Step 3: Enable Phone Provider
1. Scroll down to find **Phone** provider
2. Click on it to expand
3. Toggle **"Enable Phone provider"** to **ON**

### Step 4: Choose Mode

#### Option A: Test Mode (Recommended for Development)
**Best for:**
- Local development
- Testing without SMS costs
- No Twilio account needed

**How to enable:**
1. Select **"Use test mode"**
2. Click **Save**

**How it works:**
- You can enter ANY phone number (real or fake)
- OTP codes appear in Supabase logs instead of SMS
- Find OTP in: Dashboard → Authentication → Logs

**Example test flow:**
1. Enter phone: `+919876543210`
2. Click "Send OTP"
3. Go to Supabase → Authentication → Logs
4. Find the OTP code (6 digits)
5. Enter it in the app

---

#### Option B: Production Mode (Twilio SMS)
**Best for:**
- Production deployment
- Real SMS messages
- Live users

**Requirements:**
1. Twilio account (free tier available)
2. Twilio Account SID
3. Twilio Auth Token
4. Twilio Phone Number

**How to enable:**
1. Create Twilio account: https://www.twilio.com/try-twilio
2. Get credentials from Twilio Console
3. In Supabase Phone provider settings:
   - **Twilio Account SID**: `ACxxxx...`
   - **Twilio Auth Token**: `xxxxx...`
   - **Twilio Phone Number**: `+1234567890`
4. Click **Save**

**Cost:**
- Free tier: $15 credit
- SMS: ~$0.01 per message (varies by country)

---

## 🧪 Testing After Enabling

### Test Mode Testing:
```
1. App: Enter +919876543210
2. App: Click "Send OTP"
3. Supabase: Auth → Logs → Find OTP
4. App: Enter the 6-digit OTP
5. ✅ Should create account & redirect
```

### Production Mode Testing:
```
1. App: Enter YOUR real phone
2. App: Click "Send OTP"  
3. Phone: Receive SMS with OTP
4. App: Enter OTP
5. ✅ Should create account & redirect
```

---

## 📊 Check if Phone Auth is Working

### Success Signs:
✅ No more "Unsupported phone provider" error  
✅ "OTP sent" message appears  
✅ Logs show: `Auth state changed: SIGNED_IN`  
✅ Redirects to profile/payment setup  

### Failure Signs:
❌ Still getting "Unsupported" error → Phone not enabled  
❌ "Invalid phone number" → Check format (+91...)  
❌ "Rate limit exceeded" → Wait 60 seconds  
❌ "Invalid OTP" → Check code from logs  

---

## 🔍 Find OTP in Test Mode

### Via Supabase Dashboard:
1. Dashboard → Authentication → Logs (left sidebar)
2. Look for recent entries with "OTP"
3. Code format: `123456` (6 digits)

### Via Supabase SQL:
Run in SQL Editor:
```sql
SELECT * FROM auth.mfa_challenges
ORDER BY created_at DESC
LIMIT 1;
```

---

## 🎯 Quick Checklist

- [ ] Supabase Dashboard opened
- [ ] Authentication → Providers clicked
- [ ] Phone provider found
- [ ] "Enable Phone provider" toggled ON
- [ ] Test mode selected (for development)
- [ ] Changes saved
- [ ] App restarted (Ctrl+C → `npx expo start`)
- [ ] Test OTP flow
- [ ] Check logs for OTP code
- [ ] Enter OTP in app
- [ ] Profile created successfully

---

## 🆘 Troubleshooting

### "Unsupported phone provider" persists
- Clear Expo cache: `npx expo start --clear`
- Verify Phone is **enabled** in Supabase
- Check you're on the correct project
- Wait 1-2 minutes for changes to propagate

### Can't find OTP in logs
- Make sure test mode is enabled
- Refresh the logs page
- Try Auth → Users → Recent activity
- Check if phone number format is correct (+91...)

### "Invalid credentials" error
- Double-check `.env` file has correct anon key
- Anon key should start with `eyJ...`
- Restart Expo after changing `.env`

### OTP expired
- OTP valid for 60 seconds only
- Request new OTP and enter quickly

---

## 📝 Summary

**What you need to do NOW:**
1. ✅ Go to Supabase Dashboard
2. ✅ Enable Phone authentication
3. ✅ Select "Test mode"
4. ✅ Test the flow
5. ✅ Come back and tell me it works!

**After it works:**
- I'll continue with Phase 4 (store integration)
- You'll have full backend + frontend working
- Multi-device sync, real-time updates, etc.

---

**Go enable Phone auth now, then test with +919876543210! 🚀**
