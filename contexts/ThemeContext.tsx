import React, { createContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (t: Theme) => void;
}

export const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export const ThemeProvider: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>('light');
  const [isEmbedded, setIsEmbedded] = useState(false);

  // Detect if running in iframe
  useEffect(() => {
    setIsEmbedded(window.self !== window.top);
  }, []);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('theme');
      if (stored === 'dark' || stored === 'light') {
        setTheme(stored);
        return;
      }
    } catch (e) {
      // ignore localStorage errors
    }
  }, []);

  // If no explicit preference is stored, respect the OS/browser preference
  useEffect(() => {
    try {
      const stored = localStorage.getItem('theme');
      if (!stored && window.matchMedia) {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setTheme(prefersDark ? 'dark' : 'light');
      }
    } catch (e) {
      // ignore
    }
  }, []);

  // Listen for theme changes from portal
  useEffect(() => {
    if (!isEmbedded) return;

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'THEME_CHANGE') {
        const newTheme = event.data.theme as Theme;
        if (newTheme === 'dark' || newTheme === 'light') {
          setTheme(newTheme);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [isEmbedded]);

  useEffect(() => {
    try {
      document.documentElement.classList.toggle('theme-dark', theme === 'dark');
      localStorage.setItem('theme', theme);
    } catch (e) {
      // ignore
    }
  }, [theme]);

  const toggleTheme = () => setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>{children}</ThemeContext.Provider>
  );
};

export default ThemeProvider;
