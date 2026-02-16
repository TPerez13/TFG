import React, { useMemo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../components/layout/Screen';
import { getHabitByKey, getHabitByTypeId } from '../features/habits/habitRegistry';
import type { HabitsStackParamList } from '../navigation/types';
import { baseStyles } from '../theme/components';
import { colors, fontSizes, spacing } from '../theme/tokens';

type HabitDetailScreenProps = NativeStackScreenProps<HabitsStackParamList, 'HabitDetail'>;

const ACTIONS = ['Anadir registro', 'Ver historico', 'Editar meta', 'Recordatorios'];

export default function HabitDetailScreen({ navigation, route }: HabitDetailScreenProps) {
  const { habitKey, typeId, initialTab, mode } = route.params ?? {};

  const habit = useMemo(() => {
    if (habitKey) return getHabitByKey(habitKey);
    if (typeof typeId === 'number') return getHabitByTypeId(typeId);
    return undefined;
  }, [habitKey, typeId]);

  const title = habit?.title ?? 'Detalle de habito';
  const isAddMode = mode === 'add' || initialTab === 'add';
  const isComidas = habit?.key === 'comidas';
  const isAgua = habit?.key === 'agua';
  const isEjercicio = habit?.key === 'ejercicio';
  const isSueno = habit?.key === 'sueno';
  const isMeditacion = habit?.key === 'meditacion';

  const onActionPress = (action: string) => {
    if (isAgua && action === 'Anadir registro') {
      navigation.navigate('RegistrarAgua', { mode: 'quick' });
      return;
    }
    if (isAgua && action === 'Ver historico') {
      navigation.navigate('Hidratacion');
      return;
    }
    if (isComidas && action === 'Anadir registro') {
      navigation.navigate('NutritionQuickAdd', { tipoComidaSeleccionada: 'DESAYUNO' });
      return;
    }
    if (isComidas && action === 'Editar meta') {
      navigation.navigate('HabitGoals');
      return;
    }
    if (isEjercicio && action === 'Anadir registro') {
      navigation.navigate('RegistrarEjercicio', { mode: 'quick' });
      return;
    }
    if (isEjercicio && action === 'Ver historico') {
      navigation.navigate('Ejercicio');
      return;
    }
    if (isEjercicio && action === 'Editar meta') {
      navigation.navigate('HabitGoals');
      return;
    }
    if (isSueno && action === 'Anadir registro') {
      navigation.navigate('RegistrarSueno', { mode: 'quick' });
      return;
    }
    if (isSueno && action === 'Ver historico') {
      navigation.navigate('Sueno');
      return;
    }
    if (isSueno && action === 'Editar meta') {
      navigation.navigate('HabitGoals');
      return;
    }
    if (isMeditacion && action === 'Anadir registro') {
      navigation.navigate('RegistrarMeditacion', { mode: 'quick' });
      return;
    }
    if (isMeditacion && action === 'Ver historico') {
      navigation.navigate('Meditacion');
      return;
    }
    if (isMeditacion && action === 'Editar meta') {
      navigation.navigate('HabitGoals');
      return;
    }
    Alert.alert(action, 'Seccion disponible pronto.');
  };

  return (
    <Screen>
      <View style={[baseStyles.content, styles.content]}>
        <View style={styles.header}>
          <Pressable
            accessibilityLabel="Volver"
            onPress={() => navigation.goBack()}
            style={({ pressed }) => [styles.backButton, pressed ? styles.buttonPressed : null]}
          >
            <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>{title}</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.hero}>
          <Text style={styles.title}>{title}</Text>
          {isAddMode ? <Text style={styles.hint}>Se abrio directamente en "Anadir registro".</Text> : null}
        </View>

        <View style={styles.actions}>
          {ACTIONS.map((action) => (
            <Pressable
              key={action}
              onPress={() => onActionPress(action)}
              style={({ pressed }) => [styles.actionButton, pressed ? styles.buttonPressed : null]}
            >
              <Text style={styles.actionText}>{action}</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textSubtle} />
            </Pressable>
          ))}
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
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
    fontSize: fontSizes.lg,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  headerSpacer: {
    width: 36,
    height: 36,
  },
  hero: {
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  hint: {
    fontSize: fontSizes.md,
    color: colors.textMuted,
  },
  actions: {
    gap: spacing.md,
  },
  actionButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: 16,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actionText: {
    fontSize: fontSizes.base,
    fontWeight: '600',
    color: colors.textPrimary,
  },
});
