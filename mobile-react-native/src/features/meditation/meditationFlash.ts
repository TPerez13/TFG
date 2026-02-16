type MeditationFlashPayload = {
  message: string;
  undoEntryId?: number;
};

type Listener = (payload: MeditationFlashPayload) => void;

const listeners = new Set<Listener>();
let pendingPayload: MeditationFlashPayload | null = null;

export const emitMeditationFlash = (payload: MeditationFlashPayload) => {
  pendingPayload = payload;
  listeners.forEach((listener) => listener(payload));
};

export const subscribeMeditationFlash = (listener: Listener) => {
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
