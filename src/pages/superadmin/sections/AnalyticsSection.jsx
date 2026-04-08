import './AnalyticsSection.css'

export default function AnalyticsSection({
  users,
  authorizedAdmins,
  serviceRequests,
  inventory,
  technicians,
  roleOptions,
  normalizeText,
}) {
  return (
    <section className="analytics-section-grid grid gap-6 lg:grid-cols-3">
      <article className="analytics-card rounded-2xl p-6">
        <h3 className="font-['Epilogue'] text-lg font-extrabold uppercase italic tracking-tighter">User Mix</h3>
        <div className="mt-4 space-y-3 text-sm">
          {roleOptions.map((role) => {
            const count = users.filter((user) => normalizeText(user.role) === role).length
            const width = users.length ? Math.max(8, Math.round((count / users.length) * 100)) : 8

            return (
              <div key={role}>
                <div className="mb-1 flex items-center justify-between text-white/70">
                  <span className="capitalize">{role}</span>
                  <span>{count}</span>
                </div>
                <div className="h-2 rounded-full bg-white/5">
                  <div className="h-full rounded-full bg-[#e10100]" style={{ width: `${width}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      </article>

      <article className="analytics-card rounded-2xl p-6">
        <h3 className="font-['Epilogue'] text-lg font-extrabold uppercase italic tracking-tighter">Realtime Totals</h3>
        <div className="mt-4 space-y-4 text-sm text-white/70">
          <div className="flex items-center justify-between"><span>Users</span><strong className="text-white">{users.length}</strong></div>
          <div className="flex items-center justify-between"><span>Authorized access records</span><strong className="text-white">{authorizedAdmins.length}</strong></div>
          <div className="flex items-center justify-between"><span>Bookings</span><strong className="text-white">{serviceRequests.length}</strong></div>
          <div className="flex items-center justify-between"><span>Inventory items</span><strong className="text-white">{inventory.length}</strong></div>
          <div className="flex items-center justify-between"><span>Technicians</span><strong className="text-white">{technicians.length}</strong></div>
        </div>
      </article>

      <article className="analytics-card rounded-2xl p-6">
        <h3 className="font-['Epilogue'] text-lg font-extrabold uppercase italic tracking-tighter">Health Check</h3>
        <div className="mt-4 space-y-3 text-sm text-white/70">
          <p>• Firebase reads are live for the active console.</p>
          <p>• Role access is sourced from `authorizedAdmin`, `authorizedPersonnel`, and `users`.</p>
          <p>• Service, inventory, and technician updates write back to Firestore in real time.</p>
        </div>
      </article>
    </section>
  )
}
