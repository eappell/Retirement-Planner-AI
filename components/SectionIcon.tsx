import React from 'react';
import {
  DocumentTextIcon,
  ShieldCheckIcon,
  UserIcon,
  BriefcaseIcon,
  BanknotesIcon,
  CreditCardIcon,
  CpuChipIcon,
  TableCellsIcon,
  ChartBarIcon,
  Bars3Icon,
  BuildingLibraryIcon,
} from '@heroicons/react/24/outline';

interface SectionIconProps {
  title: React.ReactNode;
  titleColorClass?: string;
}

export const SectionIcon: React.FC<SectionIconProps> = ({ title, titleColorClass = 'text-brand-text-primary' }) => {
  if (typeof title !== 'string') return null;
  
  const key = title.toLowerCase();
  const baseClasses = "h-6 w-6 mr-2";
  
  if (key.includes('information')) {
    return <DocumentTextIcon className={`${baseClasses} text-brand-primary`} />;
  }
  
  // Check more specific matches first to avoid false positives
  if (key.includes('estate') || key.includes('legacy') || key.includes('gift') || key.includes('gifts')) {
    return <BuildingLibraryIcon className={`${baseClasses} text-purple-600`} />;
  }
  
  if (key.includes('social')) {
    // For Social Security, use gold shield to represent badge/protection
    return <ShieldCheckIcon className={`${baseClasses} text-[#D4AF37]`} />;
  }
  
  if (key.includes('person') || key.includes('person1') || key.includes('person2')) {
    return <UserIcon className={`${baseClasses} text-gray-700`} />;
  }
  
  if (key.includes('account')) {
    return <BriefcaseIcon className={`${baseClasses} text-cyan-600`} />;
  }
  
  if (key.includes('income') || key.includes('pension') || key.includes('annuit')) {
    return <BanknotesIcon className={`${baseClasses} text-green-600`} />;
  }
  
  if (key.includes('expense')) {
    return <CreditCardIcon className={`${baseClasses} text-red-600`} />;  
  }
  
  if (key.includes('ai') || key.includes('insight')) {
    return <CpuChipIcon className={`${baseClasses} text-blue-600`} />;
  }
  
  if (key.includes('annual')) {
    return <TableCellsIcon className={`${baseClasses} text-green-600`} />;
  }
  
  if (key.includes('charts') || key.includes('analysis') || key.includes('projection') || key.includes('monte')) {
    return <ChartBarIcon className={`${baseClasses} text-yellow-600`} />;
  }
  
  // Default fallback icon
  return <Bars3Icon className={`${baseClasses} text-brand-text-secondary`} />;
};
