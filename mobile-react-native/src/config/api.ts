import { Platform } from 'react-native';

const ANDROID_EMULATOR_API_BASE_URL = 'http://10.0.2.2:3000';
const IOS_SIMULATOR_API_BASE_URL = 'http://localhost:3000';

const withProtocol = (value: string) =>
  /^[a-z][a-z0-9+.-]*:\/\//i.test(value) ? value : `http://${value}`;

const isDevelopmentRuntime = () => process.env.NODE_ENV !== 'production';

export const normalizeApiBaseUrl = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error('EXPO_PUBLIC_API_URL no puede estar vacia.');
  }

  const parsed = new URL(withProtocol(trimmed));
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('EXPO_PUBLIC_API_URL debe usar http:// o https://.');
  }

  const normalizedPath = parsed.pathname.replace(/\/+$/g, '').replace(/\/api$/i, '');

  return `${parsed.origin}${normalizedPath === '/' ? '' : normalizedPath}`;
};

export const getConfiguredApiBaseUrl = () => {
  const configuredBaseUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (!configuredBaseUrl) {
    return null;
  }

  try {
    return normalizeApiBaseUrl(configuredBaseUrl);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(`EXPO_PUBLIC_API_URL es invalida. ${detail}`);
  }
};

export const getDevelopmentApiBaseUrl = () =>
  Platform.OS === 'android' ? ANDROID_EMULATOR_API_BASE_URL : IOS_SIMULATOR_API_BASE_URL;

export const getApiBaseUrl = () => {
  const configuredBaseUrl = getConfiguredApiBaseUrl();
  if (configuredBaseUrl) {
    return configuredBaseUrl;
  }

  if (isDevelopmentRuntime()) {
    return getDevelopmentApiBaseUrl();
  }

  throw new Error('EXPO_PUBLIC_API_URL es obligatoria fuera de desarrollo.');
};

export const buildApiUrl = (path: string) => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${getApiBaseUrl()}/api${normalizedPath}`;
};
