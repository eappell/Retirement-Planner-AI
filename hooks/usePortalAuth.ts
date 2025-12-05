import { useState, useEffect } from 'react';

interface UserData {
  userId: string;
  email: string;
  tier: 'free' | 'premium' | 'admin';
  token: string;
}

export const usePortalAuth = () => {
  // Determine embedding synchronously so UI can make access decisions immediately
  const initialEmbedded = (typeof window !== 'undefined') ? (window.self !== window.top) : false;
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEmbedded, setIsEmbedded] = useState<boolean>(initialEmbedded);

  useEffect(() => {
    // Update embedded state in case it changed
    const embeddedNow = window.self !== window.top;
    setIsEmbedded(embeddedNow);

    // If embedded, request auth from the parent in case it posted the token
    // before this frame mounted.
    if (embeddedNow && window.parent) {
      try {
        window.parent.postMessage({ type: 'REQUEST_AUTH' }, '*');
      } catch (e) {
        // ignore
      }
    }

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'AUTH_TOKEN') {
        // Normalize tier values (case-insensitive) and coerce unknown values to 'free'
        const rawTier = (event.data.tier || '').toString().toLowerCase();
        let normalizedTier: UserData['tier'] = 'free';
        if (rawTier.startsWith('admin')) normalizedTier = 'admin';
        else if (rawTier.startsWith('premium')) normalizedTier = 'premium';

        console.log('[usePortalAuth] Received auth token:', {
          userId: event.data.userId,
          email: event.data.email,
          tier: normalizedTier,
        });

        setUserData({
          userId: event.data.userId,
          email: event.data.email,
          tier: normalizedTier,
          token: event.data.token,
        });
        setLoading(false);
      }
    };

    window.addEventListener('message', handleMessage);

    // Set loading to false after a short timeout if no message received
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 2000);

    return () => {
      window.removeEventListener('message', handleMessage);
      clearTimeout(timeout);
    };
  }, []);

  // If the app is running standalone (not embedded in a portal), treat it as
  // having full access so users see all features.
  const isStandalone = !isEmbedded;

  return {
    userData,
    loading,
    isEmbedded,
    isAuthenticated: !!userData,
    isFree: userData?.tier === 'free',
    // If running standalone and there's no portal user, expose premium features
    isPremium: userData ? (userData.tier === 'premium' || userData.tier === 'admin') : isStandalone,
    isAdmin: userData?.tier === 'admin',
    hasAccess: (requiredTier: 'free' | 'premium' | 'admin') => {
      if (isStandalone) return true;
      if (!userData) return false;
      if (userData.tier === 'admin') return true;
      if (requiredTier === 'premium') return ['premium', 'admin'].includes(userData.tier);
      if (requiredTier === 'free') return true;
      return false;
    },
  };
};
