const GOAL_LABELS = { cut: 'Fat loss', maintain: 'Maintain', bulk: 'Muscle gain' };

export default function PlanResults({ mode, plan, onGoToProfile }) {
  if (!plan) {
    return (
      <div className="plan-page">
        <p className="plan-empty">
          Fill in your health details first.{' '}
          <button type="button" className="plan-empty-link" onClick={onGoToProfile}>
            Go to Profile
          </button>
        </p>
      </div>
    );
  }

  return (
    <div className="plan-page">
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

        <div className="plan-week">
          {mode === 'meals'
            ? plan.weekPlan.map((day) => (
                <div className="plan-day-card" key={day.day}>
                  <h3>{day.day}</h3>
                  <ul className="plan-meals">
                    {day.meals.map((meal) => (
                      <li key={meal.label}>
                        <span className="plan-meal-time">{meal.time}</span> {meal.label} — {meal.approxCalories} kcal,{' '}
                        {meal.approxProteinG}g protein
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
    </div>
  );
}
