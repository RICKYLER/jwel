import { useEffect, useRef, useState } from 'react'
import VerifiedRoundedIcon from '@mui/icons-material/VerifiedRounded'
import LocationOnRoundedIcon from '@mui/icons-material/LocationOnRounded'
import EditRoundedIcon from '@mui/icons-material/EditRounded'
import SaveRoundedIcon from '@mui/icons-material/SaveRounded'
import PersonRoundedIcon from '@mui/icons-material/PersonRounded'
import PhoneRoundedIcon from '@mui/icons-material/PhoneRounded'
import SecurityRoundedIcon from '@mui/icons-material/SecurityRounded'
import VpnKeyRoundedIcon from '@mui/icons-material/VpnKeyRounded'
import CameraAltRoundedIcon from '@mui/icons-material/CameraAltRounded'
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
  const fileInputRef = useRef(null)
  const [avatarPreview, setAvatarPreview] = useState(null)

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

  const handleAvatarUpload = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      // Preview
      const reader = new FileReader()
      reader.onload = (event) => {
        setAvatarPreview(event.target?.result)
      }
      reader.readAsDataURL(file)
      
      // Store file for upload
      onProfileFieldChange({
        target: { name: 'avatarFile', value: file },
      })
    }
  }

  const formatPhoneInput = (value) => {
    // Remove all non-digits
    let digits = value.replace(/\D/g, '')
    
    // If it doesn't start with 63, add it
    if (digits.length > 0 && !digits.startsWith('63')) {
      if (digits.startsWith('9')) {
        digits = '63' + digits
      }
    }
    
    // Format: +63 9XX XXXX XXX
    if (digits.length <= 2) return '+' + digits
    if (digits.length <= 5) return '+' + digits.slice(0, 2) + ' ' + digits.slice(2)
    if (digits.length <= 9) return '+' + digits.slice(0, 2) + ' ' + digits.slice(2, 5) + ' ' + digits.slice(5)
    return '+' + digits.slice(0, 2) + ' ' + digits.slice(2, 5) + ' ' + digits.slice(5, 9) + ' ' + digits.slice(9, 12)
  }

  const handlePhoneChange = (e) => {
    const formatted = formatPhoneInput(e.target.value)
    onProfileFieldChange({
      target: { name: 'phone', value: formatted },
    })
  }

  return (
    <div className={`profile-section-grid grid gap-8 xl:grid-cols-[0.85fr_1.15fr] ${!isDarkMode ? 'light-mode' : ''}`}>
      {/* Left: Profile Card */}
      <section className={`profile-card rounded-xl p-6 shadow-md border ${isDarkMode ? 'border-white/10 bg-[#0f0f0f] shadow-black/50' : 'border-gray-200 bg-white shadow-gray-200/30'}`}>
        {/* Avatar & Name */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="relative mb-4">
            <div className={`profile-avatar flex h-24 w-24 items-center justify-center rounded-full text-3xl font-black shadow-md ${isDarkMode ? 'bg-red-700 text-white' : 'bg-red-600 text-white'}`}>
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar" className="h-24 w-24 rounded-full object-cover" />
              ) : profileForm.avatarUrl ? (
                <img src={profileForm.avatarUrl} alt="Avatar" className="h-24 w-24 rounded-full object-cover" />
              ) : (
                (profileForm.fullName || currentUser?.displayName || currentUser?.email || 'S').charAt(0).toUpperCase()
              )}
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={`absolute bottom-0 right-0 p-2 rounded-full shadow-md transition ${isDarkMode ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-red-600 text-white hover:bg-red-700'}`}
            >
              <CameraAltRoundedIcon sx={{ fontSize: 16 }} />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
            />
          </div>
          <h3 className={`font-['Epilogue'] text-xl font-extrabold uppercase tracking-tight ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {profileForm.fullName || currentUser?.displayName || 'Profile'}
          </h3>
          <p className={`text-xs mt-1 ${isDarkMode ? 'text-white/50' : 'text-gray-600'}`}>{currentUser?.email || 'No email'}</p>
          <div className={`mt-3 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.15em] ${isDarkMode ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' : 'border-emerald-600/30 bg-emerald-50 text-emerald-700'}`}>
            <VerifiedRoundedIcon sx={{ fontSize: 12 }} />
            {accessProfile?.label || 'Superadmin'} Verified
          </div>
        </div>

        {/* Profile Details Sections */}
        <div className="space-y-5">
          {/* Profile Title */}
          <div className={`p-4 rounded-lg border ${isDarkMode ? 'bg-white/2 border-white/5' : 'bg-gray-50 border-gray-200'}`}>
            <p className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${isDarkMode ? 'text-white/40' : 'text-gray-500'}`}>Profile Title</p>
            <p className={`text-sm font-semibold ${isDarkMode ? 'text-white/80' : 'text-gray-900'}`}>{profileForm.title || 'Operations Lead'}</p>
          </div>

          {/* Location */}
          <div className={`p-4 rounded-lg border ${isDarkMode ? 'bg-white/2 border-white/5' : 'bg-gray-50 border-gray-200'}`}>
            <p className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${isDarkMode ? 'text-white/40' : 'text-gray-500'}`}>Location</p>
            <p className={`text-sm font-semibold ${isDarkMode ? 'text-white/80' : 'text-gray-900'}`}>{profileForm.location || 'Bykelink HQ'}</p>
          </div>

          {/* Last Updated */}
          <div className={`p-4 rounded-lg border ${isDarkMode ? 'bg-white/2 border-white/5' : 'bg-gray-50 border-gray-200'}`}>
            <p className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${isDarkMode ? 'text-white/40' : 'text-gray-500'}`}>Last Updated</p>
            <p className={`text-sm font-semibold ${isDarkMode ? 'text-white/80' : 'text-gray-900'}`}>{formatDate(new Date())}</p>
          </div>

          {/* Phone */}
          <div className={`p-4 rounded-lg border ${isDarkMode ? 'bg-white/2 border-white/5' : 'bg-gray-50 border-gray-200'}`}>
            <p className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${isDarkMode ? 'text-white/40' : 'text-gray-500'}`}>Phone</p>
            <p className={`text-sm font-semibold ${isDarkMode ? 'text-white/80' : 'text-gray-900'}`}>{profileForm.phone || '+63 9XX XXXX XXX'}</p>
          </div>

          {/* Divider */}
          <div className={`h-px ${isDarkMode ? 'bg-white/5' : 'bg-gray-200'}`} />

          {/* Security Overview */}
          <div>
            <p className={`text-xs font-bold uppercase tracking-widest mb-3 ${isDarkMode ? 'text-white/60' : 'text-gray-700'}`}>Security Overview</p>
            <div className="space-y-2">
              <div className={`flex items-center gap-3 p-3 rounded-lg ${isDarkMode ? 'bg-white/2' : 'bg-gray-50'}`}>
                <VpnKeyRoundedIcon sx={{ fontSize: 18 }} className={isDarkMode ? 'text-red-400' : 'text-red-600'} />
                <div className="flex-1">
                  <p className={`text-xs font-bold ${isDarkMode ? 'text-white/80' : 'text-gray-900'}`}>Biometric Login</p>
                  <p className={`text-[10px] ${isDarkMode ? 'text-white/40' : 'text-gray-500'}`}>Enabled</p>
                </div>
              </div>
              <div className={`flex items-center gap-3 p-3 rounded-lg ${isDarkMode ? 'bg-white/2' : 'bg-gray-50'}`}>
                <SecurityRoundedIcon sx={{ fontSize: 18 }} className={isDarkMode ? 'text-red-400' : 'text-red-600'} />
                <div className="flex-1">
                  <p className={`text-xs font-bold ${isDarkMode ? 'text-white/80' : 'text-gray-900'}`}>Encrypted Vault</p>
                  <p className={`text-[10px] ${isDarkMode ? 'text-white/40' : 'text-gray-500'}`}>Protected</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Right: Edit Profile Card */}
      <section className={`profile-card rounded-xl p-6 shadow-md border ${isDarkMode ? 'border-white/10 bg-[#0f0f0f] shadow-black/50' : 'border-gray-200 bg-white shadow-gray-200/30'}`}>
        <h3 className={`text-lg font-bold uppercase tracking-wide mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Edit Profile Details
        </h3>

        <form onSubmit={onProfileSave} className="space-y-4">
          {/* Full Name & Title */}
          <div className="grid gap-4 md:grid-cols-2">
            <label className={`block text-sm ${isDarkMode ? 'text-white/80' : 'text-gray-700'}`}>
              <span className="text-xs font-bold uppercase tracking-wider mb-2 block">Full Name</span>
              <input
                type="text"
                name="fullName"
                value={profileForm.fullName}
                onChange={onProfileFieldChange}
                className={`w-full rounded-lg border px-3 py-2.5 text-sm transition-all focus:outline-none focus:ring-1 ${isDarkMode ? 'border-white/10 bg-[#1a1a1a] text-white placeholder-white/30 focus:border-red-600 focus:ring-red-600/30' : 'border-gray-300 bg-gray-50 text-gray-900 placeholder-gray-400 focus:border-red-600 focus:ring-red-100'}`}
              />
            </label>

            <label className={`block text-sm ${isDarkMode ? 'text-white/80' : 'text-gray-700'}`}>
              <span className="text-xs font-bold uppercase tracking-wider mb-2 block">Title</span>
              <input
                type="text"
                name="title"
                value={profileForm.title}
                onChange={onProfileFieldChange}
                className={`w-full rounded-lg border px-3 py-2.5 text-sm transition-all focus:outline-none focus:ring-1 ${isDarkMode ? 'border-white/10 bg-[#1a1a1a] text-white placeholder-white/30 focus:border-red-600 focus:ring-red-600/30' : 'border-gray-300 bg-gray-50 text-gray-900 placeholder-gray-400 focus:border-red-600 focus:ring-red-100'}`}
              />
            </label>
          </div>

          {/* Phone & Location */}
          <div className="grid gap-4 md:grid-cols-2">
            <label className={`block text-sm ${isDarkMode ? 'text-white/80' : 'text-gray-700'}`}>
              <span className="text-xs font-bold uppercase tracking-wider mb-2 block">Phone</span>
              <input
                type="tel"
                name="phone"
                value={profileForm.phone}
                onChange={handlePhoneChange}
                placeholder="+63 9XX XXXX XXX"
                className={`w-full rounded-lg border px-3 py-2.5 text-sm transition-all focus:outline-none focus:ring-1 ${isDarkMode ? 'border-white/10 bg-[#1a1a1a] text-white placeholder-white/30 focus:border-red-600 focus:ring-red-600/30' : 'border-gray-300 bg-gray-50 text-gray-900 placeholder-gray-400 focus:border-red-600 focus:ring-red-100'}`}
              />
            </label>

            <label className={`block text-sm ${isDarkMode ? 'text-white/80' : 'text-gray-700'}`}>
              <span className="text-xs font-bold uppercase tracking-wider mb-2 block">Location Name</span>
              <input
                type="text"
                name="location"
                value={profileForm.location}
                onChange={onProfileFieldChange}
                className={`w-full rounded-lg border px-3 py-2.5 text-sm transition-all focus:outline-none focus:ring-1 ${isDarkMode ? 'border-white/10 bg-[#1a1a1a] text-white placeholder-white/30 focus:border-red-600 focus:ring-red-600/30' : 'border-gray-300 bg-gray-50 text-gray-900 placeholder-gray-400 focus:border-red-600 focus:ring-red-100'}`}
              />
            </label>
          </div>

          {/* Short Bio */}
          <label className={`block text-sm ${isDarkMode ? 'text-white/80' : 'text-gray-700'}`}>
            <span className="text-xs font-bold uppercase tracking-wider mb-2 block">Short Bio</span>
            <textarea
              name="bio"
              rows="3"
              value={profileForm.bio}
              onChange={onProfileFieldChange}
              className={`w-full rounded-lg border px-3 py-2.5 text-sm resize-none transition-all focus:outline-none focus:ring-1 ${isDarkMode ? 'border-white/10 bg-[#1a1a1a] text-white placeholder-white/30 focus:border-red-600 focus:ring-red-600/30' : 'border-gray-300 bg-gray-50 text-gray-900 placeholder-gray-400 focus:border-red-600 focus:ring-red-100'}`}
            />
          </label>

          {/* Location Coordinates Section */}
          <div>
            <p className={`text-sm font-bold uppercase tracking-wider mb-3 ${isDarkMode ? 'text-white/80' : 'text-gray-900'}`}>Flagship Location Coordinates</p>
            <div className="grid gap-4 md:grid-cols-2 mb-3">
              <div>
                <label className={`block text-xs font-bold uppercase tracking-wider mb-1 ${isDarkMode ? 'text-white/60' : 'text-gray-600'}`}>Latitude</label>
                <input
                  type="number"
                  name="latitude"
                  step="0.000001"
                  value={profileForm.latitude || ''}
                  onChange={onProfileFieldChange}
                  className={`w-full rounded-lg border px-3 py-2 text-sm transition-all focus:outline-none focus:ring-1 ${isDarkMode ? 'border-white/10 bg-[#1a1a1a] text-white placeholder-white/30 focus:border-red-600 focus:ring-red-600/30' : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:border-red-600 focus:ring-red-100'}`}
                />
              </div>
              <div>
                <label className={`block text-xs font-bold uppercase tracking-wider mb-1 ${isDarkMode ? 'text-white/60' : 'text-gray-600'}`}>Longitude</label>
                <input
                  type="number"
                  name="longitude"
                  step="0.000001"
                  value={profileForm.longitude || ''}
                  onChange={onProfileFieldChange}
                  className={`w-full rounded-lg border px-3 py-2 text-sm transition-all focus:outline-none focus:ring-1 ${isDarkMode ? 'border-white/10 bg-[#1a1a1a] text-white placeholder-white/30 focus:border-red-600 focus:ring-red-600/30' : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:border-red-600 focus:ring-red-100'}`}
                />
              </div>
            </div>
          </div>

          {/* Map Section */}
          <div className={`rounded-lg border overflow-hidden relative shadow-sm ${isDarkMode ? 'border-white/10' : 'border-gray-200'}`}>
            <div className="absolute top-3 left-3 right-3 z-20 flex gap-2">
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search for a specific address..."
                className={`flex-1 rounded-lg border px-3 py-2 text-xs outline-none focus:ring-1 transition-all ${isDarkMode ? 'border-white/20 bg-white/5 text-white placeholder-white/50 focus:border-red-600 focus:ring-red-600/30' : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500 focus:border-red-600 focus:ring-red-100'}`}
              />
              <button
                type="button"
                onClick={() => alert('Get PIN functionality would go here')}
                className={`get-pin-btn px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition whitespace-nowrap ${isDarkMode ? 'bg-gray-900 text-white hover:bg-gray-800' : 'bg-gray-900 text-white hover:bg-gray-800'}`}
              >
                Get PIN
              </button>
            </div>
            <div
              ref={mapRef}
              className="h-64 w-full"
              style={{ minHeight: '16rem' }}
            />
          </div>

          {/* Form Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`save-btn flex-1 rounded-lg px-4 py-3 text-sm font-bold uppercase tracking-wide transition disabled:opacity-60 text-white! ${isDarkMode ? 'bg-red-600 hover:bg-red-700' : 'bg-red-600 hover:bg-red-700'}`}
            >
              {isSubmitting ? 'Saving...' : 'SAVE PROFILE & LOCATION'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
