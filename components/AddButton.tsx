import React from 'react';

interface AddButtonProps {
  label?: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  ariaLabel?: string;
}

const AddButton: React.FC<AddButtonProps> = ({ label = '+ Add', onClick, disabled = false, className = '', ariaLabel }) => {
  const base = 'inline-flex items-center px-3 py-1.5 rounded-full text-sm shadow-sm';
  const enabledClasses = 'bg-brand-primary text-white hover:opacity-90';
  const disabledClasses = 'bg-gray-200 text-gray-500 cursor-not-allowed';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel || (typeof label === 'string' ? label : 'Add')}
      className={`${base} ${disabled ? disabledClasses : enabledClasses} ${className}`}
    >
      {label}
    </button>
  );
};

export default AddButton;
