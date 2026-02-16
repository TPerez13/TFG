type NutritionFlashPayload = {
  message: string;
  undoEntryId?: number;
};

type Listener = (payload: NutritionFlashPayload) => void;

const listeners = new Set<Listener>();

export const emitNutritionFlash = (payload: NutritionFlashPayload) => {
  listeners.forEach((listener) => listener(payload));
};

export const subscribeNutritionFlash = (listener: Listener) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
