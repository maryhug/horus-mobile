import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { getItem, setItem } from '../utils/storage';
import { darkColors, lightColors, AppColors } from '../constants/colors';

const THEME_KEY = 'horus_theme';

type ThemeContextType = {
  isDark: boolean;
  colors: AppColors;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType>({
  isDark: true,
  colors: darkColors,
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    getItem(THEME_KEY).then(val => {
      if (val === 'light') setIsDark(false);
    });
  }, []);

  const toggleTheme = () => {
    setIsDark(prev => {
      const next = !prev;
      setItem(THEME_KEY, next ? 'dark' : 'light');
      return next;
    });
  };

  const value = useMemo(
    () => ({ isDark, colors: isDark ? darkColors : lightColors, toggleTheme }),
    [isDark]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
