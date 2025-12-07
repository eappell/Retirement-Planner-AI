import React, { useState } from 'react';

interface UserManualModalProps {
    isOpen: boolean;
    onClose: () => void;
    openDisclaimer?: () => void;
}

const manualContent = [
    {
        id: 'keyIndicators',
        title: 'Key Indicators',
        icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
        content: (
            <>
                <p>This panel shows the high-level results of your retirement projection. All values are automatically updated as you change your plan.</p>
                <ul>
                    <li><strong>Tax Rates:</strong> Your average effective federal and state tax rates during retirement.</li>
                    <li><strong>Timing:</strong> Most model events (contributions, withdrawals, income payments) are applied on an annual basis at a deterministic point in the year rather than continuously.</li>
                    <li><strong>Survivor handling:</strong> If you enable plan-level options that allow deceased spouse balances to fund survivor income, the planner models a simplified transfer of account ownership so the survivor can access balances; this is a practical approximation and may not reflect the exact legal/tax treatment in all cases.</li>
                </ul>
                <p className="mt-3 p-2 bg-indigo-50 border-l-4 border-indigo-400 rounded-r-md"><strong>Note:</strong> These assumptions are intended to make the tool practical for high-level planning. They trade some realism and regulatory detail for clarity and speed—consult a qualified professional for decisions that require precise tax, legal, or actuarial treatment.</p>
            </>
        )
    },
    {
        id: 'planInfo',
        title: 'Plan Information',
        icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
        content: (
             <>
                <p>Set the basic assumptions for your plan here.</p>
                <ul>
                    <li><strong>Plan For:</strong> Choose 'Individual' or 'Couple' to tailor the planner.</li>
                    <li><strong>Die with Zero:</strong> Enable this to calculate the maximum you can spend to end with a target amount (e.g., $0), overriding the fixed withdrawal rate.</li>
                    <li><strong>State of Residence:</strong> This is crucial for accurate state income tax calculations.</li>
                    <li><strong>Inflation & Withdrawal Rate:</strong> These are powerful tools for scenario planning.</li>
                </ul>
                <p className="mt-3 p-2 bg-indigo-50 border-l-4 border-indigo-400 rounded-r-md"><strong>Tip:</strong> Test a higher inflation rate (e.g., 3.5%) or a lower withdrawal rate (e.g., 3.5%) to see how it stress-tests your plan's resilience.</p>
            </>
        )
    },
    {
        id: 'peopleSS',
        title: 'People & Social Security',
        icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
        content: (
            <>
                <p>Enter details for each person in the plan. The Social Security estimator provides a rough monthly benefit based on your current salary and when you choose to start taking benefits.</p>
                <p className="mt-3 p-2 bg-indigo-50 border-l-4 border-indigo-400 rounded-r-md"><strong>Tip:</strong> Claiming Social Security at age 70 provides the maximum possible monthly benefit. Try changing the claiming age from 62 to 70 to see how significantly it can impact your retirement income.</p>
            </>
        )
    },
    {
        id: 'accounts',
        title: 'Accounts',
        icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z" /></svg>,
        content: (
            <>
                <p>Manage your investment and retirement accounts in the tabbed Accounts section.</p>
                <h4 className="font-semibold mt-2">Quick steps</h4>
                <ol className="list-decimal list-inside ml-4">
                    <li>Select the tab for the account type (Retirement / Investment / HSA).</li>
                    <li>Click the <strong>+ Add</strong> button to create a new account — the primary input will be focused for immediate editing.</li>
                    <li>Fill in `Name`, `Owner`, `Balance`, and `Annual Contribution`. For employer plans, add `Match` if applicable.</li>
                    <li>Repeat for each account. Use the action icons to duplicate or remove accounts.</li>
                </ol>
                <div className="mt-3">
                    <h5 className="font-semibold">Bulk update behavior</h5>
                    <p>The header-level <strong>Update All Scenarios</strong> button copies the active tab's account list to other scenarios while preserving HSAs or non-HSA accounts as appropriate. This avoids accidentally overwriting unrelated account types.</p>
                    <div className="mt-2">
                        <img src="/manual-screens/accounts.png" alt="Accounts Tab" className="w-full max-h-36 object-contain border rounded" />
                    </div>
                    <div className="mt-2">
                        <h5 className="font-medium text-sm mt-2">Investment Accounts (example)</h5>
                        <img src="/manual-screens/investments.png" alt="Investment Accounts" className="w-full max-h-24 object-contain border rounded mt-1" />
                    </div>
                </div>
                <p className="mt-3 p-2 bg-indigo-50 border-l-4 border-indigo-400 rounded-r-md"><strong>Tip:</strong> Keep HSAs separated from other retirement accounts to maintain correct tax treatment in projections.</p>
            </>
        )
    },
    {
        id: 'income',
        title: 'Income',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 2c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2-3-.895-3-2" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 10c0 2.21 3.582 4 8 4s8-1.79 8-4-3.582-4-8-4-8 1.79-8 4z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 14c0 1.105 2.239 2 5 2s5-.895 5-2" />
            </svg>
        ),
        content: (
            <>
                <p>The Income section is tabbed so you can manage different income types separately.</p>
                <h4 className="font-semibold mt-2">Pensions (Step-by-step)</h4>
                <ol className="list-decimal list-inside ml-4">
                    <li>Open the <strong>Pensions</strong> tab.</li>
                    <li>Click <strong>+ Add Pension</strong> and provide a name and owner.</li>
                    <li>Choose <em>Monthly</em> or <em>Lump</em> payout and enter the amount.</li>
                    <li>Set <em>Start Age</em>, <em>COLA</em>, and <em>Survivor %</em> (if applicable).</li>
                </ol>
                <div className="mt-2">
                    <img src="/manual-screens/pensions.png" alt="Pensions" className="w-full max-h-36 object-contain border rounded" />
                </div>

                <h4 className="font-semibold mt-3">Annuities & Other</h4>
                <p>Use the <strong>Annuities</strong> and <strong>Other Incomes</strong> tabs for purchased income products and irregular or rental income. Each item supports start/end ages and COLA.</p>

                <div className="mt-2">
                    <img src="/manual-screens/annuities.png" alt="Annuities" className="w-full max-h-36 object-contain border rounded" />
                </div>

                <p className="mt-3 p-2 bg-indigo-50 border-l-4 border-indigo-400 rounded-r-md"><strong>Tip:</strong> Use the header-level <strong>Update All Scenarios</strong> to copy only the active income tab to other scenarios.</p>
            </>
        )
    },
    {
        id: 'expenses',
        title: 'Expenses',
        icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h18v4H3zM5 11h14v10H5z"/></svg>,
        content: (
            <>
                <p>Model your spending across different phases of retirement using Expense Periods.</p>
                <ul>
                    <li><strong>Expense Periods:</strong> Create multiple periods to represent varying spending (for example: Go-Go, Slow-Go, No-Go).</li>
                    <li><strong>Start/End Ages:</strong> Assign start and end ages for each period; the planner will apply the monthly expenses during those ages.</li>
                </ul>
                <p className="mt-3 p-2 bg-indigo-50 border-l-4 border-indigo-400 rounded-r-md"><strong>Tip:</strong> Stagger expense periods to reflect lifestyle changes (higher spending early in retirement, lower later).</p>
                <div className="mt-3">
                    <img src="/manual-screens/expenseperiods.png" alt="Expense Periods" className="w-full max-h-36 object-contain border rounded" />
                </div>
            </>
        )
    },
    {
        id: 'gifts',
        title: 'Gifts & Legacy',
        icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12v7a2 2 0 01-2 2H6a2 2 0 01-2-2v-7"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 12V3"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h10"/></svg>,
        content: (
            <>
                <p>The <strong>Gifts</strong> section lets you plan one-time or recurring annual gifts to beneficiaries. Gifts are treated as cash outflows and will reduce your account balances in the year they occur.</p>
                <ul>
                    <li><strong>Owner:</strong> Choose who will be making the gift (Person 1 or Person 2). The owner's age is used to schedule the gift.</li>
                    <li><strong>Beneficiary:</strong> A short description or name for who receives the gift.</li>
                    <li><strong>One-time gift:</strong> Enter an <em>Amount</em> and the <em>Age</em> (owner's age) when the gift will be given.</li>
                    <li><strong>Annual gift:</strong> Enter the <em>Amount</em> and the <em>Start</em> and <em>End</em> ages (owner's ages) for the recurring payments.
                        The planner will deduct the specified annual amount in each year the owner's age falls between Start and End, inclusive.</li>
                    <li><strong>Impact on Legacy:</strong> Gifts reduce your assets and therefore can affect the final legacy/leave-behind amount when using "Die with Zero". The planner reserves legacy amounts first and then computes spendable assets; large gifts may reduce available spending.</li>
                </ul>
                <p className="mt-3 p-2 bg-indigo-50 border-l-4 border-indigo-400 rounded-r-md"><strong>Tip:</strong> Use one-time gifts for planned bequests (e.g., a child's wedding) and annual gifts for ongoing support (e.g., college tuition or annual donations). Review the Projection table to see yearly gift outflows when any gifts are present.</p>
            </>
        )
    },
     {
        id: 'aiInsights',
        title: 'AI Powered Insights',
        icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>,
        content: (
            <>
                <p>After the planner runs a calculation, click the "Generate AI Insights" button. The AI assistant will analyze your complete financial picture and provide a simple overview and three actionable, personalized tips to help you improve your plan.</p>
                <p className="mt-3 p-2 bg-indigo-50 border-l-4 border-indigo-400 rounded-r-md"><strong>Tip:</strong> After making significant changes to your plan, generate a new insight report to get fresh, relevant advice based on your updated situation.</p>
            </>
        )
    },
    {
        id: 'scenarioManager',
        title: 'Scenario Manager',
        icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" /></svg>,
        content: (
            <>
                <p>The Scenario Manager (top header) helps you create, copy, rename, and delete scenarios for side-by-side comparisons.</p>
                <h4 className="font-semibold mt-2">Common tasks</h4>
                <ol className="list-decimal list-inside ml-4">
                    <li><strong>New:</strong> Start a fresh scenario with defaults.</li>
                    <li><strong>Copy:</strong> Duplicate the current scenario to experiment safely.</li>
                    <li><strong>Rename:</strong> Click the scenario name to edit it.</li>
                    <li><strong>Delete:</strong> Remove a scenario (disabled if it's the last one).</li>
                </ol>
                <div className="mt-3">
                    <h5 className="font-semibold">Backup & Restore</h5>
                    <p>Download all scenarios to a <code>retirement_scenarios.retire</code> file or upload a file to restore. Uploading replaces all in-browser scenarios.</p>
                    <div className="mt-2">
                        <img src="/manual-screens/scenariomanager.png" alt="Scenario Manager" className="w-full max-h-28 object-contain border rounded" />
                    </div>
                </div>
                <p className="mt-3 p-2 bg-yellow-50 border-l-4 border-yellow-400 rounded-r-md"><strong>Important:</strong> Scenarios are stored in browser local storage — export frequently if you depend on them.</p>
            </>
        )
    },
    {
        id: 'tabsAccessibility',
        title: 'Tabs & Accessibility',
        icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/></svg>,
        content: (
            <>
                <p>The application groups related inputs into tabbed panels. These follow common ARIA patterns and support keyboard navigation.</p>
                <ul>
                    <li><strong>Arrow Keys:</strong> Use <code>Left</code> and <code>Right</code> to move between tabs in a tablist.</li>
                    <li><strong>Home / End:</strong> Press <code>Home</code> to jump to the first tab and <code>End</code> to jump to the last tab.</li>
                    <li><strong>Focus After Add:</strong> When you click the per-tab <strong>+ Add</strong> button the UI will create a typed item and move focus into the primary input so you can begin typing immediately.</li>
                    <li><strong>Screen Readers:</strong> Tabs expose <code>role="tablist"</code>, each tab uses <code>role="tab"</code>, and panels use <code>role="tabpanel"</code> with <code>aria-controls</code>/<code>aria-labelledby</code> to connect tabs to panels.</li>
                </ul>
                <p className="mt-3 p-2 bg-indigo-50 border-l-4 border-indigo-400 rounded-r-md"><strong>Tip:</strong> Focused tab buttons receive visible focus and the active tab has <code>aria-selected="true"</code> for assistive tech compatibility.</p>
            </>
        )
    }
    ,
    {
        id: 'adsenseSetup',
        title: 'AdSense Setup Guide',
        icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
        content: (
            <>
                <p>Use this guide when you are ready to add Google AdSense ads to your live application.</p>
                
                <h4 className="font-bold mt-4 mb-2">1. Sign Up & Approval</h4>
                <ul className="list-disc list-inside ml-2 space-y-1">
                    <li>Go to Google AdSense and sign up.</li>
                    <li>Add your site (must be a live domain like <code>www.myapp.com</code>, not localhost).</li>
                    <li>Wait for approval (can take a few days).</li>
                </ul>

                <h4 className="font-bold mt-4 mb-2">2. Add Global Script</h4>
                <p>Once approved, get the script code from AdSense and paste it into the <code>&lt;head&gt;</code> of your <code>index.html</code> file:</p>
                <pre className="bg-gray-100 p-2 rounded text-xs mt-2 overflow-x-auto">
{`<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-YOUR_ID" crossorigin="anonymous"></script>`}
                </pre>

                <h4 className="font-bold mt-4 mb-2">3. Create Ad Unit</h4>
                <ul className="list-disc list-inside ml-2 space-y-1">
                    <li>In AdSense, go to <strong>Ads &gt; By ad unit</strong>.</li>
                    <li>Create a new "Display ad" (Vertical or Square).</li>
                    <li>Copy the <code>data-ad-client</code> and <code>data-ad-slot</code> numbers.</li>
                </ul>

                <h4 className="font-bold mt-4 mb-2">4. React Implementation</h4>
                <p>In <code>App.tsx</code>, use the following pattern to display the ad. Do not just paste the script tag directly.</p>
                <pre className="bg-gray-100 p-2 rounded text-xs mt-2 overflow-x-auto">
{`// Inside App.tsx component:
useEffect(() => {
  try {
    (window.adsbygoogle = window.adsbygoogle || []).push({});
  } catch (e) { console.error(e); }
}, []);

// Inside your JSX layout where you want the ad:
<ins className="adsbygoogle"
     style={{ display: 'block' }}
     data-ad-client="ca-pub-YOUR_CLIENT_ID"
     data-ad-slot="YOUR_SLOT_ID"
     data-ad-format="auto"
     data-full-width-responsive="true">
</ins>`}
                </pre>
            </>
        )
    }
];

export const UserManualModal: React.FC<UserManualModalProps> = ({ isOpen, onClose, openDisclaimer }) => {
    const [activeTopicId, setActiveTopicId] = useState(manualContent[0].id);
    
    if (!isOpen) return null;

    const activeTopic = manualContent.find(topic => topic.id === activeTopicId);

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4 transition-opacity duration-300"
            onClick={onClose}
        >
            <div 
                className={`bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[640px] overflow-hidden flex flex-col transition-transform duration-300 user-manual-modal ${isOpen ? 'open' : ''}`}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex-shrink-0 flex justify-between items-center p-4 border-b bg-gray-50">
                    <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-brand-secondary">User Manual</h2>
                    <button 
                        onClick={onClose} 
                        className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-200"
                        aria-label="Close user manual"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                {/* Body */}
                <div className="flex-grow flex overflow-hidden">
                    {/* Left Navigation */}
                    <nav className="w-1/3 flex-shrink-0 border-r bg-gray-50 p-4 overflow-y-auto user-manual-nav">
                        <ul className="space-y-2">
                            {manualContent.map(topic => (
                                <li key={topic.id}>
                                    <button
                                        onClick={() => setActiveTopicId(topic.id)}
                                        className={`w-full text-left p-3 rounded-md transition-colors text-sm font-medium flex items-center space-x-3 ${
                                            activeTopicId === topic.id 
                                            ? 'bg-indigo-100 text-indigo-700' 
                                            : 'text-gray-600 hover:bg-gray-200'
                                        }`}
                                    >
                                        <span className="flex-shrink-0 w-5 h-5">{topic.icon}</span>
                                        <span>{topic.title}</span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </nav>

                    {/* Right Content */}
                    <div className="w-2/3 p-6 lg:p-8 overflow-y-auto">
                        {activeTopic && (
                             <div className="flex items-start space-x-4">
                                <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                                    {activeTopic.icon}
                                </div>
                                <div>
                                    <h3 className="text-xl font-semibold text-brand-text-primary mb-2">{activeTopic.title}</h3>
                                    <div className="prose max-w-none text-brand-text-secondary">{activeTopic.content}</div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                {/* Footer: quick links */}
                <div className="flex-shrink-0 border-t bg-gray-50 p-4 flex justify-end space-x-2">
                    <button
                        onClick={() => {
                            // Close manual and open disclaimer (if provided)
                            onClose();
                            if (openDisclaimer) openDisclaimer();
                        }}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                    >
                        View Disclaimer
                    </button>
                </div>
            </div>
        </div>
    );
};