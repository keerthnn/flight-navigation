import { PropsWithChildren, createContext, useContext, useMemo, useState } from 'react';
import { AppStoreProvider } from '../store/appStore';

type Theme = 'dark' | 'light';

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function AppProviders({ children }: PropsWithChildren) {
  const [theme, setTheme] = useState<Theme>('dark');
  const value = useMemo(
    () => ({
      theme,
      toggleTheme: () => setTheme((current) => (current === 'dark' ? 'light' : 'dark')),
    }),
    [theme],
  );

  return (
    <ThemeContext.Provider value={value}>
      <AppStoreProvider>
        <div data-theme={theme}>{children}</div>
      </AppStoreProvider>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used inside AppProviders');
  return context;
}
