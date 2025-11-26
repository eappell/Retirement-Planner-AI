# Retirement Planner AI — User Manual

This manual documents the user-facing features and sections of the Retirement Planner AI web application. It is intended to help new and returning users understand how to build scenarios, run projections, and interpret results.

---

## Quick Start

- Open the app at `http://localhost:5173/` (or your deployed URL).
- Create or select a scenario using the **Scenarios** control in the top header.
- Start in **Plan Information** to set the high-level assumptions: `Individual` vs `Couple`, state of residence, inflation, average return, and withdrawal targets.
- Add people, accounts, income, and expenses using the tabbed sections. Changes are applied live and indicators update automatically.
- Use **Run Projection** or the Monte Carlo controls (if available) to compute stochastic projections.
- Use **AI Powered Insights** for high-level, personalized advice based on your plan.

---

## Contents

- Plan Information
- People & Social Security
- Accounts
- Income (Pensions, Annuities, Other)
- Expenses (Expense Periods & One-Time)
- Estate Planning (Gifts & Legacy)
- Scenario Manager (Create / Copy / Backup / Restore)
- Projections & Monte Carlo Simulation
- Charts & Analysis
- Print & Export
- Settings & Theme
- Accessibility
- Troubleshooting and FAQ
- Developer Notes (data model, services)

---

## Plan Information

Location: first Input section in the left column.

What it contains:
- `Plan For`: choose `Individual` or `Couple`.
- `Die with Zero`: calculates the maximum sustainable withdrawals to end with a target legacy (for example $0). When enabled, fixed withdrawal-rate settings are ignored and projections compute the maximum spending path consistent with the target legacy.
- `State of Residence`: used for simplified state income tax calculations.
- `Inflation`, `Avg Return`, `Withdrawal Rate`: key knobs that affect the entire projection.
- Market assumptions and advanced options (fat-tail sampling) can be configured here or saved as defaults.

Tips:
- Small changes to inflation and withdrawal rate can produce large differences in projected longevity of savings; experiment with several scenarios.

---

## People & Social Security

Location: `People & Social Security` section.

Key features:
- Add Person 1 and Person 2 (for couples). Provide `Name`, `Current Age`, `Retirement Age`, `Life Expectancy`, and `Current Salary`.
- `Claiming Age` for Social Security — adjust to see how earlier vs later claiming changes monthly benefits.
- The Social Security estimator provides a rough monthly benefit estimate based on current salary and claiming age.

Tip: Change claiming age from 62 to 70 to see the maximum benefit effect.

---

## Accounts

Tabbed view: Retirement Accounts / Investment Accounts / HSAs

Retirement Accounts:
- Add 401(k), 403(b), IRA, Roth IRA, HSA (treated specially), or Other.
- Inputs: `Name`, `Owner`, `Balance`, `Annual Contribution`, `Match` (for employer-sponsored accounts), `Type`.

Investment Accounts:
- Taxable brokerage and other investment accounts. Track contributions and percent allocations.

HSAs:
- HSAs are modeled as part of retirement accounts (type `HSA`) and kept in a separate tab for clarity.

Bulk updates:
- The header includes an **Update All Scenarios** button (visible when you have multiple scenarios) that copies the active tab's account list to other scenarios in a targeted manner (preserving HSA vs non-HSA distinctions when appropriate).

Tip: Use per-tab Add buttons to create items and the UI will focus the primary input for quick editing.

<!-- Accounts screenshot -->
<p>
  <img src="/manual-screens/accounts.png" alt="Accounts tab screenshot" style="max-width:100%;height:auto;border:1px solid #e5e7eb;border-radius:6px;" />
</p>

---

## Income

Tabbed view: Pensions / Annuities / Other Incomes

Pensions:
- Add employer pensions and defined-benefit plans.
- Inputs: `Owner`, `Name`, `Payout` (monthly or lump), `Monthly Benefit` or `Lump Sum`, `Start Age`, `COLA`, `Survivor %` and `Taxable` flag.
- Survivor %: percentage of the pension that continues to the spouse after an owner dies. There are plan-level options to use deceased spouse balances to fund survivor income (practical simplification).

Annuities:
- Add annuity contracts: start age, end age, payment frequency and amount, COLA, and taxable flag.

Other Incomes:
- Recurring incomes like rental, part-time work: monthly amount, start/end ages, COLA.

Bulk updates:
- `Update All Scenarios` in the income header copies only the active income tab (pensions, annuities, or other incomes) to the other scenarios.

Tip: Keep pension survivor percentages compact and on a single row for easier editing.

<!-- Pensions screenshot -->
<p>
  <img src="/manual-screens/pensions.png" alt="Pensions tab screenshot" style="max-width:100%;height:auto;border:1px solid #e5e7eb;border-radius:6px;" />
</p>

---

## Expenses

Features:
- Expense Periods: model recurring spending phases (Start Age, End Age, Monthly Amount). Use to model changing spending patterns across retirement (e.g., travel in early years).
- One-Time Expenses: ad hoc large items scheduled for a given age.

Bulk updates:
- A header-level Update All Scenarios button allows copying expense periods or one-time expenses to other scenarios.

Tip: Add descriptive names and stagger periods to accurately reflect lifestyle shifts.

---

## Estate Planning — Gifts & Legacy

Gifts:
- One-time or annual gifts to beneficiaries. Specify owner, beneficiary description, amounts and ages.

Legacy / Leave-Behind:
- `Leave Behind` is the target legacy amount that is reserved before computing discretionary spending when `Die with Zero` is enabled.

Backup & Restore:
- The Scenario Manager includes Download and Upload scenario functions:
  - Downloaded file: `retirement_scenarios.retire` (contains all scenarios and plan data).
  - Uploading a scenarios file will overwrite all current scenarios.

Warning: Always keep backups. Upload will overwrite current browser-local data and cannot be undone.

---

## Scenario Manager

Access: top header `Scenarios` control

Capabilities:
- Create a new scenario (blank with defaults).
- Copy the current scenario (useful for branching experiments).
- Delete (cannot delete the last remaining scenario).
- Rename scenarios.
- Back up and restore all scenarios to/from a file.

Storage:
- Scenarios are stored in browser `localStorage`. Clearing browser data will remove scenarios unless you export them.

Tip: Keep a periodically updated backup file if you rely on multiple scenarios.

<!-- Scenario Manager screenshot -->
<p>
  <img src="/manual-screens/scenariomanager.png" alt="Scenario Manager screenshot" style="max-width:100%;height:auto;border:1px solid #e5e7eb;border-radius:6px;" />
</p>

---

## Projections & Monte Carlo Simulation

The planner supports deterministic (single-run) projections and Monte Carlo simulations.

How it works:
- Deterministic projection uses your inputs and average return assumptions to produce year-by-year cashflow and balances.
- Monte Carlo simulation runs many stochastic scenarios using specified return volatility and optionally a fat-tail model. It uses a web worker for background simulation to keep the UI responsive.

Controls & outputs:
- Number of simulations, volatility, and fat-tail toggle (if present) are available in the Monte Carlo settings.
- Results include distributions of final net worth, median and percentile incomes, and survival probabilities.

Tip: Use at least several hundred simulations for reliable percentile estimates; Monte Carlo runs longer with thousands but will take more time.

---

## Charts & Analysis

Includes:
- Dynamic charts showing spending, balances, and net income over time.
- Annual projection table with a year-by-year break down of income, expenses, taxes, and balances.
- AI-generated insights summarize results and provide three actionable recommendations.

Tip: Use charts to visually compare scenarios; the printable report collects commonly reviewed charts and the annual projection table.

---

## Print & Export

- Use the `Print` button in the top header to generate a printable report of charts and the annual projection table.
- Export / Import scenarios as described in Scenario Manager for backup and sharing.

---

## Settings & App Preferences

- Theme Toggle: switch light/dark modes from the header.
- App Settings: save market assumptions as defaults for new scenarios.
- Disclaimer: legal and methodological notes are available in the Disclaimer modal.

---

## Accessibility & Keyboard Shortcuts

- Tabs support keyboard navigation: `Left`/`Right` arrows to move between tabs; `Home`/`End` to go to first/last tab.
- Buttons and inputs receive focus in logical order; focus moves to primary inputs after adding new items.
- ARIA attributes are present on tablists, tabs and panels to improve screen reader compatibility.

---

## Troubleshooting & FAQ

Q: My scenario disappeared — how do I recover?
A: If you previously downloaded a `.retire` backup file, use Scenario Manager &gt; Upload Scenarios to restore. If not, browser local storage may have been cleared and the data may be lost.

Q: The Monte Carlo simulation is slow. What can I do?
A: Reduce the number of simulations or toggle off fat-tail sampling. Large simulation counts (10k+) will take noticeably longer. The app runs simulations in a web worker to avoid freezing the UI.

Q: Tax calculations look incorrect.
A: Taxation is an approximation. If you need precise tax calculations consult a tax professional or export data for detailed tax software.

---

## Developer Notes (Short)

- Data model: primary types are in `types.ts` (e.g., `RetirementPlan`, `Pension`, `Annuity`, `MonteCarloResult`).
- Simulation worker: `workers/monteCarloWorker.ts` runs Monte Carlo trials and posts progress events.
- Services: `services/monteCarloService.ts`, `services/simulationService.ts`, `services/socialSecurityService.ts` encapsulate domain logic.
- Scenario management: `hooks/useScenarioManagement.ts` and `services/exportImport.ts` handle update semantics, including `__perScenario` partial maps for targeted multi-scenario updates.

---

## Glossary

- Monte Carlo: stochastic simulation technique using repeated random sampling.
- COLA: Cost-Of-Living Adjustment, annual percentage increase to income streams.
- Die with Zero: a mode that computes the maximum sustainable withdrawals to meet a legacy target.
- Fat-tail: sampling method that gives greater weight to extreme market moves for stress testing.

---

## Contact & Contribution

This repository is maintained at https://github.com/eappell/Retirement-Planner-AI. Issues and pull requests are welcome. For quick support, open an issue describing the behavior and attach a minimal repro or a scenarios backup file if relevant.


*End of User Manual (draft).*