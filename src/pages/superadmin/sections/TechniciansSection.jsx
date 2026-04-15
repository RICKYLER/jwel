import './TechniciansSection.css'

export default function TechniciansSection({
  technicians,
  canEditOperations,
  technicianStatusOptions,
  handleCollectionUpdate,
  getStatusClasses,
  isDarkMode = true,
}) {
  return (
    <section className="technicians-section rounded-xl p-6">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h3 className="font-['Epilogue'] text-xl font-extrabold uppercase italic tracking-tighter">Technicians</h3>
          <p className="text-sm text-white/40">Workforce sync from `technicians` collection.</p>
        </div>
      </div>

      <div className="technicians-section-grid grid gap-4 md:grid-cols-2">
        {technicians.map((member) => (
          <article key={member.id} className="technician-card rounded-2xl p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-lg font-bold text-white">{member.name || 'Technician'}</p>
                <p className="text-sm text-white/50">{member.specialty || 'General Service'}</p>
              </div>
              <span className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase ${getStatusClasses(member.status)}`}>
                {member.status || 'Online'}
              </span>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-black/20 p-3 text-sm text-white/70">
                Active Jobs
                <p className="mt-1 text-xl font-bold text-white">{member.activeJobs ?? 0}</p>
              </div>
              <div className="rounded-xl bg-black/20 p-3 text-sm text-white/70">
                Capacity
                <p className="mt-1 text-xl font-bold text-white">{member.capacity ?? 4}</p>
              </div>
            </div>
            <select
              value={member.status || 'Online'}
              onChange={(event) => handleCollectionUpdate('technicians', member.id, { status: event.target.value })}
              disabled={!canEditOperations}
              className="mt-4 w-full rounded-xl border border-white/10 bg-[#101010] px-3 py-2 text-sm text-white outline-none disabled:opacity-70"
            >
              {technicianStatusOptions.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </article>
        ))}
      </div>
    </section>
  )
}
