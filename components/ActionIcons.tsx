import React from 'react';

interface ActionIconsProps {
  onAdd: () => void;
  onRemove?: () => void;
  canRemove?: boolean;
}

const ActionIcons: React.FC<ActionIconsProps> = ({ onAdd, onRemove, canRemove = true }) => {
  return (
    <div className="flex items-center space-x-2">
      <button type="button" onClick={onAdd} aria-label="Add" className="p-1 rounded-md hover:bg-gray-100">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
          <path d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" />
        </svg>
      </button>
      <button type="button" onClick={onRemove} aria-label="Remove" disabled={!canRemove} className={`p-1 rounded-md ${!canRemove ? 'opacity-40 cursor-not-allowed' : 'hover:bg-gray-100'}`}>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-600" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M6 7a1 1 0 011-1h6a1 1 0 011 1v8a2 2 0 01-2 2H8a2 2 0 01-2-2V7zm3-3a1 1 0 00-1 1v1h6V5a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
      </button>
    </div>
  );
};

export default ActionIcons;
