import React from 'react';
import { View, Text, SectionList, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { getAllChecklists } from '../data/checklists';
import { ChecklistCard } from '../components/ChecklistCard';
import { ChecklistEntry } from '../types';
import { Colors } from '../utils/constants';
import { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

const CATEGORY_LABELS: Record<ChecklistEntry['category'], string> = {
  quick: 'Quick Checks',
  master: 'Master',
  situational: 'Situational',
  special: 'Special',
};

export function HomeScreen({ navigation }: Props) {
  const checklists = getAllChecklists();

  const sections = (['quick', 'master', 'situational', 'special'] as const).map((cat) => ({
    title: CATEGORY_LABELS[cat],
    data: checklists.filter((c) => c.category === cat),
  }));

  return (
    <View style={styles.container}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ChecklistCard
            checklist={item}
            onPress={() => navigation.navigate('Session', { checklistId: item.id })}
            onPlayback={() => navigation.navigate('Playback', { checklistId: item.id })}
          />
        )}
        renderSectionHeader={({ section }) => (
          <Text style={styles.sectionHeader}>{section.title}</Text>
        )}
        contentContainerStyle={styles.list}
        stickySectionHeadersEnabled={false}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>Readiness Voice Agent</Text>
            <Text style={styles.subtitle}>Select a checklist to begin</Text>
          </View>
        }
        ListFooterComponent={
          <View style={styles.footer}>
            <Text
              style={styles.settingsLink}
              onPress={() => navigation.navigate('Settings')}
            >
              Settings
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  list: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 20,
    gap: 4,
  },
  title: {
    color: Colors.text,
    fontSize: 28,
    fontWeight: '800',
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: 16,
  },
  sectionHeader: {
    color: Colors.accent,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginTop: 20,
    marginBottom: 10,
  },
  footer: {
    marginTop: 24,
    alignItems: 'center',
  },
  settingsLink: {
    color: Colors.accent,
    fontSize: 16,
    padding: 12,
  },
});
