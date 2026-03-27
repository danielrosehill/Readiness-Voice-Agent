import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../utils/constants';

interface Props {
  checked: number;
  skipped: number;
  total: number;
}

export function ProgressBar({ checked, skipped, total }: Props) {
  const progress = total > 0 ? (checked + skipped) / total : 0;
  const checkedWidth = total > 0 ? (checked / total) * 100 : 0;
  const skippedWidth = total > 0 ? (skipped / total) * 100 : 0;

  return (
    <View style={styles.container}>
      <View style={styles.barBackground}>
        <View style={[styles.barChecked, { width: `${checkedWidth}%` }]} />
        <View style={[styles.barSkipped, { width: `${skippedWidth}%` }]} />
      </View>
      <Text style={styles.label}>
        {checked}/{total} done{skipped > 0 ? ` · ${skipped} skipped` : ''} · {Math.round(progress * 100)}%
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 6 },
  barBackground: {
    height: 8,
    backgroundColor: Colors.surfaceLight,
    borderRadius: 4,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  barChecked: {
    backgroundColor: Colors.success,
    height: '100%',
  },
  barSkipped: {
    backgroundColor: Colors.warning,
    height: '100%',
  },
  label: {
    color: Colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
  },
});
