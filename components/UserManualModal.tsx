import React, { useState } from 'react';

interface UserManualModalProps {
    isOpen: boolean;
    onClose: () => void;
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
                    <li><strong>Avg. Monthly Net Income:</strong> Your estimated after-tax monthly income in retirement, shown in today's dollars to reflect purchasing power.</li>
                    <li><strong>Final Net Worth (Today's $):</strong> The projected value of all your assets at the end of the plan, also in today's dollars.</li>
                    <li><strong>Tax Rates:</strong> Your average effective federal and state tax rates during retirement.</li>
                </ul>
                <p className="mt-3 p-2 bg-indigo-50 border-l-4 border-indigo-400 rounded-r-md"><strong>Tip:</strong> After you make any change to your plan, glance up at these indicators to see the immediate impact on your retirement outlook!</p>
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
        title: 'Accounts, Incomes & Expenses',
        icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm-5-5a2 2 0 114 0 2 2 0 01-4 0z" /></svg>,
        content: (
             <>
                <p>This is where you build the detailed picture of your finances. Use the <strong>+</strong> and <strong>🗑️</strong> icons to add or remove items in each list.</p>
                <ul>
                    <li><strong>Retirement Accounts:</strong> Includes 401(k)s, IRAs, etc. 'Match %' is the employer match based on your salary.</li>
                     <li><strong>Investment Accounts:</strong> Taxable brokerage accounts.</li>
                    <li><strong>Pensions & Other Income:</strong> Add any regular income streams you expect in retirement. COLA is the Cost-of-Living Adjustment.</li>
                    <li><strong>Expenses:</strong> Plan your spending throughout retirement.</li>
                </ul>
                <p className="mt-3 p-2 bg-indigo-50 border-l-4 border-indigo-400 rounded-r-md"><strong>Tip:</strong> Use multiple expense periods to model the "Go-Go" (active), "Slow-Go" (less active), and "No-Go" (late-stage) years of retirement with different spending levels.</p>
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
                <p>The Scenario Manager allows you to create and compare different retirement plans. You can access it via the "Scenarios" button in the top header.</p>
                <ul>
                    <li><strong>Current Scenario:</strong> Use the dropdown to switch between your saved scenarios.</li>
                    <li><strong>Scenario Name:</strong> Edit the name of the currently selected scenario.</li>
                    <li><strong>New:</strong> Creates a brand new, blank scenario with default values.</li>
                    <li><strong>Copy:</strong> Creates an exact duplicate of the current scenario, allowing you to tweak it without starting over.</li>
                    <li><strong>Delete:</strong> Removes the current scenario. You cannot delete the last remaining scenario.</li>
                </ul>
                <p className="mt-3 p-2 bg-yellow-50 border-l-4 border-yellow-400 rounded-r-md"><strong>Important:</strong> All your scenarios are saved in your browser's local storage. This data can be lost if you clear your cache. Always use the Backup feature to save your work!</p>
            </>
        )
    },
    {
        id: 'backupRestore',
        title: 'Backup & Restore',
        icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" /></svg>,
        content: (
            <>
                <p>This feature allows you to save all of your scenarios to a file and load them back later. This is perfect for moving your plans to a different computer or browser, or just for keeping a safe backup. Access it via the "Backup" button in the top header.</p>
                <ul>
                    <li><strong>Download Scenarios:</strong> This will save a single file named <code>retirement_scenarios.json</code> to your computer. This file contains all the scenarios and data you've created.</li>
                    <li><strong>Upload Scenarios:</strong> This will open a file prompt. Select a previously downloaded <code>.json</code> file to load it.</li>
                </ul>
                <p className="mt-3 p-2 bg-red-50 border-l-4 border-red-400 rounded-r-md"><strong>Warning:</strong> Uploading a scenarios file will completely overwrite all scenarios currently in the application. This action cannot be undone.</p>
            </>
        )
    }
];

export const UserManualModal: React.FC<UserManualModalProps> = ({ isOpen, onClose }) => {
    const [activeTopicId, setActiveTopicId] = useState(manualContent[0].id);
    
    if (!isOpen) return null;

    const activeTopic = manualContent.find(topic => topic.id === activeTopicId);

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4 transition-opacity duration-300"
            onClick={onClose}
        >
            <div 
                className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[640px] overflow-hidden flex flex-col transform transition-transform duration-300 scale-95"
                onClick={e => e.stopPropagation()}
                style={{ transform: isOpen ? 'scale(1)' : 'scale(0.95)' }}
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
                    <nav className="w-1/3 flex-shrink-0 border-r bg-gray-50 p-4 overflow-y-auto">
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
            </div>
        </div>
    );
};