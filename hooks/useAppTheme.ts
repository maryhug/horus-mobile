import { useTheme } from '../contexts/ThemeContext';
import { LIGHT, DARK } from '../constants/theme';

export function useAppTheme() {
  const { isDark, toggleTheme } = useTheme();
  return { ...(isDark ? DARK : LIGHT), isDark, toggleTheme };
}
