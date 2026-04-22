import { useEffect, useRef } from 'react'
import VerifiedRoundedIcon from '@mui/icons-material/VerifiedRounded'
import LocationOnRoundedIcon from '@mui/icons-material/LocationOnRounded'
import './ProfileSection.css'

export default function ProfileSection({
  currentUser,
  accessProfile,
  profileForm,
  onProfileFieldChange,
  onProfileSave,
  isSubmitting,
  formatDate,
  isDarkMode = true,
}) {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const searchInputRef = useRef(null)
  const autocompleteRef = useRef(null)

  // Initialize location map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    const loadGoogleMaps = () => {
      if (document.getElementById('google-maps-profile-script')) return

      const script = document.createElement('script')
      script.id = 'google-maps-profile-script'
      script.src = 'https://maps.googleapis.com/maps/api/js?key=AIzaSyDSLvek-8Ret8lxbZGp3dgNzWBWfmdqqIE&libraries=places&loading=async'
      script.async = true
      script.defer = true

      script.onload = () => {
        setTimeout(initMap, 200)
      }

      document.head.appendChild(script)
    }

    const initMap = () => {
      if (!window.google?.maps?.Map) return

      const initialLat = parseFloat(profileForm.latitude) || 7.3086
      const initialLng = parseFloat(profileForm.longitude) || 125.7399
      const position = { lat: initialLat, lng: initialLng }

      const map = new window.google.maps.Map(mapRef.current, {
        zoom: 15,
        center: position,
        mapTypeId: 'roadmap',
      })

      let marker = new window.google.maps.Marker({
        position: position,
        map: map,
        draggable: true,
        title: 'Drag to set Flagship Location',
      })

      // Update coordinates when marker is dragged
      marker.addListener('dragend', () => {
        const pos = marker.getPosition()
        onProfileFieldChange({
          target: {
            name: 'latitude',
            value: pos.lat().toFixed(6),
          },
        })
        onProfileFieldChange({
          target: {
            name: 'longitude',
            value: pos.lng().toFixed(6),
          },
        })
      })

      // Update marker when map is clicked
      map.addListener('click', (e) => {
        marker.setPosition(e.latLng)
        onProfileFieldChange({
          target: {
            name: 'latitude',
            value: e.latLng.lat().toFixed(6),
          },
        })
        onProfileFieldChange({
          target: {
            name: 'longitude',
            value: e.latLng.lng().toFixed(6),
          },
        })
      })

      // Initialize Places Autocomplete
      if (searchInputRef.current && window.google?.maps?.places?.Autocomplete) {
        const autocomplete = new window.google.maps.places.Autocomplete(searchInputRef.current, {
          fields: ['formatted_address', 'geometry'],
          types: ['establishment'],
        })

        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace()
          if (place.geometry && place.geometry.location) {
            const newLocation = place.geometry.location
            const newLat = newLocation.lat()
            const newLng = newLocation.lng()

            // Update map center and marker
            map.setCenter(newLocation)
            marker.setPosition(newLocation)

            // Update coordinates
            onProfileFieldChange({
              target: {
                name: 'latitude',
                value: newLat.toFixed(6),
              },
            })
            onProfileFieldChange({
              target: {
                name: 'longitude',
                value: newLng.toFixed(6),
              },
            })
          }
        })

        autocompleteRef.current = autocomplete
      }

      mapInstanceRef.current = map
    }

    loadGoogleMaps()
  }, [onProfileFieldChange, profileForm.latitude, profileForm.longitude, searchInputRef])

  return (
    <div className={`profile-section-grid grid gap-6 xl:grid-cols-[0.9fr_1.1fr] ${!isDarkMode ? 'light-mode' : ''}`}>
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
          <p className="flex items-center gap-2"><span className="text-white flex items-center gap-1"><LocationOnRoundedIcon sx={{ fontSize: 16 }} /> Location:</span> {profileForm.location || 'Bykelink HQ'}</p>
          <p className="text-xs text-white/50">Lat: {profileForm.latitude || 'Not set'} | Lng: {profileForm.longitude || 'Not set'}</p>
          <p><span className="text-white">Phone:</span> {profileForm.phone || 'Not set yet'}</p>
          <p><span className="text-white">Last updated:</span> {formatDate(new Date())}</p>
        </div>
      </section>

      <section className="profile-card rounded-2xl p-6">
        <h3 className="font-['Epilogue'] text-lg font-extrabold uppercase italic tracking-tighter text-white">
          Edit Profile & Flagship Location
        </h3>
        <p className="mt-2 text-sm text-white/50">
          Update profile details and drag the map pin to set the exact flagship location.
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
              <span className="mb-2 block">Location Name</span>
              <input
                type="text"
                name="location"
                value={profileForm.location}
                onChange={onProfileFieldChange}
                className="w-full rounded-xl border border-white/10 bg-[#101010] px-4 py-3 text-white outline-none"
              />
            </label>
          </div>

          {/* Location Coordinates */}
          <div className="rounded-xl border border-white/10 bg-[#0a0a0a] p-4">
            <p className="mb-3 text-sm font-bold uppercase text-white">Flagship Location Coordinates</p>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="block text-sm text-white/80">
                <span className="mb-2 block">Latitude</span>
                <input
                  type="number"
                  name="latitude"
                  step="0.000001"
                  value={profileForm.latitude || ''}
                  onChange={onProfileFieldChange}
                  placeholder="e.g., 7.3086"
                  className="w-full rounded-xl border border-white/10 bg-[#101010] px-4 py-3 text-white outline-none"
                />
              </label>
              <label className="block text-sm text-white/80">
                <span className="mb-2 block">Longitude</span>
                <input
                  type="number"
                  name="longitude"
                  step="0.000001"
                  value={profileForm.longitude || ''}
                  onChange={onProfileFieldChange}
                  placeholder="e.g., 125.7399"
                  className="w-full rounded-xl border border-white/10 bg-[#101010] px-4 py-3 text-white outline-none"
                />
              </label>
            </div>
            <p className="mt-3 text-xs text-white/50">Drag the pin on the map below or click on the map to set location</p>
          </div>

          {/* Location Map */}
          <div className="rounded-xl border border-white/10 overflow-hidden bg-[#0a0a0a] relative">
            {/* Search Box */}
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search location..."
              className="absolute top-3 left-3 right-3 z-10 rounded-lg border border-white/20 bg-[#1a1a1a] px-4 py-2 text-sm text-white placeholder-white/50 outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600"
            />
            <div
              ref={mapRef}
              className="h-64 w-full"
              style={{ minHeight: '16rem' }}
            />
          </div>

          <label className="block text-sm text-white/80">
            <span className="mb-2 block">Short bio</span>
            <textarea
              name="bio"
              rows="3"
              value={profileForm.bio}
              onChange={onProfileFieldChange}
              className="w-full rounded-xl border border-white/10 bg-[#101010] px-4 py-3 text-white outline-none"
            />
          </label>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-full bg-red-600 px-5 py-3 text-sm font-black uppercase tracking-[0.18em] text-white disabled:opacity-70 hover:bg-red-700 transition"
          >
            {isSubmitting ? 'Saving...' : 'Save Profile & Location'}
          </button>
        </form>
      </section>
    </div>
  )
}
