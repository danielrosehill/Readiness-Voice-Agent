import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { Colors } from '../utils/constants';
import { AgentState } from '../hooks/useVoiceSession';

interface Props {
  state: AgentState;
}

export function MicIndicator({ state }: Props) {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (state === 'listening') {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1.3, duration: 800, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      );
      animation.start();
      return () => animation.stop();
    } else if (state === 'speaking') {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1.15, duration: 400, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1, duration: 400, useNativeDriver: true }),
        ])
      );
      animation.start();
      return () => animation.stop();
    } else {
      pulse.setValue(1);
    }
  }, [state, pulse]);

  const color =
    state === 'listening'
      ? Colors.accent
      : state === 'speaking'
        ? Colors.success
        : state === 'connecting'
          ? Colors.warning
          : state === 'error'
            ? Colors.critical
            : Colors.textSecondary;

  const label =
    state === 'listening'
      ? 'Listening...'
      : state === 'speaking'
        ? 'Speaking...'
        : state === 'connecting'
          ? 'Connecting...'
          : state === 'error'
            ? 'Error'
            : '';

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.circle,
          { backgroundColor: color, transform: [{ scale: pulse }] },
        ]}
      />
      <Animated.Text style={[styles.label, { color }]}>{label}</Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: 12 },
  circle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    opacity: 0.9,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
  },
});
