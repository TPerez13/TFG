import React, { useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Button } from '../components/ui/Button';
import { Screen } from '../components/layout/Screen';
import { emitNutritionFlash } from '../features/nutrition/nutritionFlash';
import { useNutritionMutations } from '../features/nutrition/useNutritionMutations';
import type { MealType } from '../features/nutrition/types';
import type { HabitsStackParamList } from '../navigation/types';
import { baseStyles } from '../theme/components';
import { colors, fontSizes, radius, spacing } from '../theme/tokens';

type NutritionManualEntryScreenProps = NativeStackScreenProps<HabitsStackParamList, 'NutritionManualEntry'>;

const formatNowTime = () =>
  new Intl.DateTimeFormat('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date());

const parseNumeric = (value: string): number | undefined => {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number(trimmed.replace(',', '.'));
  if (!Number.isFinite(parsed)) return undefined;
  return parsed;
};

export default function NutritionManualEntryScreen({
  navigation,
  route,
}: NutritionManualEntryScreenProps) {
  const selectedType: MealType = route.params?.tipoComidaSeleccionada ?? 'DESAYUNO';
  const [name, setName] = useState('');
  const [kcal, setKcal] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [showKcalError, setShowKcalError] = useState(false);
  const [showNameError, setShowNameError] = useState(false);
  const { createEntry, creating } = useNutritionMutations();
  const timeLabel = useMemo(() => formatNowTime(), []);

  const handleSave = async () => {
    const trimmedName = name.trim();
    const kcalValue = parseNumeric(kcal);

    setShowNameError(!trimmedName);
    setShowKcalError(!kcalValue || kcalValue <= 0);

    if (!trimmedName || !kcalValue || kcalValue <= 0) {
      return;
    }

    try {
      const created = await createEntry({
        tipoComida: selectedType,
        nombre: trimmedName,
        kcal: kcalValue,
        proteinaG: parseNumeric(protein),
        carbohidratosG: parseNumeric(carbs),
        grasasG: parseNumeric(fat),
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
      Alert.alert('Error', err instanceof Error ? err.message : 'No se pudo guardar la comida.');
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
          <Text style={styles.headerTitle}>Registro Manual</Text>
          <View style={styles.headerSpacer} />
        </View>

        <Text style={styles.title}>Comida - {timeLabel}</Text>
        <Text style={styles.subtitle}>Introduce los detalles de tu alimento</Text>

        <Text style={styles.fieldLabel}>Nombre de la comida</Text>
        <TextInput
          value={name}
          onChangeText={(value) => {
            setName(value);
            if (showNameError && value.trim()) {
              setShowNameError(false);
            }
          }}
          placeholder="Ej. Ensalada de pollo"
          placeholderTextColor={colors.placeholder}
          style={[styles.input, showNameError ? styles.inputError : null]}
        />
        {showNameError ? <Text style={styles.errorText}>Por favor, introduce el nombre de la comida</Text> : null}

        <Text style={styles.fieldLabel}>Calorias (kcal)</Text>
        <TextInput
          value={kcal}
          onChangeText={(value) => {
            setKcal(value);
            if (showKcalError && parseNumeric(value) && (parseNumeric(value) ?? 0) > 0) {
              setShowKcalError(false);
            }
          }}
          placeholder="0"
          placeholderTextColor={colors.placeholder}
          keyboardType="numeric"
          style={[styles.input, showKcalError ? styles.inputError : null]}
        />
        {showKcalError ? <Text style={styles.errorText}>Por favor, introduce las calorias</Text> : null}

        <Text style={styles.fieldLabel}>Proteina (g)</Text>
        <TextInput
          value={protein}
          onChangeText={setProtein}
          placeholder="0"
          placeholderTextColor={colors.placeholder}
          keyboardType="numeric"
          style={styles.input}
        />

        <View style={styles.optionalRow}>
          <View style={styles.optionalField}>
            <Text style={styles.fieldLabel}>Carbohidratos (g)</Text>
            <TextInput
              value={carbs}
              onChangeText={setCarbs}
              placeholder="0"
              placeholderTextColor={colors.placeholder}
              keyboardType="numeric"
              style={styles.input}
            />
          </View>
          <View style={styles.optionalField}>
            <Text style={styles.fieldLabel}>Grasas (g)</Text>
            <TextInput
              value={fat}
              onChangeText={setFat}
              placeholder="0"
              placeholderTextColor={colors.placeholder}
              keyboardType="numeric"
              style={styles.input}
            />
          </View>
        </View>

        <Button
          title={creating ? 'Guardando...' : 'Guardar'}
          onPress={handleSave}
          style={styles.saveButton}
          rightIcon={<Ionicons name="save-outline" size={18} color={colors.textOnAccent} />}
        />

        <Button
          title="Cambiar a Registro Rapido"
          variant="outline"
          onPress={() =>
            navigation.replace('NutritionQuickAdd', {
              tipoComidaSeleccionada: selectedType,
            })
          }
          style={styles.switchModeButton}
          rightIcon={<Ionicons name="flash-outline" size={18} color={colors.textPrimary} />}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.contentBottom + 28,
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
  headerSpacer: {
    width: 38,
    height: 38,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  title: {
    fontSize: 38,
    lineHeight: 42,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: fontSizes.lg,
    color: colors.textMuted,
    marginBottom: spacing.xl,
  },
  fieldLabel: {
    color: colors.textPrimary,
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  input: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#d0d7d1',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: 18,
    lineHeight: 22,
    color: colors.textPrimary,
    marginBottom: spacing.md,
    minHeight: 62,
  },
  inputError: {
    borderColor: '#e67a00',
  },
  errorText: {
    color: '#c66b00',
    fontSize: fontSizes.md,
    marginTop: -spacing.sm,
    marginBottom: spacing.md,
  },
  optionalRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  optionalField: {
    flex: 1,
  },
  saveButton: {
    marginTop: spacing.lg,
  },
  switchModeButton: {
    marginTop: spacing.md,
    backgroundColor: '#f0f3f1',
    borderColor: '#d9e2db',
  },
});
