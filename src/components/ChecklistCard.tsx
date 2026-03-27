import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { ChecklistEntry } from '../types';
import { Colors } from '../utils/constants';

interface Props {
  checklist: ChecklistEntry;
  onPress: () => void;
}

export function ChecklistCard({ checklist, onPress }: Props) {
  const criticalCount = checklist.items.filter((i) => i.critical).length;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.colorStripe, { backgroundColor: checklist.color }]} />
      <View style={styles.content}>
        <Text style={styles.title}>{checklist.title}</Text>
        {checklist.description ? (
          <Text style={styles.description} numberOfLines={2}>
            {checklist.description}
          </Text>
        ) : null}
        <View style={styles.meta}>
          <Text style={styles.metaText}>{checklist.items.length} items</Text>
          {criticalCount > 0 && (
            <Text style={styles.criticalText}>{criticalCount} critical</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    flexDirection: 'row',
    overflow: 'hidden',
    marginBottom: 10,
  },
  colorStripe: {
    width: 5,
  },
  content: {
    flex: 1,
    padding: 16,
    gap: 6,
  },
  title: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  description: {
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  meta: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  metaText: {
    color: Colors.textSecondary,
    fontSize: 12,
  },
  criticalText: {
    color: Colors.critical,
    fontSize: 12,
    fontWeight: '500',
  },
});
