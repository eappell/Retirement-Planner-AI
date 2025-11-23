import React from 'react';
import { SelectInput, TextInput } from './FormControls';
import { Square3Stack3DIcon, ArrowDownTrayIcon, ArrowUpTrayIcon, PlusIcon, DocumentDuplicateIcon, TrashIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

interface ScenariosBarProps {
  scenarios: { id: string; name: string }[] | Record<string, any>;
  activeScenarioId?: string | null;
  onSwitchScenario?: (id: string) => void;
  onRenameScenario?: (id: string, name: string) => void;
  onNewScenario?: () => void;
  onCopyScenario?: (id: string) => void;
  onDeleteScenario?: (id: string) => void;
    onDownload?: () => void;
    onUpload?: (file: File) => void;
}

const ScenariosBar: React.FC<ScenariosBarProps> = ({ scenarios = [], activeScenarioId = null, onSwitchScenario, onRenameScenario, onNewScenario, onCopyScenario, onDeleteScenario, onDownload, onUpload }) => {
    // normalize scenarios to array
    const list = Array.isArray(scenarios) ? scenarios : Object.values(scenarios || {});
    const [selected, setSelected] = React.useState<string | null>(activeScenarioId ?? (list[0] && list[0].id) ?? null);
    const [name, setName] = React.useState<string>('');

    React.useEffect(() => {
        setSelected(activeScenarioId ?? (list[0] && list[0].id) ?? null);
    }, [activeScenarioId, scenarios]);

    React.useEffect(() => {
        const s = list.find((x: any) => x.id === selected);
        setName(s ? s.name : '');
    }, [selected, scenarios]);

    const handleSwitch = (id: string) => {
        setSelected(id);
        if (typeof onSwitchScenario === 'function') onSwitchScenario(id);
        else window.dispatchEvent(new CustomEvent('scenarios:switch', { detail: { id } }));
    };

    const handleRename = (val: string) => {
        setName(val);
        if (!selected) return;
        if (typeof onRenameScenario === 'function') onRenameScenario(val);
        else window.dispatchEvent(new CustomEvent('scenarios:rename', { detail: { id: selected, name: val } }));
    };

    const handleNew = () => {
        if (typeof onNewScenario === 'function') onNewScenario();
        else window.dispatchEvent(new CustomEvent('scenarios:new'));
    };

    const handleCopy = () => {
        if (!selected) return;
        if (typeof onCopyScenario === 'function') onCopyScenario(selected);
        else window.dispatchEvent(new CustomEvent('scenarios:copy', { detail: { id: selected } }));
    };

    const handleDelete = () => {
        if (!selected) return;
        if (typeof onDeleteScenario === 'function') onDeleteScenario(selected);
        else window.dispatchEvent(new CustomEvent('scenarios:delete', { detail: { id: selected } }));
    };

    const helpRef = React.useRef<HTMLDivElement | null>(null);
    const [helpOpen, setHelpOpen] = React.useState<boolean>(false);

    React.useEffect(() => {
        const onDocClick = (e: MouseEvent) => {
            if (!helpRef.current) return;
            if (!helpRef.current.contains(e.target as Node)) setHelpOpen(false);
        };
        document.addEventListener('mousedown', onDocClick);
        return () => document.removeEventListener('mousedown', onDocClick);
    }, []);

    return (
        <div className="w-full bg-[#f1f5fb] py-2 px-3">
            <div className="max-w-full mx-auto flex items-center space-x-3">
                <div className="flex items-center space-x-2 w-64">
                    <label htmlFor="scenarios-select" className="text-lg font-semibold text-[#0b6b04] flex items-center space-x-2">
                        <Square3Stack3DIcon className="h-5 w-5 text-[#0b6b04]" />
                        <span>Scenarios</span>
                    </label>
                    <SelectInput id="scenarios-select" value={selected ?? ''} onChange={e => handleSwitch(e.target.value)}>
                        {list.length === 0 && <option value="">(No scenarios)</option>}
                        {list.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </SelectInput>
                </div>

                <div className="w-48">
                    <TextInput value={name} onChange={e => handleRename(e.target.value)} placeholder="Scenario name" />
                </div>

                <div className="flex items-center space-x-2">
                    <button
                        type="button"
                        onClick={handleNew}
                        aria-label="New scenario"
                        className="relative group py-2 px-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center justify-center font-semibold text-base"
                    >
                        <PlusIcon className="h-4 w-4" />
                        <span className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap z-40 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-none">Create a new scenario</span>
                    </button>
                    <button
                        type="button"
                        onClick={handleCopy}
                        aria-label="Copy scenario"
                        className="relative group py-2 px-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center font-semibold text-base"
                    >
                        <DocumentDuplicateIcon className="h-4 w-4" />
                        <span className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap z-40 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-none">Create a copy of the current scenario</span>
                    </button>
                    <button
                        type="button"
                        onClick={handleDelete}
                        aria-label="Delete scenario"
                        disabled={list.length <= 1}
                        className="relative group py-2 px-3 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center font-semibold text-base"
                    >
                        <TrashIcon className="h-4 w-4" />
                        <span className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap z-40 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-none">Delete the current scenario</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            if (typeof onDownload === 'function') onDownload();
                            else window.dispatchEvent(new CustomEvent('scenarios:download'));
                        }}
                        title="Download scenarios"
                        aria-label="Download scenarios"
                        className="relative group px-3 h-8 bg-[#106087] text-white rounded-md text-base hover:bg-[#0d4f6f] transition-colors flex items-center space-x-2 font-semibold"
                    >
                        <ArrowDownTrayIcon className="h-4 w-4 text-white" strokeWidth={2} />
                        <span className="text-sm font-semibold text-white whitespace-nowrap">Download Scenarios</span>
                        <span className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap z-40 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-none">Download Scenarios</span>
                    </button>
                    <label className="relative group px-3 h-8 bg-[#28702d] text-white rounded-md text-base hover:bg-[#225b27] transition-colors cursor-pointer flex items-center space-x-2 font-semibold">
                        <ArrowUpTrayIcon className="h-4 w-4 text-white" strokeWidth={2} />
                        <input
                            type="file"
                            className="hidden"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                if (typeof onUpload === 'function') onUpload(file);
                                else window.dispatchEvent(new CustomEvent('scenarios:upload', { detail: { file } }));
                                if (e.target) e.target.value = '';
                            }}
                            accept=".retire"
                        />
                        <span className="text-sm font-semibold text-white whitespace-nowrap">Restore Scenarios</span>
                        <span className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap z-40 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-none">Restore Scenarios</span>
                    </label>
                    <div ref={helpRef} className="relative">
                        <a
                            href="#"
                            onClick={(e) => { e.preventDefault(); setHelpOpen(prev => !prev); }}
                            role="button"
                            aria-expanded={helpOpen}
                            className="ml-2 flex items-center space-x-2 text-[#0b6b04] hover:underline font-bold text-base"
                        >
                            <InformationCircleIcon className="h-4 w-4 text-[#0b6b04]" strokeWidth={2} />
                            <span>What are scenarios?</span>
                        </a>

                        {helpOpen && (
                            <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 w-80 bg-white shadow-lg rounded-md p-4 z-50">
                                <h4 className="text-sm font-semibold text-[#0b6b04]">What Are Scenarios?</h4>
                                <div className="text-sm text-gray-700 mt-2 space-y-2">
                                    <p>Scenarios let you save a copy of your current plan so you can switch between different versions of your assumptions and inputs.</p>
                                    <p>Use scenarios to preserve your work, experiment safely, and compare outcomes across alternatives.</p>
                                    <p>You can also download your scenarios to a file and load them in another browser or device so your work travels with you.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ScenariosBar;
