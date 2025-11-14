import React from 'react';

interface NumberInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  prefix?: string;
  suffix?: string;
}

export const NumberInput: React.FC<NumberInputProps> = ({ label, prefix, suffix, ...props }) => {
  return (
    <div className="flex flex-col w-full">
      {label && <label className="mb-1 text-sm font-medium text-brand-text-secondary">{label}</label>}
      <div className="flex items-center">
        {prefix && <span className="text-gray-500 mr-2">{prefix}</span>}
        <input
          type="number"
          className="w-full px-2 py-1.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-brand-primary focus:border-transparent bg-white text-sm"
          {...props}
        />
        {suffix && <span className="text-gray-500 ml-2">{suffix}</span>}
      </div>
    </div>
  );
};


interface SelectInputProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  children: React.ReactNode;
}

export const SelectInput: React.FC<SelectInputProps> = ({ label, children, ...props }) => {
    return (
        <div className="flex flex-col w-full">
            {label && <label className="mb-1 text-sm font-medium text-brand-text-secondary">{label}</label>}
            <select
                className="w-full px-2 py-1.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-brand-primary focus:border-transparent bg-white text-sm"
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
  const baseClasses = "w-full px-2 py-1.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-brand-primary focus:border-transparent bg-white text-sm text-black";
  
  return (
    <div className="flex flex-col w-full">
      {label && <label className="mb-1 text-sm font-medium text-brand-text-secondary">{label}</label>}
      <input
        type="text"
        className={`${baseClasses} ${className || ''}`}
        {...props}
      />
    </div>
  );
};