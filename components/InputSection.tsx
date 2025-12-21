import React from 'react';
import useTheme from '../hooks/useTheme';
import { SectionIcon } from './SectionIcon';

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

  const isAnnual = typeof title === 'string' && title.toLowerCase().includes('annual');
  const effectiveTitleClass = theme === 'dark' && isAnnual ? 'text-white' : titleColorClass;

  const headerBorderClass = !(isAnnual && theme === 'light') ? 'border-b border-gray-200 pb-3 mb-4' : 'pb-3 mb-4';

  return (
    <div className="bg-brand-surface p-6 rounded-lg shadow-sm mb-6">
      <div className={`flex justify-between items-start ${headerBorderClass}`}>
        <div>
            <h3 className={`text-xl font-bold ${effectiveTitleClass} flex items-center`}><SectionIcon title={title} titleColorClass={titleColorClass} /><span>{title}</span></h3>
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
