import React, { useState, useRef, useEffect } from 'react';
import { Scenario } from '../types';
import { SelectInput, TextInput } from './FormControls';

interface HeaderProps {
    activeScenario: Scenario;
    scenarios: Record<string, Scenario>;
    handleSelectScenario: (id: string) => void;
    handleNewScenario: () => void;
    handleCopyScenario: () => void;
    handleDeleteScenario: () => void;
    handleUpdateScenarioName: (name: string) => void;
    handleDownloadScenarios: () => void;
    handleUploadScenarios: (event: React.ChangeEvent<HTMLInputElement>) => void;
    handleResetPlan: () => void;
    handlePrint: () => void;
    setIsManualOpen: (isOpen: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({
    activeScenario,
    scenarios,
    handleSelectScenario,
    handleNewScenario,
    handleCopyScenario,
    handleDeleteScenario,
    handleUpdateScenarioName,
    handleDownloadScenarios,
    handleUploadScenarios,
    handleResetPlan,
    handlePrint,
    setIsManualOpen
}) => {
    const [isBackupMenuOpen, setIsBackupMenuOpen] = useState(false);
    const [isScenarioMenuOpen, setIsScenarioMenuOpen] = useState(false);
    const backupMenuRef = useRef<HTMLDivElement>(null);
    const scenarioMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (backupMenuRef.current && !backupMenuRef.current.contains(event.target as Node)) {
                setIsBackupMenuOpen(false);
            }
             if (scenarioMenuRef.current && !scenarioMenuRef.current.contains(event.target as Node)) {
                setIsScenarioMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const onDownload = () => {
        handleDownloadScenarios();
        setIsBackupMenuOpen(false);
    };

    const onUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        handleUploadScenarios(event);
        setIsBackupMenuOpen(false);
    }
    
    return (
        <header className="bg-brand-surface shadow-md h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 sticky top-0 z-20">
            <div className="flex flex-col">
                <div className="flex items-baseline space-x-3 overflow-hidden">
                    <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-brand-secondary flex-shrink-0">
                        Retirement Monthly Income Planner
                    </h1>
                    <span 
                        className="text-sm font-medium text-brand-text-secondary whitespace-nowrap overflow-hidden text-ellipsis"
                        title={activeScenario.name}
                    >
                        ({activeScenario.name})
                    </span>
                </div>
                <p className="text-xs text-brand-text-secondary mt-0.5">Estimate your retirement income, taxes, and net worth.</p>
            </div>
            <div className="flex items-center space-x-2">
                <button type="button" onClick={() => setIsManualOpen(true)} className="flex items-center space-x-2 text-sm text-gray-600 hover:text-brand-primary transition-colors font-medium p-2 rounded-md hover:bg-gray-100">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                    <span>User Manual</span>
                </button>
                <button type="button" onClick={handlePrint} className="flex items-center space-x-2 text-sm text-gray-600 hover:text-brand-primary transition-colors font-medium p-2 rounded-md hover:bg-gray-100">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                    <span>Print Report</span>
                </button>

                    <div className="relative" ref={scenarioMenuRef}>
                    <button
                        type="button"
                        onClick={() => setIsScenarioMenuOpen(prev => !prev)}
                        className="flex items-center space-x-2 text-sm text-gray-600 hover:text-brand-primary transition-colors font-medium p-2 rounded-md hover:bg-gray-100"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" /></svg>
                        <span>Scenarios</span>
                    </button>
                    {isScenarioMenuOpen && (
                        <div className="origin-top-right absolute right-0 mt-2 w-96 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-30 p-4">
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-gray-800">Scenario Manager</h3>
                                <div>
                                    <SelectInput label="Current Scenario" value={activeScenario.id || ''} onChange={e => handleSelectScenario(e.target.value)}>
                                        {Object.values(scenarios).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </SelectInput>
                                </div>
                                <TextInput label="Scenario Name" value={activeScenario.name} onChange={e => handleUpdateScenarioName(e.target.value)} />
                                <div className="grid grid-cols-3 gap-2">
                                    <button onClick={handleNewScenario} className="w-full px-3 py-1.5 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors">New</button>
                                    <button onClick={handleCopyScenario} className="w-full px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">Copy</button>
                                    <button onClick={handleDeleteScenario} disabled={Object.keys(scenarios).length <= 1} className="w-full px-3 py-1.5 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400 transition-colors">Delete</button>
                                </div>
                                <div className="col-span-full pt-2 border-t">
                                    <p className="text-xs text-gray-500">This data is stored in your browser. If you clear your browser cache without saving the scenarios file, you <strong className="text-red-600">WILL LOSE</strong> your scenarios. Use the Backup feature to download your scenarios file to save all your hard work.</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="relative" ref={backupMenuRef}>
                    <button
                        type="button"
                        onClick={() => setIsBackupMenuOpen(prev => !prev)}
                        className="flex items-center space-x-2 text-sm text-gray-600 hover:text-brand-primary transition-colors font-medium p-2 rounded-md hover:bg-gray-100"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" /></svg>
                        <span>Backup</span>
                    </button>
                    {isBackupMenuOpen && (
                        <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-30">
                            <div className="py-1">
                                <button
                                    onClick={onDownload}
                                    className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                    <span className="ml-3">Download Scenarios</span>
                                </button>
                                <label className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0l-4 4m4-4v12" /></svg>
                                    <span className="ml-3">Upload Scenarios</span>
                                    <input
                                        type="file"
                                        onChange={onUpload}
                                        accept=".retire"
                                        className="hidden"
                                    />
                                </label>
                            </div>
                        </div>
                    )}
                </div>
                    <button 
                    type="button" 
                    onClick={handleResetPlan} 
                    className="flex items-center space-x-2 text-sm text-red-600 hover:text-red-800 transition-colors font-medium p-2 rounded-md hover:bg-red-100"
                    title="Reset all data and scenarios"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    <span>Reset Plan</span>
                </button>
            </div>
        </header>
    );
};