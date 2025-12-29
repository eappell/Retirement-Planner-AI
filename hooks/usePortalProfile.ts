import { useState, useEffect, useCallback } from 'react';

export interface PortalProfile {
  dob: string | null;
  retirementAge: number | null;
  currentAnnualIncome: number | null;
  filingStatus: 'single' | 'married' | null;
  spouseDob: string | null;
  spouseName: string | null;
  lifeExpectancy: number | null;
  currentState: string | null;
  retirementState: string | null;
}

const emptyProfile: PortalProfile = {
  dob: null,
  retirementAge: null,
  currentAnnualIncome: null,
  filingStatus: null,
  spouseDob: null,
  spouseName: null,
  lifeExpectancy: null,
  currentState: null,
  retirementState: null,
};

/**
 * Hook to receive user profile data from the portal via postMessage.
 * The portal sends profile fields when:
 * - AUTH_TOKEN message on initial load
 * - USER_ROLE_UPDATE when role/profile changes
 * - USER_PROFILE_UPDATE when profile is explicitly updated
 */
export const usePortalProfile = () => {
  const [profile, setProfile] = useState<PortalProfile>(emptyProfile);
  const [hasReceivedProfile, setHasReceivedProfile] = useState(false);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const { type, ...data } = event.data || {};

      // Handle profile data from various portal message types
      if (type === 'AUTH_TOKEN' || type === 'USER_ROLE_UPDATE' || type === 'USER_PROFILE_UPDATE') {
        const newProfile: PortalProfile = {
          dob: data.dob ?? null,
          retirementAge: data.retirementAge ?? null,
          currentAnnualIncome: data.currentAnnualIncome ?? null,
          filingStatus: data.filingStatus ?? null,
          spouseDob: data.spouseDob ?? null,
          spouseName: data.spouseName ?? null,
          lifeExpectancy: data.lifeExpectancy ?? null,
          currentState: data.currentState ?? null,
          retirementState: data.retirementState ?? null,
        };

        // Only update if we have at least one non-null value
        const hasAnyData = Object.values(newProfile).some(v => v !== null);
        if (hasAnyData) {
          setProfile(newProfile);
          setHasReceivedProfile(true);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  /**
   * Calculate age from DOB
   */
  const getAgeFromDob = useCallback((dob: string | null): number | null => {
    if (!dob) return null;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }, []);

  /**
   * Get the effective state for tax calculations.
   * Uses retirementState if set, otherwise falls back to currentState.
   */
  const getEffectiveState = useCallback((): string | null => {
    return profile.retirementState || profile.currentState;
  }, [profile.currentState, profile.retirementState]);

  return {
    profile,
    hasReceivedProfile,
    currentAge: getAgeFromDob(profile.dob),
    spouseCurrentAge: getAgeFromDob(profile.spouseDob),
    getEffectiveState,
    isMarried: profile.filingStatus === 'married',
  };
};

export default usePortalProfile;
