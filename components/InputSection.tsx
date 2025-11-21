import React from 'react';
import useTheme from '../hooks/useTheme';

interface InputSectionProps {
  title: React.ReactNode;
  subtitle?: string;
  titleColorClass?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  gridCols?: number;
}

export const InputSection: React.FC<InputSectionProps> = ({ title, subtitle, titleColorClass = 'text-brand-text-primary', children, actions, gridCols = 3 }) => {
  const { theme } = useTheme();
  const getIconForTitle = (t: React.ReactNode) => {
    if (typeof t !== 'string') return null;
    const key = t.toLowerCase();
    if (key.includes('plan')) {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-brand-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m2 0a2 2 0 012 2v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4a2 2 0 012-2h2"/></svg>
      );
    }
    if (key.includes('social')) {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-6 w-6 mr-2 text-blue-600" aria-hidden="true" focusable="false">
          {/* Police-style badge shape with central star */}
          <path fill="currentColor" d="M12 2l2.1 3.6L18 7l-2 2 .5 4.5L12 12.8 7.5 13.5 8 9 6 7l3.9-1.4L12 2z" />
          <path fill="currentColor" d="M12 13.2l3.4 1.8-.6 2.7L12 16.5l-2.8 1.2-.6-2.7L12 13.2z" opacity="0.95" />
        </svg>
      );
    }
    if (key.includes('person') || key.includes('person1') || key.includes('person2')) {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-gray-700" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
      );
    }
    if (key.includes('account')) {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-cyan-600" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h18v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V5a4 4 0 018 0v2"/></svg>
      );
    }
    if (key.includes('income') || key.includes('pension') || key.includes('annuit')) {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 1.343-3 3v6h6v-6c0-1.657-1.343-3-3-3z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 20h14"/></svg>
      );
    }
    if (key.includes('annual')) {
      // Excel-style table icon for annual projection sections
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <rect x="3" y="4" width="18" height="16" rx="1" ry="1" strokeWidth={1.5} />
          <path d="M3 9h18" strokeWidth={1.5} />
          <path d="M9 4v16" strokeWidth={1.5} />
        </svg>
      );
    }
    if (key.includes('charts') || key.includes('analysis') || key.includes('projection') || key.includes('monte')) {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-yellow-600" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3v18h18"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 13l3-3 4 4 5-7"/></svg>
      );
    }
    // default generic icon
    return (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-brand-text-secondary" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/></svg>
    );
  };

  const icon = getIconForTitle(title);

  const isAnnual = typeof title === 'string' && title.toLowerCase().includes('annual');
  const effectiveTitleClass = theme === 'dark' && isAnnual ? 'text-white' : titleColorClass;

  return (
    <div className="bg-brand-surface p-6 rounded-lg shadow-sm mb-6">
      <div className="flex justify-between items-start border-b border-gray-200 pb-3 mb-4">
        <div>
            <h3 className={`text-xl font-bold ${effectiveTitleClass} flex items-center`}>{icon}<span>{title}</span></h3>
            {subtitle && <p className="text-sm text-brand-text-secondary mt-1">{subtitle}</p>}
        </div>
        {actions && <div className="flex-shrink-0 ml-4">{actions}</div>}
      </div>
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${gridCols} gap-4 items-end`}>
        {children}
      </div>
    </div>
  );
};
