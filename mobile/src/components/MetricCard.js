import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import Heatmap from './Heatmap';
import { currentStreak, longestStreak, totalActiveDays, toLocalIso } from '../heatmapUtils';
import { colors } from '../theme';

export default function MetricCard({ metric, entryMap, onLog }) {
  const [value, setValue] = useState('');
  const streak = currentStreak(metric, entryMap);
  const best = longestStreak(metric, entryMap);
  const total = totalActiveDays(metric, entryMap);

  const handleLog = () => {
    const today = toLocalIso(new Date());
    if (metric.type === 'boolean') {
      onLog(metric.id, today, 1);
      return;
    }
    const num = Number(value);
    if (Number.isNaN(num) || value === '') return;
    onLog(metric.id, today, num);
    setValue('');
  };

  return (
    <View style={[styles.card, { borderColor: colors.border }]}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: metric.color }]}>{metric.name}</Text>
          <Text style={styles.streak}>
            {streak > 0 ? `${streak} day${streak === 1 ? '' : 's'} streak` : 'no streak yet'}
            {'  ·  '}best {best}
            {'  ·  '}{total} in the last year
          </Text>
        </View>
        <View style={styles.form}>
          {metric.type === 'numeric' ? (
            <TextInput
              style={styles.input}
              placeholder={metric.unit || 'value'}
              placeholderTextColor={colors.textDim}
              keyboardType="numeric"
              value={value}
              onChangeText={setValue}
            />
          ) : null}
          <Pressable style={[styles.button, { backgroundColor: metric.color }]} onPress={handleLog}>
            <Text style={styles.buttonText}>{metric.type === 'boolean' ? '✓' : 'Log'}</Text>
          </Pressable>
        </View>
      </View>
      <Heatmap metric={metric} entryMap={entryMap} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    flexWrap: 'wrap',
    gap: 8,
  },
  title: { fontSize: 16, fontWeight: '700' },
  streak: { fontSize: 11, color: colors.textDim, marginTop: 2 },
  form: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  input: {
    backgroundColor: '#0d0d10',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    color: colors.text,
    paddingHorizontal: 8,
    paddingVertical: 6,
    width: 80,
    fontSize: 12,
  },
  button: { borderRadius: 6, paddingHorizontal: 12, paddingVertical: 7 },
  buttonText: { color: '#0a0a0c', fontWeight: '700', fontSize: 12 },
});
