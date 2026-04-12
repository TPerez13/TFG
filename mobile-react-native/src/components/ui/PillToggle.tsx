import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';

type PillToggleProps = {
  value: boolean;
  disabled?: boolean;
  onValueChange: (value: boolean) => void;
};

const TRACK_WIDTH = 52;
const TRACK_HEIGHT = 30;
const TRACK_PADDING = 2;
const THUMB_SIZE = 24;
const THUMB_TRANSLATE = TRACK_WIDTH - THUMB_SIZE - TRACK_PADDING * 2;

export function PillToggle({ value, disabled = false, onValueChange }: PillToggleProps) {
  const progress = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: value ? 1 : 0,
      duration: 150,
      useNativeDriver: true,
    }).start();
  }, [progress, value]);

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      onPress={() => {
        if (!disabled) onValueChange(!value);
      }}
      disabled={disabled}
      style={[styles.track, value ? styles.trackOn : styles.trackOff, disabled ? styles.disabled : null]}
    >
      <Animated.View
        style={[
          styles.thumb,
          {
            transform: [
              {
                translateX: progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, THUMB_TRANSLATE],
                }),
              },
            ],
          },
        ]}
      />
      <View pointerEvents="none" style={styles.thumbSpacer} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    width: TRACK_WIDTH,
    height: TRACK_HEIGHT,
    borderRadius: 999,
    padding: TRACK_PADDING,
    justifyContent: 'center',
  },
  trackOn: {
    backgroundColor: '#22C55E',
  },
  trackOff: {
    backgroundColor: '#E5E7EB',
  },
  thumb: {
    position: 'absolute',
    left: TRACK_PADDING,
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.16,
    shadowRadius: 2,
    elevation: 2,
  },
  thumbSpacer: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
  },
  disabled: {
    opacity: 0.45,
  },
});
