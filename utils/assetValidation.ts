export function validateAssetDefaults(d: any): string[] {
    const issues: string[] = [];
    if (!d) return issues;
    const { stockMean, bondMean, stockStd, bondStd } = d;
    if (typeof stockMean !== 'number' || typeof bondMean !== 'number') {
        issues.push('Stock or bond mean is not a number');
    } else if (stockMean < bondMean) {
        issues.push('Stock mean is lower than bond mean (unusual assumption)');
    }
    if (typeof stockStd !== 'number' || typeof bondStd !== 'number') {
        issues.push('Stock or bond volatility (std) is not a number');
    } else {
        if (stockStd < 0 || bondStd < 0) issues.push('Volatility cannot be negative');
        if (stockStd > 100 || bondStd > 100) issues.push('Volatility values look unreasonably large');
    }
    if (typeof stockMean === 'number' && (stockMean < -20 || stockMean > 50)) issues.push('Stock mean is outside reasonable bounds');
    if (typeof bondMean === 'number' && (bondMean < -10 || bondMean > 30)) issues.push('Bond mean is outside reasonable bounds');
    return issues;
}

export default validateAssetDefaults;
