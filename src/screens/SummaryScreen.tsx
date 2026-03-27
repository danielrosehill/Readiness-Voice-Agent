import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Colors } from '../utils/constants';
import { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Summary'>;

export function SummaryScreen({ route, navigation }: Props) {
  const { checked, skipped, total, skippedCritical } = route.params;
  const allDone = checked === total;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.iconCircle}>
        <Text style={styles.icon}>{allDone ? '\u2713' : '\u26A0'}</Text>
      </View>

      <Text style={styles.title}>
        {allDone ? 'Checklist Complete' : 'Checklist Finished'}
      </Text>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statNumber}>{checked}</Text>
          <Text style={styles.statLabel}>Checked</Text>
        </View>
        <View style={styles.stat}>
          <Text style={[styles.statNumber, skipped > 0 && { color: Colors.warning }]}>{skipped}</Text>
          <Text style={styles.statLabel}>Skipped</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statNumber}>{total}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
      </View>

      {skippedCritical.length > 0 && (
        <View style={styles.warningBox}>
          <Text style={styles.warningTitle}>Critical items skipped:</Text>
          {skippedCritical.map((label, i) => (
            <Text key={i} style={styles.warningItem}>
              {'\u2022'} {label}
            </Text>
          ))}
        </View>
      )}

      <View style={styles.buttons}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.popToTop()}
        >
          <Text style={styles.primaryButtonText}>Back to Checklists</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => {
            navigation.goBack();
          }}
        >
          <Text style={styles.secondaryButtonText}>Run Again</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: 24,
    alignItems: 'center',
    gap: 24,
    paddingTop: 60,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 40,
    color: Colors.success,
  },
  title: {
    color: Colors.text,
    fontSize: 26,
    fontWeight: '800',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 32,
  },
  stat: {
    alignItems: 'center',
    gap: 4,
  },
  statNumber: {
    color: Colors.text,
    fontSize: 32,
    fontWeight: '700',
  },
  statLabel: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
  warningBox: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    alignSelf: 'stretch',
    borderLeftWidth: 4,
    borderLeftColor: Colors.critical,
    gap: 6,
  },
  warningTitle: {
    color: Colors.critical,
    fontSize: 15,
    fontWeight: '700',
  },
  warningItem: {
    color: Colors.text,
    fontSize: 14,
    paddingLeft: 4,
  },
  buttons: {
    gap: 12,
    alignSelf: 'stretch',
    marginTop: 12,
  },
  primaryButton: {
    backgroundColor: Colors.accent,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
});
