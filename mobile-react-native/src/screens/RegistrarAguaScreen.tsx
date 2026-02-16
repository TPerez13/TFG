import React, { useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Screen } from '../components/layout/Screen';
import { Button } from '../components/ui/Button';
import { emitHydrationFlash } from '../features/hydration/hydrationFlash';
import { useHydrationToday, hydrationUnits } from '../features/hydration/useHydrationToday';
import { useCreateHabitEntry } from '../features/habits/useCreateHabitEntry';
import { getHabitByKey } from '../features/habits/habitRegistry';
import type { HabitsStackParamList } from '../navigation/types';
import { baseStyles } from '../theme/components';
import { colors, fontSizes, radius, spacing } from '../theme/tokens';

type RegistrarAguaScreenProps = NativeStackScreenProps<HabitsStackParamList, 'RegistrarAgua'>;

const formatNowTime = () =>
  new Intl.DateTimeFormat('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date());

const toMlFromManual = (value: number, unit: 'ml' | 'vasos') =>
  unit === 'ml' ? value : value * hydrationUnits.ML_PER_GLASS;

export default function RegistrarAguaScreen({ navigation, route }: RegistrarAguaScreenProps) {
  const today = useMemo(() => new Date(), []);
  const hydrationTypeId = getHabitByKey('agua')?.idTipoHabito ?? 1;
  const [mode, setMode] = useState<'quick' | 'manual'>(route.params?.mode ?? 'quick');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState<'ml' | 'vasos'>('ml');
  const [notes, setNotes] = useState('');
  const [showQuantityError, setShowQuantityError] = useState(false);
  const { data } = useHydrationToday(today);
  const { createEntry, creating } = useCreateHabitEntry();
  const timeLabel = useMemo(() => formatNowTime(), []);

  const registerMl = async (ml: number, notesText?: string) => {
    try {
      const created = await createEntry({
        typeId: hydrationTypeId,
        value: ml,
        unit: 'ml',
        dateTime: new Date().toISOString(),
        notes: notesText,
      });

      emitHydrationFlash({
        message: 'Agua registrada correctamente!',
        undoEntryId: created.id_registro_habito,
      });
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'No se pudo registrar agua.');
    }
  };

  const onQuickAdd = async (ml: number) => {
    await registerMl(ml);
  };

  const onSaveManual = async () => {
    const value = Number(quantity.replace(',', '.'));
    if (!Number.isFinite(value) || value <= 0) {
      setShowQuantityError(true);
      return;
    }
    setShowQuantityError(false);
    const ml = toMlFromManual(value, unit);
    await registerMl(ml, notes.trim() || undefined);
  };

  const recentMl = data.recentAmountsMl.length > 0 ? data.recentAmountsMl : [200, 250, 300];

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
          <Text style={styles.headerTitle}>Registrar Agua</Text>
          <Pressable onPress={() => Alert.alert('Ayuda', 'Disponible pronto.')}>
            <Text style={styles.helpText}>Ayuda</Text>
          </Pressable>
        </View>

        <View style={styles.modeCard}>
          <View style={styles.modeInfo}>
            <Ionicons name="water-outline" size={24} color={colors.textAccent} />
            <View>
              <Text style={styles.modeTitle}>Agua</Text>
              <Text style={styles.modeMeta}>Hoy, {timeLabel}</Text>
            </View>
          </View>
          <Pressable
            onPress={() => setMode((current) => (current === 'quick' ? 'manual' : 'quick'))}
            style={({ pressed }) => [styles.switchButton, pressed ? styles.buttonPressed : null]}
          >
            <Text style={styles.switchButtonText}>
              {mode === 'quick' ? 'Cambiar a Manual' : 'Cambiar a Registro Rapido'}
            </Text>
          </Pressable>
        </View>

        {mode === 'quick' ? (
          <View>
            <View style={styles.quickGrid}>
              <Pressable
                onPress={() => onQuickAdd(hydrationUnits.ML_PER_GLASS)}
                style={({ pressed }) => [styles.quickButton, pressed ? styles.buttonPressed : null]}
              >
                <Text style={styles.quickButtonText}>+1 vaso</Text>
                <Text style={styles.quickButtonMeta}>{hydrationUnits.ML_PER_GLASS} ml</Text>
              </Pressable>
              <Pressable
                onPress={() => onQuickAdd(200)}
                style={({ pressed }) => [styles.quickButton, pressed ? styles.buttonPressed : null]}
              >
                <Text style={styles.quickButtonText}>+200 ml</Text>
              </Pressable>
              <Pressable
                onPress={() => onQuickAdd(300)}
                style={({ pressed }) => [styles.quickButton, pressed ? styles.buttonPressed : null]}
              >
                <Text style={styles.quickButtonText}>+300 ml</Text>
              </Pressable>
              <Pressable
                onPress={() => onQuickAdd(500)}
                style={({ pressed }) => [styles.quickButton, pressed ? styles.buttonPressed : null]}
              >
                <Text style={styles.quickButtonText}>+500 ml</Text>
              </Pressable>
            </View>

            <Text style={styles.sectionTitle}>Recientes</Text>
            {recentMl.map((ml) => (
              <View key={ml} style={styles.recentItem}>
                <Text style={styles.recentAmount}>{ml} ml</Text>
                <Pressable
                  onPress={() => onQuickAdd(ml)}
                  style={({ pressed }) => [styles.recentAddButton, pressed ? styles.buttonPressed : null]}
                >
                  <Text style={styles.recentAddText}>Anadir +</Text>
                </Pressable>
              </View>
            ))}
          </View>
        ) : (
          <View>
            <Text style={styles.fieldLabel}>Cantidad</Text>
            <TextInput
              value={quantity}
              onChangeText={(value) => {
                setQuantity(value);
                if (showQuantityError && Number(value) > 0) {
                  setShowQuantityError(false);
                }
              }}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={colors.placeholder}
              style={[styles.input, showQuantityError ? styles.inputError : null]}
            />
            {showQuantityError ? <Text style={styles.errorText}>Introduce una cantidad valida.</Text> : null}

            <Text style={styles.fieldLabel}>Unidad</Text>
            <View style={styles.unitRow}>
              <Pressable
                onPress={() => setUnit('ml')}
                style={({ pressed }) => [
                  styles.unitChip,
                  unit === 'ml' ? styles.unitChipActive : null,
                  pressed ? styles.buttonPressed : null,
                ]}
              >
                <Text style={[styles.unitChipText, unit === 'ml' ? styles.unitChipTextActive : null]}>ml</Text>
              </Pressable>
              <Pressable
                onPress={() => setUnit('vasos')}
                style={({ pressed }) => [
                  styles.unitChip,
                  unit === 'vasos' ? styles.unitChipActive : null,
                  pressed ? styles.buttonPressed : null,
                ]}
              >
                <Text style={[styles.unitChipText, unit === 'vasos' ? styles.unitChipTextActive : null]}>vasos</Text>
              </Pressable>
            </View>

            <Text style={styles.fieldLabel}>Nota (opcional)</Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Ej. despues de entrenar"
              placeholderTextColor={colors.placeholder}
              style={styles.input}
            />

            <Button
              title={creating ? 'Guardando...' : 'Guardar'}
              onPress={onSaveManual}
              style={styles.saveButton}
            />
            <Button
              title="Cambiar a Registro Rapido"
              variant="outline"
              onPress={() => setMode('quick')}
              style={styles.switchModeButton}
            />
          </View>
        )}
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
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPressed: {
    opacity: 0.85,
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  helpText: {
    color: colors.textAccent,
    fontSize: fontSizes.base,
    fontWeight: '700',
  },
  modeCard: {
    borderRadius: radius.lg,
    backgroundColor: '#dff2e7',
    borderWidth: 1,
    borderColor: '#d0e8d9',
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  modeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  modeTitle: {
    fontSize: 28,
    lineHeight: 32,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  modeMeta: {
    fontSize: fontSizes.base,
    color: colors.textMuted,
    fontWeight: '600',
  },
  switchButton: {
    alignSelf: 'flex-end',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  switchButtonText: {
    color: colors.textPrimary,
    fontSize: fontSizes.base,
    fontWeight: '700',
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  quickButton: {
    minWidth: 150,
    flexGrow: 1,
    borderRadius: radius.lg,
    backgroundColor: colors.textAccent,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  quickButtonText: {
    color: colors.textOnAccent,
    fontSize: 20,
    fontWeight: '800',
  },
  quickButtonMeta: {
    color: '#dbffe6',
    marginTop: spacing.xs,
    fontSize: fontSizes.sm,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: '800',
    marginBottom: spacing.md,
  },
  recentItem: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  recentAmount: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  recentAddButton: {
    borderRadius: 18,
    backgroundColor: colors.textAccent,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  recentAddText: {
    color: colors.textOnAccent,
    fontSize: fontSizes.md,
    fontWeight: '700',
  },
  fieldLabel: {
    color: colors.textPrimary,
    fontSize: 18,
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
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  inputError: {
    borderColor: '#e67a00',
  },
  errorText: {
    color: '#c66b00',
    marginTop: -spacing.sm,
    marginBottom: spacing.sm,
  },
  unitRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  unitChip: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  unitChipActive: {
    borderColor: colors.textAccent,
    backgroundColor: '#eafbf1',
  },
  unitChipText: {
    fontWeight: '700',
    color: colors.textMuted,
  },
  unitChipTextActive: {
    color: '#167a43',
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
