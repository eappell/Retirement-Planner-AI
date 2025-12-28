import React from 'react';
import { ThemeContext } from '../contexts/ThemeContext';
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
        if (typeof onRenameScenario === 'function') onRenameScenario(selected, val);
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
    const hideTimerRef = React.useRef<number | null>(null);
    const isTouchRef = React.useRef<boolean>(false);

    const [isDark, setIsDark] = React.useState<boolean>(false);
    const [isLight, setIsLight] = React.useState<boolean>(false);
    const rootRef = React.useRef<HTMLDivElement | null>(null);
    const prevThemeRef = React.useRef<string | null>(null);

    const themeCtx = React.useContext(ThemeContext);

    React.useEffect(() => {
        try {
            const getIsDark = () => {
                if (!document) return false;
                const html = document.documentElement;
                const body = document.body;
                const htmlDark = html && (html.classList.contains('theme-dark') || html.classList.contains('dark'));
                const bodyDark = body && (body.classList.contains('theme-dark') || body.classList.contains('dark'));
                return htmlDark || bodyDark || (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
            };
            const getIsLight = () => {
                if (!document) return false;
                const html = document.documentElement;
                const body = document.body;
                const htmlLight = html && (html.classList.contains('theme-light') || html.classList.contains('light'));
                const bodyLight = body && (body.classList.contains('theme-light') || body.classList.contains('light'));
                return htmlLight || bodyLight;
            };

            // initialize from context first, then fall back to DOM/media/localStorage
            const initFromContext = () => {
                if (themeCtx && themeCtx.theme) {
                    setIsDark(themeCtx.theme === 'dark');
                    setIsLight(themeCtx.theme === 'light');
                    prevThemeRef.current = themeCtx.theme;
                    return true;
                }
                return false;
            };

            const initialFromCtx = initFromContext();
            if (!initialFromCtx) {
                const initialDark = getIsDark();
                const initialLight = getIsLight();
                // also try localStorage if present
                try {
                    const stored = localStorage.getItem('theme');
                    if (stored === 'dark' || stored === 'light') {
                        setIsDark(stored === 'dark');
                        setIsLight(stored === 'light');
                        prevThemeRef.current = stored;
                    } else {
                        setIsDark(initialDark);
                        setIsLight(initialLight);
                        prevThemeRef.current = initialLight ? 'light' : (initialDark ? 'dark' : (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
                    }
                } catch (e) {
                    setIsDark(initialDark);
                    setIsLight(initialLight);
                    prevThemeRef.current = initialLight ? 'light' : (initialDark ? 'dark' : (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
                }
            }

            const mq = window.matchMedia('(prefers-color-scheme: dark)');
            const handler = () => {
                const dark = getIsDark();
                const light = getIsLight();
                setIsDark(dark);
                setIsLight(light);

                const themeStr = light ? 'light' : (dark ? 'dark' : (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
                if (prevThemeRef.current === null) {
                    prevThemeRef.current = themeStr;
                } else if (prevThemeRef.current !== themeStr) {
                    prevThemeRef.current = themeStr;
                    try { console.log(`Theme changed: ${themeStr}`); } catch (e) { /* ignore */ }
                }
            };
            if (mq.addEventListener) mq.addEventListener('change', handler);
            else mq.addListener(handler as any);

            // observe class changes on <html> and <body> so toggling theme class is detected
            const obs = new MutationObserver(handler);
            if (document.documentElement) obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
            if (document.body) obs.observe(document.body, { attributes: true, attributeFilter: ['class'] });

            // listen for storage events (other tabs) to catch theme changes
            const storageListener = (e: StorageEvent) => {
                try {
                    if (e.key === 'theme') {
                        const t = e.newValue;
                        setIsDark(t === 'dark');
                        setIsLight(t === 'light');
                        console.log('Theme changed (storage):', t);
                    }
                } catch (err) { /* ignore */ }
            };
            window.addEventListener('storage', storageListener);

            // listen for a possible custom event some theme toggles may emit
            const themeEventListener = () => handler();
            window.addEventListener('theme:change', themeEventListener as EventListener);

            return () => {
                if (mq.removeEventListener) mq.removeEventListener('change', handler);
                else mq.removeListener(handler as any);
                obs.disconnect();
                window.removeEventListener('theme:change', themeEventListener as EventListener);
                window.removeEventListener('storage', storageListener);
            };
        } catch (e) {
            // ignore
        }
    }, [themeCtx]);

    // respond to ThemeContext changes (re-rendered automatically when context value changes)
    React.useEffect(() => {
        try {
            if (!themeCtx) return;
            const t = themeCtx.theme;
            setIsDark(t === 'dark');
            setIsLight(t === 'light');
            const themeStr = t === 'light' ? 'light' : 'dark';
            if (prevThemeRef.current !== themeStr) {
                prevThemeRef.current = themeStr;
                console.log(`Theme changed (context): ${themeStr}`);
            }
        } catch (e) {
            // ignore
        }
    }, [themeCtx?.theme]);

    // compute theme from context, localStorage or prefers-color-scheme to drive immediate styling
    const computedTheme = React.useMemo(() => {
        try {
            if (themeCtx && themeCtx.theme) return themeCtx.theme;
            const stored = localStorage.getItem('theme');
            if (stored === 'light' || stored === 'dark') return stored;
            if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
            return 'light';
        } catch (e) {
            return undefined as any;
        }
    }, [themeCtx?.theme]);

    React.useEffect(() => {
        const onDocClick = (e: MouseEvent) => {
            if (!helpRef.current) return;
            if (!helpRef.current.contains(e.target as Node)) setHelpOpen(false);
        };
        document.addEventListener('mousedown', onDocClick);
        return () => document.removeEventListener('mousedown', onDocClick);
    }, []);

    // cleanup any pending timers on unmount
    React.useEffect(() => {
        return () => {
            if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
        };
    }, []);

    return (
        <div ref={rootRef} className="w-full bg-[#f1f5fb] dark:bg-slate-900 py-2 px-3" style={{ backgroundColor: computedTheme === 'light' ? '#f1f5fb' : (computedTheme === 'dark' ? '#081025' : undefined) }}>
            <div className="max-w-full mx-auto flex items-center space-x-3">
                <div className="flex items-center space-x-2 w-64">
                    <label htmlFor="scenarios-select" className="text-lg font-semibold dark:text-green-300 flex items-center space-x-2" style={{ color: computedTheme === 'light' ? '#2e6f2b' : undefined }}>
                        <Square3Stack3DIcon className="h-5 w-5 dark:text-green-300" style={{ color: computedTheme === 'light' ? '#2e6f2b' : undefined }} />
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
                        <span className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 bg-gray-800 dark:bg-gray-700 text-white dark:text-white text-xs rounded py-1 px-2 whitespace-nowrap z-40 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-none">Create a new scenario</span>
                    </button>
                    <button
                        type="button"
                        onClick={handleCopy}
                        aria-label="Copy scenario"
                        className="relative group py-2 px-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center font-semibold text-base"
                    >
                        <DocumentDuplicateIcon className="h-4 w-4" />
                        <span className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 bg-gray-800 dark:bg-gray-700 text-white dark:text-white text-xs rounded py-1 px-2 whitespace-nowrap z-40 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-none">Create a copy of the current scenario</span>
                    </button>
                    <button
                        type="button"
                        onClick={handleDelete}
                        aria-label="Delete scenario"
                        disabled={list.length <= 1}
                        className="relative group py-2 px-3 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center font-semibold text-base"
                        style={{ backgroundColor: computedTheme === 'dark' ? '#dc2626' : undefined }}
                    >
                        <TrashIcon className="h-4 w-4 text-white" />
                        <span className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 bg-gray-800 dark:bg-gray-700 text-white dark:text-white text-xs rounded py-1 px-2 whitespace-nowrap z-40 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-none">Delete the current scenario</span>
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
                    </label>
                    <div
                        ref={helpRef}
                        className="relative"
                        onMouseEnter={() => {
                            if (isTouchRef.current) return;
                            if (hideTimerRef.current) { window.clearTimeout(hideTimerRef.current); hideTimerRef.current = null; }
                            setHelpOpen(true);
                        }}
                        onMouseLeave={() => {
                            if (isTouchRef.current) return;
                            if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
                            hideTimerRef.current = window.setTimeout(() => setHelpOpen(false), 250);
                        }}
                        onTouchStart={() => { isTouchRef.current = true; }}
                    >
                        <a
                            href="#"
                            onClick={(e) => {
                                // toggle on touch devices; otherwise prevent default for keyboard/mouse
                                if (isTouchRef.current) {
                                    e.preventDefault();
                                    setHelpOpen(prev => !prev);
                                } else {
                                    e.preventDefault();
                                }
                            }}
                            onFocus={() => setHelpOpen(true)}
                            onBlur={() => setHelpOpen(false)}
                            role="button"
                            aria-expanded={helpOpen}
                            className="ml-2 flex items-center space-x-2 dark:text-green-300 hover:underline font-bold text-base"
                            style={{ color: computedTheme === 'light' ? '#2e6f2b' : undefined }}
                        >
                            <InformationCircleIcon className="h-4 w-4 dark:text-green-300" strokeWidth={2} style={{ color: computedTheme === 'light' ? '#2e6f2b' : undefined }} />
                            <span>What are scenarios?</span>
                        </a>

                        <div
                            className={`absolute top-full mt-2 left-1/2 transform -translate-x-1/2 w-80 bg-white dark:bg-slate-800 shadow-xl rounded-md p-4 z-50 transition-all duration-300 ease-in-out ${helpOpen ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto' : 'opacity-0 -translate-y-2 scale-95 pointer-events-none'}`}
                            aria-hidden={!helpOpen}
                            style={{
                                willChange: 'opacity, transform',
                                backgroundColor: computedTheme === 'light' ? '#ffffff' : undefined,
                                color: computedTheme === 'light' ? '#1f2937' : undefined,
                            }}
                        >
                            <h4 className="text-sm font-semibold dark:text-green-300" style={{ color: computedTheme === 'light' ? '#2e6f2b' : undefined }}>What Are Scenarios?</h4>
                            <div className="text-sm text-gray-700 dark:text-gray-300 mt-2 space-y-2" style={{ color: computedTheme === 'light' ? '#1f2937' : undefined }}>
                                <p>Scenarios let you save a copy of your current plan so you can switch between different versions of your assumptions and inputs.</p>
                                <p>Use scenarios to preserve your work, experiment safely, and compare outcomes across alternatives.</p>
                                <p>You can also download your scenarios to a file and load them in another browser or device so your work travels with you.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ScenariosBar;
