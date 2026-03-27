import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { getChecklistById } from '../data/checklists';
import { useVoiceSession } from '../hooks/useVoiceSession';
import { useSettings } from '../hooks/useSettings';
import { MicIndicator } from '../components/MicIndicator';
import { CurrentItemDisplay } from '../components/CurrentItemDisplay';
import { ProgressBar } from '../components/ProgressBar';
import { Colors } from '../utils/constants';
import { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Session'>;

export function SessionScreen({ route, navigation }: Props) {
  const checklist = getChecklistById(route.params.checklistId);
  const { settings } = useSettings();

  if (!checklist) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Checklist not found</Text>
      </View>
    );
  }

  return <SessionActive checklist={checklist} apiKey={settings.apiKey} navigation={navigation} />;
}

function SessionActive({
  checklist,
  apiKey,
  navigation,
}: {
  checklist: NonNullable<ReturnType<typeof getChecklistById>>;
  apiKey: string;
  navigation: Props['navigation'];
}) {
  const { checklistState, agentState, transcript, error, startSession, stopSession } =
    useVoiceSession(checklist, apiKey);

  const { state } = checklistState;
  const currentItem = state.currentIndex < checklist.items.length ? checklist.items[state.currentIndex] : null;
  const progress = checklistState.getProgress();

  // Navigate to summary when complete
  useEffect(() => {
    if (state.status === 'complete') {
      navigation.replace('Summary', {
        checklistId: checklist.id,
        checked: state.checkedItems.size,
        skipped: state.skippedItems.size,
        total: checklist.items.length,
        skippedCritical: checklist.items
          .filter((i) => i.critical && state.skippedItems.has(i.id))
          .map((i) => i.label),
      });
    }
  }, [state.status]);

  return (
    <View style={styles.container}>
      <Text style={styles.checklistTitle}>{checklist.title}</Text>

      <ProgressBar checked={progress.checked} skipped={progress.skipped} total={progress.total} />

      <View style={styles.itemSection}>
        <CurrentItemDisplay item={currentItem} index={state.currentIndex} total={checklist.items.length} />
      </View>

      <MicIndicator state={agentState} />

      {error && <Text style={styles.errorText}>{error}</Text>}

      {!apiKey && (
        <Text style={styles.warningText}>
          No API key set. Go to Settings to add your Google AI key, or tap Start for offline mode.
        </Text>
      )}

      {/* Transcript */}
      <ScrollView style={styles.transcriptBox} contentContainerStyle={styles.transcriptContent}>
        {transcript.map((line, i) => (
          <Text key={i} style={styles.transcriptLine}>
            {line}
          </Text>
        ))}
      </ScrollView>

      {/* Controls */}
      <View style={styles.controls}>
        {agentState === 'idle' || agentState === 'error' || agentState === 'disconnected' ? (
          <TouchableOpacity style={styles.startButton} onPress={startSession}>
            <Text style={styles.startButtonText}>Start</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.stopButton} onPress={stopSession}>
            <Text style={styles.stopButtonText}>Stop</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: 16,
    gap: 16,
  },
  checklistTitle: {
    color: Colors.text,
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  itemSection: {
    flex: 0,
  },
  errorText: {
    color: Colors.critical,
    fontSize: 14,
    textAlign: 'center',
  },
  warningText: {
    color: Colors.warning,
    fontSize: 13,
    textAlign: 'center',
  },
  transcriptBox: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    maxHeight: 150,
  },
  transcriptContent: {
    padding: 12,
  },
  transcriptLine: {
    color: Colors.textSecondary,
    fontSize: 13,
    marginBottom: 4,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    paddingBottom: 16,
  },
  startButton: {
    backgroundColor: Colors.accent,
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 30,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  stopButton: {
    backgroundColor: Colors.critical,
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 30,
  },
  stopButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});
