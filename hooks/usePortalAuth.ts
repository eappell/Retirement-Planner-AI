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
        console.log('[usePortalAuth] Received auth token:', {
          userId: event.data.userId,
          email: event.data.email,
          tier: event.data.tier,
        });
        
        setUserData({
          userId: event.data.userId,
          email: event.data.email,
          tier: event.data.tier,
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
    isPremium: userData?.tier === 'premium',
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
