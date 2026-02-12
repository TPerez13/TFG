import { type Dispatch, type SetStateAction, useCallback, useEffect, useState } from 'react';
import type { UserSummary } from '@muchasvidas/shared';
import { useAuth } from '../../navigation/AuthContext';
import { apiFetch } from '../../services/api';

type UseMeResult = {
  user: UserSummary | null;
  setUser: Dispatch<SetStateAction<UserSummary | null>>;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
};

export function useMe(): UseMeResult {
  const { signOut } = useAuth();
  const [user, setUser] = useState<UserSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiFetch('/users/me');

      if (response.status === 401) {
        await signOut();
        return;
      }

      if (!response.ok) {
        throw new Error('No se pudo cargar la informacion del perfil.');
      }

      const payload = (await response.json()) as { user?: UserSummary };
      setUser(payload.user ?? null);
    } catch (_error) {
      setError('No pudimos cargar tu informacion. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  }, [signOut]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { user, setUser, loading, error, reload };
}
