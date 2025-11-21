import React from 'react';

interface ToastProps {
  message: string | null;
}

export const Toast: React.FC<ToastProps> = ({ message }) => {
  if (!message) return null;
  return (
    <div className="fixed right-4 bottom-6 z-50">
      <div className="bg-black text-white text-sm px-4 py-2 rounded shadow">{message}</div>
    </div>
  );
};

export default Toast;
