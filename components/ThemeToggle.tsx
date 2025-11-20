import React from 'react';
import useTheme from '../hooks/useTheme';

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-pressed={theme === 'dark'}
      title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
      className="flex items-center space-x-2 text-sm text-gray-600 hover:text-brand-primary transition-colors font-medium p-2 rounded-md hover:bg-gray-100"
    >
      {theme === 'dark' ? (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.293 13.293A8 8 0 116.707 2.707a7 7 0 0010.586 10.586z"/></svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4.22 2.03a1 1 0 011.415 0l.707.707a1 1 0 11-1.415 1.415l-.707-.707a1 1 0 010-1.415zM18 9a1 1 0 110 2h-1a1 1 0 110-2h1zM6.343 5.343a1 1 0 10-1.414-1.414L4.222 4.636a1 1 0 101.414 1.414l.707-.707zM10 16a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zm-6-6a1 1 0 110 2H3a1 1 0 110-2h1zm1.343 6.657a1 1 0 011.414 1.414l-.707.707a1 1 0 11-1.414-1.414l.707-.707zM15.657 15.657a1 1 0 10-1.414 1.414l.707.707a1 1 0 001.414-1.414l-.707-.707z"/></svg>
      )}
      <span className="sr-only">Toggle theme</span>
    </button>
  );
};

export default ThemeToggle;
