# 🚀 Implementation Plan: Google/Apple OAuth

## ✅ What We're Doing

**OLD:** Phone OTP (complex, expensive, slow)
**NEW:** Google/Apple OAuth (simple, free, fast)

**Payment Info:** Asked ONLY when settling up (not during signup!)

---

## 📋 Step-by-Step Implementation

### Step 1: Install Dependencies (5 min)

```bash
# Google Sign-In
npx expo install @react-native-google-signin/google-signin

# Apple Sign-In (built into Expo)
npx expo install expo-apple-authentication

# Deep linking for OAuth callback
npx expo install expo-linking expo-web-browser
```

---

### Step 2: Configure Google OAuth (10 min)

#### A. Create Google OAuth Client:
1. Go to: https://console.cloud.google.com
2. Create new project: "FairPay"
3. Enable: "Google Sign-In API"
4. Create OAuth 2.0 Client ID:
   - **Android:**
     - Application type: Android
     - Package name: `com.yourcompany.fairpay` (from app.json)
     - SHA-1: Get from `expo fetch:android:hashes`
   - **iOS:**
     - Application type: iOS
     - Bundle ID: `com.yourcompany.fairpay` (from app.json)
   - **Web:**
     - Application type: Web
     - Redirect URI: `https://[your-supabase-ref].supabase.co/auth/v1/callback`

#### B. Add to Supabase:
1. Supabase Dashboard → Authentication → Providers
2. Enable Google
3. Paste Client ID + Client Secret
4. Save ✅

---

### Step 3: Configure Apple Sign-In (10 min)

#### A. Apple Developer Account:
1. Go to: https://developer.apple.com
2. Certificates, Identifiers & Profiles
3. Create Identifier:
   - Type: App IDs
   - Bundle ID: `com.yourcompany.fairpay`
   - Enable: "Sign in with Apple"
4. Create Service ID:
   - Identifier: `com.yourcompany.fairpay.auth`
   - Enable: "Sign in with Apple"
   - Configure: Add redirect URL

#### B. Add to Supabase:
1. Supabase Dashboard → Authentication → Providers
2. Enable Apple
3. Paste Service ID, Team ID, Key ID
4. Save ✅

---

### Step 4: Update app.json (2 min)

```json
{
  "expo": {
    "scheme": "fairpay",
    "ios": {
      "bundleIdentifier": "com.yourcompany.fairpay",
      "usesAppleSignIn": true
    },
    "android": {
      "package": "com.yourcompany.fairpay",
      "googleServicesFile": "./google-services.json"
    },
    "plugins": [
      [
        "expo-apple-authentication"
      ],
      [
        "@react-native-google-signin/google-signin"
      ]
    ]
  }
}
```

---

### Step 5: Create Social Auth Screen (30 min)

**File:** `src/app/(auth)/social.tsx`

```typescript
import { useState } from 'react';
import { View, Text, Pressable, Alert } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as AppleAuthentication from 'expo-apple-authentication';
import { supabase } from '@/lib/supabase';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

export default function SocialAuthScreen() {
  const [loading, setLoading] = useState(false);

  // Google Sign-In
  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      
      const { idToken } = await GoogleSignin.getTokens();
      
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: idToken!,
      });
      
      if (error) throw error;
      
      // Success - Supabase will trigger onAuthStateChange
      router.replace('/');
    } catch (error: any) {
      Alert.alert('Login failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  // Apple Sign-In
  const handleAppleSignIn = async () => {
    try {
      setLoading(true);
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: credential.identityToken!,
      });
      
      if (error) throw error;
      
      router.replace('/');
    } catch (error: any) {
      if (error.code === 'ERR_REQUEST_CANCELED') {
        // User canceled
        return;
      }
      Alert.alert('Login failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to FairPay</Text>
      <Text style={styles.subtitle}>
        Split expenses with friends · Track IOUs · Settle up easily
      </Text>

      {/* Google Sign-In */}
      <Pressable
        style={[styles.button, styles.googleButton]}
        onPress={handleGoogleSignIn}
        disabled={loading}
      >
        <Ionicons name="logo-google" size={20} color="#fff" />
        <Text style={styles.buttonText}>Continue with Google</Text>
      </Pressable>

      {/* Apple Sign-In */}
      <AppleAuthentication.AppleAuthenticationButton
        buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
        buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
        cornerRadius={12}
        style={styles.appleButton}
        onPress={handleAppleSignIn}
      />

      {/* Skip for now */}
      <Pressable onPress={() => router.replace('/')}>
        <Text style={styles.skip}>Skip for now</Text>
      </Pressable>

      <Text style={styles.terms}>
        By continuing, you agree to our Terms & Privacy Policy
      </Text>
    </View>
  );
}
```

---

### Step 6: Update Auth Store (15 min)

**File:** `src/store/auth.ts`

```typescript
// Listen to Supabase auth state
useEffect(() => {
  // Get initial session
  supabase.auth.getSession().then(({ data: { session } }) => {
    if (session) {
      setUser({
        id: session.user.id,
        email: session.user.email!,
        name: session.user.user_metadata?.full_name || 
              session.user.user_metadata?.name || 
              'User',
        avatar: session.user.user_metadata?.avatar_url,
      });
    }
  });

  // Listen for changes
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (_event, session) => {
      if (session) {
        setUser({
          id: session.user.id,
          email: session.user.email!,
          name: session.user.user_metadata?.full_name || 
                session.user.user_metadata?.name || 
                'User',
          avatar: session.user.user_metadata?.avatar_url,
        });
      } else {
        setUser(null);
      }
    }
  );

  return () => subscription.unsubscribe();
}, []);
```

---

### Step 7: Add Payment Setup to Settle Screen (30 min)

**File:** `src/app/settle/payment-setup.tsx`

```typescript
import { useState } from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '@/store/auth';
import { supabase } from '@/lib/supabase';

export default function PaymentSetupScreen() {
  const { returnTo } = useLocalSearchParams<{ returnTo: string }>();
  const user = useAuthStore((s) => s.user);
  const [upiId, setUpiId] = useState('');
  const [loading, setLoading] = useState(false);

  const savePaymentMethod = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Update payment_methods in database
      const { error } = await supabase
        .from('users')
        .update({
          payment_methods: [
            { type: 'upi', id: upiId, primary: true }
          ]
        })
        .eq('id', user.id);
      
      if (error) throw error;
      
      // Update local store
      useAuthStore.getState().updatePaymentMethods([
        { type: 'upi', id: upiId, primary: true }
      ]);
      
      // Return to settle screen
      if (returnTo) {
        router.push(returnTo);
      } else {
        router.back();
      }
    } catch (error: any) {
      Alert.alert('Failed to save', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add payment method 💳</Text>
      <Text style={styles.subtitle}>
        How do you want to receive money?
      </Text>

      <View style={styles.section}>
        <Text style={styles.label}>🇮🇳 UPI ID</Text>
        <TextInput
          style={styles.input}
          placeholder="yourname@paytm"
          value={upiId}
          onChangeText={setUpiId}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Text style={styles.help}>
          Works with Paytm, PhonePe, Google Pay, BHIM
        </Text>
      </View>

      <Text style={styles.info}>
        💡 This is how friends will pay you. We'll save it for next time!
      </Text>

      <Pressable
        style={[styles.button, !upiId && styles.buttonDisabled]}
        onPress={savePaymentMethod}
        disabled={!upiId || loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Saving...' : 'Save & Continue'}
        </Text>
      </Pressable>

      <Pressable onPress={() => router.back()}>
        <Text style={styles.skip}>Skip for now</Text>
      </Pressable>
    </View>
  );
}
```

---

### Step 8: Update Settle Screen (10 min)

**File:** `src/app/settle/[id].tsx`

Add payment check:

```typescript
const handleSettleUp = () => {
  const user = useAuthStore.getState().user;
  
  // Check if user has payment method
  if (!user?.paymentMethods || user.paymentMethods.length === 0) {
    // First time settling - ask for payment info
    router.push({
      pathname: '/settle/payment-setup',
      params: { returnTo: `/settle/${id}` }
    });
    return;
  }
  
  // Has payment method - proceed with settle
  proceedWithSettlement();
};
```

---

### Step 9: Clean Up Old Files (5 min)

Delete these files:
- `src/app/(auth)/phone.tsx`
- `src/app/(auth)/verify.tsx`
- `src/app/(auth)/profile.tsx`
- Old payment-setup in auth folder

---

### Step 10: Update Database Schema (5 min)

```sql
-- Update users table
ALTER TABLE users
  DROP COLUMN IF EXISTS phone_number,
  DROP COLUMN IF EXISTS phone_verified,
  ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- payment_methods already exists as JSONB ✅
```

---

## 🧪 Testing Checklist

### Test 1: Google Sign-In
- [ ] Tap "Continue with Google"
- [ ] Select Google account
- [ ] Redirected to home screen
- [ ] Name/email/avatar populated
- [ ] Can create groups immediately

### Test 2: Apple Sign-In
- [ ] Tap "Continue with Apple"
- [ ] Face ID / Touch ID
- [ ] Redirected to home screen
- [ ] Name/email populated
- [ ] Can create groups immediately

### Test 3: Skip Login
- [ ] Tap "Skip for now"
- [ ] Can use app locally
- [ ] Prompted to login when creating group

### Test 4: Payment Setup
- [ ] Create group with expenses
- [ ] Tap "Settle Up"
- [ ] If first time → Shown payment setup
- [ ] Add UPI ID
- [ ] Saved to database
- [ ] Next time → Skip setup

---

## 📊 Before vs After

### Before (Phone OTP):
```
1. Open app
2. Enter phone number
3. Wait for SMS (5-10s)
4. Enter OTP
5. Enter name
6. Add payment method
7. Start using app

Time: 60-90 seconds
Cost: ₹0.28 per user
Friction: HIGH
```

### After (OAuth):
```
1. Open app
2. Tap "Continue with Google"
3. Select account
4. Start using app
(Payment method asked later when needed)

Time: 5 seconds
Cost: FREE
Friction: VERY LOW
```

**Result: 12x faster, FREE, better UX!** 🎉

---

## 💰 Cost Savings

### Old (Phone OTP):
- 1000 users × ₹0.28 = **₹280/month**
- 10,000 users × ₹0.28 = **₹2,800/month**

### New (OAuth):
- 1000 users × ₹0 = **₹0/month** ✅
- 10,000 users × ₹0 = **₹0/month** ✅

**You save 100% on auth costs!** 💰

---

## ✅ Summary

**What changed:**
- ❌ Phone OTP removed
- ✅ Google/Apple OAuth added
- ✅ Payment info moved to settle screen
- ✅ Simpler, faster, cheaper

**Time to implement:** 2-3 hours
**Time to test:** 1 hour
**Total:** ~4 hours

**Benefits:**
- 5-second signup (vs 60 seconds)
- FREE (vs ₹0.28/user)
- Better UX (familiar login)
- Global support (works everywhere)
- Less friction (payment info only when needed)

**STATUS: Ready to implement!** 🚀

Let's do this! 💪
