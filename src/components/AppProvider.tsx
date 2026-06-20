import React, { useReducer } from 'react';
import { AppState, AppAction, PracticeRecord } from '../types';
import { AppContext } from '../context/AppContext';

const initialState: AppState = {
  viewMode: 'home',
  currentLevel: null,
  currentArticleId: null,
  chatMessages: [],
  isLoading: false,
  error: null,
  theme: 'dark',
  user: null,
  showRegister: false,
  registerStep: 0,
  searchQuery: '',
  showSearch: false,
  gameProfile: { level: 1, xp: 0, badges: [], streak: 0, lastActive: new Date().toISOString() },
  practiceRecords: loadPracticeRecords(),
  showLevelUp: null,
};

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
    case 'SET_USER':
      return { ...state, user: action.payload };
    case 'SHOW_REGISTER':
      return { ...state, showRegister: true, registerStep: 0 };
    case 'HIDE_REGISTER':
      return { ...state, showRegister: false };
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
    default:
      return state;
  }
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};
