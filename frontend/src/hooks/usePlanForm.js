import { useState } from 'react';
import { generatePlan, getProfile, saveProfile } from '../api';

export const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const emptyDay = () => ({ isOff: false, workStart: '09:00', workEnd: '18:00' });

export function usePlanForm() {
  const [profile, setProfile] = useState({
    name: '',
    heightCm: '',
    age: '',
    sex: 'male',
    weightKg: '',
    targetWeightKg: '',
    bodyFatPercent: '',
    activityLevel: 'moderate',
    medicalHistory: '',
    allergies: '',
    injuries: '',
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

  const loadProfile = async () => {
    const saved = await getProfile();
    if (!saved) return;
    if (saved.profile) setProfile((p) => ({ ...p, ...saved.profile }));
    if (Array.isArray(saved.schedule) && saved.schedule.length === 7) setSchedule(saved.schedule);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await saveProfile(profile, schedule);
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

  return { profile, schedule, plan, error, loading, updateField, updateDay, handleSubmit, loadProfile };
}
