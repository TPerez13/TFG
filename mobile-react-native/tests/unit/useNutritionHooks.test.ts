import assert from 'node:assert/strict';
import { afterEach, describe, it, mock } from 'node:test';
import * as nutritionApi from '../../src/features/nutrition/api';
import { useFrequentFoods } from '../../src/features/nutrition/useFrequentFoods';
import { useNutritionToday } from '../../src/features/nutrition/useNutritionToday';
import { useRecentFoods } from '../../src/features/nutrition/useRecentFoods';
import { renderHook } from '../helpers/renderHook';

afterEach(() => {
  mock.restoreAll();
});

describe('nutrition hooks', () => {
  it('loads recent foods with the requested limit', async () => {
    let capturedLimit = 0;

    mock.method(nutritionApi, 'fetchRecentFoods', async (limit = 10) => {
      capturedLimit = limit;
      return [{ alimentoId: 1, nombre: 'Avena', kcal: 120, proteinaG: 4, carbohidratosG: 20, grasasG: 2 }];
    });

    const hook = await renderHook(() => useRecentFoods(5));
    await hook.flush();

    assert.equal(capturedLimit, 5);
    assert.equal(hook.current.loading, false);
    assert.equal(hook.current.error, null);
    assert.equal(hook.current.items[0]?.nombre, 'Avena');
    await hook.unmount();
  });

  it('exposes errors from frequent foods loading', async () => {
    mock.method(nutritionApi, 'fetchFrequentFoods', async () => {
      throw new Error('No se pudieron cargar frecuentes.');
    });

    const hook = await renderHook(() => useFrequentFoods());
    await hook.flush();

    assert.equal(hook.current.loading, false);
    assert.equal(hook.current.items.length, 0);
    assert.equal(hook.current.error, 'No se pudieron cargar frecuentes.');
    await hook.unmount();
  });

  it('loads nutrition data for the selected date and meal type', async () => {
    let capturedArgs: unknown[] = [];

    mock.method(
      nutritionApi,
      'fetchNutritionToday',
      async (date: string, mealType?: 'DESAYUNO' | 'ALMUERZO' | 'CENA' | 'SNACK') => {
        capturedArgs = [date, mealType];
        return {
          date,
          objetivoDiario: 4,
          comidasRegistradas: 2,
          progreso: 0.5,
          resumen: {
            kcal: 600,
            proteinaG: 20,
            carbohidratosG: 70,
            grasasG: 15,
          },
          historial: [],
          globalNotificationsEnabled: true,
          reminderEnabled: true,
          reminderTime: '13:00',
          reminderSnapshot: {
            globalEnabled: true,
            quietHoursEnabled: false,
            quietFrom: '22:00',
            quietTo: '07:00',
            habitEnabled: true,
            time: '13:00',
            lastCompletedDate: null,
          },
        };
      }
    );

    const hook = await renderHook(() => useNutritionToday('2026-03-20', 'ALMUERZO'));
    await hook.flush();

    assert.deepEqual(capturedArgs, ['2026-03-20', 'ALMUERZO']);
    assert.equal(hook.current.loading, false);
    assert.equal(hook.current.data?.comidasRegistradas, 2);
    assert.equal(hook.current.error, null);
    await hook.unmount();
  });
});
