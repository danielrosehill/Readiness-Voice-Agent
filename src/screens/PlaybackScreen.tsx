import React, { useRef, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { getChecklistById } from '../data/checklists';
import { usePlayback, PlaybackStatus } from '../hooks/usePlayback';
import { useSettings } from '../hooks/useSettings';
import { Colors } from '../utils/constants';
import { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Playback'>;

export function PlaybackScreen({ route }: Props) {
  const checklist = getChecklistById(route.params.checklistId);
  const { settings } = useSettings();

  if (!checklist) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Checklist not found</Text>
      </View>
    );
  }

  return <PlaybackActive checklist={checklist} apiKey={settings.apiKey} />;
}

function PlaybackActive({
  checklist,
  apiKey,
}: {
  checklist: NonNullable<ReturnType<typeof getChecklistById>>;
  apiKey: string;
}) {
  const { status, error, currentItemIndex, generateAndPlay, stop, pause, resume } =
    usePlayback(checklist, apiKey);
  const listRef = useRef<FlatList>(null);

  // Auto-scroll to current item
  useEffect(() => {
    if (currentItemIndex >= 0 && listRef.current) {
      listRef.current.scrollToIndex({
        index: currentItemIndex,
        animated: true,
        viewPosition: 0.3,
      });
    }
  }, [currentItemIndex]);

  const statusLabel = STATUS_LABELS[status];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{checklist.title}</Text>
      {checklist.description ? (
        <Text style={styles.description}>{checklist.description}</Text>
      ) : null}

      {/* Status indicator */}
      <View style={styles.statusRow}>
        <View style={[styles.statusDot, { backgroundColor: STATUS_COLORS[status] }]} />
        <Text style={styles.statusText}>{statusLabel}</Text>
        {currentItemIndex >= 0 && (
          <Text style={styles.progressText}>
            {currentItemIndex + 1} / {checklist.items.length}
          </Text>
        )}
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}

      {!apiKey && status === 'idle' && (
        <Text style={styles.hintText}>
          No API key set — will use device text-to-speech.
        </Text>
      )}

      {/* Checklist items */}
      <FlatList
        ref={listRef}
        data={checklist.items}
        keyExtractor={(item) => item.id}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        onScrollToIndexFailed={() => {}}
        renderItem={({ item, index }) => {
          const isCurrent = index === currentItemIndex;
          const isPast = index < currentItemIndex;
          return (
            <View
              style={[
                styles.itemRow,
                isCurrent && styles.itemCurrent,
                isPast && styles.itemDone,
              ]}
            >
              <View style={styles.itemNumber}>
                <Text
                  style={[
                    styles.itemNumberText,
                    isCurrent && styles.itemNumberCurrent,
                    isPast && styles.itemNumberDone,
                  ]}
                >
                  {index + 1}
                </Text>
              </View>
              <View style={styles.itemContent}>
                <Text
                  style={[
                    styles.itemLabel,
                    isCurrent && styles.itemLabelCurrent,
                    isPast && styles.itemLabelDone,
                  ]}
                >
                  {item.label}
                  {item.critical ? '  ⚠' : ''}
                </Text>
                {item.subItems?.length ? (
                  <Text style={styles.itemSub}>
                    {item.subItems.join(' · ')}
                  </Text>
                ) : null}
              </View>
            </View>
          );
        }}
      />

      {/* Controls */}
      <View style={styles.controls}>
        {status === 'idle' || status === 'done' || status === 'error' ? (
          <TouchableOpacity style={styles.playButton} onPress={generateAndPlay}>
            <Text style={styles.buttonText}>
              {status === 'done' ? '↻ Replay' : '▶ Listen'}
            </Text>
          </TouchableOpacity>
        ) : status === 'generating' ? (
          <View style={styles.generatingButton}>
            <Text style={styles.buttonTextDim}>Generating audio…</Text>
          </View>
        ) : status === 'playing' ? (
          <View style={styles.controlRow}>
            <TouchableOpacity style={styles.pauseButton} onPress={pause}>
              <Text style={styles.buttonText}>⏸ Pause</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.stopButton} onPress={stop}>
              <Text style={styles.buttonText}>■ Stop</Text>
            </TouchableOpacity>
          </View>
        ) : status === 'paused' ? (
          <View style={styles.controlRow}>
            <TouchableOpacity style={styles.playButton} onPress={resume}>
              <Text style={styles.buttonText}>▶ Resume</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.stopButton} onPress={stop}>
              <Text style={styles.buttonText}>■ Stop</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const STATUS_LABELS: Record<PlaybackStatus, string> = {
  idle: 'Ready to play',
  generating: 'Generating audio…',
  playing: 'Playing',
  paused: 'Paused',
  done: 'Finished',
  error: 'Error',
};

const STATUS_COLORS: Record<PlaybackStatus, string> = {
  idle: Colors.textSecondary,
  generating: Colors.warning,
  playing: Colors.success,
  paused: Colors.warning,
  done: Colors.accent,
  error: Colors.critical,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: 16,
    gap: 12,
  },
  title: {
    color: Colors.text,
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  description: {
    color: Colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusText: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
  progressText: {
    color: Colors.accent,
    fontSize: 14,
    fontWeight: '600',
  },
  errorText: {
    color: Colors.critical,
    fontSize: 14,
    textAlign: 'center',
  },
  hintText: {
    color: Colors.warning,
    fontSize: 13,
    textAlign: 'center',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 20,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 4,
    gap: 12,
  },
  itemCurrent: {
    backgroundColor: Colors.surfaceLight,
    borderWidth: 1,
    borderColor: Colors.accent,
  },
  itemDone: {
    opacity: 0.5,
  },
  itemNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemNumberText: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  itemNumberCurrent: {
    color: Colors.accent,
  },
  itemNumberDone: {
    color: Colors.success,
  },
  itemContent: {
    flex: 1,
    gap: 3,
  },
  itemLabel: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: '500',
  },
  itemLabelCurrent: {
    color: Colors.accent,
    fontWeight: '700',
  },
  itemLabelDone: {
    color: Colors.textSecondary,
  },
  itemSub: {
    color: Colors.textSecondary,
    fontSize: 12,
    lineHeight: 16,
  },
  controls: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  controlRow: {
    flexDirection: 'row',
    gap: 16,
  },
  playButton: {
    backgroundColor: Colors.accent,
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 30,
  },
  pauseButton: {
    backgroundColor: Colors.warning,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 30,
  },
  stopButton: {
    backgroundColor: Colors.critical,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 30,
  },
  generatingButton: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  buttonTextDim: {
    color: Colors.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
});
