import assert from 'node:assert/strict';
import { afterEach, describe, it, mock } from 'node:test';
import { apiFetch } from '../../src/services/api';
import {
  buildApiUrl,
  getApiBaseUrl,
  getConfiguredApiBaseUrl,
  getDevelopmentApiBaseUrl,
  normalizeApiBaseUrl,
} from '../../src/config/api';

const ORIGINAL_API_URL = process.env.EXPO_PUBLIC_API_URL;
const ORIGINAL_NODE_ENV = process.env.NODE_ENV;

afterEach(() => {
  mock.restoreAll();

  if (ORIGINAL_API_URL === undefined) {
    Reflect.deleteProperty(process.env, 'EXPO_PUBLIC_API_URL');
  } else {
    process.env.EXPO_PUBLIC_API_URL = ORIGINAL_API_URL;
  }

  if (ORIGINAL_NODE_ENV === undefined) {
    Reflect.deleteProperty(process.env, 'NODE_ENV');
  } else {
    process.env.NODE_ENV = ORIGINAL_NODE_ENV;
  }
});

describe('api configuration', () => {
  it('normalizes configured base urls and strips /api', () => {
    assert.equal(normalizeApiBaseUrl('192.168.1.34:3000/api/'), 'http://192.168.1.34:3000');
    assert.equal(normalizeApiBaseUrl('https://api.example.com/api'), 'https://api.example.com');
  });

  it('reads EXPO_PUBLIC_API_URL as the single source of truth when provided', () => {
    process.env.EXPO_PUBLIC_API_URL = '192.168.1.50:3000/api';

    assert.equal(getConfiguredApiBaseUrl(), 'http://192.168.1.50:3000');
    assert.equal(getApiBaseUrl(), 'http://192.168.1.50:3000');
    assert.equal(buildApiUrl('/health'), 'http://192.168.1.50:3000/api/health');
  });

  it('falls back to the simulator default during development when no env is set', () => {
    Reflect.deleteProperty(process.env, 'EXPO_PUBLIC_API_URL');
    process.env.NODE_ENV = 'development';

    assert.equal(getApiBaseUrl(), getDevelopmentApiBaseUrl());
  });

  it('requires EXPO_PUBLIC_API_URL outside development', () => {
    Reflect.deleteProperty(process.env, 'EXPO_PUBLIC_API_URL');
    process.env.NODE_ENV = 'production';

    assert.throws(() => getApiBaseUrl(), /EXPO_PUBLIC_API_URL es obligatoria/);
  });

  it('surfaces a network error with the resolved backend url', async () => {
    process.env.EXPO_PUBLIC_API_URL = 'http://192.168.1.50:3000';

    mock.method(globalThis, 'fetch', async () => {
      throw new TypeError('Network request failed');
    });

    await assert.rejects(
      () => apiFetch('/login'),
      (error: unknown) => {
        assert.ok(error instanceof Error);
        assert.match(error.message, /192\.168\.1\.50:3000/);
        assert.match(error.message, /EXPO_PUBLIC_API_URL/);
        return true;
      }
    );
  });
});
