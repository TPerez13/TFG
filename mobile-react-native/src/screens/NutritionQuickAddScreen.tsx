import React, { useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { FoodItemCard } from '../components/nutrition/FoodItemCard';
import { Screen } from '../components/layout/Screen';
import { mealTypeLabel, mealTypeOptions } from '../features/nutrition/constants';
import { emitNutritionFlash } from '../features/nutrition/nutritionFlash';
import { useFrequentFoods } from '../features/nutrition/useFrequentFoods';
import { useNutritionMutations } from '../features/nutrition/useNutritionMutations';
import { useRecentFoods } from '../features/nutrition/useRecentFoods';
import type { MealType } from '../features/nutrition/types';
import type { HabitsStackParamList } from '../navigation/types';
import { baseStyles } from '../theme/components';
import { colors, fontSizes, radius, spacing } from '../theme/tokens';

type NutritionQuickAddScreenProps = NativeStackScreenProps<HabitsStackParamList, 'NutritionQuickAdd'>;

const formatNowTime = () =>
  new Intl.DateTimeFormat('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date());

export default function NutritionQuickAddScreen({
  navigation,
  route,
}: NutritionQuickAddScreenProps) {
  const [selectedType, setSelectedType] = useState<MealType>(
    route.params?.tipoComidaSeleccionada ?? 'DESAYUNO',
  );
  const { items: recentItems, loading: recentLoading, error: recentError, reload: reloadRecent } = useRecentFoods(8);
  const {
    items: frequentItems,
    loading: frequentLoading,
    error: frequentError,
    reload: reloadFrequent,
  } = useFrequentFoods(8);
  const { createEntry, creating } = useNutritionMutations();
  const nowLabel = useMemo(() => formatNowTime(), []);

  useFocusEffect(
    React.useCallback(() => {
      void reloadRecent();
      void reloadFrequent();
    }, [reloadRecent, reloadFrequent]),
  );

  const handleAdd = async (item: {
    alimentoId: number | null;
    nombre: string;
    kcal: number;
    proteinaG: number | null;
    carbohidratosG: number | null;
    grasasG: number | null;
  }) => {
    try {
      const created = await createEntry({
        tipoComida: selectedType,
        alimentoId: item.alimentoId ?? undefined,
        nombre: item.nombre,
        kcal: item.kcal,
        proteinaG: item.proteinaG ?? undefined,
        carbohidratosG: item.carbohidratosG ?? undefined,
        grasasG: item.grasasG ?? undefined,
      });

      emitNutritionFlash({
        message: 'Comida registrada correctamente!',
        undoEntryId: created.idRegistroComida,
      });
      navigation.reset({
        index: 1,
        routes: [
          { name: 'Habits' },
          {
            name: 'Nutrition',
            params: {
              tipoComidaSeleccionada: selectedType,
              refreshToken: Date.now(),
            },
          },
        ],
      });
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'No se pudo registrar la comida.');
    }
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={[baseStyles.content, styles.content]}>
        <View style={styles.header}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={({ pressed }) => [styles.iconButton, pressed ? styles.buttonPressed : null]}
          >
            <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>Registro Rapido</Text>
          <Pressable onPress={() => Alert.alert('Ayuda', 'Disponible pronto.')}>
            <Text style={styles.helpText}>Ayuda</Text>
          </Pressable>
        </View>

        <View style={styles.modeCard}>
          <View style={styles.modeInfo}>
            <Ionicons name="restaurant-outline" size={24} color="#22c55e" />
            <View>
              <Text style={styles.modeTitle}>Comida</Text>
              <Text style={styles.modeMeta}>Hoy, {nowLabel}</Text>
            </View>
          </View>
          <Pressable
            onPress={() =>
              navigation.replace('NutritionManualEntry', {
                tipoComidaSeleccionada: selectedType,
              })
            }
            style={({ pressed }) => [styles.switchButton, pressed ? styles.buttonPressed : null]}
          >
            <Text style={styles.switchButtonText}>Cambiar a Manual</Text>
          </Pressable>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsRow}>
          {mealTypeOptions.map((option) => {
            const active = option.key === selectedType;
            return (
              <Pressable
                key={option.key}
                onPress={() => setSelectedType(option.key)}
                style={({ pressed }) => [
                  styles.tabChip,
                  active ? styles.tabChipActive : null,
                  pressed ? styles.buttonPressed : null,
                ]}
              >
                <Text style={[styles.tabLabel, active ? styles.tabLabelActive : null]}>{option.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <Text style={styles.sectionTitle}>Recientes</Text>
        {recentLoading ? <ActivityIndicator size="small" color={colors.textAccent} /> : null}
        {recentError ? <Text style={styles.errorText}>{recentError}</Text> : null}
        {!recentLoading && recentItems.length === 0 ? (
          <Text style={styles.emptyText}>No hay recientes para {mealTypeLabel(selectedType)}.</Text>
        ) : null}
        {recentItems.map((item, index) => (
          <FoodItemCard key={`recent-${item.nombre}-${index}`} item={item} onAdd={() => handleAdd(item)} />
        ))}

        <Text style={[styles.sectionTitle, styles.sectionSpacing]}>Frecuentes</Text>
        {frequentLoading ? <ActivityIndicator size="small" color={colors.textAccent} /> : null}
        {frequentError ? <Text style={styles.errorText}>{frequentError}</Text> : null}
        {!frequentLoading && frequentItems.length === 0 ? (
          <Text style={styles.emptyText}>Aun no hay alimentos frecuentes.</Text>
        ) : null}
        {frequentItems.map((item, index) => (
          <FoodItemCard key={`frequent-${item.nombre}-${index}`} item={item} onAdd={() => handleAdd(item)} />
        ))}

        {creating ? <Text style={styles.savingText}>Guardando registro...</Text> : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.contentBottom + 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 32,
    lineHeight: 34,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  helpText: {
    color: '#22c55e',
    fontSize: fontSizes.lg,
    fontWeight: '700',
  },
  modeCard: {
    backgroundColor: '#dff2e7',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#d0e8d9',
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  modeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  modeTitle: {
    fontSize: 30,
    lineHeight: 34,
    color: colors.textPrimary,
    fontWeight: '800',
  },
  modeMeta: {
    fontSize: fontSizes.lg,
    color: colors.textMuted,
    fontWeight: '600',
  },
  switchButton: {
    alignSelf: 'flex-end',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  switchButtonText: {
    fontSize: fontSizes.base,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  tabsRow: {
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  tabChip: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  tabChipActive: {
    borderColor: '#22c55e',
    backgroundColor: '#eafbf1',
  },
  tabLabel: {
    fontWeight: '700',
    color: colors.textMuted,
  },
  tabLabelActive: {
    color: '#15803d',
  },
  sectionTitle: {
    fontSize: 30,
    lineHeight: 34,
    color: colors.textPrimary,
    fontWeight: '800',
    marginBottom: spacing.md,
  },
  sectionSpacing: {
    marginTop: spacing.lg,
  },
  errorText: {
    color: '#b84a4a',
    marginBottom: spacing.md,
  },
  emptyText: {
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  savingText: {
    textAlign: 'center',
    color: colors.textMuted,
    marginTop: spacing.md,
  },
  buttonPressed: {
    opacity: 0.85,
  },
});
