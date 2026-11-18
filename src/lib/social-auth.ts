/**
 * Social Auth (OAuth) - Google and Apple Sign-In helpers for Supabase
 */

import { makeRedirectUri } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { supabase } from './supabase';

function parseQueryParams(url: string): Record<string, string | undefined> {
  const parsed = Linking.parse(url);
  const params: Record<string, string | undefined> = {};
  if (parsed.queryParams) {
    for (const [k, v] of Object.entries(parsed.queryParams)) {
      params[k] = Array.isArray(v) ? v[0] : (v ?? undefined);
    }
  }
  return params;
}

// Important: Tell WebBrowser to close after redirect
WebBrowser.maybeCompleteAuthSession();

/**
 * Create redirect URL for OAuth
 */
export const createRedirectUrl = () => {
  return makeRedirectUri({
    scheme: 'fairpay',
    path: 'auth/callback',
  });
};

/**
 * Sign in with Google using Supabase OAuth
 */
export async function signInWithGoogle() {
  try {
    const redirectUrl = createRedirectUrl();
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        skipBrowserRedirect: true, // We handle redirect manually
      },
    });

    if (error) throw error;
    if (!data?.url) throw new Error('No OAuth URL returned');

    // Open browser for OAuth flow
    const result = await WebBrowser.openAuthSessionAsync(
      data.url,
      redirectUrl
    );

    if (result.type === 'success') {
      // Extract session from URL
      const { url } = result;
      const params = parseQueryParams(url);
      
      if (params.error) {
        throw new Error(params.error_description || 'OAuth failed');
      }

      // Session is automatically set by Supabase
      const { data: sessionData } = await supabase.auth.getSession();
      return { user: sessionData.session?.user, error: null };
    } else if (result.type === 'cancel') {
      return { user: null, error: new Error('User cancelled') };
    } else {
      return { user: null, error: new Error('OAuth failed') };
    }
  } catch (error) {
    console.error('Google sign-in error:', error);
    return { user: null, error: error as Error };
  }
}

/**
 * Sign in with Apple using Supabase OAuth
 */
export async function signInWithApple() {
  try {
    const redirectUrl = createRedirectUrl();
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: {
        redirectTo: redirectUrl,
        skipBrowserRedirect: true,
      },
    });

    if (error) throw error;
    if (!data?.url) throw new Error('No OAuth URL returned');

    const result = await WebBrowser.openAuthSessionAsync(
      data.url,
      redirectUrl
    );

    if (result.type === 'success') {
      const { url } = result;
      const params = parseQueryParams(url);
      
      if (params.error) {
        throw new Error(params.error_description || 'OAuth failed');
      }

      const { data: sessionData } = await supabase.auth.getSession();
      return { user: sessionData.session?.user, error: null };
    } else if (result.type === 'cancel') {
      return { user: null, error: new Error('User cancelled') };
    } else {
      return { user: null, error: new Error('OAuth failed') };
    }
  } catch (error) {
    console.error('Apple sign-in error:', error);
    return { user: null, error: error as Error };
  }
}

/**
 * Handle OAuth callback from deep link
 */
export async function handleOAuthCallback(url: string) {
  try {
    const params = parseQueryParams(url);
    
    if (params.error) {
      throw new Error(params.error_description || 'OAuth failed');
    }

    // Supabase automatically handles the session
    const { data: sessionData } = await supabase.auth.getSession();
    return { session: sessionData.session, error: null };
  } catch (error) {
    console.error('OAuth callback error:', error);
    return { session: null, error: error as Error };
  }
}
