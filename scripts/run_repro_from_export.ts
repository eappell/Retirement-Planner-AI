import fs from 'fs';
import path from 'path';
import { runSimulation } from '../services/simulationService';
import { RetirementPlan } from '../types';

const file = path.resolve(process.cwd(), 'retirementPlannerScenarios.json');
const raw = fs.readFileSync(file, 'utf8');
const full = JSON.parse(raw);
const activeId: string = full.activeScenarioId;
if (!activeId) {
  console.error('No activeScenarioId in export');
  process.exit(2);
}
const scenario = full.scenarios[activeId];
if (!scenario) {
  console.error('Active scenario not found in export');
  process.exit(2);
}
const plan: RetirementPlan = scenario.plan as RetirementPlan;
console.log('Running simulation for scenario:', scenario.name || activeId);
const res = runSimulation(plan as any);
const years = res.yearlyProjections;

// Find any years where grossIncome === 0 but assets > 1000000 (1M) and at least one spouse alive
const problems = years.filter(y => (y.grossIncome === 0 || y.grossIncome === null) && (y.netWorth || 0) > 1000000 && ((y.age2 || 0) === 0 || (y.age1 || 0) === 0 ? true : true));

const report = {
  scenarioId: activeId,
  scenarioName: scenario.name,
  totalYears: years.length,
  first10: years.slice(0, 12),
  problems: problems
};

const outFile = path.resolve(process.cwd(), 'scripts', 'repro_report.json');
fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
console.log('Wrote', outFile, '— problems found:', problems.length);
if (problems.length > 0) process.exitCode = 1;
else process.exitCode = 0;
