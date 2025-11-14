
import React from 'react';

interface IndicatorCardProps {
  title: string;
  value: string;
  subValue?: string;
  icon: React.ReactNode;
  colorClass: string;
}

export const IndicatorCard: React.FC<IndicatorCardProps> = ({ title, value, subValue, icon, colorClass }) => {
  return (
    <div className="bg-brand-surface p-4 rounded-xl shadow-md flex items-center space-x-4 transition-transform hover:scale-105">
      <div className={`p-3 rounded-full ${colorClass}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-brand-text-secondary">{title}</p>
        <p className="text-xl font-bold text-brand-text-primary">{value}</p>
        {subValue && <p className="text-xs text-brand-text-secondary mt-1">{subValue}</p>}
      </div>
    </div>
  );
};