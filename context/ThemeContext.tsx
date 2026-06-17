'use client';

import React, { createContext, useContext, useEffect, useLayoutEffect, useState, useCallback, useMemo } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme | undefined;
  isDarkMode: boolean;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const getSystemTheme = () =>
    window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

  const getInitialTheme = (): Theme | undefined => {
    if (typeof window === 'undefined') return undefined;

    return (localStorage.getItem('theme') as Theme | null) || getSystemTheme();
  };

  const [theme, setThemeState] = useState<Theme | undefined>(() => {
    if (typeof window === 'undefined') return undefined;
    return (localStorage.getItem('theme') as Theme | null) || getSystemTheme();
  });

  const applyTheme = useCallback((newTheme: Theme) => {
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  useLayoutEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    if (theme) {
      applyTheme(theme);
    }

    const handleSystemThemeChange = () => {
      if (localStorage.getItem('theme')) return;

      const nextTheme = mediaQuery.matches ? 'dark' : 'light';
      setThemeState(nextTheme);
      applyTheme(nextTheme);
    };

    mediaQuery.addEventListener('change', handleSystemThemeChange);
    return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
  }, [theme, applyTheme]);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);
    applyTheme(newTheme);
  }, [applyTheme]);

  const toggleTheme = useCallback(() => {
    setThemeState(prev => {
      const nextTheme = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem('theme', nextTheme);
      applyTheme(nextTheme);
      return nextTheme;
    });
  }, [applyTheme]);

  const isDarkMode = theme === 'dark';

  const value = useMemo(() => ({
    theme,
    isDarkMode,
    toggleTheme,
    setTheme
  }), [theme, isDarkMode, toggleTheme, setTheme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
