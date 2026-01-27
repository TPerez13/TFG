import { Platform } from 'react-native';

let authToken: string | null = null;

export const getBaseUrl = () => {
  if (Platform.OS === 'android') return 'http://10.0.2.2:3000';
  return 'http://localhost:3000';
};

export const setAuthToken = (token?: string | null) => {
  authToken = token ?? null;
};

export const getAuthToken = () => authToken;

export const apiFetch = (path: string, options: RequestInit = {}) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (options.headers) {
    Object.entries(options.headers as Record<string, string>).forEach(([key, value]) => {
      headers[key] = value;
    });
  }

  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  return fetch(`${getBaseUrl()}/api${path}`, {
    ...options,
    headers,
  });
};
