// Pure, stateless calculators for BMR/TDEE and template-based meal + workout
// plans. No user data is persisted here - every call is a fresh calculation
// from whatever stats/schedule the caller provides.

const ACTIVITY_MULTIPLIERS = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
};

const GOAL_CALORIE_ADJUSTMENT = {
  cut: -0.2,
  maintain: 0,
  bulk: 0.15,
};

// Grams of protein per kg bodyweight - higher on a cut to preserve muscle
// through the deficit.
const GOAL_PROTEIN_PER_KG = {
  cut: 2.4,
  maintain: 2.0,
  bulk: 2.0,
};

const WORKOUT_TEMPLATES = {
  1: ['Full Body'],
  2: ['Full Body A', 'Full Body B'],
  3: ['Full Body A', 'Full Body B', 'Full Body C'],
  4: ['Upper', 'Lower', 'Upper', 'Lower'],
  5: ['Push', 'Pull', 'Legs', 'Upper', 'Lower'],
  6: ['Push', 'Pull', 'Legs', 'Push', 'Pull', 'Legs'],
};

function bmr({ sex, weightKg, heightCm, age, bodyFatPercent }) {
  if (bodyFatPercent != null) {
    // Katch-McArdle: more accurate when lean body mass is actually known.
    const leanMassKg = weightKg * (1 - bodyFatPercent / 100);
    return 370 + 21.6 * leanMassKg;
  }
  // Mifflin-St Jeor fallback when body fat % isn't available.
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return sex === 'male' ? base + 5 : base - 161;
}

function tdee(bmrValue, activityLevel) {
  return bmrValue * (ACTIVITY_MULTIPLIERS[activityLevel] ?? ACTIVITY_MULTIPLIERS.moderate);
}

function targetCalories(tdeeValue, goal) {
  return tdeeValue * (1 + (GOAL_CALORIE_ADJUSTMENT[goal] ?? 0));
}

// Within 1kg of target counts as "maintain" - anything further out picks a
// direction based on which way the user needs to move.
const MAINTAIN_TOLERANCE_KG = 1;

function deriveGoal(weightKg, targetWeightKg) {
  const delta = targetWeightKg - weightKg;
  if (Math.abs(delta) <= MAINTAIN_TOLERANCE_KG) return 'maintain';
  return delta < 0 ? 'cut' : 'bulk';
}

function macros(calories, weightKg, goal) {
  const proteinG = Math.round((GOAL_PROTEIN_PER_KG[goal] ?? 2.0) * weightKg);
  const proteinCal = proteinG * 4;
  const fatCal = calories * 0.25;
  const fatG = Math.round(fatCal / 9);
  const carbCal = Math.max(calories - proteinCal - fatCal, 0);
  const carbG = Math.round(carbCal / 4);
  return { proteinG, fatG, carbG };
}

// A day counts as a workout day if it's off entirely, or has a long enough
// gap around work to realistically train (2+ free hours).
function freeHours(day) {
  if (!day || day.isOff) return 24;
  const start = day.workStart ? toMinutes(day.workStart) : null;
  const end = day.workEnd ? toMinutes(day.workEnd) : null;
  if (start == null || end == null) return 24;
  return 24 - (end - start) / 60;
}

function toMinutes(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + (m || 0);
}

function suggestWorkoutTime(day) {
  if (!day || day.isOff || !day.workStart) return 'Anytime';
  const startMin = toMinutes(day.workStart);
  // Only worth training before work if there's a realistic gap to wake,
  // train, shower and commute - a 9am start doesn't leave enough room.
  if (startMin >= 10 * 60) return 'Morning, before work';
  return 'Evening, after work';
}

function mealPlanForDay(day, calories, macroSplit) {
  const hours = freeHours(day);
  const mealCount = hours >= 10 ? 4 : 3;
  const perMeal = Math.round(calories / mealCount);
  const times =
    mealCount === 4
      ? ['7:30 AM', '12:30 PM', '4:00 PM', '7:30 PM']
      : ['8:00 AM', '1:00 PM', '7:00 PM'];
  return times.map((time, i) => ({
    time,
    label: `Meal ${i + 1}`,
    approxCalories: perMeal,
    approxProteinG: Math.round(macroSplit.proteinG / mealCount),
  }));
}

function generatePlan({ heightCm, age, sex, weightKg, targetWeightKg, bodyFatPercent, activityLevel, schedule }) {
  const goal = deriveGoal(weightKg, targetWeightKg);
  const bmrValue = bmr({ sex, weightKg, heightCm, age, bodyFatPercent });
  const tdeeValue = tdee(bmrValue, activityLevel);
  const calories = targetCalories(tdeeValue, goal);
  const macroSplit = macros(calories, weightKg, goal);

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const normalizedSchedule = days.map((label, i) => schedule?.[i] ?? { isOff: true });

  const workoutDayCount = normalizedSchedule.filter((d) => freeHours(d) >= 2).length;
  const templateKey = Math.min(Math.max(workoutDayCount, 1), 6);
  const template = WORKOUT_TEMPLATES[templateKey];

  let templateIndex = 0;
  const weekPlan = normalizedSchedule.map((day, i) => {
    const canWorkout = freeHours(day) >= 2;
    const workout = canWorkout
      ? { type: template[templateIndex % template.length], time: suggestWorkoutTime(day) }
      : { type: 'Rest', time: null };
    if (canWorkout) templateIndex++;

    return {
      day: days[i],
      isOff: !!day.isOff,
      workout,
      meals: mealPlanForDay(day, calories, macroSplit),
    };
  });

  return {
    bmr: Math.round(bmrValue),
    tdee: Math.round(tdeeValue),
    targetCalories: Math.round(calories),
    goal,
    macros: macroSplit,
    weekPlan,
  };
}

module.exports = { generatePlan };
