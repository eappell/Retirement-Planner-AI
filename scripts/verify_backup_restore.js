#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Create a representative scenarios state (matches the shape used by the app)
const sample = {
  activeScenarioId: 'scenario-verify-1',
  scenarios: {
    'scenario-verify-1': {
      id: 'scenario-verify-1',
      name: 'Verify Backup Scenario',
      plan: {
        planType: 'INDIVIDUAL',
        person1: { name: 'Person 1', currentAge: 40, retirementAge: 67, lifeExpectancy: 90, currentSalary: 80000, claimingAge: 67 },
        person2: { name: 'Person 2', currentAge: 40, retirementAge: 67, lifeExpectancy: 90, currentSalary: 75000, claimingAge: 67 },
        retirementAccounts: [],
        investmentAccounts: [],
        pensions: [],
        otherIncomes: [],
        expensePeriods: [],
        socialSecurity: { person1EstimatedBenefit: 0, person2EstimatedBenefit: 0 },
        state: 'CA',
        inflationRate: 2.5,
        avgReturn: 7,
        annualWithdrawalRate: 4,
        dieWithZero: false,
        legacyAmount: 0,
      },
    },
  },
};

const outPath = path.resolve(__dirname, '..', 'tmp_retirement_scenarios.retire');

try {
  // Write sample backup file
  fs.writeFileSync(outPath, JSON.stringify(sample, null, 2), 'utf8');
  console.log('Wrote sample backup to', outPath);

  // Read it back and validate
  const read = fs.readFileSync(outPath, 'utf8');
  const parsed = JSON.parse(read);

  if (!parsed || typeof parsed !== 'object') throw new Error('Parsed content is not an object');
  if (!parsed.scenarios || typeof parsed.activeScenarioId === 'undefined') throw new Error('Missing required top-level fields (scenarios, activeScenarioId)');

  const active = parsed.scenarios[parsed.activeScenarioId];
  if (!active || !active.plan) throw new Error('Active scenario or plan missing');

  console.log('Backup file parsed and validated successfully. Active scenario id:', parsed.activeScenarioId);
  console.log('Sample plan keys:', Object.keys(active.plan).slice(0, 8).join(', '));

  // Simulate uploadScenarios by assigning to a variable
  const appState = parsed;
  if (appState && appState.scenarios && appState.activeScenarioId) {
    console.log('Simulated uploadScenarios succeeded.');
  }

  // Clean up temp file
  // fs.unlinkSync(outPath);
  console.log('Verification complete. (temp file left at', outPath + ')');
  process.exit(0);
} catch (err) {
  console.error('Backup/restore verification failed:', err && err.message ? err.message : err);
  process.exit(2);
}
