import React from 'react';

interface ActionIconsProps {
  onAdd: () => void;
  onRemove?: () => void;
  canRemove?: boolean;
}

const ActionIcons: React.FC<ActionIconsProps> = ({ onAdd, onRemove, canRemove = true }) => {
  return (
    <div className="flex items-center space-x-2">
      <button
        type="button"
        onClick={onAdd}
        aria-label="Add"
        className="inline-flex items-center justify-center h-7 w-7 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-100 hover:bg-emerald-100"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>

      <button
        type="button"
        onClick={onRemove}
        aria-label="Remove"
        disabled={!canRemove}
        className={`inline-flex items-center justify-center h-7 w-7 rounded-md ${!canRemove ? 'border border-gray-200 text-gray-300 cursor-not-allowed bg-gray-50' : 'bg-red-50 text-red-700 border border-red-100 hover:bg-red-100'}`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m5 0V4a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v2" />
        </svg>
      </button>
    </div>
  );
};

export default ActionIcons;
