import React from 'react';

interface NumberInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  prefix?: string;
  suffix?: string;
}

export const NumberInput: React.FC<NumberInputProps> = ({ label, prefix, suffix, ...props }) => {
  const isDisabled = props.disabled;
  return (
    <div className={`flex flex-col w-full transition-all duration-300 ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
      {label && <label className={`mb-1 text-sm font-medium ${isDisabled ? 'text-gray-400' : 'text-brand-text-secondary'}`}>{label}</label>}
      <div className="flex items-center">
        {prefix && <span className={`mr-2 ${isDisabled ? 'text-gray-400' : 'text-brand-text-secondary'}`}>{prefix}</span>}
        <input
          type="number"
          className={`w-full px-2 py-1.5 border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-brand-primary focus:border-transparent text-sm ${
            isDisabled 
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed border-gray-200' 
              : 'bg-white text-brand-text-primary border-gray-300 dark:bg-brand-surface dark:text-brand-text-primary'
          }`}
          {...props}
        />
        {suffix && <span className={`ml-2 ${isDisabled ? 'text-gray-400' : 'text-brand-text-secondary'}`}>{suffix}</span> }
      </div>
    </div>
  );
};


interface SelectInputProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  children: React.ReactNode;
}

export const SelectInput: React.FC<SelectInputProps> = ({ label, children, ...props }) => {
    const isDisabled = props.disabled;
    return (
        <div className={`flex flex-col w-full transition-all duration-300 ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
            {label && <label className={`mb-1 text-sm font-medium ${isDisabled ? 'text-gray-400' : 'text-brand-text-secondary'}`}>{label}</label>}
            <select
                className={`w-full px-2 py-1.5 border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-brand-primary focus:border-transparent text-sm ${
                    isDisabled 
                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed border-gray-200' 
                        : 'bg-white text-brand-text-primary border-gray-300'
                }`}
                {...props}
            >
                {children}
            </select>
        </div>
    );
};

interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const TextInput: React.FC<TextInputProps> = ({ label, className, ...props }) => {
  const isDisabled = props.disabled;
  const baseClasses = `w-full px-2 py-1.5 border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-brand-primary focus:border-transparent text-sm ${
    isDisabled 
      ? 'bg-gray-200 text-gray-500 cursor-not-allowed border-gray-200' 
      : 'bg-white text-brand-text-primary border-gray-300'
  }`;
  
  return (
    <div className={`flex flex-col w-full transition-all duration-300 ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
      {label && <label className={`mb-1 text-sm font-medium ${isDisabled ? 'text-gray-400' : 'text-brand-text-secondary'}`}>{label}</label>}
      <input
        type="text"
        className={`${baseClasses} ${className || ''}`}
        {...props}
      />
    </div>
  );
};