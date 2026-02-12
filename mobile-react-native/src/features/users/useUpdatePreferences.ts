import { useState } from 'react';
import { useAuth } from '../../navigation/AuthContext';
import { apiFetch } from '../../services/api';
import { mergePreferences, type PreferencesMap, type PreferencesPatch } from './preferences';

type UseUpdatePreferencesResult = {
  saving: boolean;
  error: string | null;
  clearError: () => void;
  updatePreferences: (
    current: Record<string, unknown> | null | undefined,
    patch: PreferencesPatch
  ) => Promise<PreferencesMap | null>;
};

export function useUpdatePreferences(): UseUpdatePreferencesResult {
  const { signOut } = useAuth();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  const updatePreferences = async (
    current: Record<string, unknown> | null | undefined,
    patch: PreferencesPatch
  ): Promise<PreferencesMap | null> => {
    try {
      setSaving(true);
      setError(null);

      const merged = mergePreferences(current, patch);
      const response = await apiFetch('/users/me', {
        method: 'PUT',
        body: JSON.stringify({ preferencias: merged }),
      });

      if (response.status === 401) {
        await signOut();
        return null;
      }

      if (!response.ok) {
        throw new Error('No se pudieron guardar los cambios.');
      }

      const payload = (await response.json()) as { preferencias?: PreferencesMap };
      return payload.preferencias ?? merged;
    } catch (_error) {
      setError('No se pudieron guardar los cambios de privacidad.');
      return null;
    } finally {
      setSaving(false);
    }
  };

  return {
    saving,
    error,
    clearError,
    updatePreferences,
  };
}
