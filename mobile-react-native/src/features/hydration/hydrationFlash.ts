type HydrationFlashPayload = {
  message: string;
  undoEntryId?: number;
};

type Listener = (payload: HydrationFlashPayload) => void;

const listeners = new Set<Listener>();

export const emitHydrationFlash = (payload: HydrationFlashPayload) => {
  listeners.forEach((listener) => listener(payload));
};

export const subscribeHydrationFlash = (listener: Listener) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
