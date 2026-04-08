import { useMemo, useState } from 'react'
import EditRoundedIcon from '@mui/icons-material/EditRounded'
import FilterListRoundedIcon from '@mui/icons-material/FilterListRounded'
import PersonAddAlt1RoundedIcon from '@mui/icons-material/PersonAddAlt1Rounded'
import './UserManagementSection.css'

const isRecentDate = (value) => {
  const date = value?.toDate ? value.toDate() : value ? new Date(value) : null

  if (!date || Number.isNaN(date.getTime())) {
    return false
  }

  return Date.now() - date.getTime() <= 7 * 24 * 60 * 60 * 1000
}

export default function UserManagementSection({
  filteredAuthorizedAdmins,
  filteredUsers,
  canManageAccess,
  isSubmitting,
  handleCollectionUpdate,
  handleUserRoleChange,
  roleOptions,
  formatDate,
  getStatusClasses,
  searchTerm,
  onSearchChange,
  onOpenNewUserModal,
}) {
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 5

  const mappedUsers = useMemo(() => {
    return filteredUsers
      .filter((user) => String(user.role || '').toLowerCase() !== 'superadmin')
      .map((user) => {
        const matchingAccess = filteredAuthorizedAdmins.find((item) => {
          const lookupEmail = String(item.email || item.id || '').trim().toLowerCase()
          return lookupEmail && lookupEmail === String(user.email || '').trim().toLowerCase()
        })

        const status =
          matchingAccess?.active === false
            ? 'Suspended'
            : user.emailVerified === false
              ? 'Pending'
              : 'Active'

        return {
          ...user,
          teamLabel:
            user.role === 'admin'
              ? 'Operations Desk'
              : user.role === 'mechanics personnel'
                ? 'Mechanics Bay'
                : user.role === 'inventory personnel'
                  ? 'Inventory Desk'
                  : user.role === 'cashier personnel'
                    ? 'Billing Counter'
                    : user.role === 'front desk personnel'
                      ? 'Reception Desk'
                      : user.role === 'staff'
                        ? 'Field Team'
                        : 'Customer Network',
          status,
        }
      })
  }, [filteredAuthorizedAdmins, filteredUsers])

  const visibleUsers = useMemo(() => {
    const nextUsers = mappedUsers.filter((user) => {
      const roleMatch = roleFilter === 'all' || String(user.role || 'customer') === roleFilter
      const statusMatch = statusFilter === 'all' || user.status.toLowerCase() === statusFilter
      return roleMatch && statusMatch
    })

    return nextUsers
  }, [mappedUsers, roleFilter, statusFilter])

  const totalPages = Math.max(1, Math.ceil(visibleUsers.length / pageSize))
  const paginatedUsers = visibleUsers.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const totalUsers = mappedUsers.length
  const newUsersThisWeek = mappedUsers.filter((user) => isRecentDate(user.createdAt || user.updatedAt || user.lastLoginAt)).length
  const activeRoles = filteredAuthorizedAdmins.filter((item) => item.active !== false).length
  const pendingApprovals = mappedUsers.filter((user) => user.status === 'Pending').length

  return (
    <section className="user-management-shell space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="font-['Epilogue'] text-3xl font-black uppercase tracking-tight text-white sm:text-4xl">
            User Management
          </h2>
          <p className="mt-2 text-sm text-white/50">
            Configure and oversee the Bykelink operator network.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenNewUserModal}
          disabled={!canManageAccess || isSubmitting}
          className="user-management-primary-action inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-black text-white disabled:opacity-70"
        >
          <PersonAddAlt1RoundedIcon sx={{ fontSize: 16 }} />
          New User
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Total Users', value: totalUsers.toLocaleString(), detail: '+12.5% from last month' },
          { label: 'New this week', value: newUsersThisWeek.toLocaleString(), detail: 'Fresh operator onboarding' },
          { label: 'Active role rules', value: activeRoles.toLocaleString(), detail: 'Live access grants' },
          { label: 'Pending approvals', value: pendingApprovals.toLocaleString(), detail: 'Awaiting review' },
        ].map((card) => (
          <article key={card.label} className="user-stat-card rounded-2xl p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-white/40">{card.label}</p>
            <h3 className="mt-3 text-3xl font-black text-white font-['Epilogue']">{card.value}</h3>
            <p className="mt-2 text-xs text-white/50">{card.detail}</p>
          </article>
        ))}
      </div>

      <div className="user-table-shell rounded-3xl p-4 sm:p-5">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="user-table-toolbar flex flex-1 flex-col gap-3 md:flex-row">
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Search by name or email..."
              className="min-w-0 flex-1 rounded-xl border border-white/10 bg-[#111111] px-4 py-2.5 text-sm text-white outline-none"
            />
            <select
              value={roleFilter}
              onChange={(event) => {
                setRoleFilter(event.target.value)
                setCurrentPage(1)
              }}
              className="rounded-xl border border-white/10 bg-[#111111] px-4 py-2.5 text-sm text-white outline-none"
            >
              <option value="all">All Roles</option>
              {roleOptions.filter((role) => role !== 'superadmin').map((role) => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value)
                setCurrentPage(1)
              }}
              className="rounded-xl border border-white/10 bg-[#111111] px-4 py-2.5 text-sm text-white outline-none"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>

          <button type="button" className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/70">
            <FilterListRoundedIcon sx={{ fontSize: 16 }} />
            Filters
          </button>
        </div>

        <div className="hidden grid-cols-[1.2fr_0.95fr_0.95fr_0.7fr_0.7fr] gap-3 border-b border-white/5 px-3 py-3 text-[10px] font-black uppercase tracking-[0.24em] text-white/40 md:grid">
          <span>Member</span>
          <span>Role & Team</span>
          <span>Last Activity</span>
          <span>Status</span>
          <span className="text-right">Actions</span>
        </div>

        <div className="divide-y divide-white/5">
          {paginatedUsers.map((user) => (
            <div key={user.id} className="grid gap-3 px-3 py-4 md:grid-cols-[1.2fr_0.95fr_0.95fr_0.7fr_0.7fr] md:items-center">
              <div className="flex items-center gap-3">
                <div className="user-avatar flex h-10 w-10 items-center justify-center rounded-full text-sm font-black text-white">
                  {(user.fullName || user.displayName || user.email || 'U').charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-white">{user.fullName || user.displayName || user.email || 'Firebase user'}</p>
                  <p className="text-xs text-white/45">{user.email || 'No email provided'}</p>
                </div>
              </div>

              <div>
                <span className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase ${getStatusClasses(user.role)}`}>
                  {user.role || 'customer'}
                </span>
                <p className="mt-2 text-xs text-white/45">{user.teamLabel}</p>
              </div>

              <div>
                <p className="text-sm text-white">{formatDate(user.lastLoginAt || user.updatedAt || user.createdAt)}</p>
                <p className="text-xs text-white/45">{user.emailVerified ? 'Last login recorded' : 'Waiting for email verification'}</p>
              </div>

              <div>
                <span className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase ${getStatusClasses(user.status)}`}>
                  {user.status}
                </span>
              </div>

              <div className="flex items-center justify-end gap-2">
                <select
                  value={user.role || 'customer'}
                  onChange={(event) => handleUserRoleChange(user, event.target.value)}
                  disabled={!canManageAccess || isSubmitting}
                  className="rounded-lg border border-white/10 bg-[#111111] px-2 py-1.5 text-xs text-white outline-none disabled:opacity-70"
                >
                  {roleOptions.filter((role) => role !== 'superadmin').map((role) => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => {
                    const personnelRoles = [
                      'mechanics personnel',
                      'inventory personnel',
                      'cashier personnel',
                      'front desk personnel',
                      'staff',
                    ]
                    const targetCollection = personnelRoles.includes(String(user.role || '').toLowerCase())
                      ? 'authorizedPersonnel'
                      : 'authorizedAdmin'

                    handleCollectionUpdate(targetCollection, String(user.email || user.id).trim().toLowerCase(), {
                      email: String(user.email || '').trim().toLowerCase(),
                      role: user.role || 'customer',
                      active: user.status !== 'Active',
                    })
                  }}
                  disabled={!canManageAccess || !user.email}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/70 disabled:opacity-50"
                  aria-label={`Edit ${user.fullName || user.email || user.id}`}
                >
                  <EditRoundedIcon sx={{ fontSize: 16 }} />
                </button>
              </div>
            </div>
          ))}

          {!paginatedUsers.length && (
            <div className="rounded-xl px-3 py-8 text-center text-sm text-white/50">
              No user records match the current filters.
            </div>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between text-xs text-white/45">
          <span>Showing {paginatedUsers.length} of {visibleUsers.length} users</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              className="rounded-lg border border-white/10 px-2.5 py-1.5 text-white/70"
              disabled={currentPage === 1}
            >
              ‹
            </button>
            {Array.from({ length: Math.min(totalPages, 3) }).map((_, index) => {
              const pageNumber = index + 1
              return (
                <button
                  key={pageNumber}
                  type="button"
                  onClick={() => setCurrentPage(pageNumber)}
                  className={`rounded-lg px-3 py-1.5 ${currentPage === pageNumber ? 'bg-[#e10100] text-white' : 'border border-white/10 text-white/70'}`}
                >
                  {pageNumber}
                </button>
              )
            })}
            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              className="rounded-lg border border-white/10 px-2.5 py-1.5 text-white/70"
              disabled={currentPage === totalPages}
            >
              ›
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
