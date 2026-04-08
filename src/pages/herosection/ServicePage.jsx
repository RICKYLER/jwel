import { useMemo, useState } from 'react'
import BiotechRoundedIcon from '@mui/icons-material/BiotechRounded'
import BoltRoundedIcon from '@mui/icons-material/BoltRounded'
import BuildCircleRoundedIcon from '@mui/icons-material/BuildCircleRounded'
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded'
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded'
import LocationOnRoundedIcon from '@mui/icons-material/LocationOnRounded'
import PersonRoundedIcon from '@mui/icons-material/PersonRounded'
import SpeedRoundedIcon from '@mui/icons-material/SpeedRounded'
import TireRepairRoundedIcon from '@mui/icons-material/TireRepairRounded'
import TuneRoundedIcon from '@mui/icons-material/TuneRounded'
import TwoWheelerRoundedIcon from '@mui/icons-material/TwoWheelerRounded'
import bykelinkLogo from '../../assets/bykelinklogo.png'

const bookingSteps = [
  { id: 'service-type', label: 'Service Type', icon: BuildCircleRoundedIcon },
  { id: 'vehicle-info', label: 'Vehicle Info', icon: TwoWheelerRoundedIcon },
  { id: 'schedule', label: 'Schedule', icon: CalendarMonthRoundedIcon },
  { id: 'upgrades', label: 'Upgrades', icon: SpeedRoundedIcon },
  { id: 'confirm', label: 'Confirm', icon: CheckCircleRoundedIcon },
]

const serviceOptions = [
  {
    id: 'periodic',
    title: 'Periodic Maintenance',
    description:
      'Comprehensive fluid checks, lubrication, and system adjustments to ensure factory-standard reliability.',
    kicker: 'Select Plan',
    icon: BuildCircleRoundedIcon,
    featured: true,
    cost: 485,
  },
  {
    id: 'diagnostic',
    title: 'Engine Diagnostic',
    description: 'Full ECU scanning and sensor calibration.',
    icon: BiotechRoundedIcon,
    cost: 320,
  },
  {
    id: 'brakes',
    title: 'Brake & Tire',
    description: 'Safety-critical wear inspection and replacement.',
    icon: TireRepairRoundedIcon,
    cost: 275,
  },
  {
    id: 'tuning',
    title: 'Performance Tuning',
    description:
      'Unlock the full power of your Yamaha with custom mapping and exhaust optimization.',
    icon: SpeedRoundedIcon,
    wide: true,
    cost: 625,
  },
  {
    id: 'addons',
    title: 'Custom Add-ons',
    description: 'Install official Yamaha accessories or aftermarket performance parts.',
    icon: TuneRoundedIcon,
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBiHHSwXfPtXiwZuIGqTxLz9piPxrZ3cqTO1GAVgRBRQOSe3cgDx5tqqQlE4yp4rAQhFqFeLpF8qZEsUNJdFMW-TuLEI6TK9vv7jLlGOq_Ckt6vGDjIxMojYDRy153VQZ-ikaIPrYiXWn4WGbXhb33B5KJFPN2WP71OSI4yBXQwpdappWV-g4tHWfqaHu4Y-u4XHQT-u8Z90EIC4zdoF422CyEZo0SvbInQqSZOFPKolGU86RTH_bqUmlJNNcLDHRH4FR0MIiKp1wE',
    wide: true,
    cost: 410,
  },
]

const appointmentDays = ['12', '13', '14', '15', '16', '17', '18']
const timeSlots = ['08:00 AM', '10:30 AM', '01:45 PM']
const modelOptions = [
  'YZF-R1M World GP 60th Anniversary',
  'MT-09 SP Hyper Naked',
  'Ténéré 700 World Raid',
  'XSR900 Heritage',
]

export default function ServicePage({ onNavigateHome, onNavigateShowroom, onNavigateSection, onOpenSignup }) {
  const [activeStep, setActiveStep] = useState('service-type')
  const [selectedService, setSelectedService] = useState('periodic')
  const [selectedDay, setSelectedDay] = useState('15')
  const [selectedTime, setSelectedTime] = useState('10:30 AM')
  const [vehicleForm, setVehicleForm] = useState({
    model: modelOptions[0],
    year: '2023',
    mileage: '',
  })

  const estimatedCost = useMemo(() => {
    return serviceOptions.find((option) => option.id === selectedService)?.cost ?? 485
  }, [selectedService])

  const handleVehicleChange = (event) => {
    const { name, value } = event.target
    setVehicleForm((current) => ({
      ...current,
      [name]: value,
    }))
  }

  return (
    <div className="min-h-screen bg-[#131313] font-['Manrope'] text-[#e5e2e1]">
      <header className="fixed top-0 z-50 flex h-20 w-full items-center justify-between bg-neutral-950/80 px-4 shadow-[0_4px_30px_rgba(225,1,0,0.05)] backdrop-blur-xl sm:px-6 lg:px-8">
        <button type="button" onClick={onNavigateHome} className="flex items-center gap-3 text-left">
          <img src={bykelinkLogo} alt="Bykelink logo" className="h-10 w-10 rounded-lg bg-white p-1.5" />
          <div className="text-base font-black uppercase tracking-tighter text-neutral-100 font-['Epilogue'] sm:text-2xl">
            Yamaha Elite Service
          </div>
        </button>

        <nav className="hidden gap-8 font-['Epilogue'] text-sm font-bold uppercase tracking-tighter md:flex">
          <button type="button" onClick={onNavigateShowroom} className="text-neutral-400 transition-colors duration-300 hover:text-neutral-100">
            Models
          </button>
          <span className="border-b-2 border-red-600 pb-1 text-red-600">Service</span>
          <button type="button" onClick={() => onNavigateSection?.('showroom', 'Showroom')} className="text-neutral-400 transition-colors duration-300 hover:text-neutral-100">
            Motorsport
          </button>
          <button type="button" onClick={() => onNavigateSection?.('about', 'About')} className="text-neutral-400 transition-colors duration-300 hover:text-neutral-100">
            Heritage
          </button>
        </nav>

        <div className="flex items-center gap-3 sm:gap-5">
          <button type="button" onClick={() => onNavigateSection?.('contact', 'Contact')} className="text-neutral-400 transition-colors hover:text-neutral-100" aria-label="Location">
            <LocationOnRoundedIcon sx={{ fontSize: 20 }} />
          </button>
          <button type="button" onClick={onOpenSignup} className="text-neutral-400 transition-colors hover:text-neutral-100" aria-label="Account">
            <PersonRoundedIcon sx={{ fontSize: 20 }} />
          </button>
          <button
            type="button"
            onClick={onOpenSignup}
            className="rounded-full bg-[#e10100] px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white transition-all hover:shadow-[0_0_20px_rgba(225,1,0,0.3)] sm:px-6 sm:text-xs"
          >
            Book Appointment
          </button>
        </div>
      </header>

      <div className="flex pt-20">
        <aside className="fixed left-0 top-20 hidden h-[calc(100vh-5rem)] w-64 flex-col border-r border-neutral-800/20 bg-neutral-900 py-8 lg:flex">
          <div className="mb-12 px-8">
            <h3 className="font-['Epilogue'] text-xl font-black uppercase italic leading-none text-red-600">
              Booking Progress
            </h3>
            <p className="mt-2 text-xs uppercase tracking-widest text-neutral-500">
              Precision Maintenance
            </p>
          </div>

          <nav className="flex flex-col space-y-2">
            {bookingSteps.map((step) => {
              const Icon = step.icon
              const isActive = activeStep === step.id

              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => setActiveStep(step.id)}
                  className={`mr-4 flex items-center gap-4 px-6 py-3 text-left transition-all ${
                    isActive
                      ? 'rounded-r-full bg-red-600 text-white'
                      : 'text-neutral-500 hover:bg-neutral-800 hover:text-neutral-200'
                  }`}
                >
                  <Icon sx={{ fontSize: 20 }} />
                  <span className="text-sm font-semibold">{step.label}</span>
                </button>
              )
            })}
          </nav>

          <div className="mt-auto px-8 py-8 opacity-40">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400">Bykelink Motor Inc.</p>
            <p className="mt-1 text-[8px] text-neutral-600">APEX VELOCITY SYSTEM V2.4</p>
          </div>
        </aside>

        <main className="flex-1 bg-[#131313] p-4 sm:p-8 lg:ml-64 lg:p-12">
          <div className="mx-auto max-w-6xl">
            <div className="mb-8 flex gap-2 overflow-x-auto lg:hidden">
              {bookingSteps.map((step) => {
                const isActive = activeStep === step.id
                return (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => setActiveStep(step.id)}
                    className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] ${
                      isActive ? 'bg-red-600 text-white' : 'bg-[#201f1f] text-neutral-400'
                    }`}
                  >
                    {step.label}
                  </button>
                )
              })}
            </div>

            <header className="mb-12 lg:mb-16">
              <h1 className="mb-2 text-4xl font-black uppercase italic tracking-tighter text-white font-['Epilogue'] sm:text-5xl lg:text-6xl">
                Configure <span className="text-[#e10100]">Service</span>
              </h1>
              <p className="max-w-xl text-base text-neutral-500 sm:text-lg">
                Select the precision engineering package tailored for your machine's peak performance.
              </p>
            </header>

            <section className="mb-16 lg:mb-20">
              <h2 className="mb-8 border-l-4 border-red-600 pl-4 text-xs font-bold uppercase tracking-[0.3em] text-neutral-500 font-['Epilogue']">
                01. Service Categories
              </h2>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
                {serviceOptions.map((option) => {
                  const Icon = option.icon
                  const isSelected = selectedService === option.id

                  if (option.featured) {
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => {
                          setSelectedService(option.id)
                          setActiveStep('vehicle-info')
                        }}
                        className={`group relative overflow-hidden rounded-xl p-8 text-left transition-all duration-500 md:col-span-2 ${
                          isSelected ? 'bg-[#2f2f2f] ring-1 ring-red-600/50' : 'bg-[#2a2a2a] hover:bg-[#353534]'
                        }`}
                      >
                        <div className="relative z-10">
                          <Icon sx={{ fontSize: 40 }} className="mb-6 text-red-600" />
                          <h3 className="mb-4 text-2xl font-bold text-white font-['Epilogue']">{option.title}</h3>
                          <p className="mb-6 text-sm leading-relaxed text-neutral-400">{option.description}</p>
                          <span className="text-xs font-black uppercase tracking-widest text-red-600">{option.kicker}</span>
                        </div>
                        <div className="absolute -bottom-4 -right-4 opacity-10 transition-opacity group-hover:opacity-20">
                          <BuildCircleRoundedIcon sx={{ fontSize: 150 }} />
                        </div>
                      </button>
                    )
                  }

                  if (option.image) {
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => {
                          setSelectedService(option.id)
                          setActiveStep('confirm')
                        }}
                        className={`rounded-xl p-6 text-left md:col-span-2 ${
                          isSelected ? 'bg-[#2f2f2f] ring-1 ring-red-600/50' : 'bg-[#1c1b1b]'
                        }`}
                      >
                        <div className="flex items-center gap-5 sm:gap-8">
                          <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-neutral-950 sm:h-24 sm:w-24">
                            <img src={option.image} alt={option.title} className="h-full w-full object-cover opacity-60" />
                          </div>
                          <div>
                            <h3 className="mb-1 text-lg font-bold text-white font-['Epilogue']">{option.title}</h3>
                            <p className="mb-3 text-xs text-neutral-500">{option.description}</p>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-red-600">
                              Browse Catalog
                            </span>
                          </div>
                        </div>
                      </button>
                    )
                  }

                  if (option.wide) {
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => {
                          setSelectedService(option.id)
                          setActiveStep('upgrades')
                        }}
                        className={`group flex items-center justify-between rounded-xl border p-6 text-left transition-all duration-300 md:col-span-2 ${
                          isSelected
                            ? 'border-red-600/50 bg-[#2a2a2a]'
                            : 'border-[#5b403d]/20 bg-linear-to-br from-[#2a2a2a] to-[#0e0e0e] hover:border-red-600/40'
                        }`}
                      >
                        <div className="max-w-[65%]">
                          <h3 className="mb-2 text-xl font-black uppercase italic tracking-tighter text-white font-['Epilogue'] sm:text-2xl">
                            {option.title}
                          </h3>
                          <p className="text-sm text-neutral-400">{option.description}</p>
                        </div>
                        <Icon sx={{ fontSize: 56 }} className="text-red-600/40 transition-colors group-hover:text-red-600" />
                      </button>
                    )
                  }

                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setSelectedService(option.id)}
                      className={`rounded-xl border p-6 text-left transition-all duration-300 ${
                        isSelected
                          ? 'border-red-600/50 bg-[#2a2a2a]'
                          : 'border-[#5b403d]/10 bg-[#1c1b1b] hover:border-red-600/30'
                      }`}
                    >
                      <Icon sx={{ fontSize: 30 }} className="mb-5 text-neutral-300" />
                      <h3 className="mb-2 text-lg font-bold text-white font-['Epilogue']">{option.title}</h3>
                      <p className="text-xs leading-relaxed text-neutral-500">{option.description}</p>
                    </button>
                  )
                })}
              </div>
            </section>

            <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-12">
              <section>
                <h2 className="mb-8 border-l-4 border-red-600 pl-4 text-xs font-bold uppercase tracking-[0.3em] text-neutral-500 font-['Epilogue']">
                  02. Vehicle Identification
                </h2>
                <div className="space-y-6 rounded-xl bg-[#1c1b1b] p-6 sm:p-8">
                  <div>
                    <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                      Yamaha Model
                    </label>
                    <select
                      name="model"
                      value={vehicleForm.model}
                      onChange={handleVehicleChange}
                      className="w-full rounded-lg border-none bg-[#353534] px-4 py-4 text-white outline-none focus:ring-0"
                    >
                      {modelOptions.map((model) => (
                        <option key={model}>{model}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                        Model Year
                      </label>
                      <input
                        type="number"
                        name="year"
                        value={vehicleForm.year}
                        onChange={handleVehicleChange}
                        className="w-full rounded-lg border-none bg-[#353534] px-4 py-4 text-white outline-none focus:ring-0"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                        Current Mileage
                      </label>
                      <input
                        type="text"
                        name="mileage"
                        value={vehicleForm.mileage}
                        onChange={handleVehicleChange}
                        placeholder="e.g. 12,450"
                        className="w-full rounded-lg border-none bg-[#353534] px-4 py-4 text-white placeholder:text-neutral-500 outline-none focus:ring-0"
                      />
                    </div>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="mb-8 border-l-4 border-red-600 pl-4 text-xs font-bold uppercase tracking-[0.3em] text-neutral-500 font-['Epilogue']">
                  03. Schedule Session
                </h2>
                <div className="rounded-xl bg-[#1c1b1b] p-6 sm:p-8">
                  <div className="mb-6 flex items-center justify-between">
                    <button type="button" className="text-neutral-500 transition hover:text-white" aria-label="Previous month">
                      <ChevronLeftRoundedIcon />
                    </button>
                    <h4 className="font-['Epilogue'] text-sm font-bold uppercase tracking-widest text-white">
                      October 2024
                    </h4>
                    <button type="button" className="text-neutral-500 transition hover:text-white" aria-label="Next month">
                      <ChevronRightRoundedIcon />
                    </button>
                  </div>

                  <div className="mb-6 grid grid-cols-7 gap-2 text-center">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                      <span key={day} className="text-[8px] font-bold uppercase text-neutral-600">
                        {day}
                      </span>
                    ))}
                    {appointmentDays.map((day) => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => {
                          setSelectedDay(day)
                          setActiveStep('schedule')
                        }}
                        className={`flex h-10 w-10 items-center justify-center rounded-lg text-xs transition ${
                          selectedDay === day
                            ? 'bg-red-600 font-bold text-white'
                            : Number(day) < 15
                              ? 'text-neutral-600 hover:bg-neutral-800'
                              : 'text-white hover:bg-neutral-800'
                        }`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    {timeSlots.map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setSelectedTime(slot)}
                        className={`rounded-lg px-2 py-3 text-[10px] font-bold uppercase tracking-tighter transition-all ${
                          selectedTime === slot
                            ? 'bg-red-600 text-white'
                            : 'bg-[#353534] text-neutral-400 hover:bg-red-600 hover:text-white'
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>
              </section>
            </div>

            <div className="mt-12 flex flex-col items-center justify-between gap-6 rounded-2xl border border-red-600/20 bg-neutral-950 p-6 sm:p-8 md:flex-row lg:mt-20 lg:p-10">
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <BoltRoundedIcon sx={{ fontSize: 16 }} className="text-red-600" />
                  <span className="text-xs font-bold uppercase tracking-widest text-neutral-400 font-['Epilogue']">
                    Total Estimated Cost
                  </span>
                </div>
                <div className="text-3xl font-black italic text-white font-['Epilogue'] sm:text-4xl">
                  ${estimatedCost.toFixed(2)}
                </div>
              </div>

              <button
                type="button"
                onClick={onOpenSignup}
                className="rounded-full bg-[#e10100] px-8 py-4 text-sm font-black uppercase tracking-[0.2em] text-white transition-all hover:scale-105 hover:shadow-[0_10px_30px_rgba(225,1,0,0.4)] active:scale-95 sm:px-10 sm:py-5"
              >
                Confirm Booking
              </button>
            </div>
          </div>
        </main>
      </div>

      <footer className="relative z-50 flex w-full flex-col items-center gap-6 bg-neutral-950 px-6 py-12 text-center">
        <div className="text-lg font-black uppercase tracking-tighter text-neutral-100 font-['Epilogue'] italic">
          Yamaha Motor Corp.
        </div>
        <nav className="flex flex-wrap justify-center gap-6 text-xs uppercase tracking-widest text-neutral-600 sm:gap-8">
          <a href="#" className="transition-colors hover:text-red-500">Privacy Policy</a>
          <a href="#" className="transition-colors hover:text-red-500">Terms of Service</a>
          <a href="#" className="transition-colors hover:text-red-500">Dealer Locator</a>
        </nav>
        <p className="text-[10px] uppercase tracking-widest text-neutral-700">
          © 2024 Yamaha Motor Corp. Kinetic Gallery Edition.
        </p>
      </footer>
    </div>
  )
}
