import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  loadFrequentFoodsItems,
  loadNutritionTodayData,
  loadRecentFoodsItems,
} from '../../src/features/nutrition/loaders';

describe('nutrition loaders', () => {
  it('loads recent foods with the requested limit', async () => {
    let capturedLimit = 0;

    const result = await loadRecentFoodsItems(5, {
      fetchRecentFoods: async (limit = 10) => {
        capturedLimit = limit;
        return [
          { alimentoId: 1, nombre: 'Avena', kcal: 120, proteinaG: 4, carbohidratosG: 20, grasasG: 2 },
        ];
      },
    });

    assert.equal(capturedLimit, 5);
    assert.equal(result.error, null);
    assert.equal(result.items[0]?.nombre, 'Avena');
  });

  it('maps frequent foods load errors into the returned state', async () => {
    const result = await loadFrequentFoodsItems(10, {
      fetchFrequentFoods: async () => {
        throw new Error('No se pudieron cargar frecuentes.');
      },
    });

    assert.equal(result.items.length, 0);
    assert.equal(result.error, 'No se pudieron cargar frecuentes.');
  });

  it('loads nutrition data for the selected date and meal type', async () => {
    let capturedArgs: unknown[] = [];

    const result = await loadNutritionTodayData('2026-03-20', 'ALMUERZO', {
      fetchNutritionToday: async (date, mealType) => {
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
          },
        };
      },
    });

    assert.deepEqual(capturedArgs, ['2026-03-20', 'ALMUERZO']);
    assert.equal(result.error, null);
    assert.equal(result.data?.comidasRegistradas, 2);
  });
});
