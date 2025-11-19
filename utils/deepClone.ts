/**
 * Efficiently deep clone objects using structuredClone when available,
 * falling back to a custom implementation for older browsers.
 * This is significantly faster than JSON.parse(JSON.stringify())
 */

export function deepClone<T>(obj: T): T {
    // Use native structuredClone if available (modern browsers)
    if (typeof structuredClone === 'function') {
        return structuredClone(obj);
    }
    
    // Fallback for older browsers
    return JSON.parse(JSON.stringify(obj));
}

/**
 * Clone an array of objects efficiently
 */
export function cloneArray<T>(arr: T[]): T[] {
    if (typeof structuredClone === 'function') {
        return structuredClone(arr);
    }
    return JSON.parse(JSON.stringify(arr));
}
