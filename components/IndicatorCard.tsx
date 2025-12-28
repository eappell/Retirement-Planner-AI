
import React from 'react';

interface IndicatorCardProps {
  title: string;
  value?: string | React.ReactNode;
  subValue?: string | React.ReactNode;
  icon: React.ReactNode;
  colorClass: string;
}

export const IndicatorCard: React.FC<IndicatorCardProps> = React.memo(({ title, value, subValue, icon, colorClass }) => {
  return (
    <div className="w-full min-w-0 bg-brand-surface p-4 rounded-xl shadow-md flex items-center space-x-4 transition-transform hover:scale-105">
      <div className={`p-3 rounded-full ${colorClass}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-brand-text-secondary">{title}</p>
        {value && <p className="text-xl font-bold text-brand-text-primary">{value}</p>}
        {subValue && <div className="text-xs text-brand-text-secondary mt-1">{subValue}</div>}
      </div>
    </div>
  );
});