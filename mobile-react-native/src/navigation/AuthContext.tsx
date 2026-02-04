import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setAuthToken } from '../services/api';

type AuthContextValue = {
  token: string | null;
  loading: boolean;
  signIn: (token: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const STORAGE_KEY = 'auth_token';
/**
 * Lo mismo que esto:
type Props = { children: React.ReactNode };

export function AuthProvider(props: Props) {
  const { children } = props;
  ...
}
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const restoreSession = async () => {
      try {
        const storedToken = await AsyncStorage.getItem(STORAGE_KEY);
        if (mounted) {
          setToken(storedToken);
          setAuthToken(storedToken);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    restoreSession();
    return () => {
      mounted = false;
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      loading,
      signIn: async (nextToken: string) => {
        setToken(nextToken);
        setAuthToken(nextToken);
        await AsyncStorage.setItem(STORAGE_KEY, nextToken);
      },
      signOut: async () => {
        setToken(null);
        setAuthToken(null);
        await AsyncStorage.removeItem(STORAGE_KEY);
      },
    }),
    [token, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
