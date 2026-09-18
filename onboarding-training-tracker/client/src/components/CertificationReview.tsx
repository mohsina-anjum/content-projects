import { useEffect, useRef, useState } from 'react';
import { api } from '../api/client';
import { CERTIFICATION_RECOMMENDATIONS, CertificationRecommendation, NewHireWithProgress } from '../types';

interface Props {
  hire: NewHireWithProgress;
  categories: string[];
  onUpdated: (updated: NewHireWithProgress) => void;
}

export default function CertificationReview({ hire, categories, onUpdated }: Props) {
  const [notes, setNotes] = useState(hire.certification_notes ?? '');
  const [saved, setSaved] = useState(false);
  const savedTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setNotes(hire.certification_notes ?? '');
  }, [hire.id, hire.certification_notes]);

  useEffect(() => {
    return () => {
      if (savedTimeout.current) clearTimeout(savedTimeout.current);
    };
  }, []);

  function flashSaved() {
    setSaved(true);
    if (savedTimeout.current) clearTimeout(savedTimeout.current);
    savedTimeout.current = setTimeout(() => setSaved(false), 1500);
  }

  async function save(
    patch: Partial<{
      certification_notes: string | null;
      certification_recommendation: CertificationRecommendation | null;
      certification_training_areas: string[];
    }>
  ) {
    const updated = await api.updateNewHire(hire.id, patch);
    onUpdated(updated);
    flashSaved();
  }

  function handleNotesBlur() {
    if (notes !== (hire.certification_notes ?? '')) {
      save({ certification_notes: notes.trim() === '' ? null : notes });
    }
  }

  function handleRecommendationChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value;
    save({
      certification_recommendation: value === '' ? null : (value as CertificationRecommendation),
    });
  }

  function toggleTrainingArea(category: string) {
    const current = hire.certification_training_areas;
    const next = current.includes(category)
      ? current.filter((c) => c !== category)
      : [...current, category];
    save({ certification_training_areas: next });
  }

  return (
    <div className="cert-review">
      <div className="cert-review-header">
        <h3 className="cert-review-title">Certification Review</h3>
        {saved && <span className="saved-indicator">Saved</span>}
      </div>

      <label className="form-field">
        <span>Review Notes</span>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={handleNotesBlur}
          rows={3}
          placeholder="Add review notes here, these notes will be shared with the employee as feedback"
        />
      </label>

      <label className="form-field">
        <span>Buddy Recommendation</span>
        <select
          value={hire.certification_recommendation ?? ''}
          onChange={handleRecommendationChange}
        >
          <option value="">Not yet reviewed</option>
          {CERTIFICATION_RECOMMENDATIONS.map((r) => (
            <option key={r.key} value={r.key}>
              {r.label}
            </option>
          ))}
        </select>
      </label>

      {hire.certification_recommendation === 'certified' && (
        <div className="cert-certified-badge">
          CERTIFIED
          <span className="cert-certified-subtext">Certification call complete</span>
        </div>
      )}

      {hire.certification_recommendation === 'needs_training' && (
        <div className="form-field">
          <span>Needs More Training On</span>
          <div className="cert-training-areas">
            {categories.map((category) => (
              <label key={category} className="cert-training-checkbox">
                <input
                  type="checkbox"
                  checked={hire.certification_training_areas.includes(category)}
                  onChange={() => toggleTrainingArea(category)}
                />
                {category === 'Certification' ? 'Certification call (when applicable)' : category}
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
