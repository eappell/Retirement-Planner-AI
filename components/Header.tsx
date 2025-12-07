import React from 'react';
import { Scenario } from '../types';
import { SelectInput, TextInput } from './FormControls';
import ThemeToggle from './ThemeToggle';
import AppSettingsMenu from './AppSettingsMenu';
import { 
  QuestionMarkCircleIcon, 
  PrinterIcon, 
  AdjustmentsHorizontalIcon, 
  Square3Stack3DIcon,
  ShieldExclamationIcon, 
  SunIcon, 
  MoonIcon, 
  XCircleIcon,
  ArrowDownTrayIcon, 
  ArrowUpTrayIcon 
} from '@heroicons/react/24/outline';

// HeroIcon SVG strings for portal toolbar
const HEROICON_SVGS = {
  print: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>',
  help: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4m0-4h.01"></path></svg>',
  settings: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M12 1v6m0 6v6M4.22 4.22l4.24 4.24m5.08 5.08l4.24 4.24M1 12h6m6 0h6M4.22 19.78l4.24-4.24m5.08-5.08l4.24-4.24"></path></svg>',
  disclaimer: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>',
  scenarios: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="6" rx="1" ry="1"></rect><rect x="3" y="13" width="18" height="6" rx="1" ry="1"></rect><path d="M7 7v2"></path><path d="M7 16v1"></path></svg>',
};

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
  onSaveDefaults: (d: { stockMean: number; stockStd: number; bondMean: number; bondStd: number; useFatTails?: boolean; fatTailDf?: number }) => void;
  plan?: any;
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
  onSaveDefaults,
  plan,
}) => {
  const [isScenarioMenuOpen, setIsScenarioMenuOpen] = React.useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
  const scenarioMenuRef = React.useRef<HTMLDivElement | null>(null);
  const settingsRef = React.useRef<HTMLDivElement | null>(null);

  // Send toolbar buttons and app metadata to parent portal
  React.useEffect(() => {
    // Check if we're running in an iframe (embedded in portal)
    if (window.self !== window.top) {
      // Send app metadata
      window.parent.postMessage(
        {
          type: 'APP_METADATA',
          title: 'Monthly Retirement Income AI',
          description: 'Estimate your retirement income, taxes, and net worth.',
        },
        '*'
      );

      // Define toolbar buttons
      const toolbarButtons = [
        {
          id: 'scenarios',
          icon: HEROICON_SVGS.scenarios,
          label: 'Scenarios',
          tooltip: 'Manage scenarios',
        },
        {
          id: 'settings',
          icon: HEROICON_SVGS.settings,
          label: 'Settings',
          tooltip: 'App Settings',
        },
        {
          id: 'print',
          icon: HEROICON_SVGS.print,
          label: 'Print',
          tooltip: 'Print or save as PDF',
        },
        {
          id: 'help',
          icon: HEROICON_SVGS.help,
          label: 'Help',
          tooltip: 'User Manual',
        },
        {
          id: 'disclaimer',
          icon: HEROICON_SVGS.disclaimer,
          label: 'Disclaimer',
          tooltip: 'View disclaimer',
        },
      ];

      // Send toolbar buttons to portal
      window.parent.postMessage(
        {
          type: 'TOOLBAR_BUTTONS',
          buttons: toolbarButtons,
        },
        '*'
      );
    }
  }, []);

  // Listen for button clicks from portal
  React.useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'TOOLBAR_BUTTON_CLICKED') {
        const { buttonId } = event.data;

        switch (buttonId) {
          case 'scenarios':
            setIsScenarioMenuOpen(prev => !prev);
            break;
          case 'settings':
            setIsSettingsOpen(prev => !prev);
            break;
          case 'print':
            handlePrint();
            break;
          case 'help':
            setIsManualOpen(true);
            break;
          case 'disclaimer':
            setIsDisclaimerOpen(true, false);
            break;
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [handlePrint, setIsManualOpen, setIsDisclaimerOpen]);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (scenarioMenuRef.current && !scenarioMenuRef.current.contains(event.target as Node)) {
        setIsScenarioMenuOpen(false);
      }
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setIsSettingsOpen(false);
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
      // Global app toast will show the upload result; avoid duplicating toasts here.
    } catch (err) {
      setIsScenarioMenuOpen(false);
      // Global app toast will display the failure; suppress header toast.
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
            Monthly Retirement Income AI
          </h1>
        </div>
        <p className="text-xs text-brand-text-secondary mt-0.5">Estimate your retirement income, taxes, and net worth.</p>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative" ref={scenarioMenuRef}>
          <button type="button" onClick={() => setIsScenarioMenuOpen(prev => !prev)} className="group relative p-2 rounded-md text-gray-600 hover:text-brand-primary hover:bg-gray-100 transition-colors">
            <Square3Stack3DIcon className="h-5 w-5" aria-hidden="true" />
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
                              <ArrowDownTrayIcon className="h-4 w-4 mr-2" aria-hidden="true" />
                              <span>Download</span>
                            </button>
                            <label className="flex items-center justify-center w-full px-4 py-2 text-sm rounded-md cursor-pointer btn-upload">
                              <ArrowUpTrayIcon className="h-4 w-4 mr-2" aria-hidden="true" />
                              <span>Upload</span>
                              <input type="file" onChange={handleUploadAndClose} accept=".retire" className="hidden" />
                            </label>
                  </div>
                </div>

                <div className="col-span-full pt-2">
                  <p className="text-xs text-gray-500">This data is stored in your browser. If you clear your browser cache without saving the scenarios file, you <strong className="text-red-600">WILL LOSE</strong> your scenarios. Use the Backup feature to download your scenarios file to save all your hard work.</p>
                </div>
                <div className="col-span-full pt-4">
                  <button
                    onClick={() => {
                      setIsScenarioMenuOpen(false);
                      handleResetPlan();
                    }}
                    className="w-full inline-flex items-center justify-center px-4 py-3 bg-red-600 text-white text-sm font-semibold rounded-md hover:bg-red-700 transition-colors"
                  >
                    <XCircleIcon className="h-5 w-5 mr-2" aria-hidden="true" />
                    Reset All Data
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="relative" ref={settingsRef}>
          <button type="button" onClick={() => setIsSettingsOpen(prev => !prev)} title="App Settings" aria-label="App Settings" className="group relative p-2 rounded-md text-gray-600 hover:text-brand-primary hover:bg-gray-100 transition-colors">
            <AdjustmentsHorizontalIcon className="h-5 w-5" aria-hidden="true" />
            <span className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap z-40 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-none">Settings</span>
          </button>
          {isSettingsOpen && (
            <AppSettingsMenu onSaveDefaults={(d) => { onSaveDefaults(d); setIsSettingsOpen(false); }} onClose={() => setIsSettingsOpen(false)} plan={plan} />
          )}
        </div>

        <button type="button" onClick={handlePrint} aria-label="Print" title="Print" className="group relative p-2 rounded-md text-gray-600 hover:text-brand-primary hover:bg-gray-100 transition-colors">
          <PrinterIcon className="h-5 w-5" aria-hidden="true" />
          <span className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap z-40 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-none">Print</span>
        </button>

        <button type="button" onClick={() => setIsManualOpen(true)} aria-label="Open User Manual" title="User Manual" className="group relative p-2 rounded-md text-gray-600 hover:text-brand-primary hover:bg-gray-100 transition-colors">
          <QuestionMarkCircleIcon className="h-5 w-5" aria-hidden="true" />
          <span className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap z-40 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-none">User Manual</span>
        </button>

        <div className="inline-block">
          <div className="group relative inline-block">
            <ThemeToggle />
            <span className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap z-40 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-none">Toggle theme</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsDisclaimerOpen(true, false)}
          className="group relative p-2 rounded-md text-gray-600 hover:text-red-600 hover:bg-gray-100 transition-colors"
          title="View disclaimer"
          aria-label="View disclaimer"
        >
          <ShieldExclamationIcon className="h-5 w-5" aria-hidden="true" />
          <span className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap z-40 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-none">Disclaimer</span>
        </button>

        {/* Reset moved to Scenario Manager popover */}
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
