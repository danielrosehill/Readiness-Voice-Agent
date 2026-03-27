import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSettings } from '../hooks/useSettings';
import { Colors } from '../utils/constants';
import { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

export function SettingsScreen({ navigation }: Props) {
  const { settings, updateApiKey, updateLanguage, updateSpeechRate } = useSettings();
  const [keyInput, setKeyInput] = useState(settings.apiKey);
  const [saved, setSaved] = useState(false);

  const handleSaveKey = async () => {
    await updateApiKey(keyInput.trim());
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (!settings.loaded) return null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.sectionTitle}>Google AI API Key</Text>
      <Text style={styles.hint}>
        Required for voice agent. Get a key at ai.google.dev. Your key stays on this device.
      </Text>
      <TextInput
        style={styles.input}
        value={keyInput}
        onChangeText={setKeyInput}
        placeholder="AIza..."
        placeholderTextColor={Colors.textSecondary}
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
      />
      <TouchableOpacity style={styles.saveButton} onPress={handleSaveKey}>
        <Text style={styles.saveButtonText}>{saved ? 'Saved!' : 'Save Key'}</Text>
      </TouchableOpacity>

      <Text style={[styles.sectionTitle, { marginTop: 32 }]}>Language</Text>
      <View style={styles.toggleRow}>
        <TouchableOpacity
          style={[styles.toggleButton, settings.language === 'en' && styles.toggleActive]}
          onPress={() => updateLanguage('en')}
        >
          <Text style={[styles.toggleText, settings.language === 'en' && styles.toggleTextActive]}>
            English
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleButton, settings.language === 'he' && styles.toggleActive]}
          onPress={() => updateLanguage('he')}
        >
          <Text style={[styles.toggleText, settings.language === 'he' && styles.toggleTextActive]}>
            Hebrew
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.sectionTitle, { marginTop: 32 }]}>Speech Rate</Text>
      <View style={styles.rateRow}>
        {[0.75, 1.0, 1.25, 1.5].map((rate) => (
          <TouchableOpacity
            key={rate}
            style={[styles.rateButton, settings.speechRate === rate && styles.rateActive]}
            onPress={() => updateSpeechRate(rate)}
          >
            <Text style={[styles.rateText, settings.speechRate === rate && styles.rateTextActive]}>
              {rate}x
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>About</Text>
        <Text style={styles.infoText}>
          Readiness Voice Agent v0.1.0{'\n'}
          Voice model: Gemini 3.1 Flash Live Preview{'\n'}
          Checklists based on Home Front Command guidance
        </Text>
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
    padding: 20,
    paddingBottom: 60,
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  hint: {
    color: Colors.textSecondary,
    fontSize: 13,
    marginBottom: 12,
    lineHeight: 18,
  },
  input: {
    backgroundColor: Colors.surface,
    color: Colors.text,
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  saveButton: {
    backgroundColor: Colors.accent,
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 12,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 10,
  },
  toggleButton: {
    flex: 1,
    backgroundColor: Colors.surface,
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  toggleActive: {
    borderColor: Colors.accent,
    backgroundColor: Colors.surfaceLight,
  },
  toggleText: {
    color: Colors.textSecondary,
    fontSize: 16,
  },
  toggleTextActive: {
    color: Colors.accent,
    fontWeight: '600',
  },
  rateRow: {
    flexDirection: 'row',
    gap: 10,
  },
  rateButton: {
    flex: 1,
    backgroundColor: Colors.surface,
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  rateActive: {
    borderColor: Colors.accent,
    backgroundColor: Colors.surfaceLight,
  },
  rateText: {
    color: Colors.textSecondary,
    fontSize: 15,
  },
  rateTextActive: {
    color: Colors.accent,
    fontWeight: '600',
  },
  infoBox: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginTop: 40,
    gap: 8,
  },
  infoTitle: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  infoText: {
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
  },
});
