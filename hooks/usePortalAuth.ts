import { useState, useEffect } from 'react';

interface UserData {
  userId: string;
  email: string;
  tier: 'free' | 'premium' | 'admin';
  token: string;
}

export const usePortalAuth = () => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEmbedded, setIsEmbedded] = useState(false);

  useEffect(() => {
    // Check if embedded
    setIsEmbedded(window.self !== window.top);

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
      if (!userData) {
        setLoading(false);
      }
    }, 2000);

    return () => {
      window.removeEventListener('message', handleMessage);
      clearTimeout(timeout);
    };
  }, [userData]);

  return {
    userData,
    loading,
    isEmbedded,
    isAuthenticated: !!userData,
    isFree: userData?.tier === 'free',
    // Treat admin as having premium access so components that check `isPremium`
    // will correctly allow admin users.
    isPremium: userData ? (userData.tier === 'premium' || userData.tier === 'admin') : false,
    isAdmin: userData?.tier === 'admin',
    hasAccess: (requiredTier: 'free' | 'premium' | 'admin') => {
      if (!userData) return false;
      if (userData.tier === 'admin') return true;
      if (requiredTier === 'premium') return ['premium', 'admin'].includes(userData.tier);
      if (requiredTier === 'free') return true;
      return false;
    },
  };
};
