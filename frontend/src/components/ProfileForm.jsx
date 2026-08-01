import { DAY_LABELS } from '../hooks/usePlanForm';

export default function ProfileForm({ profile, schedule, error, loading, updateField, updateDay, handleSubmit }) {
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
          {loading ? 'Saving…' : 'Save health details'}
        </button>
        {error && <p className="plan-error">{error}</p>}
      </form>
    </div>
  );
}
