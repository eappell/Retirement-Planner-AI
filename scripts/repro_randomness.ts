import fs from 'fs';
import path from 'path';
import { runSimulation } from '../services/simulationService';

(async () => {
  const scenariosFile = path.resolve(process.cwd(), 'retirementPlannerScenarios.json');
  const json = JSON.parse(fs.readFileSync(scenariosFile, 'utf-8'));
  const scenario = json.scenarios[json.activeScenarioId].plan;

  console.log('Running runSimulation 5 times for scenario', json.activeScenarioId);
  for (let i = 0; i < 5; i++) {
    const res = runSimulation(scenario as any);
    console.log(`Run ${i + 1}: netWorthAtEndFuture=${res.netWorthAtEndFuture}, avgMonthlyNetIncomeFuture=${res.avgMonthlyNetIncomeFuture.toFixed(2)}, federalTaxRate=${res.federalTaxRate.toFixed(3)}%, stateTaxRate=${res.stateTaxRate.toFixed(3)}%`);
  }
})();