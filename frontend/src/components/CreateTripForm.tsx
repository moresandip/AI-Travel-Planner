'use client';

import React, { useState } from 'react';

interface CreateTripFormProps {
  onSubmit: (tripData: {
    destination: string;
    durationDays: number;
    budgetTier: string;
    interests: string[];
  }) => Promise<void>;
  loading: boolean;
}

const INTERESTS_OPTIONS = [
  { label: '🍔 Food & Culinary', value: 'Food' },
  { label: '🏛️ Art & Culture', value: 'Culture' },
  { label: '🧗 Extreme Adventure', value: 'Adventure' },
  { label: '🛍️ Retail & Shopping', value: 'Shopping' },
  { label: '🌴 Rest & Relaxation', value: 'Relaxation' },
  { label: '⛰️ Nature & Outdoors', value: 'Nature' },
];

export default function CreateTripForm({ onSubmit, loading }: CreateTripFormProps) {
  const [destination, setDestination] = useState('');
  const [durationDays, setDurationDays] = useState(3);
  const [budgetTier, setBudgetTier] = useState('Medium');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  const handleInterestChange = (val: string) => {
    setSelectedInterests((prev) =>
      prev.includes(val) ? prev.filter((i) => i !== val) : [...prev, val]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!destination.trim()) return;
    await onSubmit({
      destination,
      durationDays,
      budgetTier,
      interests: selectedInterests,
    });
    // Reset form upon success
    setDestination('');
    setSelectedInterests([]);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-1.5">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Destination</label>
        <input
          type="text"
          placeholder="Where to? (e.g. Kyoto, Japan)"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          required
          disabled={loading}
          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 transition text-white"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Duration (Days)</label>
          <select
            value={durationDays}
            onChange={(e) => setDurationDays(Number(e.target.value))}
            disabled={loading}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 transition text-white"
          >
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
              <option key={num} value={num}>
                {num} {num === 1 ? 'Day' : 'Days'}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Budget Tier</label>
          <select
            value={budgetTier}
            onChange={(e) => setBudgetTier(e.target.value)}
            disabled={loading}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 transition text-white"
          >
            <option value="Low">Low (Backpacker)</option>
            <option value="Medium">Medium (Balanced)</option>
            <option value="High">High (Luxury)</option>
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">Interests</label>
        <div className="grid grid-cols-2 gap-2">
          {INTERESTS_OPTIONS.map((item) => {
            const isChecked = selectedInterests.includes(item.value);
            return (
              <button
                key={item.value}
                type="button"
                disabled={loading}
                onClick={() => handleInterestChange(item.value)}
                className={`text-left p-3 rounded-xl border text-xs font-medium transition flex items-center justify-between ${
                  isChecked
                    ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <span>{item.label}</span>
                {isChecked && <span className="text-indigo-400">✓</span>}
              </button>
            );
          })}
        </div>
      </div>

      <button
        type="submit"
        disabled={loading || !destination.trim()}
        className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white font-semibold py-4 rounded-xl transition shadow-xl shadow-indigo-600/20 flex justify-center items-center gap-2"
      >
        {loading ? (
          <>
            <span className="animate-spin text-lg">⚙️</span>
            <span>Generating Custom Itinerary...</span>
          </>
        ) : (
          <>
            <span>⚡</span>
            <span>Generate Travel Blueprint</span>
          </>
        )}
      </button>
    </form>
  );
}
