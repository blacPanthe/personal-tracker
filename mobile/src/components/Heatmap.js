import { ScrollView, View, StyleSheet } from 'react-native';
import { buildWeeks, cellColor } from '../heatmapUtils';

const CELL = 9;
const GAP = 3;

export default function Heatmap({ metric, entryMap }) {
  const weeks = buildWeeks();

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={styles.grid}>
        {weeks.map((week, wi) => (
          <View style={styles.col} key={wi}>
            {week.map((iso, di) => (
              <View
                key={di}
                style={[
                  styles.cell,
                  { backgroundColor: iso ? cellColor(metric, entryMap[iso]) : 'transparent' },
                ]}
              />
            ))}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', gap: GAP },
  col: { flexDirection: 'column', gap: GAP },
  cell: { width: CELL, height: CELL, borderRadius: 2 },
});
