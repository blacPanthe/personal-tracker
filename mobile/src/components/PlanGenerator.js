import { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet, Switch } from 'react-native';
import { generatePlan } from '../api';
import { colors } from '../theme';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const emptyDay = () => ({ isOff: false, workStart: '09:00', workEnd: '18:00' });

export default function PlanGenerator() {
  const [profile, setProfile] = useState({
    heightCm: '',
    age: '',
    sex: 'male',
    weightKg: '',
    bodyFatPercent: '',
    goal: 'maintain',
    activityLevel: 'moderate',
  });
  const [schedule, setSchedule] = useState(
    DAY_LABELS.map((_, i) => (i === 0 || i === 6 ? { ...emptyDay(), isOff: true } : emptyDay()))
  );
  const [plan, setPlan] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const updateField = (field, value) => setProfile((p) => ({ ...p, [field]: value }));
  const updateDay = (index, patch) =>
    setSchedule((prev) => prev.map((d, i) => (i === index ? { ...d, ...patch } : d)));

  const handleSubmit = async () => {
    setError(null);
    setLoading(true);
    try {
      const result = await generatePlan({
        heightCm: Number(profile.heightCm),
        age: Number(profile.age),
        sex: profile.sex,
        weightKg: Number(profile.weightKg),
        bodyFatPercent: profile.bodyFatPercent ? Number(profile.bodyFatPercent) : null,
        goal: profile.goal,
        activityLevel: profile.activityLevel,
        schedule: schedule.map((d) => (d.isOff ? { isOff: true } : { workStart: d.workStart, workEnd: d.workEnd })),
      });
      setPlan(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View>
      <View style={styles.form}>
        <Field label="Height (cm)" value={profile.heightCm} onChangeText={(v) => updateField('heightCm', v)} />
        <Field label="Age" value={profile.age} onChangeText={(v) => updateField('age', v)} />
        <Field label="Weight (kg)" value={profile.weightKg} onChangeText={(v) => updateField('weightKg', v)} />
        <Field
          label="Body fat % (optional)"
          value={profile.bodyFatPercent}
          onChangeText={(v) => updateField('bodyFatPercent', v)}
        />

        <Text style={styles.label}>Sex</Text>
        <ChoiceRow
          options={[
            { key: 'male', label: 'Male' },
            { key: 'female', label: 'Female' },
          ]}
          value={profile.sex}
          onChange={(v) => updateField('sex', v)}
        />

        <Text style={styles.label}>Goal</Text>
        <ChoiceRow
          options={[
            { key: 'cut', label: 'Fat loss' },
            { key: 'maintain', label: 'Maintain' },
            { key: 'bulk', label: 'Muscle gain' },
          ]}
          value={profile.goal}
          onChange={(v) => updateField('goal', v)}
        />

        <Text style={styles.label}>Activity level</Text>
        <ChoiceRow
          options={[
            { key: 'sedentary', label: 'Sedentary' },
            { key: 'light', label: 'Light' },
            { key: 'moderate', label: 'Moderate' },
            { key: 'active', label: 'Active' },
          ]}
          value={profile.activityLevel}
          onChange={(v) => updateField('activityLevel', v)}
        />

        <Text style={styles.label}>Weekly schedule</Text>
        {schedule.map((day, i) => (
          <View style={styles.dayRow} key={i}>
            <Text style={styles.dayLabel}>{DAY_LABELS[i]}</Text>
            <View style={styles.offToggle}>
              <Switch
                value={day.isOff}
                onValueChange={(v) => updateDay(i, { isOff: v })}
                trackColor={{ true: colors.neon }}
              />
              <Text style={styles.offLabel}>Off</Text>
            </View>
            {!day.isOff && (
              <>
                <TextInput
                  style={styles.timeInput}
                  value={day.workStart}
                  onChangeText={(v) => updateDay(i, { workStart: v })}
                  placeholder="09:00"
                  placeholderTextColor={colors.textDim}
                />
                <Text style={styles.toLabel}>to</Text>
                <TextInput
                  style={styles.timeInput}
                  value={day.workEnd}
                  onChangeText={(v) => updateDay(i, { workEnd: v })}
                  placeholder="18:00"
                  placeholderTextColor={colors.textDim}
                />
              </>
            )}
          </View>
        ))}

        <Pressable style={styles.submit} onPress={handleSubmit} disabled={loading}>
          <Text style={styles.submitText}>{loading ? 'Generating…' : 'Generate my plan'}</Text>
        </Pressable>
        {error && <Text style={styles.error}>{error}</Text>}
      </View>

      {plan && (
        <View style={styles.results}>
          <View style={styles.statsRow}>
            <Stat value={plan.bmr} label="BMR (kcal)" />
            <Stat value={plan.tdee} label="TDEE (kcal)" />
            <Stat value={plan.targetCalories} label="Target kcal" />
            <Stat value={`${plan.macros.proteinG}g`} label="Protein" />
            <Stat value={`${plan.macros.carbG}g`} label="Carbs" />
            <Stat value={`${plan.macros.fatG}g`} label="Fat" />
          </View>

          {plan.weekPlan.map((day) => (
            <View style={styles.dayCard} key={day.day}>
              <Text style={styles.dayCardTitle}>{day.day}</Text>
              <Text style={styles.workoutLine}>
                {day.workout.type}
                {day.workout.time ? <Text style={styles.workoutTime}> · {day.workout.time}</Text> : null}
              </Text>
              {day.meals.map((meal) => (
                <Text style={styles.mealLine} key={meal.label}>
                  <Text style={styles.mealTime}>{meal.time}</Text> {meal.label} — {meal.approxCalories} kcal,{' '}
                  {meal.approxProteinG}g protein
                </Text>
              ))}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function Field({ label, value, onChangeText }) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        keyboardType="numeric"
        placeholderTextColor={colors.textDim}
      />
    </View>
  );
}

function ChoiceRow({ options, value, onChange }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {options.map((opt) => (
          <Pressable
            key={opt.key}
            style={[styles.choiceBtn, value === opt.key && styles.choiceBtnActive]}
            onPress={() => onChange(opt.key)}
          >
            <Text style={[styles.choiceText, value === opt.key && styles.choiceTextActive]}>{opt.label}</Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

function Stat({ value, label }) {
  return (
    <View style={styles.statTile}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  form: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 16 },
  label: { color: colors.textDim, fontSize: 12, marginBottom: 6 },
  input: {
    backgroundColor: '#0d0d10',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    color: colors.text,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
  },
  choiceBtn: {
    backgroundColor: '#0d0d10',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  choiceBtnActive: { borderColor: colors.neon, backgroundColor: 'rgba(234,255,0,0.12)' },
  choiceText: { color: colors.textDim, fontSize: 12 },
  choiceTextActive: { color: colors.neon },
  dayRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  dayLabel: { width: 32, color: colors.text, fontWeight: '700', fontSize: 12 },
  offToggle: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  offLabel: { color: colors.textDim, fontSize: 11 },
  timeInput: {
    backgroundColor: '#0d0d10',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    color: colors.text,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 12,
    width: 64,
  },
  toLabel: { color: colors.textDim, fontSize: 11 },
  submit: { backgroundColor: colors.neon, borderRadius: 8, paddingVertical: 12, alignItems: 'center', marginTop: 8 },
  submitText: { color: '#0a0a0c', fontWeight: '700', fontSize: 13 },
  error: { color: '#ff3131', fontSize: 12, marginTop: 8 },
  results: { marginTop: 20 },
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  statTile: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    minWidth: 90,
    flexGrow: 1,
  },
  statValue: { color: colors.neon, fontWeight: '700', fontSize: 18 },
  statLabel: { color: colors.textDim, fontSize: 10, marginTop: 2 },
  dayCard: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 14, marginBottom: 10 },
  dayCardTitle: { color: colors.text, fontSize: 15, fontWeight: '700', marginBottom: 6 },
  workoutLine: { color: colors.neon, fontSize: 12, marginBottom: 8 },
  workoutTime: { color: colors.textDim },
  mealLine: { color: colors.textDim, fontSize: 11, marginBottom: 4 },
  mealTime: { color: colors.text },
});
