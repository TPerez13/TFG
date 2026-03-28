import Module from 'module';

type AsyncStorageShape = {
  clear: () => Promise<void>;
  getItem: (key: string) => Promise<string | null>;
  removeItem: (key: string) => Promise<void>;
  setItem: (key: string, value: string) => Promise<void>;
};

const moduleWithLoad = Module as typeof Module & {
  _load: (request: string, parent: NodeModule | null, isMain: boolean) => unknown;
};

const storage = new Map<string, string>();

const asyncStorageStub: AsyncStorageShape = {
  async clear() {
    storage.clear();
  },
  async getItem(key: string) {
    return storage.get(key) ?? null;
  },
  async removeItem(key: string) {
    storage.delete(key);
  },
  async setItem(key: string, value: string) {
    storage.set(key, value);
  },
};

const reactNativeStub = {
  Alert: {
    alert: () => undefined,
  },
  Platform: {
    OS: 'ios',
    select<T>(options: { android?: T; default?: T; ios?: T }) {
      return options.ios ?? options.default;
    },
  },
};

const expoNotificationsStub = {
  AndroidImportance: {
    DEFAULT: 3,
    HIGH: 4,
    MAX: 5,
  },
  SchedulableTriggerInputTypes: {
    CALENDAR: 'calendar',
    DATE: 'date',
  },
  cancelScheduledNotificationAsync: async () => undefined,
  getAllScheduledNotificationsAsync: async () => [],
  getPermissionsAsync: async () => ({ status: 'granted' }),
  requestPermissionsAsync: async () => ({ status: 'granted' }),
  scheduleNotificationAsync: async () => 'test-notification-id',
  setNotificationChannelAsync: async () => undefined,
  setNotificationHandler: () => undefined,
};

const originalLoad = moduleWithLoad._load.bind(moduleWithLoad);

moduleWithLoad._load = function patchedLoad(
  request: string,
  parent: NodeModule | null,
  isMain: boolean
) {
  if (request === 'react-native') {
    return reactNativeStub;
  }

  if (request === '@react-native-async-storage/async-storage') {
    return {
      __esModule: true,
      default: asyncStorageStub,
    };
  }

  if (request === 'expo-notifications') {
    return expoNotificationsStub;
  }

  return originalLoad(request, parent, isMain);
};

process.env.NODE_ENV = 'test';
(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;
