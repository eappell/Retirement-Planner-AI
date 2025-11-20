import React from 'react';

interface DisclaimerModalProps {
  isOpen: boolean;
  requireAccept?: boolean; // if true, user must click Accept to dismiss
  onAccept: () => void;
  onClose?: () => void;
}

export const DisclaimerModal: React.FC<DisclaimerModalProps> = ({ isOpen, requireAccept = false, onAccept, onClose }) => {
  if (!isOpen) return null;

  const handleBackdrop = () => {
    if (!requireAccept && onClose) onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={handleBackdrop}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-xl w-full p-6" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-semibold text-brand-text-primary dark:text-white">Important Disclaimer</h2>
        <div className="mt-3 text-sm text-brand-text-secondary dark:text-gray-200 space-y-3">
          <p>These numbers are for general planning purposes only. They are estimates and should not be considered exact figures.</p>
          <p>I am not an accountant or financial advisor. Please double- and triple-check these numbers with qualified professionals before making important financial decisions.</p>
          <p>You are responsible for your own financial planning. We do not accept responsibility for any decisions you make based on inaccurate or incomplete data provided to the planner.</p>
        </div>

        <div className="mt-6 flex justify-end space-x-2">
          {requireAccept ? (
            // When acceptance is required (first-load), show only Accept
            <button onClick={onAccept} className="px-4 py-2 rounded-md bg-brand-primary text-white text-sm hover:opacity-95">Accept</button>
          ) : (
            // When not required (header popover), show only Close
            onClose && <button onClick={onClose} className="px-4 py-2 rounded-md border text-sm bg-gray-100 hover:bg-gray-200">Close</button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DisclaimerModal;
