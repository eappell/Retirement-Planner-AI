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
  setIsDisclaimerOpen: (isOpen: boolean, requireAccept?: boolean) => void;
  onOpenSettings: () => void;
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
  setIsDisclaimerOpen,
  onOpenSettings,
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
        <button type="button" onClick={() => setIsManualOpen(true)} aria-label="Open User Manual" title="User Manual" className="group relative p-2 rounded-md text-gray-600 hover:text-brand-primary hover:bg-gray-100 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13.494" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 5.5a2 2 0 012-2h3.5a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2v-12z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 5.5a2 2 0 00-2-2h-3.5a2 2 0 00-2 2v12a2 2 0 002 2H19a2 2 0 002-2v-12z" />
          </svg>
          <span className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap z-40 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-none">User Manual</span>
        </button>

        <button type="button" onClick={handlePrint} aria-label="Print" title="Print" className="group relative p-2 rounded-md text-gray-600 hover:text-brand-primary hover:bg-gray-100 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <rect x="6" y="9" width="12" height="6" rx="2" strokeLinecap="round" strokeLinejoin="round" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 13v5a1 1 0 001 1h10a1 1 0 001-1v-5" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 9V6a3 3 0 013-3h0a3 3 0 013 3v3" />
          </svg>
          <span className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap z-40 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-none">Print</span>
        </button>

        <button type="button" onClick={onOpenSettings} title="App Settings" aria-label="App Settings" className="group relative p-2 rounded-md text-gray-600 hover:text-brand-primary hover:bg-gray-100 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l.149.458a1 1 0 00.95.69h.48c.969 0 1.371 1.24.588 1.81l-.39.28a1 1 0 00-.364 1.118l.15.46c.3.92-.755 1.688-1.54 1.16l-.41-.3a1 1 0 00-1.176 0l-.41.3c-.785.528-1.84-.24-1.54-1.16l.15-.46a1 1 0 00-.364-1.118l-.39-.28C6.9 6.345 7.302 5.105 8.27 5.105h.48a1 1 0 00.95-.69l.149-.458z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8.5a3.5 3.5 0 100 7 3.5 3.5 0 000-7z" />
          </svg>
          <span className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap z-40 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-none">Settings</span>
        </button>

        <div className="relative" ref={scenarioMenuRef}>
          <button type="button" onClick={() => setIsScenarioMenuOpen(prev => !prev)} className="group relative p-2 rounded-md text-gray-600 hover:text-brand-primary hover:bg-gray-100 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
              <rect x="3" y="4" width="18" height="6" rx="1" ry="1" />
              <rect x="3" y="13" width="18" height="6" rx="1" ry="1" />
              <path d="M7 7v2" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
              <path d="M7 16v1" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
            </svg>
            <span className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap z-40 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-none">Scenarios</span>
          </button>

          {isScenarioMenuOpen && (
            <div className="origin-top-right absolute right-0 mt-2 w-96 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-30 p-4">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-brand-text-primary flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                    <rect x="3" y="4" width="18" height="6" rx="1" ry="1" />
                    <rect x="3" y="13" width="18" height="6" rx="1" ry="1" />
                    <path d="M7 7v2" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} />
                    <path d="M7 16v1" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} />
                  </svg>
                  Scenario Manager
                </h3>
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
                            <button onClick={handleDownloadAndClose} className="flex items-center justify-center w-full px-4 py-2 text-sm rounded-md btn-download">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v13" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 9.75L12 13.5l3.75-3.75" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 19.5h13.5" />
                              </svg>
                              <span>Download</span>
                            </button>
                            <label className="flex items-center justify-center w-full px-4 py-2 text-sm rounded-md cursor-pointer btn-upload">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21V8" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 14.25L12 10.5l3.75 3.75" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 4.5h13.5" />
                              </svg>
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

        <button
          type="button"
          onClick={() => setIsDisclaimerOpen(true, false)}
          className="group relative p-2 rounded-md text-gray-600 hover:text-red-600 hover:bg-gray-100 transition-colors"
          title="View disclaimer"
          aria-label="View disclaimer"
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 16h.01" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 2a10 10 0 100 20 10 10 0 000-20z" />
            </svg>
          <span className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap z-40 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-none">Disclaimer</span>
        </button>
        <div className="inline-block">
          <div className="group relative inline-block">
            <ThemeToggle />
            <span className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap z-40 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-none">Toggle theme</span>
          </div>
        </div>

        <button type="button" onClick={handleResetPlan} aria-label="Reset Plan" title="Reset all data and scenarios" className="group relative p-2 rounded-md text-red-600 hover:text-red-800 transition-colors hover:bg-red-100">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 512 512" fill="currentColor" aria-hidden="true">
            <path d="M256 8C119.043 8 8 119.043 8 256s111.043 248 248 248 248-111.043 248-248S392.957 8 256 8zm99.03 324.971L324.971 375.03 256 306.059 187.029 375.03 136.97 324.971 205.941 256 136.97 187.029 187.029 136.97 256 205.941 324.971 136.97 375.03 187.029 306.059 256 375.03 324.971z" />
          </svg>
          <span className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap z-40 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-none">Reset</span>
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
