import React, { useState } from 'react';

export default function AssignMechanicModal({ open, onClose, onAssign, mechanics = [] }) {
  const [selectedMechanic, setSelectedMechanic] = useState('');




  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl p-6 w-full max-w-md relative">
        <h2 className="text-lg font-bold mb-4 text-slate-900 dark:text-white">Assign Mechanic</h2>
        <p className="mb-2 text-sm text-slate-700 dark:text-slate-300">Select an available mechanic for this service request:</p>
        <select
          className="w-full rounded-lg border px-3 py-2 mb-4 text-sm dark:bg-slate-800 dark:text-white"
          value={selectedMechanic}
          onChange={e => setSelectedMechanic(e.target.value)}
          disabled={!mechanics.length}
        >
          <option value="" disabled>
            {mechanics.length ? '-- Select Mechanic --' : 'No mechanics available'}
          </option>
          {mechanics.map((mech) => (
            <option key={mech.id} value={mech.id}>
              {mech.name || mech.fullName || mech.email || 'Unnamed'}
              {mech.email ? ` (${mech.email})` : ''}
            </option>
          ))}
        </select>
        <div className="flex justify-end gap-2">
          <button
            className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-white hover:bg-gray-300 dark:hover:bg-slate-600"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 rounded-lg bg-green-600 text-white font-bold hover:bg-green-700 disabled:opacity-60"
            onClick={() => onAssign(selectedMechanic)}
            disabled={!selectedMechanic}
          >
            Assign
          </button>
        </div>
      </div>
    </div>
  );
}
