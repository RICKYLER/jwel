import { useState, useEffect } from 'react'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '../../firebase'
import BiotechRoundedIcon from '@mui/icons-material/BiotechRounded'
import BuildCircleRoundedIcon from '@mui/icons-material/BuildCircleRounded'
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded'
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded'
import PhoneRoundedIcon from '@mui/icons-material/PhoneRounded'
import SpeedRoundedIcon from '@mui/icons-material/SpeedRounded'
import TireRepairRoundedIcon from '@mui/icons-material/TireRepairRounded'
import TwoWheelerRoundedIcon from '@mui/icons-material/TwoWheelerRounded'
import CloudUploadRoundedIcon from '@mui/icons-material/CloudUploadRounded'
import NavHeaderCustomer from './components/NavHeaderCustomer'
import ChatBox from '../../components/ChatBox'

const bookingSteps = [
  { id: 'service-type', label: 'Service Type', icon: BuildCircleRoundedIcon },
  { id: 'vehicle-info', label: 'Vehicle Info', icon: TwoWheelerRoundedIcon },
  { id: 'schedule', label: 'Schedule', icon: CalendarMonthRoundedIcon },
  { id: 'confirm', label: 'Confirm', icon: CheckCircleRoundedIcon },
]

const timeSlots = ['08:00 AM', '10:30 AM', '01:45 PM', '03:00 PM', '05:15 PM']

export default function CustomerServicePage({
  currentUser,
  onSignOut,
  onNavigateToShowroom,
  onNavigateToFinancing,
  onNavigateToFinancingStatus,
  onNavigateToProfile,
  onNavigateBack,
}) {
  const [isDarkMode, setIsDarkMode] = useState(true)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [activeStep, setActiveStep] = useState('service-type')
  const [selectedService, setSelectedService] = useState(null)
  const [selectedDay, setSelectedDay] = useState(String(new Date().getDate() + 1))
  const [selectedTime, setSelectedTime] = useState('10:30 AM')
  const [serviceOptions, setServiceOptions] = useState([])
  const [userVehicles, setUserVehicles] = useState([])
  const [vehicleInfo, setVehicleInfo] = useState({
    model: '',
    year: new Date().getFullYear().toString(),
  })
  const [loading, setLoading] = useState(true)
  const [unreadNotifications] = useState([
    { id: 1, title: 'New Service', message: 'New diagnostic tools available', timestamp: 'Just now', read: false },
    { id: 2, title: 'Promotions', message: '10% off on service packages', timestamp: '2 hours ago', read: true },
  ])

  // Fetch services from Firestore
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const servicesRef = collection(db, 'services')
        const snapshot = await getDocs(servicesRef)
        if (!snapshot.empty) {
          const services = snapshot.docs.map((doc) => {
            const data = doc.data()
            return {
              id: doc.id,
              title: data.title || '',
              description: data.description || '',
              cost: data.cost || 0,
              iconUrl: data.iconUrl || '',
            }
          })
          setServiceOptions(services)
          // Set first service as selected
          if (services.length > 0) {
            setSelectedService(services[0].id)
          }
        }
      } catch (error) {
        console.error('Error fetching services:', error)
      }
    }

    const fetchUserVehicles = async () => {
      try {
        if (currentUser?.uid) {
          const vehiclesRef = collection(db, `users/${currentUser.uid}/vehicles`)
          const snapshot = await getDocs(vehiclesRef)
          if (!snapshot.empty) {
            const vehicles = snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }))
            setUserVehicles(vehicles)
            // Set first vehicle as selected
            if (vehicles.length > 0) {
              setVehicleInfo({
                model: vehicles[0].model || '',
                year: vehicles[0].year || new Date().getFullYear().toString(),
              })
            }
          }
        }
      } catch (error) {
        console.error('Error fetching vehicles:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchServices()
    fetchUserVehicles()
  }, [currentUser])

  const estimatedCost = serviceOptions.find((service) => service.id === selectedService)?.cost ?? 0

  const handleServiceSelect = (serviceId) => {
    setSelectedService(serviceId)
  }

  const handleStepChange = (stepId) => {
    setActiveStep(stepId)
  }

  const handleContinue = () => {
    // Validate current step before moving forward
    if (activeStep === 'service-type' && !selectedService) {
      alert('Please select a service')
      return
    }
    if (activeStep === 'vehicle-info' && !vehicleInfo.model) {
      alert('Please select or enter a vehicle model')
      return
    }
    if (activeStep === 'schedule' && !selectedDay) {
      alert('Please select a date')
      return
    }

    const stepIndex = bookingSteps.findIndex((step) => step.id === activeStep)
    if (stepIndex < bookingSteps.length - 1) {
      setActiveStep(bookingSteps[stepIndex + 1].id)
    }
  }

  const handleBack = () => {
    const stepIndex = bookingSteps.findIndex((step) => step.id === activeStep)
    if (stepIndex > 0) {
      setActiveStep(bookingSteps[stepIndex - 1].id)
    }
  }

  const handleScheduleService = () => {
    console.log('Scheduling service:', {
      service: selectedService,
      vehicle: vehicleInfo,
      date: selectedDay,
      time: selectedTime,
    })
  }

  const StepContent = () => {
    switch (activeStep) {
      case 'service-type':
        return (
          <div className="space-y-6">
            <div>
              <h2 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Select Maintenance Package
              </h2>
              <p className={`text-sm ${isDarkMode ? 'text-white/60' : 'text-gray-600'}`}>
                {serviceOptions.length} Services Available
              </p>
            </div>
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
              {serviceOptions.map((service) => {
                const isSelected = selectedService === service.id
                return (
                  <button
                    key={service.id}
                    onClick={() => handleServiceSelect(service.id)}
                    className={`rounded-xl overflow-hidden text-left transition-all border-2 ${
                      isSelected
                        ? 'border-red-600 bg-red-50 dark:bg-red-950/20'
                        : isDarkMode
                          ? 'border-white/10 bg-white/5 hover:bg-white/10'
                          : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    {/* Icon area */}
                    <div className={`h-32 flex items-center justify-center ${
                      isDarkMode ? 'bg-linear-to-br from-red-600/10 to-red-400/5' : 'bg-linear-to-br from-red-100 to-red-50'
                    }`}>
                      {service.iconUrl ? (
                        <img
                          src={service.iconUrl}
                          alt={service.title}
                          className="w-20 h-20 object-contain"
                        />
                      ) : (
                        <CloudUploadRoundedIcon sx={{ fontSize: 40, opacity: 0.3 }} />
                      )}
                    </div>

                    {/* Content area */}
                    <div className="p-6">
                      <h3 className={`font-bold text-lg mb-2 ${isSelected ? 'text-red-600' : isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {service.title}
                      </h3>
                      <p className={`text-sm mb-4 line-clamp-2 ${isDarkMode ? 'text-white/60' : 'text-gray-600'}`}>
                        {service.description}
                      </p>
                      <p className={`font-bold text-lg ${isSelected ? 'text-red-600' : isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        ₱{service.cost}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )

      case 'vehicle-info':
        return (
          <div className="space-y-6 max-w-2xl">
            <div>
              <h2 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Vehicle Information
              </h2>
              <p className={`text-sm ${isDarkMode ? 'text-white/60' : 'text-gray-600'}`}>
                Select or enter your vehicle details
              </p>
            </div>
            {userVehicles.length > 0 && (
              <div>
                <label className={`block text-sm font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  My Vehicles
                </label>
                <div className="grid gap-3 grid-cols-1 md:grid-cols-2">
                  {userVehicles.map((vehicle) => (
                    <button
                      key={vehicle.id}
                      onClick={() => setVehicleInfo({ model: vehicle.model, year: vehicle.year })}
                      className={`rounded-lg p-4 text-left border-2 transition ${
                        vehicleInfo.model === vehicle.model
                          ? 'border-red-600 bg-red-50 dark:bg-red-950/20'
                          : isDarkMode
                            ? 'border-white/10 bg-white/5 hover:bg-white/10'
                            : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      <p className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {vehicle.model}
                      </p>
                      <p className={`text-sm ${isDarkMode ? 'text-white/60' : 'text-gray-600'}`}>
                        {vehicle.year}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className={`block text-sm font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Model
                </label>
                <input
                  type="text"
                  value={vehicleInfo.model}
                  onChange={(e) => setVehicleInfo({ ...vehicleInfo, model: e.target.value })}
                  placeholder="E.g., YZF-R5M"
                  className={`w-full rounded-lg px-4 py-3 border ${
                    isDarkMode
                      ? 'border-white/10 bg-white/5 text-white placeholder-white/40'
                      : 'border-gray-300 bg-white text-gray-900'
                  }`}
                />
              </div>
              <div>
                <label className={`block text-sm font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Year
                </label>
                <select
                  value={vehicleInfo.year}
                  onChange={(e) => setVehicleInfo({ ...vehicleInfo, year: e.target.value })}
                  className={`w-full rounded-lg px-4 py-3 border ${
                    isDarkMode
                      ? 'border-white/10 bg-white/5 text-white'
                      : 'border-gray-300 bg-white text-gray-900'
                  }`}
                >
                  {Array.from({ length: 20 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )

      case 'schedule':
        return (
          <div className="space-y-6 max-w-4xl">
            <h2 className={`text-2xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Pick a Date
            </h2>

            {/* Calendar */}
            <div className={`rounded-2xl p-6 ${isDarkMode ? 'bg-white/5' : 'bg-gray-100'}`}>
              <div className="grid grid-cols-7 gap-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div key={day} className={`text-center text-xs font-bold ${isDarkMode ? 'text-white/50' : 'text-gray-500'}`}>
                    {day}
                  </div>
                ))}
                {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                  <button
                    key={day}
                    onClick={() => setSelectedDay(String(day))}
                    className={`rounded-lg p-3 text-center font-bold transition ${
                      selectedDay === String(day)
                        ? 'bg-red-600 text-white'
                        : isDarkMode
                          ? 'bg-white/5 text-white hover:bg-white/10'
                          : 'bg-white text-gray-900 hover:bg-gray-200'
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>

            {/* Time Slots */}
            <div>
              <h3 className={`text-lg font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Select Time
              </h3>
              <div className="grid gap-3 grid-cols-2 md:grid-cols-5">
                {timeSlots.map((time) => (
                  <button
                    key={time}
                    onClick={() => setSelectedTime(time)}
                    className={`rounded-lg px-4 py-3 text-sm font-bold transition ${
                      selectedTime === time
                        ? 'bg-red-600 text-white'
                        : isDarkMode
                          ? 'border border-white/10 text-white hover:bg-white/5'
                          : 'border border-gray-300 text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )

      case 'confirm':
        return (
          <div className="space-y-6 max-w-2xl">
            <h2 className={`text-2xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Confirm Booking
            </h2>

            {/* Service Summary */}
            <div className={`rounded-2xl p-6 border ${isDarkMode ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-50'}`}>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className={isDarkMode ? 'text-white/60' : 'text-gray-600'}>Service:</span>
                  <span className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {serviceOptions.find((s) => s.id === selectedService)?.title}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={isDarkMode ? 'text-white/60' : 'text-gray-600'}>Vehicle:</span>
                  <span className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {vehicleInfo.model} {vehicleInfo.year}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={isDarkMode ? 'text-white/60' : 'text-gray-600'}>Date:</span>
                  <span className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    April {selectedDay}, 2024
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={isDarkMode ? 'text-white/60' : 'text-gray-600'}>Time:</span>
                  <span className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{selectedTime}</span>
                </div>
                <div className="border-t border-white/10 pt-3 mt-3 flex justify-between">
                  <span className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Total:</span>
                  <span className="text-2xl font-black text-red-600">₱{estimatedCost}</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleScheduleService}
              className="w-full rounded-lg bg-red-600 px-6 py-3 font-bold text-white hover:bg-red-700 transition"
            >
              Confirm & Schedule Service
            </button>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div
      className={`min-h-screen overflow-x-hidden font-['Manrope'] ${
        isDarkMode ? 'bg-linear-to-b from-slate-950 via-slate-900 to-slate-950 text-[#e5e2e1]' : 'bg-white text-slate-900'
      }`}
    >
      <NavHeaderCustomer
        currentUser={currentUser}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
        activePage="service"
        unreadNotifications={unreadNotifications}
        onNavigateToShowroom={onNavigateToShowroom}
        onNavigateToService={onNavigateBack}
        onNavigateToFinancing={onNavigateToFinancing}
        onNavigateToFinancingStatus={onNavigateToFinancingStatus}
        onNavigateToProfile={onNavigateToProfile}
        onSignOut={onSignOut}
      />

      <main className="pt-20 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {/* Steps Navigation - Matching Design */}
          <div className="mb-12">
            <h1 className={`text-3xl font-black mb-8 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              <span>SERVICE</span>
              <span className="text-red-600">BOOKING</span>
            </h1>
            <div className="flex gap-8 justify-start">
              {bookingSteps.map((step, index) => {
                const isActive = activeStep === step.id
                const isCompleted = bookingSteps.findIndex((s) => s.id === activeStep) > index

                return (
                  <div key={step.id} className="flex flex-col items-start gap-3">
                    <div
                      className={`flex items-center justify-center w-14 h-14 rounded-lg font-black text-sm transition ${
                        isActive
                          ? 'bg-red-600 text-white'
                          : isCompleted
                            ? isDarkMode
                              ? 'bg-emerald-600/20 text-emerald-400'
                              : 'bg-emerald-100 text-emerald-700'
                            : isDarkMode
                              ? 'bg-white/5 text-white/30'
                              : 'bg-gray-100 text-gray-400'
                      }`}
                    >
                      {String(index + 1).padStart(2, '0')}
                    </div>
                    <span
                      className={`text-xs font-bold uppercase tracking-widest ${
                        isActive || isCompleted
                          ? isDarkMode
                            ? 'text-red-600'
                            : 'text-red-600'
                          : isDarkMode
                            ? 'text-gray-500'
                            : 'text-gray-400'
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Content Area */}
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <StepContent />
            </div>

            {/* Right Sidebar - ORDER SUMMARY */}
            <div
              className={`rounded-xl p-8 h-fit sticky top-24 ${
                isDarkMode ? 'bg-gray-900 border border-gray-800' : 'bg-gray-800 border border-gray-700'
              }`}
            >
              <h3 className="text-sm font-black mb-8 text-white/80 uppercase tracking-widest">
                Order Summary
              </h3>

              {/* Service Selection */}
              {selectedService && (
                <div className="mb-8 pb-8 border-b border-gray-700 space-y-2">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">
                    Service Selection
                  </p>
                  <p className="text-lg font-bold text-white">
                    {serviceOptions.find((s) => s.id === selectedService)?.title}
                  </p>
                </div>
              )}

              {/* Schedule Info */}
              {(activeStep === 'schedule' || activeStep === 'confirm') && (
                <div className="mb-8 pb-8 border-b border-gray-700 space-y-3">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                    Schedule
                  </p>
                  <div className="flex items-center gap-2">
                    <CalendarMonthRoundedIcon sx={{ fontSize: 16 }} className="text-gray-500" />
                    <p className="text-sm font-bold text-white">
                      {selectedDay} Apr, {selectedTime}
                    </p>
                  </div>
                </div>
              )}

              {/* Vehicle Info */}
              {(activeStep === 'vehicle-info' || activeStep === 'confirm') && vehicleInfo.model && (
                <div className="mb-8 pb-8 border-b border-gray-700 space-y-2">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                    Vehicle
                  </p>
                  <p className="text-sm font-bold text-white">
                    {vehicleInfo.model.toUpperCase()}
                  </p>
                  <p className="text-xs text-gray-500">
                    {vehicleInfo.year}
                  </p>
                </div>
              )}

              {/* Total Estimation */}
              <div className="mb-8 pb-8 border-b border-gray-700">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                  Total Estimation
                </p>
                <p className="text-5xl font-black text-red-600">
                  ₱{estimatedCost}
                </p>
              </div>

              {/* Continue Button */}
              <button
                onClick={handleContinue}
                disabled={
                  (activeStep === 'service-type' && !selectedService) ||
                  (activeStep === 'vehicle-info' && !vehicleInfo.model)
                }
                className="w-full rounded-lg bg-red-600 px-6 py-3 font-bold text-white hover:bg-red-700 transition mb-4 uppercase text-sm tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {activeStep === 'confirm' ? 'Confirm Booking' : `Continue to ${bookingSteps[Math.min(bookingSteps.findIndex((s) => s.id === activeStep) + 1, bookingSteps.length - 1)].label}`}
              </button>

              {/* Forgot Something */}
              <button
                className="w-full rounded-lg px-6 py-3 font-bold text-gray-400 hover:text-white transition text-sm"
              >
                Forgot Something?
              </button>

              {/* Current Unit */}
              {vehicleInfo.model && (
                <div className={`mt-6 pt-6 border-t border-gray-700 space-y-3`}>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                    Current Unit
                  </p>
                  <div className={`bg-gray-800/50 rounded-lg p-4 flex items-center gap-3`}>
                    <TwoWheelerRoundedIcon sx={{ fontSize: 32 }} className="text-gray-600" />
                    <div>
                      <p className="text-sm font-bold text-white">
                        {vehicleInfo.model.toUpperCase()}
                      </p>
                      <p className="text-xs text-gray-500">
                        Reg. {vehicleInfo.year}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Chat Widget */}
      <ChatBox isOpen={isChatOpen} onToggle={setIsChatOpen} />
    </div>
  )
}
