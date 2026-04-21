import { useState, useEffect } from 'react'
import { collection, getDocs } from 'firebase/firestore'
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
  onNavigateToMessages,
  onNavigateToProfile,
  onNavigateBack,
}) {
  const [isDarkMode] = useState(true)
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
      }
    }

    fetchServices()
    fetchUserVehicles()
  }, [currentUser])

  const estimatedCost = serviceOptions.find((service) => service.id === selectedService)?.cost ?? 0

  const handleServiceSelect = (serviceId) => {
    setSelectedService(serviceId)
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
          <div className="space-y-8">
            {/* Header */}
            <div>
              <h2 className={`text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black italic mb-3 tracking-tight ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                SELECT SERVICE
              </h2>
              <p className={`text-sm font-bold uppercase tracking-widest ${isDarkMode ? 'text-white' : 'text-gray-600'}`}>
                Maintain your edge with precision tuning.
              </p>
            </div>

            {/* Service Grid */}
            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-2">
              {serviceOptions.map((service) => {
                const isSelected = selectedService === service.id
                return (
                  <button
                    key={service.id}
                    onClick={() => handleServiceSelect(service.id)}
                    className={`rounded-2xl text-left transition-all border relative overflow-hidden p-4 sm:p-5 min-h-60 sm:min-h-65 ${
                      isSelected
                        ? isDarkMode
                          ? 'border-red-600 bg-[#171922] border-l-4 border-l-red-600'
                          : 'border-red-600 bg-white border-l-4 border-l-red-600'
                        : isDarkMode
                          ? 'border-white/5 bg-[#171922] hover:bg-[#1b1e28]'
                          : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    {/* Icon cover/overlay */}
                    {service.iconUrl ? (
                      <>
                        <img
                          src={service.iconUrl}
                          alt={service.title}
                          className="absolute inset-0 w-full h-full object-cover opacity-25"
                        />
                        <div className={`absolute inset-0 ${isDarkMode ? 'bg-linear-to-b from-black/15 via-[#10141f]/55 to-[#10141f]/72' : 'bg-linear-to-b from-white/45 via-white/85 to-white/95'}`}></div>
                      </>
                    ) : (
                      <div className={`absolute inset-0 ${isDarkMode ? 'bg-linear-to-b from-[#242938] to-[#151925]' : 'bg-linear-to-b from-gray-100 to-white'}`}></div>
                    )}

                    <div className="relative z-10 flex items-start justify-between mb-5">
                      <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-lg flex items-center justify-center shrink-0 ${isDarkMode ? 'bg-black/35' : 'bg-white/80 border border-gray-200'}`}>
                        {service.iconUrl ? (
                          <img
                            src={service.iconUrl}
                            alt={service.title}
                            className="w-8 h-8 sm:w-10 sm:h-10 object-contain"
                          />
                        ) : (
                          <CloudUploadRoundedIcon sx={{ fontSize: 24, opacity: 0.55 }} />
                        )}
                      </div>
                      <div className="text-right">
                        <p className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'text-white' : 'text-gray-500'}`}>
                          Starting At
                        </p>
                        <p className={`text-2xl sm:text-4xl leading-none font-black italic ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          ₱{service.cost.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    {/* Content area */}
                    <div className="relative z-10 space-y-3 drop-shadow">
                      <h3 className={`font-black text-2xl sm:text-3xl md:text-4xl italic uppercase tracking-tight ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {service.title}
                      </h3>
                      <p className={`text-sm sm:text-base md:text-lg leading-relaxed line-clamp-2 ${isDarkMode ? 'text-white' : 'text-gray-600'}`}>
                        {service.description}
                      </p>
                      <p className={`pt-2 text-sm font-black uppercase tracking-widest ${isSelected ? 'text-red-400' : isDarkMode ? 'text-white' : 'text-gray-500'}`}>
                        {isSelected ? 'Selected ●' : 'Select Service →'}
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
              <p className={`text-sm ${isDarkMode ? 'text-white' : 'text-gray-600'}`}>
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
                      <p className={`text-sm ${isDarkMode ? 'text-white' : 'text-gray-600'}`}>
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
                  <div key={day} className={`text-center text-xs font-bold ${isDarkMode ? 'text-white' : 'text-gray-500'}`}>
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
                  <span className={isDarkMode ? 'text-white' : 'text-gray-600'}>Service:</span>
                  <span className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {serviceOptions.find((s) => s.id === selectedService)?.title}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={isDarkMode ? 'text-white' : 'text-gray-600'}>Vehicle:</span>
                  <span className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {vehicleInfo.model} {vehicleInfo.year}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={isDarkMode ? 'text-white' : 'text-gray-600'}>Date:</span>
                  <span className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    April {selectedDay}, 2024
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={isDarkMode ? 'text-white' : 'text-gray-600'}>Time:</span>
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
        activePage="service"
        unreadNotifications={unreadNotifications}
        onNavigateToShowroom={onNavigateToShowroom}
        onNavigateToService={onNavigateBack}
        onNavigateToFinancing={onNavigateToFinancing}
        onNavigateToFinancingStatus={onNavigateToFinancingStatus}
        onNavigateToMessages={onNavigateToMessages}
        onNavigateToProfile={onNavigateToProfile}
        onSignOut={onSignOut}
      />

      <main className="pt-20 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {/* Steps Navigation - Matching Design */}
          <div className="mb-14">
            <div className="mb-10">
              <h1 className={`text-3xl sm:text-4xl md:text-5xl font-black mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                <span className={isDarkMode ? 'text-white' : 'text-gray-600'}>SERVICE</span>
                <span className="text-red-600">BOOKING</span>
              </h1>
            </div>
            <div className="flex items-center gap-4 sm:gap-6 md:gap-8 lg:gap-10 overflow-x-auto pb-2">
              {bookingSteps.map((step, index) => {
                const isActive = activeStep === step.id

                return (
                  <div key={step.id} className="flex items-center gap-3 sm:gap-5 shrink-0">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <span className={`text-2xl sm:text-3xl md:text-4xl font-black italic ${isActive ? 'text-red-600' : isDarkMode ? 'text-white' : 'text-gray-500'}`}>
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <span className={`text-xs sm:text-sm font-black uppercase tracking-widest whitespace-nowrap ${isActive ? (isDarkMode ? 'text-white' : 'text-gray-900') : isDarkMode ? 'text-white' : 'text-gray-500'}`}>
                        {step.label}
                      </span>
                    </div>
                    {index < bookingSteps.length - 1 && (
                      <span className={`w-6 sm:w-10 md:w-14 h-0.5 ${isActive ? 'bg-red-600' : isDarkMode ? 'bg-white/35' : 'bg-gray-300'}`}></span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Content Area */}
          <div className="grid gap-4 sm:gap-6 lg:gap-8 grid-cols-1 lg:grid-cols-3">
            <div className="lg:col-span-2">
              {StepContent()}
            </div>

            {/* Right Sidebar - ORDER SUMMARY */}
            <div
              className={`rounded-2xl p-4 sm:p-6 lg:p-8 h-fit lg:sticky lg:top-24 border-t-4 border-t-red-600 ${
                isDarkMode ? 'bg-[#171922] border border-t-4 border-t-red-600 border-white/5' : 'bg-white border border-t-4 border-t-red-600 border-gray-200'
              }`}
            >
              <h3 className={`text-base sm:text-lg font-black italic mb-6 sm:mb-8 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                ORDER SUMMARY
              </h3>

              {/* Service Selection */}
              {selectedService && (
                <div className={`mb-4 sm:mb-6 pb-4 sm:pb-6 border-b space-y-2 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <p className={`text-xs font-bold uppercase tracking-widest mb-3 ${isDarkMode ? 'text-white' : 'text-gray-500'}`}>
                    Service
                  </p>
                  <p className={`text-base sm:text-lg font-black uppercase ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {serviceOptions.find((s) => s.id === selectedService)?.title}
                  </p>
                </div>
              )}

              {/* Technician Info */}
              <div className={`mb-4 sm:mb-6 pb-4 sm:pb-6 border-b space-y-2 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <p className={`text-xs font-bold uppercase tracking-widest mb-3 ${isDarkMode ? 'text-white' : 'text-gray-500'}`}>
                  Technician
                </p>
                <p className={`text-base sm:text-lg font-black uppercase ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {activeStep === 'confirm' ? 'Senior Master' : 'To be assigned'}
                </p>
              </div>

              {/* Schedule Info */}
              <div className={`mb-6 sm:mb-8 pb-6 sm:pb-8 border-b space-y-2 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <p className={`text-xs font-bold uppercase tracking-widest mb-3 ${isDarkMode ? 'text-white' : 'text-gray-500'}`}>
                  Schedule
                </p>
                {activeStep === 'confirm' ? (
                  <p className={`text-base sm:text-lg font-black uppercase ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {selectedDay} Apr, {selectedTime}
                  </p>
                ) : (
                  <p className={`text-base sm:text-lg font-black uppercase ${isDarkMode ? 'text-white' : 'text-gray-500'}`}>
                    To be confirmed
                  </p>
                )}
              </div>

              {/* Total Estimation */}
              <div className={`mb-6 sm:mb-8 pb-6 sm:pb-8 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <p className={`text-xs font-bold uppercase tracking-widest mb-2 ${isDarkMode ? 'text-white' : 'text-gray-500'}`}>
                  Total Estimation
                </p>
                <p className="text-4xl sm:text-5xl lg:text-6xl leading-none font-black italic text-red-600">
                  ₱{estimatedCost.toFixed(2)}
                </p>
              </div>

              {/* Next Step Button */}
              <button
                onClick={handleContinue}
                disabled={
                  (activeStep === 'service-type' && !selectedService) ||
                  (activeStep === 'vehicle-info' && !vehicleInfo.model)
                }
                className="w-full bg-red-600 px-6 py-3 sm:py-4 font-black text-white hover:bg-red-700 transition mb-4 sm:mb-6 uppercase text-xs sm:text-sm tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next Step →
              </button>
            </div>

            <div className={`lg:col-start-3 rounded-2xl border ${isDarkMode ? 'bg-[#171922] border-white/5' : 'bg-white border-gray-200'} p-4 lg:sticky lg:top-24`}>
              <p className={`text-xs font-black uppercase tracking-widest mb-3 ${isDarkMode ? 'text-white' : 'text-gray-500'}`}>
                Current Unit
              </p>
              <div className="flex items-center justify-between gap-2 sm:gap-3">
                <div>
                  <p className={`text-lg sm:text-2xl font-black italic leading-none ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {vehicleInfo.model ? vehicleInfo.model.toUpperCase() : 'YAMAHA YZF-R1M'}
                  </p>
                  <p className={`text-[10px] mt-2 font-black uppercase tracking-widest ${isDarkMode ? 'text-white' : 'text-gray-500'}`}>
                    Engine 998cc
                  </p>
                  <p className={`text-[10px] mt-1 font-black uppercase tracking-widest ${isDarkMode ? 'text-white' : 'text-gray-500'}`}>
                    Power 200hp
                  </p>
                </div>
                <TwoWheelerRoundedIcon sx={{ fontSize: 56 }} className={`sm:text-[88px]! ${isDarkMode ? 'text-white' : 'text-gray-700'}`} />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Chat Widget */}
      <ChatBox isOpen={isChatOpen} onToggle={setIsChatOpen} />
    </div>
  )
}
