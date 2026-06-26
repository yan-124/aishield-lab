import React, { useReducer, useEffect, useRef } from 'react';
import { getAuthToken, clearAuth } from '../services/authFetch';
import { AppState, AppAction, PracticeRecord } from '../types';
import { AppContext } from '../context/AppContext';

// Hash ↔ ViewMode mapping
const HASH_VIEW_MAP: Record<string, AppState['viewMode']> = {
  '': 'home',
  'home': 'home',
  'knowledge': 'knowledge',
  'videos': 'videos',
  'interview': 'interview',
  'range': 'range',
  'range-level': 'range-level',
  'community': 'community',
  'jobs': 'jobs',
  'news': 'news',
  'news-detail': 'news-detail',
  'settings': 'settings',
  'my': 'my',
  'learning-progress': 'learning-progress',
  'learning-path': 'learning-path',
  'practice-records': 'practice-records',
  'leaderboard': 'leaderboard',
  'user-profile': 'user-profile',
  'career-guide': 'career-guide',
  'pricing': 'pricing',
  'credits': 'credits',
  'enterprise': 'enterprise',
  'admin': 'admin',
};

const VIEW_HASH_MAP: Record<string, string> = {};
for (const [hash, view] of Object.entries(HASH_VIEW_MAP)) {
  if (!VIEW_HASH_MAP[view] || hash === view) VIEW_HASH_MAP[view] = hash;
}

function getInitialViewMode(): AppState['viewMode'] {
  const hash = window.location.hash.replace('#', '');
  return HASH_VIEW_MAP[hash] || 'home';
}

const initialState: AppState = {
  viewMode: getInitialViewMode(),
  currentLevel: null,
  currentArticleId: null,
  chatMessages: [],
  isLoading: false,
  error: null,
  theme: loadTheme(),
  user: loadUser(),
  showRegister: false,
      showLogin: false,
  registerStep: 0,
  searchQuery: '',
  showSearch: false,
  gameProfile: { level: 1, xp: 0, badges: [], streak: 0, lastActive: new Date().toISOString() },
  practiceRecords: loadPracticeRecords(),
  showLevelUp: null,
  completedLevels: new Set<string>(),
};

function loadUser(): AppState['user'] {
  try {
    const stored = localStorage.getItem('aishield_user');
    return stored ? JSON.parse(stored) : null;
  } catch { return null; }
}

function loadTheme(): AppState['theme'] {
  try {
    const stored = localStorage.getItem('aishield_theme');
    return stored === 'light' ? 'light' : 'dark';
  } catch { return 'dark'; }
}

function loadPracticeRecords(): PracticeRecord[] {
  try {
    const stored = localStorage.getItem('aishield-practice-records');
    return stored ? JSON.parse(stored) : [];
  } catch { return []; }
}

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_VIEW_MODE':
      return { ...state, viewMode: action.payload, error: null };
    case 'SET_CURRENT_LEVEL':
      return { ...state, currentLevel: action.payload, chatMessages: action.payload ? [] : state.chatMessages };
    case 'ADD_CHAT_MESSAGE':
      return { ...state, chatMessages: [...state.chatMessages, action.payload] };
    case 'CLEAR_CHAT':
      return { ...state, chatMessages: [] };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_USER': {
      const user = action.payload;
      try { localStorage.setItem('aishield_user', JSON.stringify(user)); } catch {}
      try { if ((user as any)?.token) localStorage.setItem('aishield_token', (user as any).token); } catch {}
      return { ...state, user };
    }
    case 'LOGOUT': {
      try { localStorage.removeItem('aishield_user'); localStorage.removeItem('aishield_token'); } catch {}
      return { ...state, user: null };
    }
    case 'SHOW_REGISTER':
      return { ...state, showRegister: true, registerStep: 0 };
    case 'HIDE_REGISTER':
      return { ...state, showRegister: false };
    case 'SHOW_LOGIN':
      return { ...state, showLogin: true };
    case 'HIDE_LOGIN':
      return { ...state, showLogin: false };
    case 'SET_REGISTER_STEP':
      return { ...state, registerStep: action.payload };
    case 'SET_CURRENT_ARTICLE':
      return { ...state, currentArticleId: action.payload };
    case 'SET_SEARCH_QUERY':
      return { ...state, searchQuery: action.payload };
    case 'TOGGLE_SEARCH':
      return { ...state, showSearch: !state.showSearch, searchQuery: action.payload === undefined ? '' : state.searchQuery };
    case 'SET_GAME_PROFILE':
      return { ...state, gameProfile: { ...state.gameProfile, ...action.payload } };
    case 'SHOW_LEVEL_UP':
      return { ...state, showLevelUp: action.payload };
    case 'ADD_PRACTICE_RECORD': {
      const records = [...state.practiceRecords, action.payload];
      localStorage.setItem('aishield-practice-records', JSON.stringify(records));
      return { ...state, practiceRecords: records };
    }
    case 'SET_PRACTICE_RECORDS':
      return { ...state, practiceRecords: action.payload };
    case 'TOGGLE_THEME': {
      const next = state.theme === 'dark' ? 'light' : 'dark';
      try { localStorage.setItem('aishield_theme', next); } catch {}
      return { ...state, theme: next };
    }
    default:
      return state;
  }
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Verify auth token on mount
  React.useEffect(() => {
    const token = localStorage.getItem('aishield_token');
    const user = localStorage.getItem('aishield_user');
    if (token && user) {
      fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.ok ? r.json() : Promise.reject())
        .then(data => { dispatch({ type: 'SET_USER', payload: { ...data.user, isLoggedIn: true, token } }); })
        .catch(() => { try { localStorage.removeItem('aishield_token'); localStorage.removeItem('aishield_user'); } catch {} dispatch({ type: 'LOGOUT' }); });
    }
  }, []);

  // Periodic token validation (every 5 minutes)
  const tokenCheckRef = useRef<ReturnType<typeof setInterval>>()
  useEffect(() => {
    const checkToken = () => {
      const token = getAuthToken()
      if (!token) return
      fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
        .then(r => { if (!r.ok) { clearAuth(); dispatch({ type: 'LOGOUT' }) } })
        .catch(() => {})
    }
    tokenCheckRef.current = setInterval(checkToken, 5 * 60 * 1000)
    return () => { if (tokenCheckRef.current) clearInterval(tokenCheckRef.current) }
  }, [])

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', state.theme);
  }, [state.theme]);

  // Sync hash → state on popstate (back/forward)
  useEffect(() => {
    const onHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      const view = HASH_VIEW_MAP[hash] || 'home';
      if (view !== state.viewMode) {
        dispatch({ type: 'SET_VIEW_MODE', payload: view });
      }
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, [state.viewMode]);

  // Sync state → hash on view change
  useEffect(() => {
    const targetHash = VIEW_HASH_MAP[state.viewMode] || '';
    const currentHash = window.location.hash.replace('#', '');
    if (targetHash !== currentHash) {
      window.location.hash = targetHash;
    }
  }, [state.viewMode]);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};
