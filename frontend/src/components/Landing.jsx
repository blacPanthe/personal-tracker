const FEATURES = [
  {
    icon: '◆',
    title: 'Profile',
    description: 'Log your stats, medical history, allergies, and weekly schedule once.',
  },
  {
    icon: '▦',
    title: 'Trackers',
    description: 'GitHub-contribution-style heatmaps for protein, water, steps, sleep, and more.',
  },
  {
    icon: '▤',
    title: 'Meal Plan',
    description: 'A calorie and macro-targeted weekly meal plan generated from your goals.',
  },
  {
    icon: '▲',
    title: 'Workout Plan',
    description: 'A weekly training split built around your real schedule and free hours.',
  },
];

const STEPS = [
  {
    title: 'Create your account',
    description: 'Sign up with your name, email, and password. Takes about a minute.',
  },
  {
    title: 'Fill in your Profile',
    description: 'Height, age, weight, target weight, activity level, medical history, and your weekly schedule.',
  },
  {
    title: 'Get your plans',
    description: 'Baseline generates a weekly meal plan and workout split from your stats and free time.',
  },
  {
    title: 'Track every day',
    description: 'Log habits on the tracker heatmaps and watch your streaks build like a commit graph.',
  },
];

const FAQ = [
  {
    q: 'Is my data shared with other accounts?',
    a: 'No. Every account gets its own private set of trackers, entries, and generated plans.',
  },
  {
    q: 'How are the meal and workout plans generated?',
    a: 'From your Profile stats (height, weight, target weight, activity level) using standard BMR/TDEE calculations, plus your weekly schedule to figure out which days you actually have time to train.',
  },
  {
    q: 'Can I change my target weight later?',
    a: "Yes - update it on the Profile tab and regenerate your plans any time your goal changes.",
  },
  {
    q: 'Is Baseline free?',
    a: 'Yes, Baseline is free to use.',
  },
];

export default function Landing({ onGetStarted, onSignIn }) {
  return (
    <div className="landing">
      <section className="landing-hero">
        <img src="/logo-wordmark.svg" alt="Baseline" className="landing-mark" width={280} height={84} />
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
            <span className="landing-feature-icon">{f.icon}</span>
            <h3>{f.title}</h3>
            <p>{f.description}</p>
          </div>
        ))}
      </section>

      <section className="landing-section">
        <h2 className="landing-section-title">How it works</h2>
        <div className="landing-steps">
          {STEPS.map((s, i) => (
            <div className="landing-step" key={s.title}>
              <span className="landing-step-number">{i + 1}</span>
              <h3>{s.title}</h3>
              <p>{s.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="landing-section">
        <h2 className="landing-section-title">Frequently asked questions</h2>
        <div className="landing-faq">
          {FAQ.map((item) => (
            <details className="landing-faq-item" key={item.q}>
              <summary>{item.q}</summary>
              <p>{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="landing-final-cta">
        <h2>Ready to start?</h2>
        <button type="button" className="landing-cta" onClick={onGetStarted}>
          Get started
        </button>
      </section>

      <footer className="landing-footer">
        <p>Baseline — your habits, mapped like commits.</p>
        <a href="https://github.com/blacPanthe/personal-tracker" target="_blank" rel="noopener noreferrer">
          View on GitHub
        </a>
      </footer>
    </div>
  );
}
