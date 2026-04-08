import VerifiedRoundedIcon from '@mui/icons-material/VerifiedRounded'
import './ProfileSection.css'

export default function ProfileSection({
  currentUser,
  accessProfile,
  profileForm,
  onProfileFieldChange,
  onProfileSave,
  isSubmitting,
  formatDate,
}) {
  return (
    <div className="profile-section-grid grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <section className="profile-card rounded-2xl p-6">
        <div className="flex items-center gap-4">
          <div className="profile-avatar flex h-20 w-20 items-center justify-center rounded-full text-2xl font-black text-white">
            {(profileForm.fullName || currentUser?.displayName || currentUser?.email || 'S').charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="font-['Epilogue'] text-2xl font-extrabold uppercase italic tracking-tighter text-white">
              {profileForm.fullName || currentUser?.displayName || 'Profile'}
            </h3>
            <p className="text-sm text-white/50">{currentUser?.email || 'No email'}</p>
            <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-emerald-300">
              <VerifiedRoundedIcon sx={{ fontSize: 14 }} />
              {accessProfile?.label || 'Superadmin'} Verified
            </div>
          </div>
        </div>

        <div className="mt-6 space-y-3 text-sm text-white/70">
          <p><span className="text-white">Profile title:</span> {profileForm.title || 'Operations Lead'}</p>
          <p><span className="text-white">Location:</span> {profileForm.location || 'Bykelink HQ'}</p>
          <p><span className="text-white">Phone:</span> {profileForm.phone || 'Not set yet'}</p>
          <p><span className="text-white">Last updated:</span> {formatDate(new Date())}</p>
        </div>
      </section>

      <section className="profile-card rounded-2xl p-6">
        <h3 className="font-['Epilogue'] text-lg font-extrabold uppercase italic tracking-tighter text-white">
          Edit Profile
        </h3>
        <p className="mt-2 text-sm text-white/50">
          Update your superadmin profile details stored in Firebase.
        </p>

        <form onSubmit={onProfileSave} className="mt-5 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block text-sm text-white/80">
              <span className="mb-2 block">Full name</span>
              <input
                type="text"
                name="fullName"
                value={profileForm.fullName}
                onChange={onProfileFieldChange}
                className="w-full rounded-xl border border-white/10 bg-[#101010] px-4 py-3 text-white outline-none"
              />
            </label>

            <label className="block text-sm text-white/80">
              <span className="mb-2 block">Title</span>
              <input
                type="text"
                name="title"
                value={profileForm.title}
                onChange={onProfileFieldChange}
                className="w-full rounded-xl border border-white/10 bg-[#101010] px-4 py-3 text-white outline-none"
              />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block text-sm text-white/80">
              <span className="mb-2 block">Phone</span>
              <input
                type="text"
                name="phone"
                value={profileForm.phone}
                onChange={onProfileFieldChange}
                className="w-full rounded-xl border border-white/10 bg-[#101010] px-4 py-3 text-white outline-none"
              />
            </label>

            <label className="block text-sm text-white/80">
              <span className="mb-2 block">Location</span>
              <input
                type="text"
                name="location"
                value={profileForm.location}
                onChange={onProfileFieldChange}
                className="w-full rounded-xl border border-white/10 bg-[#101010] px-4 py-3 text-white outline-none"
              />
            </label>
          </div>

          <label className="block text-sm text-white/80">
            <span className="mb-2 block">Short bio</span>
            <textarea
              name="bio"
              rows="4"
              value={profileForm.bio}
              onChange={onProfileFieldChange}
              className="w-full rounded-xl border border-white/10 bg-[#101010] px-4 py-3 text-white outline-none"
            />
          </label>

          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-full bg-[#e10100] px-5 py-3 text-sm font-black uppercase tracking-[0.18em] text-white disabled:opacity-70"
          >
            {isSubmitting ? 'Saving Profile...' : 'Save Profile'}
          </button>
        </form>
      </section>
    </div>
  )
}
