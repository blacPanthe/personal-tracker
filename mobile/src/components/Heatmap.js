import { useState } from 'react';
import { ScrollView, View, Text, Pressable, StyleSheet } from 'react-native';
import { buildWeeks, cellColor, formatTooltip } from '../heatmapUtils';
import { colors } from '../theme';

const CELL = 9;
const GAP = 3;

export default function Heatmap({ metric, entryMap }) {
  const weeks = buildWeeks();
  const [selected, setSelected] = useState(null);

  return (
    <View>
      <Text style={styles.selectedLabel}>
        {selected ? formatTooltip(metric, selected, entryMap[selected]) : 'Tap a day to see its value'}
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.grid}>
          {weeks.map((week, wi) => (
            <View style={styles.col} key={wi}>
              {week.map((iso, di) =>
                iso ? (
                  <Pressable
                    key={di}
                    onPress={() => setSelected(iso)}
                    hitSlop={2}
                    style={[
                      styles.cell,
                      { backgroundColor: cellColor(metric, entryMap[iso]) },
                      selected === iso && styles.cellSelected,
                    ]}
                  />
                ) : (
                  <View key={di} style={[styles.cell, { backgroundColor: 'transparent' }]} />
                )
              )}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  selectedLabel: { color: colors.textDim, fontSize: 12, marginBottom: 6 },
  grid: { flexDirection: 'row', gap: GAP },
  col: { flexDirection: 'column', gap: GAP },
  cell: { width: CELL, height: CELL, borderRadius: 2 },
  cellSelected: { borderWidth: 1, borderColor: colors.neon },
});
