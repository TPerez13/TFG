import {
  fetchFrequentFoods as fetchFrequentFoodsRequest,
  fetchNutritionToday as fetchNutritionTodayRequest,
  fetchRecentFoods as fetchRecentFoodsRequest,
} from './api';
import type { FoodTemplate, MealType, NutritionTodayData } from './types';

const RECENT_FOODS_ERROR = 'No se pudieron cargar los alimentos recientes.';
const FREQUENT_FOODS_ERROR = 'No se pudieron cargar los alimentos frecuentes.';
const NUTRITION_TODAY_ERROR = 'No se pudo cargar la alimentación.';

type NutritionLoaderDependencies = {
  fetchRecentFoods?: typeof fetchRecentFoodsRequest;
  fetchFrequentFoods?: typeof fetchFrequentFoodsRequest;
  fetchNutritionToday?: typeof fetchNutritionTodayRequest;
};

type FoodTemplatesResult = {
  items: FoodTemplate[];
  error: string | null;
};

type NutritionTodayResult = {
  data: NutritionTodayData | null;
  error: string | null;
};

const toErrorMessage = (error: unknown, fallback: string): string =>
  error instanceof Error ? error.message : fallback;

export async function loadRecentFoodsItems(
  limit = 10,
  dependencies: NutritionLoaderDependencies = {}
): Promise<FoodTemplatesResult> {
  const fetchRecentFoods = dependencies.fetchRecentFoods ?? fetchRecentFoodsRequest;

  try {
    return {
      items: await fetchRecentFoods(limit),
      error: null,
    };
  } catch (error) {
    return {
      items: [],
      error: toErrorMessage(error, RECENT_FOODS_ERROR),
    };
  }
}

export async function loadFrequentFoodsItems(
  limit = 10,
  dependencies: NutritionLoaderDependencies = {}
): Promise<FoodTemplatesResult> {
  const fetchFrequentFoods = dependencies.fetchFrequentFoods ?? fetchFrequentFoodsRequest;

  try {
    return {
      items: await fetchFrequentFoods(limit),
      error: null,
    };
  } catch (error) {
    return {
      items: [],
      error: toErrorMessage(error, FREQUENT_FOODS_ERROR),
    };
  }
}

export async function loadNutritionTodayData(
  date: string,
  mealType?: MealType,
  dependencies: NutritionLoaderDependencies = {}
): Promise<NutritionTodayResult> {
  const fetchNutritionToday = dependencies.fetchNutritionToday ?? fetchNutritionTodayRequest;

  try {
    return {
      data: await fetchNutritionToday(date, mealType),
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error: toErrorMessage(error, NUTRITION_TODAY_ERROR),
    };
  }
}
