type ExerciseFlashPayload = {
  message: string;
  undoEntryId?: number;
};

type Listener = (payload: ExerciseFlashPayload) => void;

const listeners = new Set<Listener>();
let pendingPayload: ExerciseFlashPayload | null = null;

export const emitExerciseFlash = (payload: ExerciseFlashPayload) => {
  pendingPayload = payload;
  listeners.forEach((listener) => listener(payload));
};

export const subscribeExerciseFlash = (listener: Listener) => {
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
