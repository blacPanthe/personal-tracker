import { useEffect, useMemo, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, ScrollView, Text, View, StyleSheet, ActivityIndicator } from 'react-native';
import { getMetrics, getEntriesSummary, upsertEntry } from './src/api';
import { toLocalIso } from './src/heatmapUtils';
import MetricCard from './src/components/MetricCard';
import { colors } from './src/theme';

function isoDaysAgo(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return toLocalIso(d);
}

export default function App() {
  const [metrics, setMetrics] = useState([]);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getMetrics(), getEntriesSummary(isoDaysAgo(371), isoDaysAgo(0))])
      .then(([m, e]) => {
        setMetrics(m);
        setEntries(e);
      })
      .finally(() => setLoading(false));
  }, []);

  const entryMapsByMetric = useMemo(() => {
    const map = {};
    for (const metric of metrics) map[metric.id] = {};
    for (const entry of entries) {
      if (!map[entry.metric_id]) map[entry.metric_id] = {};
      map[entry.metric_id][entry.date] = entry.value;
    }
    return map;
  }, [metrics, entries]);

  const handleLog = async (metric_id, date, value) => {
    const saved = await upsertEntry(metric_id, date, value);
    setEntries((prev) => {
      const withoutOld = prev.filter((e) => !(e.metric_id === metric_id && e.date === date));
      return [...withoutOld, saved];
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <ActivityIndicator color={colors.neon} />
        <StatusBar style="light" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.title}>
            Personal <Text style={{ color: colors.neon }}>Tracker</Text>
          </Text>
          <Text style={styles.subtitle}>Your habits, mapped like commits.</Text>
        </View>
        {metrics.map((metric) => (
          <MetricCard
            key={metric.id}
            metric={metric}
            entryMap={entryMapsByMetric[metric.id] || {}}
            onLog={handleLog}
          />
        ))}
      </ScrollView>
      <StatusBar style="light" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  centered: { alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: 20, paddingBottom: 60 },
  header: { marginBottom: 24 },
  title: { fontSize: 28, fontWeight: '800', color: colors.text },
  subtitle: { color: colors.textDim, marginTop: 4, fontSize: 13 },
});
