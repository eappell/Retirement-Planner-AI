import React from 'react';
import { Scenario } from '../types';
import { SelectInput, TextInput } from './FormControls';
import ThemeToggle from './ThemeToggle';

interface HeaderProps {
  activeScenario: Scenario;
  scenarios: Record<string, Scenario>;
  handleSelectScenario: (id: string) => void;
  handleNewScenario: () => void;
  handleCopyScenario: () => void;
  handleDeleteScenario: () => void;
  handleUpdateScenarioName: (name: string) => void;
  handleDownloadScenarios: () => Promise<boolean>;
  handleUploadScenarios: (event: React.ChangeEvent<HTMLInputElement>) => Promise<boolean>;
  handleResetPlan: () => void;
  handlePrint: () => void;
  setIsManualOpen: (isOpen: boolean) => void;
}

const Header: React.FC<HeaderProps> = ({
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
  setIsManualOpen,
}) => {
  const [isScenarioMenuOpen, setIsScenarioMenuOpen] = React.useState(false);
  const scenarioMenuRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (scenarioMenuRef.current && !scenarioMenuRef.current.contains(event.target as Node)) {
        setIsScenarioMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [toastMessage, setToastMessage] = React.useState<string>('');
  const [showToast, setShowToast] = React.useState<boolean>(false);
  const [toastType, setToastType] = React.useState<'success' | 'error'>('success');

  const handleUploadAndClose = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const success = await handleUploadScenarios(e);
      setIsScenarioMenuOpen(false);
      setToastType(success ? 'success' : 'error');
      setToastMessage(success ? 'Scenarios uploaded' : 'Upload failed');
      setShowToast(true);
    } catch (err) {
      setIsScenarioMenuOpen(false);
      setToastType('error');
      setToastMessage('Upload failed');
      setShowToast(true);
    }
  };

  const handleDownloadAndClose = async () => {
    try {
      const success = await handleDownloadScenarios();
      setIsScenarioMenuOpen(false);
      setToastType(success ? 'success' : 'error');
      setToastMessage(success ? 'Scenarios downloaded' : 'Download failed');
      setShowToast(true);
    } catch (err) {
      setIsScenarioMenuOpen(false);
      setToastType('error');
      setToastMessage('Download failed');
      setShowToast(true);
    }
  };

  React.useEffect(() => {
    if (!showToast) return;
    const t = setTimeout(() => setShowToast(false), 3000);
    return () => clearTimeout(t);
  }, [showToast]);

  return (
    <header className="bg-brand-surface shadow-md h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 sticky top-0 z-20">
      <div className="flex flex-col">
        <div className="flex items-baseline space-x-3 overflow-hidden">
          <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-brand-secondary flex-shrink-0">
            Retirement Monthly Income Planner
          </h1>
          <span className="text-sm font-medium text-brand-text-secondary whitespace-nowrap overflow-hidden text-ellipsis" title={activeScenario.name}>
            ({activeScenario.name})
          </span>
        </div>
        <p className="text-xs text-brand-text-secondary mt-0.5">Estimate your retirement income, taxes, and net worth.</p>
      </div>

      <div className="flex items-center space-x-2">
        <button type="button" onClick={() => setIsManualOpen(true)} className="flex items-center space-x-2 text-sm text-gray-600 hover:text-brand-primary transition-colors font-medium p-2 rounded-md hover:bg-gray-100">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path d="M4 2h9a2 2 0 012 2v12a1 1 0 01-1.447.894L11 15H6a2 2 0 01-2-2V4a2 2 0 012-2z"/></svg>
          <span>User Manual</span>
        </button>

        <button type="button" onClick={handlePrint} className="flex items-center space-x-2 text-sm text-gray-600 hover:text-brand-primary transition-colors font-medium p-2 rounded-md hover:bg-gray-100">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 9V2h12v7"/><rect x="6" y="13" width="12" height="8" rx="2" ry="2"/></svg>
          <span>Print</span>
        </button>

        <div className="relative" ref={scenarioMenuRef}>
          <button type="button" onClick={() => setIsScenarioMenuOpen(prev => !prev)} className="flex items-center space-x-2 text-sm text-gray-600 hover:text-brand-primary transition-colors font-medium p-2 rounded-md hover:bg-gray-100">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h18M3 11h18M3 15h18"/></svg>
            <span>Scenarios</span>
          </button>

          {isScenarioMenuOpen && (
            <div className="origin-top-right absolute right-0 mt-2 w-96 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-30 p-4">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-brand-text-primary">Scenario Manager</h3>
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
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={handleDownloadAndClose} className="flex items-center justify-center w-full px-4 py-2 text-sm rounded-md" style={{ backgroundColor: '#8595d4', color: '#ffffff' }}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path d="M3 14a1 1 0 001 1h12a1 1 0 001-1v-2a1 1 0 10-2 0v1H5v-1a1 1 0 10-2 0v2z"/><path d="M7 7l3-3 3 3M10 4v9"/></svg>
                      <span>Download</span>
                    </button>
                    <label className="flex items-center justify-center w-full px-4 py-2 text-sm rounded-md cursor-pointer" style={{ backgroundColor: '#85d48d', color: '#ffffff' }}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path d="M3 6a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 11-2 0V7H5v9h6a1 1 0 110 2H4a1 1 0 01-1-1V6z"/><path d="M9 7l3 3 3-3"/></svg>
                      <span>Upload</span>
                      <input type="file" onChange={handleUploadAndClose} accept=".retire" className="hidden" />
                    </label>
                  </div>
                </div>

                <div className="col-span-full pt-2">
                  <p className="text-xs text-gray-500">This data is stored in your browser. If you clear your browser cache without saving the scenarios file, you <strong className="text-red-600">WILL LOSE</strong> your scenarios. Use the Backup feature to download your scenarios file to save all your hard work.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <ThemeToggle />

        <button type="button" onClick={handleResetPlan} className="flex items-center space-x-2 text-sm text-red-600 hover:text-red-800 transition-colors font-medium p-2 rounded-md hover:bg-red-100" title="Reset all data and scenarios">
          <span>Reset Plan</span>
        </button>
      </div>

      {showToast && (
        <div className="fixed right-4 top-4 z-50">
          <div role="status" aria-live="polite" className={`text-sm px-3 py-2 rounded shadow flex items-center ${toastType === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
            <span>{toastMessage}</span>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header
