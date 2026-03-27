import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ChecklistItem } from '../types';
import { Colors } from '../utils/constants';

interface Props {
  item: ChecklistItem | null;
  index: number;
  total: number;
}

export function CurrentItemDisplay({ item, index, total }: Props) {
  if (!item) {
    return (
      <View style={styles.container}>
        <Text style={styles.completeText}>All items addressed</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.counter}>
        {index + 1} of {total}
      </Text>
      {item.critical && (
        <View style={styles.criticalBadge}>
          <Text style={styles.criticalBadgeText}>CRITICAL</Text>
        </View>
      )}
      <Text style={styles.label}>{item.label}</Text>
      {item.details && <Text style={styles.details}>{item.details}</Text>}
      {item.subItems && item.subItems.length > 0 && (
        <View style={styles.subItems}>
          {item.subItems.map((sub, i) => (
            <Text key={i} style={styles.subItem}>
              {'\u2022'} {sub}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 24,
    gap: 10,
    alignItems: 'center',
  },
  counter: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
  criticalBadge: {
    backgroundColor: Colors.critical,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  criticalBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  label: {
    color: Colors.text,
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  details: {
    color: Colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  subItems: {
    alignSelf: 'stretch',
    gap: 4,
    marginTop: 8,
  },
  subItem: {
    color: Colors.textSecondary,
    fontSize: 14,
    paddingLeft: 8,
  },
  completeText: {
    color: Colors.success,
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
});
