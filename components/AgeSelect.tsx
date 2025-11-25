import React, { useState, useRef, useEffect } from 'react';

interface PlanYearOption {
    value: number;
    label: string;
    fullLabel: string;
    age1: number;
    age2?: number;
    age1Allowed: boolean;
    age2Allowed: boolean;
    name1: string;
    name2?: string;
    yearsLabel: string;
}

interface Props {
    options: PlanYearOption[];
    value: string; // stringified offset
    onChange: (value: string) => void;
    id?: string;
    label?: string;
}

const AgeSelect: React.FC<Props> = ({ options, value, onChange, id, label }) => {
    const [open, setOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const onDocClick = (e: MouseEvent) => {
            if (!wrapperRef.current) return;
            if (!wrapperRef.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', onDocClick);
        return () => document.removeEventListener('mousedown', onDocClick);
    }, []);

    const selected = options.find(o => String(o.value) === String(value));

    return (
        <div className="relative" ref={wrapperRef}>
            <label className="block text-sm font-medium text-brand-text-secondary mb-1">{label}</label>
            <button type="button" aria-haspopup="listbox" aria-expanded={open ? 'true' : 'false'} id={id} onClick={() => setOpen(s => !s)} className="w-full text-left bg-white border border-gray-300 rounded px-2 py-1.5 flex items-center justify-between">
                <span className="truncate">{selected ? selected.label : 'Select...'}</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500 ml-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clipRule="evenodd" /></svg>
            </button>

            {open && (
                <div role="listbox" aria-label={label ? `${label} options` : 'Options'} tabIndex={-1} className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded shadow max-h-60 overflow-auto">
                    {options.map(opt => (
                        <div key={opt.value}>
                            <button
                                type="button"
                                role="option"
                                aria-selected={String(opt.value) === String(value) ? 'true' : 'false'}
                                title={opt.fullLabel}
                                onClick={() => { onChange(String(opt.value)); setOpen(false); }}
                                className={`w-full text-left px-3 py-2 hover:bg-gray-100 flex items-center justify-between ${String(opt.value) === String(value) ? 'bg-gray-100' : ''}`}>
                                <div className="truncate text-sm">
                                    {/* Render both persons where applicable; gray-out parts that exceed life expectancy */}
                                    {opt.name2 ? (
                                        <span className="inline-flex items-center space-x-2">
                                            <span className={`${opt.age1Allowed ? 'text-brand-text-primary' : 'text-gray-400'}`}>{opt.name1} {opt.age1}</span>
                                            <span className="text-gray-300">/</span>
                                            <span className={`${opt.age2Allowed ? 'text-brand-text-primary' : 'text-gray-400'}`}>{opt.name2} {opt.age2}</span>
                                            <span className="ml-2 text-xs text-gray-500">{opt.yearsLabel}</span>
                                        </span>
                                    ) : (
                                        <span className={`${opt.age1Allowed ? 'text-brand-text-primary' : 'text-gray-400'}`}>{opt.name1} {opt.age1} <span className="ml-2 text-xs text-gray-500">{opt.yearsLabel}</span></span>
                                    )}
                                </div>
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AgeSelect;
