type SleepFlashPayload = {
  message: string;
  undoEntryId?: number;
};

type Listener = (payload: SleepFlashPayload) => void;

const listeners = new Set<Listener>();
let pendingPayload: SleepFlashPayload | null = null;

export const emitSleepFlash = (payload: SleepFlashPayload) => {
  pendingPayload = payload;
  listeners.forEach((listener) => listener(payload));
};

export const subscribeSleepFlash = (listener: Listener) => {
  listeners.add(listener);
  if (pendingPayload) {
    const payload = pendingPayload;
    pendingPayload = null;
    listener(payload);
  }
  return () => {
    listeners.delete(listener);
  };
};
