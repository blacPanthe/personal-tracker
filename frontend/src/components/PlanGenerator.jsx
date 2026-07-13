import { useState } from 'react';
import { generatePlan } from '../api';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const GOAL_LABELS = { cut: 'Fat loss', maintain: 'Maintain', bulk: 'Muscle gain' };

const emptyDay = () => ({ isOff: false, workStart: '09:00', workEnd: '18:00' });

export default function PlanGenerator() {
  const [profile, setProfile] = useState({
    heightCm: '',
    age: '',
    sex: 'male',
    weightKg: '',
    targetWeightKg: '',
    bodyFatPercent: '',
    activityLevel: 'moderate',
  });
  const [schedule, setSchedule] = useState(
    DAY_LABELS.map((_, i) => (i === 0 || i === 6 ? { ...emptyDay(), isOff: true } : emptyDay()))
  );
  const [plan, setPlan] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [resultTab, setResultTab] = useState('meals');

  const updateField = (field, value) => setProfile((p) => ({ ...p, [field]: value }));

  const updateDay = (index, patch) =>
    setSchedule((prev) => prev.map((d, i) => (i === index ? { ...d, ...patch } : d)));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await generatePlan({
        heightCm: Number(profile.heightCm),
        age: Number(profile.age),
        sex: profile.sex,
        weightKg: Number(profile.weightKg),
        targetWeightKg: Number(profile.targetWeightKg),
        bodyFatPercent: profile.bodyFatPercent ? Number(profile.bodyFatPercent) : null,
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
    <div className="plan-page">
      <form className="plan-form" onSubmit={handleSubmit}>
        <div className="plan-form-grid">
          <label>
            Height (cm)
            <input
              type="number"
              required
              value={profile.heightCm}
              onChange={(e) => updateField('heightCm', e.target.value)}
            />
          </label>
          <label>
            Age
            <input type="number" required value={profile.age} onChange={(e) => updateField('age', e.target.value)} />
          </label>
          <label>
            Sex
            <select value={profile.sex} onChange={(e) => updateField('sex', e.target.value)}>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </label>
          <label>
            Weight (kg)
            <input
              type="number"
              required
              value={profile.weightKg}
              onChange={(e) => updateField('weightKg', e.target.value)}
            />
          </label>
          <label>
            Target weight (kg)
            <input
              type="number"
              required
              value={profile.targetWeightKg}
              onChange={(e) => updateField('targetWeightKg', e.target.value)}
            />
          </label>
          <label>
            Body fat % (optional)
            <input
              type="number"
              value={profile.bodyFatPercent}
              onChange={(e) => updateField('bodyFatPercent', e.target.value)}
            />
          </label>
          <label>
            Activity level
            <select value={profile.activityLevel} onChange={(e) => updateField('activityLevel', e.target.value)}>
              <option value="sedentary">Sedentary</option>
              <option value="light">Lightly active</option>
              <option value="moderate">Moderately active</option>
              <option value="active">Very active</option>
            </select>
          </label>
        </div>

        <div className="plan-schedule">
          {schedule.map((day, i) => (
            <div className="plan-day-row" key={i}>
              <span className="plan-day-label">{DAY_LABELS[i]}</span>
              <label className="plan-off-toggle">
                <input
                  type="checkbox"
                  checked={day.isOff}
                  onChange={(e) => updateDay(i, { isOff: e.target.checked })}
                />
                Off
              </label>
              {!day.isOff && (
                <>
                  <input
                    type="time"
                    value={day.workStart}
                    onChange={(e) => updateDay(i, { workStart: e.target.value })}
                  />
                  <span className="plan-day-sep">to</span>
                  <input
                    type="time"
                    value={day.workEnd}
                    onChange={(e) => updateDay(i, { workEnd: e.target.value })}
                  />
                </>
              )}
            </div>
          ))}
        </div>

        <button type="submit" className="plan-submit" disabled={loading}>
          {loading ? 'Generating…' : 'Generate my plan'}
        </button>
        {error && <p className="plan-error">{error}</p>}
      </form>

      {plan && (
        <div className="plan-results">
          <div className="plan-stats-row">
            <div className="plan-stat-tile">
              <span className="plan-stat-value">{GOAL_LABELS[plan.goal]}</span>
              <span className="plan-stat-label">Goal</span>
            </div>
            <div className="plan-stat-tile">
              <span className="plan-stat-value">{plan.bmr}</span>
              <span className="plan-stat-label">BMR (kcal)</span>
            </div>
            <div className="plan-stat-tile">
              <span className="plan-stat-value">{plan.tdee}</span>
              <span className="plan-stat-label">TDEE (kcal)</span>
            </div>
            <div className="plan-stat-tile">
              <span className="plan-stat-value">{plan.targetCalories}</span>
              <span className="plan-stat-label">Target calories</span>
            </div>
            <div className="plan-stat-tile">
              <span className="plan-stat-value">{plan.macros.proteinG}g</span>
              <span className="plan-stat-label">Protein</span>
            </div>
            <div className="plan-stat-tile">
              <span className="plan-stat-value">{plan.macros.carbG}g</span>
              <span className="plan-stat-label">Carbs</span>
            </div>
            <div className="plan-stat-tile">
              <span className="plan-stat-value">{plan.macros.fatG}g</span>
              <span className="plan-stat-label">Fat</span>
            </div>
          </div>

          <nav className="app-tabs">
            <button
              className={`app-tab${resultTab === 'meals' ? ' active' : ''}`}
              onClick={() => setResultTab('meals')}
            >
              Meal Plan
            </button>
            <button
              className={`app-tab${resultTab === 'workouts' ? ' active' : ''}`}
              onClick={() => setResultTab('workouts')}
            >
              Workout Plan
            </button>
          </nav>

          <div className="plan-week">
            {resultTab === 'meals'
              ? plan.weekPlan.map((day) => (
                  <div className="plan-day-card" key={day.day}>
                    <h3>{day.day}</h3>
                    <ul className="plan-meals">
                      {day.meals.map((meal) => (
                        <li key={meal.label}>
                          <span className="plan-meal-time">{meal.time}</span> {meal.label} — {meal.approxCalories}{' '}
                          kcal, {meal.approxProteinG}g protein
                        </li>
                      ))}
                    </ul>
                  </div>
                ))
              : plan.weekPlan.map((day) => (
                  <div className="plan-day-card" key={day.day}>
                    <h3>{day.day}</h3>
                    <p className="plan-workout">
                      {day.workout.type}
                      {day.workout.time && <span className="plan-workout-time"> · {day.workout.time}</span>}
                    </p>
                  </div>
                ))}
          </div>
        </div>
      )}
    </div>
  );
}
