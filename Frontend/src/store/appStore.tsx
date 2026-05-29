import { PropsWithChildren, createContext, useCallback, useContext, useEffect, useMemo, useReducer } from 'react';
import { readJson, writeJson } from '../lib/storage';
import { Airport } from '../types/domain';

export interface RecentSearch {
  fromICAO: string;
  toICAO: string;
  timestamp: string;
}

interface AppState {
  selectedFrom?: Airport;
  selectedTo?: Airport;
  recentSearches: RecentSearch[];
  activeRouteId?: string;
  providerStatus?: unknown;
}

type Action =
  | { type: 'select-from'; airport?: Airport }
  | { type: 'select-to'; airport?: Airport }
  | { type: 'record-search'; fromICAO: string; toICAO: string }
  | { type: 'set-active-route'; routeId?: string }
  | { type: 'set-provider-status'; providerStatus: unknown };

interface AppStoreValue extends AppState {
  selectFrom: (airport?: Airport) => void;
  selectTo: (airport?: Airport) => void;
  recordSearch: (fromICAO: string, toICAO: string) => void;
  setActiveRoute: (routeId?: string) => void;
  setProviderStatus: (providerStatus: unknown) => void;
}

const storageKey = 'flight-navigation-store';
const AppStoreContext = createContext<AppStoreValue | undefined>(undefined);

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'select-from':
      return { ...state, selectedFrom: action.airport };
    case 'select-to':
      return { ...state, selectedTo: action.airport };
    case 'record-search': {
      const nextSearch = {
        fromICAO: action.fromICAO,
        toICAO: action.toICAO,
        timestamp: new Date().toISOString(),
      };
      const recentSearches = [
        nextSearch,
        ...state.recentSearches.filter(
          (search) => search.fromICAO !== action.fromICAO || search.toICAO !== action.toICAO,
        ),
      ].slice(0, 5);
      return { ...state, recentSearches };
    }
    case 'set-active-route':
      return { ...state, activeRouteId: action.routeId };
    case 'set-provider-status':
      return { ...state, providerStatus: action.providerStatus };
    default:
      return state;
  }
}

export function AppStoreProvider({ children }: PropsWithChildren) {
  const [state, dispatch] = useReducer(reducer, undefined, () =>
    readJson<AppState>(storageKey, { recentSearches: [] }),
  );

  useEffect(() => {
    writeJson(storageKey, {
      selectedFrom: state.selectedFrom,
      selectedTo: state.selectedTo,
      recentSearches: state.recentSearches,
      activeRouteId: state.activeRouteId,
    });
  }, [state]);

  const selectFrom = useCallback((airport?: Airport) => dispatch({ type: 'select-from', airport }), []);
  const selectTo = useCallback((airport?: Airport) => dispatch({ type: 'select-to', airport }), []);
  const recordSearch = useCallback(
    (fromICAO: string, toICAO: string) => dispatch({ type: 'record-search', fromICAO, toICAO }),
    [],
  );
  const setActiveRoute = useCallback((routeId?: string) => dispatch({ type: 'set-active-route', routeId }), []);
  const setProviderStatus = useCallback(
    (providerStatus: unknown) => dispatch({ type: 'set-provider-status', providerStatus }),
    [],
  );

  const value = useMemo<AppStoreValue>(
    () => ({
      ...state,
      selectFrom,
      selectTo,
      recordSearch,
      setActiveRoute,
      setProviderStatus,
    }),
    [recordSearch, selectFrom, selectTo, setActiveRoute, setProviderStatus, state],
  );

  return <AppStoreContext.Provider value={value}>{children}</AppStoreContext.Provider>;
}

export function useAppStore(): AppStoreValue {
  const context = useContext(AppStoreContext);
  if (!context) throw new Error('useAppStore must be used inside AppStoreProvider');
  return context;
}
