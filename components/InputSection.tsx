import React from 'react';

interface InputSectionProps {
  title: React.ReactNode;
  subtitle?: string; 
  titleColorClass?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  gridCols?: number;
}

export const InputSection: React.FC<InputSectionProps> = ({ title, subtitle, titleColorClass = 'text-brand-text-primary', children, actions, gridCols = 3 }) => {
  return (
    <div className="bg-brand-surface p-6 rounded-lg shadow-sm mb-6">
      <div className="flex justify-between items-start border-b border-gray-200 pb-3 mb-4">
        <div>
            <h3 className={`text-xl font-bold ${titleColorClass}`}>{title}</h3>
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