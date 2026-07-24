import { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import type { Student } from '../../types';

interface StudentPickerProps {
  selected: Student | null;
  onSelect: (student: Student | null) => void;
}

/** A searchable student picker: type a name, roll number or class to find one fast. */
export function StudentPicker({ selected, onSelect }: StudentPickerProps) {
  const data = useAppStore((s) => s.data)!;
  const [query, setQuery] = useState('');

  if (selected) {
    const family = data.families.find((f) => f.id === selected.familyId);
    return (
      <div className="card-flat flex items-center justify-between p-4">
        <div>
          <div className="font-semibold text-ink">{selected.name}</div>
          <div className="text-sm text-muted">{selected.className} · {family?.name}</div>
        </div>
        <button className="btn-ghost" onClick={() => onSelect(null)} aria-label="Change selected student">
          Change
        </button>
      </div>
    );
  }

  const q = query.trim().toLowerCase();
  const matches = q
    ? data.students.filter((s) =>
        s.name.toLowerCase().includes(q)
        || s.rollNo.toLowerCase().includes(q)
        || s.className.toLowerCase().includes(q))
    : [];

  return (
    <div>
      <input
        aria-label="Search for a student by name, roll number or class"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by student name, roll no. or class…"
        className="w-full rounded-lg border border-line bg-white px-4 py-3 text-sm text-ink"
        autoFocus
      />
      {matches.length > 0 && (
        <div className="mt-2 max-h-64 space-y-1 overflow-y-auto">
          {matches.map((s) => {
            const family = data.families.find((f) => f.id === s.familyId);
            return (
              <button
                key={s.id}
                onClick={() => onSelect(s)}
                className="card-flat flex w-full items-center justify-between p-3 text-left hover:border-brand"
              >
                <div>
                  <div className="font-semibold text-ink">{s.name}</div>
                  <div className="text-sm text-muted">{s.className} · {family?.name}</div>
                </div>
                <div className="text-xs text-muted">{s.rollNo}</div>
              </button>
            );
          })}
        </div>
      )}
      {q && matches.length === 0 && (
        <p className="mt-2 text-sm text-muted">No students match "{query}".</p>
      )}
    </div>
  );
}
