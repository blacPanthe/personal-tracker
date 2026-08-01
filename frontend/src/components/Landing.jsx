const FEATURES = [
  {
    title: 'Profile',
    description: 'Log your stats, medical history, allergies, and weekly schedule once.',
  },
  {
    title: 'Trackers',
    description: 'GitHub-contribution-style heatmaps for protein, water, steps, sleep, and more.',
  },
  {
    title: 'Meal Plan',
    description: 'A calorie and macro-targeted weekly meal plan generated from your goals.',
  },
  {
    title: 'Workout Plan',
    description: 'A weekly training split built around your real schedule and free hours.',
  },
];

export default function Landing({ onGetStarted, onSignIn }) {
  return (
    <div className="landing">
      <section className="landing-hero">
        <h1>
          Train smarter. <span className="accent">Track everything.</span>
        </h1>
        <p>
          One profile, a full set of habit trackers, and meal + workout plans generated from your own stats and
          schedule — all in one place.
        </p>
        <div className="landing-cta-row">
          <button type="button" className="landing-cta" onClick={onGetStarted}>
            Get started
          </button>
          <button type="button" className="landing-signin" onClick={onSignIn}>
            Sign in
          </button>
        </div>
      </section>

      <section className="landing-features">
        {FEATURES.map((f) => (
          <div className="landing-feature-card" key={f.title}>
            <h3>{f.title}</h3>
            <p>{f.description}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
