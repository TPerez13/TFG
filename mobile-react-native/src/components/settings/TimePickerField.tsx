import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { colors, fontSizes, radius, spacing } from '../../theme/tokens';

type TimePickerFieldProps = {
  value: string;
  onConfirm: (value: string) => void | Promise<void>;
  disabled?: boolean;
  modalTitle: string;
  modalDescription?: string;
  style?: StyleProp<ViewStyle>;
  accentColor?: string;
};

const HOURS = Array.from({ length: 24 }, (_, index) => index);
const MINUTES = Array.from({ length: 60 }, (_, index) => index);
const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

const pad = (value: number) => `${value}`.padStart(2, '0');
const formatTime = (hour: number, minute: number) => `${pad(hour)}:${pad(minute)}`;

const parseTime = (value: string) => {
  const trimmed = value.trim();
  const match = trimmed.match(TIME_PATTERN);
  if (!match) return { hour: 8, minute: 0 };
  return {
    hour: Number(match[1]),
    minute: Number(match[2]),
  };
};

type TimeColumnProps = {
  label: string;
  values: number[];
  selectedValue: number;
  onSelect: (value: number) => void;
  accentColor: string;
};

function TimeColumn({ label, values, selectedValue, onSelect, accentColor }: TimeColumnProps) {
  return (
    <View style={styles.column}>
      <Text style={styles.columnLabel}>{label}</Text>
      <ScrollView style={styles.columnScroll} showsVerticalScrollIndicator={false}>
        {values.map((value) => {
          const selected = value === selectedValue;
          return (
            <Pressable
              key={value}
              accessibilityRole="button"
              onPress={() => onSelect(value)}
              style={({ pressed }) => [
                styles.option,
                selected ? [styles.optionSelected, { borderColor: accentColor, backgroundColor: '#eef8f1' }] : null,
                pressed ? styles.optionPressed : null,
              ]}
            >
              <Text style={[styles.optionText, selected ? { color: accentColor } : null]}>{pad(value)}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

export function TimePickerField({
  value,
  onConfirm,
  disabled = false,
  modalTitle,
  modalDescription,
  style,
  accentColor = colors.textAccent,
}: TimePickerFieldProps) {
  const parsedValue = useMemo(() => parseTime(value), [value]);
  const [visible, setVisible] = useState(false);
  const [selectedHour, setSelectedHour] = useState(parsedValue.hour);
  const [selectedMinute, setSelectedMinute] = useState(parsedValue.minute);

  useEffect(() => {
    if (visible) return;
    setSelectedHour(parsedValue.hour);
    setSelectedMinute(parsedValue.minute);
  }, [parsedValue.hour, parsedValue.minute, visible]);

  const openPicker = () => {
    if (disabled) return;
    setSelectedHour(parsedValue.hour);
    setSelectedMinute(parsedValue.minute);
    setVisible(true);
  };

  const closePicker = () => {
    setVisible(false);
  };

  const applySelection = () => {
    const nextValue = formatTime(selectedHour, selectedMinute);
    closePicker();
    void Promise.resolve(onConfirm(nextValue));
  };

  return (
    <>
      <Pressable
        accessibilityRole="button"
        disabled={disabled}
        onPress={openPicker}
        style={({ pressed }) => [
          styles.field,
          style,
          disabled ? styles.fieldDisabled : null,
          pressed ? styles.fieldPressed : null,
        ]}
      >
        <Text style={styles.fieldValue}>{formatTime(parsedValue.hour, parsedValue.minute)}</Text>
        <Text style={styles.fieldChevron}>v</Text>
      </Pressable>

      <Modal visible={visible} transparent animationType="fade" onRequestClose={closePicker}>
        <View style={styles.backdrop}>
          <Pressable style={styles.backdropDismiss} onPress={closePicker} />
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{modalTitle}</Text>
            {modalDescription ? <Text style={styles.modalDescription}>{modalDescription}</Text> : null}

            <View style={styles.selectorRow}>
              <TimeColumn
                label="Hora"
                values={HOURS}
                selectedValue={selectedHour}
                onSelect={setSelectedHour}
                accentColor={accentColor}
              />
              <Text style={styles.separator}>:</Text>
              <TimeColumn
                label="Min"
                values={MINUTES}
                selectedValue={selectedMinute}
                onSelect={setSelectedMinute}
                accentColor={accentColor}
              />
            </View>

            <View style={styles.actionRow}>
              <Pressable
                accessibilityRole="button"
                onPress={closePicker}
                style={({ pressed }) => [styles.secondaryButton, pressed ? styles.buttonPressed : null]}
              >
                <Text style={styles.secondaryButtonText}>Cancelar</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={applySelection}
                style={({ pressed }) => [
                  styles.primaryButton,
                  { backgroundColor: accentColor },
                  pressed ? styles.buttonPressed : null,
                ]}
              >
                <Text style={styles.primaryButtonText}>Aplicar</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  field: {
    minWidth: 108,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: 10,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  fieldDisabled: {
    opacity: 0.6,
  },
  fieldPressed: {
    opacity: 0.85,
  },
  fieldValue: {
    color: colors.textPrimary,
    fontSize: fontSizes.base,
    fontWeight: '700',
  },
  fieldChevron: {
    color: colors.textSubtle,
    fontSize: fontSizes.sm,
    fontWeight: '700',
  },
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    backgroundColor: 'rgba(12, 18, 14, 0.45)',
  },
  backdropDismiss: {
    ...StyleSheet.absoluteFillObject,
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    padding: spacing.lg,
  },
  modalTitle: {
    color: colors.textPrimary,
    fontSize: fontSizes.lg,
    fontWeight: '800',
    marginBottom: spacing.xs,
  },
  modalDescription: {
    color: colors.textMuted,
    fontSize: fontSizes.base,
    marginBottom: spacing.lg,
  },
  selectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  column: {
    flex: 1,
  },
  columnLabel: {
    color: colors.textSubtle,
    fontSize: fontSizes.sm,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  columnScroll: {
    maxHeight: 240,
  },
  option: {
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: 12,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    marginBottom: spacing.xs,
    backgroundColor: colors.surface,
  },
  optionSelected: {
    borderWidth: 1,
  },
  optionPressed: {
    opacity: 0.85,
  },
  optionText: {
    color: colors.textPrimary,
    fontSize: fontSizes.base,
    fontWeight: '700',
  },
  separator: {
    color: colors.textSubtle,
    fontSize: 28,
    fontWeight: '800',
    marginTop: spacing.lg,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  secondaryButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 999,
    backgroundColor: colors.surfaceMuted,
  },
  secondaryButtonText: {
    color: colors.textPrimary,
    fontSize: fontSizes.base,
    fontWeight: '700',
  },
  primaryButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 999,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: fontSizes.base,
    fontWeight: '800',
  },
  buttonPressed: {
    opacity: 0.85,
  },
});
