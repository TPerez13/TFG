import React from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import { colors, radius } from '../theme/tokens';

type ProgressBarProps = {
  progress: number;
  trackColor?: string;
  fillColor?: string;
  height?: number;
  style?: StyleProp<ViewStyle>;
};

const clamp = (value: number) => Math.max(0, Math.min(1, value));

export function ProgressBar({
  progress,
  trackColor = colors.surfaceMuted,
  fillColor = colors.accent,
  height = 8,
  style,
}: ProgressBarProps) {
  const normalized = clamp(progress);

  return (
    <View style={[styles.track, { backgroundColor: trackColor, height, borderRadius: height / 2 }, style]}>
      <View
        style={[
          styles.fill,
          {
            width: `${Math.round(normalized * 100)}%`,
            backgroundColor: fillColor,
            borderRadius: height / 2,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    minWidth: 2,
  },
});
