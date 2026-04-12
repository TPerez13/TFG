import { buildApiUrl, getApiBaseUrl } from '../config/api';

let authToken: string | null = null;

export const setAuthToken = (token?: string | null) => {
  authToken = token ?? null;
};

export const apiFetch = async (path: string, options: RequestInit = {}) => {
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

  try {
    return await fetch(buildApiUrl(path), {
      ...options,
      headers,
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(
      `No se pudo conectar con ${getApiBaseUrl()}. Revisa EXPO_PUBLIC_API_URL o usa la IP LAN de tu ordenador si pruebas desde un movil fisico. Detalle: ${detail}`
    );
  }
};
