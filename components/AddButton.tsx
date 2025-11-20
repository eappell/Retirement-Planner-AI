import React from 'react';

interface AddButtonProps {
  label?: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  ariaLabel?: string;
  variant?: 'primary' | 'outline' | 'muted';
  icon?: React.ReactNode;
}

const AddButton: React.FC<AddButtonProps> = ({ label = '+ Add', onClick, disabled = false, className = '', ariaLabel, variant = 'primary', icon }) => {
  const base = 'inline-flex items-center px-3 py-1.5 rounded-full text-sm shadow-sm';
  const variantMap: { [k in NonNullable<AddButtonProps['variant']>]: string } = {
    primary: 'bg-brand-primary text-white hover:opacity-90',
    outline: 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50',
    muted: 'bg-gray-200 text-gray-500'
  };
  const disabledClasses = 'bg-gray-200 text-gray-500 cursor-not-allowed';

  const applied = disabled ? disabledClasses : variantMap[variant];

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel || (typeof label === 'string' ? label : 'Add')}
      className={`${base} ${applied} ${className}`}
    >
      {icon && <span className="mr-2 inline-flex items-center">{icon}</span>}
      {label}
    </button>
  );
};

export default AddButton;
