import { useMemo, useState } from 'react'
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded'
import EditRoundedIcon from '@mui/icons-material/EditRounded'
import PersonAddAlt1RoundedIcon from '@mui/icons-material/PersonAddAlt1Rounded'
import ArchiveRoundedIcon from '@mui/icons-material/ArchiveRounded'
import LockResetRoundedIcon from '@mui/icons-material/LockResetRounded'
import './UserManagementSection.css'

const isRecentDate = (value) => {
  const date = value?.toDate ? value.toDate() : value ? new Date(value) : null

  if (!date || Number.isNaN(date.getTime())) {
    return false
  }

  return Date.now() - date.getTime() <= 7 * 24 * 60 * 60 * 1000
}

const formatRoleLabel = (role = '') => {
  const normalizedRole = String(role || 'customer').trim().toLowerCase()

  if (normalizedRole === 'mechanics personnel') return 'Mechanic'
  if (normalizedRole === 'inventory personnel') return 'Inventory'
  if (normalizedRole === 'cashier personnel') return 'Cashier'
  if (normalizedRole === 'front desk personnel') return 'Front Desk'
  if (normalizedRole === 'staff') return 'Staff'
  if (normalizedRole === 'admin') return 'Admin'

  return normalizedRole || 'Customer'
}

const formatRelativeTime = (value) => {
  const date = value?.toDate ? value.toDate() : value ? new Date(value) : null

  if (!date || Number.isNaN(date.getTime())) {
    return 'No recent activity'
  }

  const diffMs = date.getTime() - Date.now()
  const diffMinutes = Math.round(diffMs / (1000 * 60))
  const relativeTime = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })

  if (Math.abs(diffMinutes) < 60) {
    return relativeTime.format(diffMinutes, 'minute')
  }

  const diffHours = Math.round(diffMinutes / 60)

  if (Math.abs(diffHours) < 24) {
    return relativeTime.format(diffHours, 'hour')
  }

  const diffDays = Math.round(diffHours / 24)
  return relativeTime.format(diffDays, 'day')
}

export default function UserManagementSection({
  filteredAuthorizedAdmins,
  filteredUsers,
  archivedUsers = [],
  canManageAccess,
  currentAccessRole,
  isSubmitting,
  roleOptions,
  formatDate,
  getStatusClasses,
  searchTerm,
  onSearchChange,
  onOpenNewUserModal,
  onCleanupDuplicates,
  onEditUser,
  onArchiveUser,
  onDeleteArchivedUser,
  onResetPassword,
  isDarkMode = true,
}) {
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [showArchived, setShowArchived] = useState(false)
  const [confirmAction, setConfirmAction] = useState(null)
  const pageSize = 4

  const mappedUsers = useMemo(() => {
    const resolveTeamLabel = (role) =>
      role === 'admin'
        ? 'Operations Desk'
        : role === 'mechanics personnel'
          ? 'Mechanics Bay'
          : role === 'inventory personnel'
            ? 'Inventory Desk'
            : role === 'cashier personnel'
              ? 'Billing Counter'
              : role === 'front desk personnel'
                ? 'Reception Desk'
                : role === 'staff'
                  ? 'Field Team'
                  : 'Customer Network'

    const mergedUsers = new Map()

    filteredUsers
      .filter((user) => String(user.role || '').toLowerCase() !== 'superadmin')
      .forEach((user) => {
        const normalizedEmail = String(user.email || '').trim().toLowerCase()
        const requiresPasswordChange = Boolean(user.mustChangePassword || user.firstLoginRequired)
        const status = requiresPasswordChange ? 'Pending' : 'Active'

        mergedUsers.set(normalizedEmail || user.id, {
          ...user,
          email: normalizedEmail || user.email || '',
          requiresPasswordChange,
          teamLabel: resolveTeamLabel(String(user.role || 'customer').toLowerCase()),
          status,
        })
      })

    filteredAuthorizedAdmins
      .filter((entry) => String(entry.role || '').toLowerCase() !== 'superadmin')
      .forEach((entry) => {
        const normalizedEmail = String(entry.email || entry.id || '').trim().toLowerCase()
        const mapKey = normalizedEmail || entry.id
        const existingUser = mergedUsers.get(mapKey) || {}
        const resolvedRole = String(entry.role || existingUser.role || 'customer').toLowerCase()
        const requiresPasswordChange = Boolean(
          existingUser.requiresPasswordChange ||
            existingUser.mustChangePassword ||
            existingUser.firstLoginRequired ||
            entry.mustChangePassword ||
            entry.firstLoginRequired,
        )
        const status = entry.active === false ? 'Suspended' : requiresPasswordChange ? 'Pending' : 'Active'

        mergedUsers.set(mapKey, {
          ...existingUser,
          ...entry,
          id: existingUser.id || entry.id || normalizedEmail,
          email: normalizedEmail || existingUser.email || '',
          fullName:
            entry.fullName ||
            existingUser.fullName ||
            existingUser.displayName ||
            normalizedEmail ||
            'Authorized User',
          displayName:
            entry.fullName ||
            existingUser.displayName ||
            existingUser.fullName ||
            normalizedEmail ||
            'Authorized User',
          role: resolvedRole,
          requiresPasswordChange,
          status,
          teamLabel: resolveTeamLabel(resolvedRole),
          lastLoginAt: existingUser.lastLoginAt || entry.lastLoginAt,
          createdAt: existingUser.createdAt || entry.createdAt,
          updatedAt: entry.updatedAt || existingUser.updatedAt,
        })
      })

    return Array.from(mergedUsers.values())
  }, [filteredAuthorizedAdmins, filteredUsers])

  const visibleUsers = useMemo(() => {
    const nextUsers = mappedUsers.filter((user) => {
      const roleMatch = roleFilter === 'all' || String(user.role || 'customer') === roleFilter
      const statusMatch = statusFilter === 'all' || user.status.toLowerCase() === statusFilter
      const searchMatch = searchTerm
        ? [user.fullName, user.displayName, user.email, user.role, user.status]
            .join(' ')
            .toLowerCase()
            .includes(String(searchTerm || '').trim().toLowerCase())
        : true
      return roleMatch && statusMatch && searchMatch
    })

    // Sort by creation date (newest first)
    return nextUsers.sort((a, b) => {
      // Use createdAt, fallback to updatedAt, then to current date for new users
      const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : (a.updatedAt?.toDate ? a.updatedAt.toDate() : new Date(a.createdAt || 0))
      const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : (b.updatedAt?.toDate ? b.updatedAt.toDate() : new Date(b.createdAt || 0))
      return dateB - dateA // Descending order (newest first)
    })
  }, [mappedUsers, roleFilter, statusFilter, searchTerm])

  const totalPages = Math.max(1, Math.ceil(visibleUsers.length / pageSize))
  const paginatedUsers = visibleUsers.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const startEntry = visibleUsers.length ? (currentPage - 1) * pageSize + 1 : 0
  const endEntry = Math.min(currentPage * pageSize, visibleUsers.length)
  const visibleArchivedUsers = archivedUsers.filter((user) => {
    const haystack = [user.fullName, user.displayName, user.email, user.role, user.status].join(' ')
    return haystack.toLowerCase().includes(String(searchTerm || '').trim().toLowerCase())
  })

  const totalUsers = mappedUsers.length
  const newUsersThisWeek = mappedUsers.filter((user) => isRecentDate(user.createdAt || user.updatedAt || user.lastLoginAt)).length
  const activeRoles = filteredAuthorizedAdmins.filter((item) => item.active !== false).length
  const pendingApprovals = mappedUsers.filter((user) => user.status === 'Pending').length

  const handleConfirmedEdit = (user) => {
    setConfirmAction({
      type: 'edit',
      user,
      onConfirm: () => {
        onEditUser?.(user)
        setConfirmAction(null)
      },
    })
  }

  const handleConfirmedArchive = (user) => {
    setConfirmAction({
      type: 'archive',
      user,
      onConfirm: () => {
        onArchiveUser?.(user)
        setConfirmAction(null)
      },
    })
  }

  const handleConfirmedDelete = (user) => {
    setConfirmAction({
      type: 'delete',
      user,
      onConfirm: () => {
        onDeleteArchivedUser?.(user)
        setConfirmAction(null)
      },
    })
  }

  const handleExportVisibleUsers = () => {
    if (typeof window === 'undefined' || !visibleUsers.length) {
      return
    }

    const rows = visibleUsers.map((user) => ({
      name: user.fullName || user.displayName || '',
      email: user.email || '',
      role: user.role || 'customer',
      status: user.status || 'Active',
      activity: formatDate(user.lastLoginAt || user.updatedAt || user.createdAt),
    }))

    const header = ['Name', 'Email', 'Role', 'Status', 'Last Activity']
    const csv = [
      header.join(','),
      ...rows.map((row) =>
        [row.name, row.email, row.role, row.status, row.activity]
          .map((value) => `"${String(value).replace(/"/g, '""')}"`)
          .join(','),
      ),
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'bykelink-users.csv'
    link.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <section className={`user-management-shell animate-entrance space-y-6 ${!isDarkMode ? 'light-mode' : ''}`}>
      {confirmAction && (
        <div
          className="confirmation-overlay"
          onClick={() => setConfirmAction(null)}
        >
          <div
            className="confirmation-dialog"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="confirmation-title">
              {confirmAction.type === 'edit' && 'Edit User Account?'}
              {confirmAction.type === 'archive' && 'Archive This User?'}
              {confirmAction.type === 'delete' && 'Permanently Delete Archived User?'}
            </h3>
            <p className="confirmation-message">
              {confirmAction.type === 'edit' && `Update account details for ${confirmAction.user?.fullName || confirmAction.user?.email}?`}
              {confirmAction.type === 'archive' && `Move ${confirmAction.user?.fullName || confirmAction.user?.email} to archived records?`}
              {confirmAction.type === 'delete' && `This action cannot be undone. ${confirmAction.user?.fullName || confirmAction.user?.email} will be permanently removed from the system.`}
            </p>
            <div className="confirmation-actions">
              <button
                type="button"
                onClick={() => setConfirmAction(null)}
                className="confirmation-button confirmation-button--cancel"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => confirmAction.onConfirm()}
                className="confirmation-button confirmation-button--confirm"
              >
                {confirmAction.type === 'delete' ? 'Delete' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className={`font-['Epilogue'] text-3xl font-black uppercase tracking-tight ${isDarkMode ? 'text-white' : 'text-gray-900'} sm:text-4xl`}>
            User Management
          </h2>
          <p className={`mt-2 text-sm ${isDarkMode ? 'text-white/50' : 'text-gray-600'}`}>
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

      <div className="user-table-shell rounded-[28px] p-4 sm:p-5">
        <div className="user-table-toolbar">
          <div className="user-table-filter-group">
            <select
              value={roleFilter}
              onChange={(event) => {
                setRoleFilter(event.target.value)
                setCurrentPage(1)
              }}
              className="user-table-select"
            >
              <option value="all">All Roles</option>
              {roleOptions.filter((role) => role !== 'superadmin').map((role) => (
                <option key={role} value={role}>{formatRoleLabel(role)}</option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value)
                setCurrentPage(1)
              }}
              className="user-table-select"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="suspended">Suspended</option>
            </select>

            <button
              type="button"
              onClick={handleExportVisibleUsers}
              className="user-table-icon-button"
              aria-label="Export users"
              title="Export users to CSV"
            >
              <DownloadRoundedIcon sx={{ fontSize: 18 }} />
            </button>

            <button
              type="button"
              onClick={onCleanupDuplicates}
              disabled={!canManageAccess || isSubmitting}
              className="user-table-icon-button"
              aria-label="Clean up duplicated privileged users"
              title="Remove stale users records for authorized admin and personnel accounts"
            >
              Clean Up
            </button>

            <button
              type="button"
              onClick={() => setShowArchived(!showArchived)}
              className={`user-table-icon-button user-table-archived-toggle ${showArchived ? 'is-active' : ''}`}
              aria-label="Toggle archived users"
              title="View archived users"
            >
              <ArchiveRoundedIcon sx={{ fontSize: 18 }} />
            </button>
          </div>
        </div>

        <div className="user-table-search-bar">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => {
              onSearchChange(e.target.value)
              setCurrentPage(1)
            }}
          />
        </div>

        <div className="user-table-header">
          <span>Avatar</span>
          <span>Name &amp; Email</span>
          <span>Role</span>
          <span>Last Activity</span>
          <span>Status</span>
          <span className="text-right">Actions</span>
        </div>

        <div className="user-table-body">
          {paginatedUsers.map((user) => {
            const getAvatarUrl = () => 
              user.photoURL ||
              user.profile_photo_url ||
              user.profilePhotoURL ||
              user.photoUrl ||
              user.profile_photo ||
              user.profileImage ||
              user.profile_image ||
              user.avatarUrl ||
              user.avatar_url ||
              user.profilePicture ||
              user.profile_picture ||
              user.avatar ||
              user.profilePictureUrl ||
              user.profile_picture_url ||
              user.photo ||
              user.image ||
              user.profileUrl ||
              user.profile_url ||
              null

            const avatarUrl = getAvatarUrl()

            return (
            <div key={user.id} className="user-table-row">
              <div className="user-avatar-cell">
                <div className="user-avatar flex h-10 w-10 items-center justify-center rounded-full text-sm font-black text-white">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={user.fullName || user.displayName || user.email} className="h-10 w-10 rounded-full object-cover" />
                  ) : (
                    (user.fullName || user.displayName || user.email || 'U').charAt(0).toUpperCase()
                  )}
                </div>
              </div>

              <div className="user-member-cell">
                <p className="user-member-name">{user.fullName || user.displayName || user.email || 'Authorized User'}</p>
                <p className="user-member-email">{user.email || 'No email provided'}</p>
              </div>

              <div className="user-role-cell">
                <span className={`user-role-pill ${getStatusClasses(user.role)}`}>
                  {formatRoleLabel(user.role)}
                </span>
              </div>

              <div className="user-activity-cell">
                <p className="user-activity-primary">{formatRelativeTime(user.lastLoginAt || user.updatedAt || user.createdAt)}</p>
                <p className="user-activity-secondary">{formatDate(user.lastLoginAt || user.updatedAt || user.createdAt)}</p>
              </div>

              <div className="user-status-cell">
                <span className={`user-status-pill ${getStatusClasses(user.status)}`}>
                  <span className="user-status-dot" />
                  {user.status}
                </span>
              </div>

              <div className="user-actions-cell">
                <button
                  type="button"
                  onClick={() => handleConfirmedEdit(user)}
                  disabled={
                    !canManageAccess ||
                    !user.email ||
                    (currentAccessRole !== 'superadmin' && ['admin', 'superadmin'].includes(String(user.role || '').toLowerCase()))
                  }
                  className="user-action-icon"
                  aria-label={`Edit ${user.fullName || user.email || user.id}`}
                >
                  <EditRoundedIcon sx={{ fontSize: 16 }} />
                </button>

                <button
                  type="button"
                  onClick={() => onResetPassword?.(user)}
                  disabled={
                    !canManageAccess ||
                    !user.email ||
                    (currentAccessRole !== 'superadmin' && ['admin', 'superadmin'].includes(String(user.role || '').toLowerCase()))
                  }
                  className="user-action-icon"
                  aria-label={`Reset password for ${user.fullName || user.email || user.id}`}
                  title="Reset password to default"
                >
                  <LockResetRoundedIcon sx={{ fontSize: 16 }} />
                </button>

                <button
                  type="button"
                  onClick={() => handleConfirmedArchive(user)}
                  disabled={
                    !canManageAccess ||
                    !user.email ||
                    (currentAccessRole !== 'superadmin' && ['admin', 'superadmin'].includes(String(user.role || '').toLowerCase()))
                  }
                  className="user-action-icon user-action-icon--danger"
                  aria-label={`Archive ${user.fullName || user.email || user.id}`}
                >
                  <DeleteOutlineRoundedIcon sx={{ fontSize: 18 }} />
                </button>
              </div>
            </div>
            )
          })}

          {!paginatedUsers.length && (
            <div className="rounded-xl px-3 py-8 text-center text-sm text-white/50">
              No user records match the current filters.
            </div>
          )}
        </div>

        <div className="user-table-footer">
          <span>Showing {startEntry} to {endEntry} of {visibleUsers.length} entries</span>
          <div className="user-pagination">
            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              className="user-pagination-button"
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
                  className={`user-pagination-button ${currentPage === pageNumber ? 'is-active' : ''}`}
                >
                  {pageNumber}
                </button>
              )
            })}
            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              className="user-pagination-button"
              disabled={currentPage === totalPages}
            >
              ›
            </button>
          </div>
        </div>

        {showArchived && (
          <div className="archived-users-shell animate-archived-in">
            <div className="archived-users-header">
              <div>
                <p className="archived-users-kicker">Delete Archived</p>
                <h3>Archived Users</h3>
                <p>
                  Admin can view archived records only. Only superadmin can permanently delete them.
                </p>
              </div>
            </div>

            <div className="archived-users-list">
              {visibleArchivedUsers.length ? (
                visibleArchivedUsers.map((user) => (
                  <div key={user.email || user.id} className="archived-user-item">
                    <div>
                      <p className="archived-user-name">{user.fullName || user.displayName || user.email || 'Archived User'}</p>
                      <p className="archived-user-meta">
                        {user.email || 'No email'} • {formatRoleLabel(user.role)} • {formatDate(user.archivedAt || user.updatedAt || user.createdAt)}
                      </p>
                    </div>

                    {currentAccessRole === 'superadmin' ? (
                      <button
                        type="button"
                        onClick={() => handleConfirmedDelete(user)}
                        disabled={isSubmitting}
                        className="archived-user-delete"
                      >
                        Delete Permanently
                      </button>
                    ) : (
                      <span className="archived-user-view-only">View only</span>
                    )}
                  </div>
                ))
              ) : (
                <div className="archived-user-empty">No archived user records yet.</div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
