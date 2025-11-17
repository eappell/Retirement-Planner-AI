import { TaxBracket } from './types.ts';

export const STATES = {
    AL: 'Alabama',
    AK: 'Alaska',
    AZ: 'Arizona',
    AR: 'Arkansas',
    CA: 'California',
    CO: 'Colorado',
    CT: 'Connecticut',
    DE: 'Delaware',
    FL: 'Florida',
    GA: 'Georgia',
    HI: 'Hawaii',
    ID: 'Idaho',
    IL: 'Illinois',
    IN: 'Indiana',
    IA: 'Iowa',
    KS: 'Kansas',
    KY: 'Kentucky',
    LA: 'Louisiana',
    ME: 'Maine',
    MD: 'Maryland',
    MA: 'Massachusetts',
    MI: 'Michigan',
    MN: 'Minnesota',
    MS: 'Mississippi',
    MO: 'Missouri',
    MT: 'Montana',
    NE: 'Nebraska',
    NV: 'Nevada',
    NH: 'New Hampshire',
    NJ: 'New Jersey',
    NM: 'New Mexico',
    NY: 'New York',
    NC: 'North Carolina',
    ND: 'North Dakota',
    OH: 'Ohio',
    OK: 'Oklahoma',
    OR: 'Oregon',
    PA: 'Pennsylvania',
    RI: 'Rhode Island',
    SC: 'South Carolina',
    SD: 'South Dakota',
    TN: 'Tennessee',
    TX: 'Texas',
    UT: 'Utah',
    VT: 'Vermont',
    VA: 'Virginia',
    WA: 'Washington',
    WV: 'West Virginia',
    WI: 'Wisconsin',
    WY: 'Wyoming',
};

// Simplified 2024 Federal Tax Brackets
export const FEDERAL_TAX_BRACKETS = {
    single: [
        { rate: 0.10, min: 0, max: 11600 },
        { rate: 0.12, min: 11601, max: 47150 },
        { rate: 0.22, min: 47151, max: 100525 },
        { rate: 0.24, min: 100526, max: 191950 },
        { rate: 0.32, min: 191951, max: 243725 },
        { rate: 0.35, min: 243726, max: 609350 },
        { rate: 0.37, min: 609351, max: Infinity },
    ],
    married_filing_jointly: [
        { rate: 0.10, min: 0, max: 23200 },
        { rate: 0.12, min: 23201, max: 94300 },
        { rate: 0.22, min: 94301, max: 201050 },
        { rate: 0.24, min: 201051, max: 383900 },
        { rate: 0.32, min: 383901, max: 487450 },
        { rate: 0.35, min: 487451, max: 731150 },
        { rate: 0.37, min: 731151, max: Infinity },
    ],
};

export const FEDERAL_STANDARD_DEDUCTION = {
    single: 14600,
    married_filing_jointly: 29200,
};


// Simplified 2024 State Tax Brackets. Source: Tax Foundation, NerdWallet, etc.
// This is for demonstration and may not include all local taxes or specific deductions.
export const STATE_TAX_BRACKETS: { [key: string]: { single: TaxBracket[], married_filing_jointly: TaxBracket[], standardDeduction: { single: number, married_filing_jointly: number } } } = {
    // No Income Tax States
    AK: { single: [], married_filing_jointly: [], standardDeduction: { single: 0, married_filing_jointly: 0 } },
    FL: { single: [], married_filing_jointly: [], standardDeduction: { single: 0, married_filing_jointly: 0 } },
    NV: { single: [], married_filing_jointly: [], standardDeduction: { single: 0, married_filing_jointly: 0 } },
    NH: { single: [], married_filing_jointly: [], standardDeduction: { single: 0, married_filing_jointly: 0 } }, // Only on interest/dividends, not modeled here
    SD: { single: [], married_filing_jointly: [], standardDeduction: { single: 0, married_filing_jointly: 0 } },
    TN: { single: [], married_filing_jointly: [], standardDeduction: { single: 0, married_filing_jointly: 0 } }, // Only on interest/dividends, not modeled here
    TX: { single: [], married_filing_jointly: [], standardDeduction: { single: 0, married_filing_jointly: 0 } },
    WA: { single: [], married_filing_jointly: [], standardDeduction: { single: 0, married_filing_jointly: 0 } }, // Only on capital gains, not modeled here
    WY: { single: [], married_filing_jointly: [], standardDeduction: { single: 0, married_filing_jointly: 0 } },
    
    // States with Income Tax
    AL: {
        single: [{ rate: 0.02, min: 0, max: 500 }, { rate: 0.04, min: 501, max: 3000 }, { rate: 0.05, min: 3001, max: Infinity }],
        married_filing_jointly: [{ rate: 0.02, min: 0, max: 1000 }, { rate: 0.04, min: 1001, max: 6000 }, { rate: 0.05, min: 6001, max: Infinity }],
        standardDeduction: { single: 3000, married_filing_jointly: 8500 }
    },
    AZ: {
        single: [{ rate: 0.025, min: 0, max: Infinity }],
        married_filing_jointly: [{ rate: 0.025, min: 0, max: Infinity }],
        standardDeduction: { single: 14600, married_filing_jointly: 29200 }
    },
    AR: {
        single: [{ rate: 0.02, min: 0, max: 5099 }, { rate: 0.04, min: 5100, max: 10299 }, { rate: 0.049, min: 10300, max: Infinity }],
        married_filing_jointly: [{ rate: 0.02, min: 0, max: 5099 }, { rate: 0.04, min: 5100, max: 10299 }, { rate: 0.049, min: 10300, max: Infinity }],
        standardDeduction: { single: 2270, married_filing_jointly: 4540 }
    },
    CA: {
        single: [{ rate: 0.01, min: 0, max: 10412 }, { rate: 0.02, min: 10413, max: 24684 }, { rate: 0.04, min: 24685, max: 38959 }, { rate: 0.06, min: 38960, max: 54081 }, { rate: 0.08, min: 54082, max: 68350 }, { rate: 0.093, min: 68351, max: 349137 }, { rate: 0.103, min: 349138, max: 418961 }, { rate: 0.113, min: 418962, max: 698271 }, { rate: 0.123, min: 698272, max: Infinity }],
        married_filing_jointly: [{ rate: 0.01, min: 0, max: 20824 }, { rate: 0.02, min: 20825, max: 49368 }, { rate: 0.04, min: 49369, max: 77918 }, { rate: 0.06, min: 77919, max: 108162 }, { rate: 0.08, min: 108163, max: 136700 }, { rate: 0.093, min: 136701, max: 698274 }, { rate: 0.103, min: 698275, max: 837922 }, { rate: 0.113, min: 837923, max: 1396542 }, { rate: 0.123, min: 1396543, max: Infinity }],
        standardDeduction: { single: 5363, married_filing_jointly: 10726 }
    },
    CO: {
        single: [{ rate: 0.044, min: 0, max: Infinity }],
        married_filing_jointly: [{ rate: 0.044, min: 0, max: Infinity }],
        standardDeduction: { single: 14600, married_filing_jointly: 29200 }
    },
    CT: {
        single: [{ rate: 0.02, min: 0, max: 10000 }, { rate: 0.04, min: 10001, max: 50000 }, { rate: 0.045, min: 50001, max: 100000 }, { rate: 0.055, min: 100001, max: 200000 }, { rate: 0.06, min: 200001, max: 250000 }, { rate: 0.065, min: 250001, max: 500000 }, { rate: 0.0699, min: 500001, max: Infinity }],
        married_filing_jointly: [{ rate: 0.02, min: 0, max: 20000 }, { rate: 0.04, min: 20001, max: 100000 }, { rate: 0.045, min: 100001, max: 200000 }, { rate: 0.055, min: 200001, max: 400000 }, { rate: 0.06, min: 400001, max: 500000 }, { rate: 0.065, min: 500001, max: 1000000 }, { rate: 0.0699, min: 1000001, max: Infinity }],
        standardDeduction: { single: 15000, married_filing_jointly: 30000 }
    },
    DE: {
        single: [{ rate: 0.022, min: 2001, max: 5000 }, { rate: 0.039, min: 5001, max: 10000 }, { rate: 0.048, min: 10001, max: 20000 }, { rate: 0.052, min: 20001, max: 25000 }, { rate: 0.0555, min: 25001, max: 60000 }, { rate: 0.066, min: 60001, max: Infinity }],
        married_filing_jointly: [{ rate: 0.022, min: 2001, max: 5000 }, { rate: 0.039, min: 5001, max: 10000 }, { rate: 0.048, min: 10001, max: 20000 }, { rate: 0.052, min: 20001, max: 25000 }, { rate: 0.0555, min: 25001, max: 60000 }, { rate: 0.066, min: 60001, max: Infinity }],
        standardDeduction: { single: 3250, married_filing_jointly: 6500 }
    },
    GA: {
        single: [{ rate: 0.0549, min: 0, max: Infinity }],
        married_filing_jointly: [{ rate: 0.0549, min: 0, max: Infinity }],
        standardDeduction: { single: 12000, married_filing_jointly: 24000 }
    },
    HI: {
        single: [{ rate: 0.014, min: 0, max: 2400 }, { rate: 0.032, min: 2401, max: 4800 }, { rate: 0.055, min: 4801, max: 9600 }, { rate: 0.064, min: 9601, max: 14400 }, { rate: 0.068, min: 14401, max: 19200 }, { rate: 0.072, min: 19201, max: 24000 }, { rate: 0.076, min: 24001, max: 36000 }, { rate: 0.079, min: 36001, max: 48000 }, { rate: 0.0825, min: 48001, max: 150000 }, { rate: 0.09, min: 150001, max: 175000 }, { rate: 0.1, min: 175001, max: 200000 }, { rate: 0.11, min: 200001, max: Infinity }],
        married_filing_jointly: [{ rate: 0.014, min: 0, max: 4800 }, { rate: 0.032, min: 4801, max: 9600 }, { rate: 0.055, min: 9601, max: 19200 }, { rate: 0.064, min: 19201, max: 28800 }, { rate: 0.068, min: 28801, max: 38400 }, { rate: 0.072, min: 38401, max: 48000 }, { rate: 0.076, min: 48001, max: 72000 }, { rate: 0.079, min: 72001, max: 96000 }, { rate: 0.0825, min: 96001, max: 300000 }, { rate: 0.09, min: 300001, max: 350000 }, { rate: 0.1, min: 350001, max: 400000 }, { rate: 0.11, min: 400001, max: Infinity }],
        standardDeduction: { single: 2200, married_filing_jointly: 4400 }
    },
    ID: {
        single: [{ rate: 0.058, min: 0, max: Infinity }],
        married_filing_jointly: [{ rate: 0.058, min: 0, max: Infinity }],
        standardDeduction: { single: 14600, married_filing_jointly: 29200 }
    },
    IL: {
        single: [{ rate: 0.0495, min: 0, max: Infinity }],
        married_filing_jointly: [{ rate: 0.0495, min: 0, max: Infinity }],
        standardDeduction: { single: 2775, married_filing_jointly: 5550 }
    },
    IN: {
        single: [{ rate: 0.0305, min: 0, max: Infinity }],
        married_filing_jointly: [{ rate: 0.0305, min: 0, max: Infinity }],
        standardDeduction: { single: 1000, married_filing_jointly: 2000 }
    },
    IA: {
        single: [{ rate: 0.057, min: 0, max: Infinity }],
        married_filing_jointly: [{ rate: 0.057, min: 0, max: Infinity }],
        standardDeduction: { single: 2470, married_filing_jointly: 6080 }
    },
    KS: {
        single: [{ rate: 0.031, min: 0, max: 15000 }, { rate: 0.0525, min: 15001, max: 30000 }, { rate: 0.057, min: 30001, max: Infinity }],
        married_filing_jointly: [{ rate: 0.031, min: 0, max: 30000 }, { rate: 0.0525, min: 30001, max: 60000 }, { rate: 0.057, min: 60001, max: Infinity }],
        standardDeduction: { single: 3500, married_filing_jointly: 8000 }
    },
    KY: {
        single: [{ rate: 0.04, min: 0, max: Infinity }],
        married_filing_jointly: [{ rate: 0.04, min: 0, max: Infinity }],
        standardDeduction: { single: 3160, married_filing_jointly: 3160 }
    },
    LA: {
        single: [{ rate: 0.0185, min: 0, max: 12500 }, { rate: 0.035, min: 12501, max: 50000 }, { rate: 0.0425, min: 50001, max: Infinity }],
        married_filing_jointly: [{ rate: 0.0185, min: 0, max: 25000 }, { rate: 0.035, min: 25001, max: 100000 }, { rate: 0.0425, min: 100001, max: Infinity }],
        standardDeduction: { single: 14600, married_filing_jointly: 29200 }
    },
    ME: {
        single: [{ rate: 0.058, min: 0, max: 24500 }, { rate: 0.0675, min: 24501, max: 58050 }, { rate: 0.0715, min: 58051, max: Infinity }],
        married_filing_jointly: [{ rate: 0.058, min: 0, max: 49050 }, { rate: 0.0675, min: 49051, max: 116100 }, { rate: 0.0715, min: 116101, max: Infinity }],
        standardDeduction: { single: 14600, married_filing_jointly: 29200 }
    },
    MD: {
        single: [{ rate: 0.02, min: 0, max: 1000 }, { rate: 0.03, min: 1001, max: 2000 }, { rate: 0.04, min: 2001, max: 3000 }, { rate: 0.0475, min: 3001, max: 100000 }, { rate: 0.05, min: 100001, max: 125000 }, { rate: 0.0525, min: 125001, max: 150000 }, { rate: 0.055, min: 150001, max: 250000 }, { rate: 0.0575, min: 250001, max: Infinity }],
        married_filing_jointly: [{ rate: 0.02, min: 0, max: 1000 }, { rate: 0.03, min: 1001, max: 2000 }, { rate: 0.04, min: 2001, max: 3000 }, { rate: 0.0475, min: 3001, max: 150000 }, { rate: 0.05, min: 150001, max: 175000 }, { rate: 0.0525, min: 175001, max: 225000 }, { rate: 0.055, min: 225001, max: 300000 }, { rate: 0.0575, min: 300001, max: Infinity }],
        standardDeduction: { single: 2550, married_filing_jointly: 5100 }
    },
    MA: {
        single: [{ rate: 0.05, min: 0, max: Infinity }],
        married_filing_jointly: [{ rate: 0.05, min: 0, max: Infinity }],
        standardDeduction: { single: 0, married_filing_jointly: 0 } // MA uses exemptions not standard deductions
    },
    MI: {
        single: [{ rate: 0.0425, min: 0, max: Infinity }],
        married_filing_jointly: [{ rate: 0.0425, min: 0, max: Infinity }],
        standardDeduction: { single: 0, married_filing_jointly: 0 } // Uses exemptions
    },
    MN: {
        single: [{ rate: 0.0535, min: 0, max: 31690 }, { rate: 0.068, min: 31691, max: 104620 }, { rate: 0.0785, min: 104621, max: 197460 }, { rate: 0.0985, min: 197461, max: Infinity }],
        married_filing_jointly: [{ rate: 0.0535, min: 0, max: 46330 }, { rate: 0.068, min: 46331, max: 184580 }, { rate: 0.0785, min: 184581, max: 329060 }, { rate: 0.0985, min: 329061, max: Infinity }],
        standardDeduction: { single: 14600, married_filing_jointly: 29200 }
    },
    MS: {
        single: [{ rate: 0.04, min: 5001, max: 10000 }, { rate: 0.047, min: 10001, max: Infinity }],
        married_filing_jointly: [{ rate: 0.04, min: 5001, max: 10000 }, { rate: 0.047, min: 10001, max: Infinity }],
        standardDeduction: { single: 14600, married_filing_jointly: 29200 }
    },
    MO: {
        single: [{ rate: 0.02, min: 1063, max: 2126 }, { rate: 0.025, min: 2127, max: 3189 }, { rate: 0.03, min: 3190, max: 4252 }, { rate: 0.035, min: 4253, max: 5315 }, { rate: 0.04, min: 5316, max: 6378 }, { rate: 0.045, min: 6379, max: 7441 }, { rate: 0.048, min: 7442, max: Infinity }],
        married_filing_jointly: [{ rate: 0.02, min: 1063, max: 2126 }, { rate: 0.025, min: 2127, max: 3189 }, { rate: 0.03, min: 3190, max: 4252 }, { rate: 0.035, min: 4253, max: 5315 }, { rate: 0.04, min: 5316, max: 6378 }, { rate: 0.045, min: 6379, max: 7441 }, { rate: 0.048, min: 7442, max: Infinity }],
        standardDeduction: { single: 14600, married_filing_jointly: 29200 }
    },
    MT: {
        single: [{ rate: 0.047, min: 0, max: 22000 }, { rate: 0.059, min: 22001, max: Infinity }],
        married_filing_jointly: [{ rate: 0.047, min: 0, max: 22000 }, { rate: 0.059, min: 22001, max: Infinity }],
        standardDeduction: { single: 5630, married_filing_jointly: 11260 }
    },
    NE: {
        single: [{ rate: 0.0246, min: 0, max: 3400 }, { rate: 0.0351, min: 3401, max: 20430 }, { rate: 0.0501, min: 20431, max: 32980 }, { rate: 0.0664, min: 32981, max: Infinity }],
        married_filing_jointly: [{ rate: 0.0246, min: 0, max: 6800 }, { rate: 0.0351, min: 6801, max: 40860 }, { rate: 0.0501, min: 40861, max: 65950 }, { rate: 0.0664, min: 65951, max: Infinity }],
        standardDeduction: { single: 8550, married_filing_jointly: 17100 }
    },
    NJ: {
        single: [{ rate: 0.014, min: 0, max: 20000 }, { rate: 0.0175, min: 20001, max: 35000 }, { rate: 0.035, min: 35001, max: 40000 }, { rate: 0.05525, min: 40001, max: 75000 }, { rate: 0.0637, min: 75001, max: 500000 }, { rate: 0.0897, min: 500001, max: 1000000 }, { rate: 0.1075, min: 1000001, max: Infinity }],
        married_filing_jointly: [{ rate: 0.014, min: 0, max: 20000 }, { rate: 0.0175, min: 20001, max: 50000 }, { rate: 0.0245, min: 50001, max: 70000 }, { rate: 0.035, min: 70001, max: 80000 }, { rate: 0.05525, min: 80001, max: 150000 }, { rate: 0.0637, min: 150001, max: 500000 }, { rate: 0.0897, min: 500001, max: 1000000 }, { rate: 0.1075, min: 1000001, max: Infinity }],
        standardDeduction: { single: 0, married_filing_jointly: 0 } // Uses exemptions
    },
    NM: {
        single: [{ rate: 0.017, min: 0, max: 5500 }, { rate: 0.032, min: 5501, max: 11000 }, { rate: 0.047, min: 11001, max: 16000 }, { rate: 0.049, min: 16001, max: 210000 }, { rate: 0.059, min: 210001, max: Infinity }],
        married_filing_jointly: [{ rate: 0.017, min: 0, max: 8000 }, { rate: 0.032, min: 8001, max: 16000 }, { rate: 0.047, min: 16001, max: 24000 }, { rate: 0.049, min: 24001, max: 315000 }, { rate: 0.059, min: 315001, max: Infinity }],
        standardDeduction: { single: 14600, married_filing_jointly: 29200 }
    },
    NY: {
        single: [{ rate: 0.04, min: 0, max: 8500 }, { rate: 0.045, min: 8501, max: 11700 }, { rate: 0.0525, min: 11701, max: 13900 }, { rate: 0.0585, min: 13901, max: 80650 }, { rate: 0.0625, min: 80651, max: 215400 }, { rate: 0.0685, min: 215401, max: 1077550 }, { rate: 0.0965, min: 1077551, max: 5000000 }, { rate: 0.103, min: 5000001, max: 25000000 }, { rate: 0.109, min: 25000001, max: Infinity }],
        married_filing_jointly: [{ rate: 0.04, min: 0, max: 17150 }, { rate: 0.045, min: 17151, max: 23600 }, { rate: 0.0525, min: 23601, max: 27900 }, { rate: 0.0585, min: 27901, max: 161550 }, { rate: 0.0625, min: 161551, max: 323200 }, { rate: 0.0685, min: 323201, max: 2155350 }, { rate: 0.0965, min: 2155351, max: 5000000 }, { rate: 0.103, min: 5000001, max: 25000000 }, { rate: 0.109, min: 25000001, max: Infinity }],
        standardDeduction: { single: 8000, married_filing_jointly: 16050 }
    },
    NC: {
        single: [{ rate: 0.045, min: 0, max: Infinity }],
        married_filing_jointly: [{ rate: 0.045, min: 0, max: Infinity }],
        standardDeduction: { single: 13875, married_filing_jointly: 27750 }
    },
    ND: {
        single: [{ rate: 0.011, min: 0, max: 44725 }, { rate: 0.0204, min: 44726, max: 108425 }, { rate: 0.0227, min: 108426, max: 226150 }, { rate: 0.0264, min: 226151, max: 479350 }, { rate: 0.029, min: 479351, max: Infinity }],
        married_filing_jointly: [{ rate: 0.011, min: 0, max: 74750 }, { rate: 0.0204, min: 74751, max: 181350 }, { rate: 0.0227, min: 181351, max: 282700 }, { rate: 0.0264, min: 282701, max: 565350 }, { rate: 0.029, min: 565351, max: Infinity }],
        standardDeduction: { single: 14600, married_filing_jointly: 29200 }
    },
    OH: {
        single: [{ rate: 0.0275, min: 26051, max: 100000 }, { rate: 0.03688, min: 100001, max: Infinity }],
        married_filing_jointly: [{ rate: 0.0275, min: 26051, max: 100000 }, { rate: 0.03688, min: 100001, max: Infinity }],
        standardDeduction: { single: 0, married_filing_jointly: 0 } // No standard deduction
    },
    OK: {
        single: [{ rate: 0.0025, min: 0, max: 1000 }, { rate: 0.0075, min: 1001, max: 2500 }, { rate: 0.0175, min: 2501, max: 3750 }, { rate: 0.0275, min: 3751, max: 4900 }, { rate: 0.0375, min: 4901, max: 7200 }, { rate: 0.0475, min: 7201, max: Infinity }],
        married_filing_jointly: [{ rate: 0.0025, min: 0, max: 2000 }, { rate: 0.0075, min: 2001, max: 5000 }, { rate: 0.0175, min: 5001, max: 7500 }, { rate: 0.0275, min: 7501, max: 9800 }, { rate: 0.0375, min: 9801, max: 12200 }, { rate: 0.0475, min: 12201, max: Infinity }],
        standardDeduction: { single: 6350, married_filing_jointly: 12700 }
    },
    OR: {
        single: [{ rate: 0.0475, min: 0, max: 4400 }, { rate: 0.0675, min: 4401, max: 11100 }, { rate: 0.0875, min: 11101, max: 125000 }, { rate: 0.099, min: 125001, max: Infinity }],
        married_filing_jointly: [{ rate: 0.0475, min: 0, max: 8800 }, { rate: 0.0675, min: 8801, max: 22200 }, { rate: 0.0875, min: 22201, max: 250000 }, { rate: 0.099, min: 250001, max: Infinity }],
        standardDeduction: { single: 2670, married_filing_jointly: 5340 }
    },
    PA: {
        single: [{ rate: 0.0307, min: 0, max: Infinity }],
        married_filing_jointly: [{ rate: 0.0307, min: 0, max: Infinity }],
        standardDeduction: { single: 0, married_filing_jointly: 0 } // No standard deduction
    },
    RI: {
        single: [{ rate: 0.0375, min: 0, max: 73450 }, { rate: 0.0475, min: 73451, max: 166950 }, { rate: 0.0599, min: 166951, max: Infinity }],
        married_filing_jointly: [{ rate: 0.0375, min: 0, max: 73450 }, { rate: 0.0475, min: 73451, max: 166950 }, { rate: 0.0599, min: 166951, max: Infinity }],
        standardDeduction: { single: 14600, married_filing_jointly: 29200 }
    },
    SC: {
        single: [{ rate: 0.03, min: 3461, max: 17300 }, { rate: 0.064, min: 17301, max: Infinity }],
        married_filing_jointly: [{ rate: 0.03, min: 3461, max: 17300 }, { rate: 0.064, min: 17301, max: Infinity }],
        standardDeduction: { single: 14600, married_filing_jointly: 29200 }
    },
    UT: {
        single: [{ rate: 0.0465, min: 0, max: Infinity }],
        married_filing_jointly: [{ rate: 0.0465, min: 0, max: Infinity }],
        standardDeduction: { single: 0, married_filing_jointly: 0 } // Uses a tax credit instead
    },
    VT: {
        single: [{ rate: 0.0335, min: 0, max: 45650 }, { rate: 0.066, min: 45651, max: 99400 }, { rate: 0.076, min: 99401, max: 207700 }, { rate: 0.0875, min: 207701, max: Infinity }],
        married_filing_jointly: [{ rate: 0.0335, min: 0, max: 76200 }, { rate: 0.066, min: 76201, max: 165900 }, { rate: 0.076, min: 165901, max: 252750 }, { rate: 0.0875, min: 252751, max: Infinity }],
        standardDeduction: { single: 14600, married_filing_jointly: 29200 }
    },
    VA: {
        single: [{ rate: 0.02, min: 0, max: 3000 }, { rate: 0.03, min: 3001, max: 5000 }, { rate: 0.05, min: 5001, max: 17000 }, { rate: 0.0575, min: 17001, max: Infinity }],
        married_filing_jointly: [{ rate: 0.02, min: 0, max: 3000 }, { rate: 0.03, min: 3001, max: 5000 }, { rate: 0.05, min: 5001, max: 17000 }, { rate: 0.0575, min: 17001, max: Infinity }],
        standardDeduction: { single: 8000, married_filing_jointly: 16000 }
    },
    WV: {
        single: [{ rate: 0.0236, min: 0, max: 10000 }, { rate: 0.0315, min: 10001, max: 25000 }, { rate: 0.0354, min: 25001, max: 40000 }, { rate: 0.0472, min: 40001, max: 60000 }, { rate: 0.0512, min: 60001, max: Infinity }],
        married_filing_jointly: [{ rate: 0.0236, min: 0, max: 10000 }, { rate: 0.0315, min: 10001, max: 25000 }, { rate: 0.0354, min: 25001, max: 40000 }, { rate: 0.0472, min: 40001, max: 60000 }, { rate: 0.0512, min: 60001, max: Infinity }],
        standardDeduction: { single: 14600, married_filing_jointly: 29200 }
    },
    WI: {
        single: [{ rate: 0.0354, min: 0, max: 14320 }, { rate: 0.0465, min: 14321, max: 28640 }, { rate: 0.053, min: 28641, max: 315570 }, { rate: 0.0765, min: 315571, max: Infinity }],
        married_filing_jointly: [{ rate: 0.0354, min: 0, max: 19090 }, { rate: 0.0465, min: 19091, max: 38190 }, { rate: 0.053, min: 38191, max: 420750 }, { rate: 0.0765, min: 420751, max: Infinity }],
        standardDeduction: { single: 14460, married_filing_jointly: 26800 }
    },
};


// Social Security Constants
export const SS_FULL_RETIREMENT_AGE = 67; // Simplified for this model
// 2024 Bend Points for AIME calculation
export const SS_BEND_POINTS = {
    first: 1174,
    second: 7078,
};
export const SS_BEND_FACTORS = {
    first: 0.90,
    second: 0.32,
    third: 0.15,
};

// Simplified table for benefit adjustment based on claiming age
export const SS_AGE_ADJUSTMENT_FACTORS: { [age: number]: number } = {
    62: 0.70,
    63: 0.75,
    64: 0.80,
    65: 0.867,
    66: 0.933,
    67: 1.00, // Full Retirement Age
    68: 1.08,
    69: 1.16,
    70: 1.24,
};

// RMD Constants
export const RMD_START_AGE = 73;
export const RMD_UNIFORM_LIFETIME_TABLE: { [age: number]: number } = {
    73: 26.5, 74: 25.5, 75: 24.6, 76: 23.7, 77: 22.9, 78: 22.0, 79: 21.1,
    80: 20.2, 81: 19.4, 82: 18.5, 83: 17.7, 84: 16.8, 85: 16.0, 86: 15.2,
    87: 14.4, 88: 13.7, 89: 12.9, 90: 12.2, 91: 11.5, 92: 10.8, 93: 10.1,
    94: 9.5, 95: 8.9, 96: 8.4, 97: 7.8, 98: 7.3, 99: 6.8, 100: 6.4,
    101: 6.0, 102: 5.6, 103: 5.2, 104: 4.9, 105: 4.6, 106: 4.3, 107: 4.1,
    108: 3.9, 109: 3.7, 110: 3.5, 111: 3.4, 112: 3.3, 113: 3.1, 114: 3.0,
    115: 2.9, 116: 2.8, 117: 2.7, 118: 2.5, 119: 2.3, 120: 2.0
};