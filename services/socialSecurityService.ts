
import { SS_BEND_POINTS, SS_BEND_FACTORS, SS_AGE_ADJUSTMENT_FACTORS, SS_FULL_RETIREMENT_AGE } from '../constants.ts';

/**
 * Estimates the monthly Social Security benefit.
 * This is a simplified model and does not reflect an official SSA estimate.
 * It uses the 2024 "bend points" on the user's current monthly salary as a proxy for their AIME.
 */
export const estimateSocialSecurityBenefit = (
    currentAnnualSalary: number,
    claimingAge: number
): number => {
    if (currentAnnualSalary <= 0 || !claimingAge) {
        return 0;
    }

    const monthlySalary = currentAnnualSalary / 12;
    let pia = 0; // Primary Insurance Amount

    // Calculate PIA based on bend points
    if (monthlySalary <= SS_BEND_POINTS.first) {
        pia = monthlySalary * SS_BEND_FACTORS.first;
    } else if (monthlySalary <= SS_BEND_POINTS.second) {
        pia = (SS_BEND_POINTS.first * SS_BEND_FACTORS.first) +
              ((monthlySalary - SS_BEND_POINTS.first) * SS_BEND_FACTORS.second);
    } else {
        pia = (SS_BEND_POINTS.first * SS_BEND_FACTORS.first) +
              ((SS_BEND_POINTS.second - SS_BEND_POINTS.first) * SS_BEND_FACTORS.second) +
              ((monthlySalary - SS_BEND_POINTS.second) * SS_BEND_FACTORS.third);
    }
    
    // Adjust PIA for claiming age
    const adjustmentFactor = SS_AGE_ADJUSTMENT_FACTORS[claimingAge] || 1.0;
    
    // Social Security has a maximum benefit amount, simplified here
    const maxBenefitAtFRA = 3822; // Approx. 2024 max benefit at FRA
    const adjustedMax = maxBenefitAtFRA * (SS_AGE_ADJUSTMENT_FACTORS[claimingAge] / SS_AGE_ADJUSTMENT_FACTORS[SS_FULL_RETIREMENT_AGE]);
    
    return Math.min(pia * adjustmentFactor, adjustedMax);
};