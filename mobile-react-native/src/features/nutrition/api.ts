import { apiFetch } from '../../services/api';
import type {
  CreateNutritionEntryPayload,
  FoodTemplate,
  NutritionEntry,
  NutritionTodayData,
  MealType,
} from './types';

const parseErrorMessage = async (response: Response, fallback: string) => {
  try {
    const payload = (await response.json()) as { message?: string };
    return payload.message ?? fallback;
  } catch {
    return fallback;
  }
};

export async function fetchNutritionToday(date: string, tipoComida?: MealType): Promise<NutritionTodayData> {
  const query = new URLSearchParams({ date });
  if (tipoComida) {
    query.append('tipoComida', tipoComida);
  }

  const response = await apiFetch(`/nutrition/today?${query.toString()}`);
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response, 'No se pudo cargar la alimentacion de hoy.'));
  }

  return (await response.json()) as NutritionTodayData;
}

export async function fetchRecentFoods(limit = 10): Promise<FoodTemplate[]> {
  const response = await apiFetch(`/nutrition/recent?limit=${limit}`);
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response, 'No se pudieron cargar recientes.'));
  }

  const payload = (await response.json()) as { items?: FoodTemplate[] };
  return payload.items ?? [];
}

export async function fetchFrequentFoods(limit = 10): Promise<FoodTemplate[]> {
  const response = await apiFetch(`/nutrition/frequent?limit=${limit}`);
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response, 'No se pudieron cargar frecuentes.'));
  }

  const payload = (await response.json()) as { items?: FoodTemplate[] };
  return payload.items ?? [];
}

export async function createNutritionEntry(payload: CreateNutritionEntryPayload): Promise<NutritionEntry> {
  const response = await apiFetch('/nutrition/entries', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response, 'No se pudo registrar la comida.'));
  }

  const body = (await response.json()) as { entry?: NutritionEntry };
  if (!body.entry) {
    throw new Error('Respuesta invalida al registrar comida.');
  }
  return body.entry;
}

export async function deleteNutritionEntry(entryId: number): Promise<void> {
  const response = await apiFetch(`/nutrition/entries/${entryId}`, { method: 'DELETE' });
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response, 'No se pudo eliminar el registro.'));
  }
}
