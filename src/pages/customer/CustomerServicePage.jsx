import { useState } from 'react'
import BiotechRoundedIcon from '@mui/icons-material/BiotechRounded'
import BuildCircleRoundedIcon from '@mui/icons-material/BuildCircleRounded'
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded'
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded'
import PhoneRoundedIcon from '@mui/icons-material/PhoneRounded'
import SpeedRoundedIcon from '@mui/icons-material/SpeedRounded'
import TireRepairRoundedIcon from '@mui/icons-material/TireRepairRounded'
import TuneRoundedIcon from '@mui/icons-material/TuneRounded'
import TwoWheelerRoundedIcon from '@mui/icons-material/TwoWheelerRounded'
import NavHeaderCustomer from './components/NavHeaderCustomer'
import ChatBox from '../../components/ChatBox'

const bookingSteps = [
  { id: 'service-type', label: 'Service Type', icon: BuildCircleRoundedIcon },
  { id: 'vehicle-info', label: 'Vehicle Info', icon: TwoWheelerRoundedIcon },
  { id: 'schedule', label: 'Schedule', icon: CalendarMonthRoundedIcon },
  { id: 'confirm', label: 'Confirm', icon: CheckCircleRoundedIcon },
]

const serviceOptions = [
  {
    id: 'change-oil',
    title: 'Change Oil',
    description: 'Professional oil and filter replacement with system check.',
    icon: TuneRoundedIcon,
    cost: 85,
  },
  {
    id: 'full-tune-up',
    title: 'Full Tune Up',
    description: 'Complete maintenance package with fluid checks and adjustments.',
    cover: true,
    featured: true,
    icon: BuildCircleRoundedIcon,
    cost: 165,
  },
  {
    id: 'brake-cleaning',
    title: 'Brake Cleaning',
    description: 'Deep clean and inspection of braking system.',
    icon: TireRepairRoundedIcon,
    cost: 120,
  },
  {
    id: 'chain-service',
    title: 'Chain Service',
    description: 'Chain cleaning, lubrication, and tension adjustment.',
    icon: SpeedRoundedIcon,
    cost: 75,
  },
  {
    id: 'electrical-check',
    title: 'Electrical Check',
    description: 'Battery and electrical system diagnostic and testing.',
    icon: BiotechRoundedIcon,
    cost: 95,
  },
]

const appointmentDays = ['12', '13', '14', '15', '16', '17', '18']
const timeSlots = ['08:00 AM', '10:30 AM', '01:45 PM', '03:00 PM', '05:15 PM']
const modelOptions = ['YZF-R1M', 'MT-09 SP', 'Ténéré 700', 'XSR900', 'YZF-R7', 'Tracer 9']

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
  const [selectedService, setSelectedService] = useState('full-tune-up')
  const [selectedDay, setSelectedDay] = useState('15')
  const [selectedTime, setSelectedTime] = useState('10:30 AM')
  const [vehicleInfo, setVehicleInfo] = useState({
    model: modelOptions[0],
    year: '2023',
  })
  const [unreadNotifications] = useState([
    { id: 1, title: 'New Service', message: 'New diagnostic tools available', timestamp: 'Just now', read: false },
    { id: 2, title: 'Promotions', message: '10% off on service packages', timestamp: '2 hours ago', read: true },
  ])

  const estimatedCost = serviceOptions.find((service) => service.id === selectedService)?.cost ?? 165

  const handleServiceSelect = (serviceId) => {
    setSelectedService(serviceId)
  }

  const handleStepChange = (stepId) => {
    setActiveStep(stepId)
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
          <div className="space-y-4">
            <h2 className={`text-2xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Select Services
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {serviceOptions.map((service) => {
                const Icon = service.icon
                const isSelected = selectedService === service.id
                return (
                  <button
                    key={service.id}
                    onClick={() => handleServiceSelect(service.id)}
                    className={`rounded-2xl p-6 text-left transition-all ${
                      isSelected
                        ? isDarkMode
                          ? 'border-2 border-red-600 bg-red-600/10'
                          : 'border-2 border-red-600 bg-red-50'
                        : isDarkMode
                          ? 'border border-white/10 bg-white/5 hover:bg-white/10'
                          : 'border border-gray-200 bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <Icon sx={{ fontSize: 32 }} className={`mb-3 ${isSelected ? 'text-red-600' : isDarkMode ? 'text-white' : 'text-gray-700'}`} />
                    <h3 className={`font-bold text-lg ${isSelected ? 'text-red-600' : isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {service.title}
                    </h3>
                    <p className={`text-sm mt-2 ${isDarkMode ? 'text-white/60' : 'text-gray-600'}`}>{service.description}</p>
                    <p className={`font-bold mt-3 ${isSelected ? 'text-red-600' : isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      ${service.cost}.00
                    </p>
                  </button>
                )
              })}
            </div>
          </div>
        )

      case 'vehicle-info':
        return (
          <div className="space-y-6 max-w-2xl">
            <h2 className={`text-2xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Vehicle Information
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className={`block text-sm font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Model
                </label>
                <select
                  value={vehicleInfo.model}
                  onChange={(e) => setVehicleInfo({ ...vehicleInfo, model: e.target.value })}
                  className={`w-full rounded-lg px-4 py-3 border ${
                    isDarkMode
                      ? 'border-white/10 bg-white/5 text-white'
                      : 'border-gray-300 bg-white text-gray-900'
                  }`}
                >
                  {modelOptions.map((model) => (
                    <option key={model} value={model}>
                      {model}
                    </option>
                  ))}
                </select>
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
                  {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i).map((year) => (
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
                  <span className="text-2xl font-black text-red-600">${estimatedCost}.00</span>
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
          {/* Steps Navigation */}
          <div className="mb-8 flex gap-2 overflow-x-auto lg:justify-center">
            {bookingSteps.map((step, index) => {
              const Icon = step.icon
              const isActive = activeStep === step.id
              const isCompleted = ['service-type', 'vehicle-info', 'schedule', 'confirm'].indexOf(activeStep) > index

              return (
                <div key={step.id} className="flex items-center gap-2">
                  <button
                    onClick={() => handleStepChange(step.id)}
                    className={`flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-3 text-xs font-bold uppercase tracking-widest transition ${
                      isActive
                        ? 'bg-red-600 text-white'
                        : isCompleted
                          ? isDarkMode
                            ? 'bg-emerald-600/20 text-emerald-400'
                            : 'bg-emerald-100 text-emerald-700'
                          : isDarkMode
                            ? 'bg-white/5 text-white/50'
                            : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    <Icon sx={{ fontSize: 16 }} />
                    {step.label}
                  </button>
                  {index < bookingSteps.length - 1 && (
                    <ChevronRightRoundedIcon
                      sx={{ fontSize: 20 }}
                      className={isDarkMode ? 'text-white/20' : 'text-gray-300'}
                    />
                  )}
                </div>
              )
            })}
          </div>

          {/* Content Area */}
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <StepContent />
            </div>

            {/* Right Sidebar - Summary */}
            <div
              className={`rounded-2xl p-6 h-fit sticky top-24 ${
                isDarkMode ? 'border border-white/10 bg-white/5' : 'border border-gray-200 bg-gray-50'
              }`}
            >
              <h3 className={`text-xl font-black mb-6 ${isDarkMode ? 'text-red-600' : 'text-red-600'}`}>
                Appointment Summary
              </h3>

              <div className={`space-y-4 mb-6 pb-6 border-b ${isDarkMode ? 'border-white/10' : 'border-gray-200'}`}>
                <div className="flex justify-between items-start">
                  <span className={`text-sm ${isDarkMode ? 'text-white/60' : 'text-gray-600'}`}>Service</span>
                  <span className={`font-bold text-right ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {serviceOptions.find((s) => s.id === selectedService)?.title}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={`text-sm ${isDarkMode ? 'text-white/60' : 'text-gray-600'}`}>Date & Time</span>
                  <span className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {selectedDay} Apr, {selectedTime}
                  </span>
                </div>
              </div>

              <div className="mb-6 flex justify-between items-center">
                <span className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Total</span>
                <span className="text-3xl font-black text-red-600">${estimatedCost}</span>
              </div>

              {activeStep === 'confirm' && (
                <button
                  onClick={handleScheduleService}
                  className="w-full rounded-lg bg-red-600 px-4 py-3 font-bold text-white hover:bg-red-700 transition mb-3"
                >
                  Schedule Service
                </button>
              )}

              <button
                className={`w-full rounded-lg px-4 py-3 font-bold text-sm transition flex items-center justify-center gap-2 ${
                  isDarkMode
                    ? 'border border-white/10 text-white hover:bg-white/5'
                    : 'border border-gray-300 text-gray-900 hover:bg-gray-100'
                }`}
              >
                <PhoneRoundedIcon sx={{ fontSize: 18 }} />
                Forgot Something?
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Chat Widget */}
      <ChatBox isOpen={isChatOpen} onToggle={setIsChatOpen} />
    </div>
  )
}
