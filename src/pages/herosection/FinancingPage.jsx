import { useState } from 'react'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat'

export default function FinancingPage() {
  const [selectedMotorcycle, setSelectedMotorcycle] = useState('YZF-R1M')
  const [downPaymentPercent, setDownPaymentPercent] = useState(30)
  const [paymentTerm, setPaymentTerm] = useState(24)
  const [incomeRange, setIncomeRange] = useState('₱30k - ₱50k')
  const [formData, setFormData] = useState({
    fullName: '',
    contactNumber: '',
    address: '',
    identityFile: null,
  })

  const motorcycles = [
    { name: 'YZF-R1M', price: 1099000 },
    { name: 'MT-09 SP', price: 659000 },
  ]

  const selectedMotoPrice = motorcycles.find((m) => m.name === selectedMotorcycle)?.price || 1099000

  const downPaymentAmount = Math.round(selectedMotoPrice * (downPaymentPercent / 100))
  const remainingBalance = selectedMotoPrice - downPaymentAmount
  const monthlyAmortization = Math.round(remainingBalance / paymentTerm)

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      setFormData((prev) => ({ ...prev, identityFile: file }))
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    console.log('Financing Application Submitted:', {
      ...formData,
      motorcycle: selectedMotorcycle,
      downPayment: `${downPaymentPercent}%`,
      paymentTerm: `${paymentTerm} Months`,
      incomeRange,
      monthlyAmortization,
    })
    alert('Application submitted successfully!')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white font-['Inter']">
      {/* Hero Section */}
      <section className="relative h-[409px] overflow-hidden bg-slate-900">
        <div className="absolute inset-0">
          <img
            className="w-full h-full object-cover opacity-50 grayscale hover:grayscale-0 transition-all duration-700"
            alt="close-up of a high-performance Yamaha superbike engine and frame with dramatic red lighting and industrial textures"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBI3sKI1gj8VA_OeGEgu-OssNmJL5BudoDQH4iH0bj6-UrXXYzvf_FWakNI1cY3VCg8qjH-v4w2h02h78bAS_UYby4h0BUqyCJ6o15oxQHSi5UUjGTcQuQW111aHk8v2FTu4L3UwdjcUxsew2clNk8zoHWjTuzmPtTzsWQSBdi39E3JusJC1_cBowiuiyHisZi_BLlcfd6wUqfSDKE_kjV8_OmpX5zuqN3oA-uhUWfvNSkcDhpsTz1TiedsTNhPv7nEvowVGWbcaSSp"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-transparent to-transparent"></div>
        </div>
        <div className="relative h-full flex flex-col justify-center px-8 md:px-16 max-w-7xl mx-auto">
          <span className="text-red-600 font-bold tracking-[0.2em] uppercase text-xs mb-4">The Precision Apex</span>
          <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter text-white leading-none">
            ENGINEERED
            <br />
            <span className="text-red-600">FINANCING.</span>
          </h1>
        </div>
      </section>

      {/* Financing Hub */}
      <div className="max-w-7xl mx-auto px-4 md:px-16 -mt-16 pb-24 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
          {/* Left Column: Step 1 Calculator */}
          <div className="lg:col-span-7 bg-slate-900/50 p-8 md:p-12 border border-slate-800/30">
            <div className="flex items-center gap-4 mb-10">
              <span className="text-4xl font-black text-slate-700 opacity-30">01</span>
              <h2 className="text-3xl font-black italic tracking-tight uppercase">Financing Calculator</h2>
            </div>
            <form className="space-y-8">
              {/* Motorcycle Selection */}
              <div className="space-y-4">
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-400">Selected Motorcycle Unit</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {motorcycles.map((moto) => (
                    <div
                      key={moto.name}
                      onClick={() => setSelectedMotorcycle(moto.name)}
                      className={`p-4 ring-2 relative group cursor-pointer transition-all ${
                        selectedMotorcycle === moto.name
                          ? 'ring-red-600 bg-red-600/10'
                          : 'ring-slate-700 bg-slate-900/30 hover:ring-slate-600'
                      }`}
                    >
                      <div className="absolute top-2 right-2">
                        {selectedMotorcycle === moto.name && <CheckCircleIcon className="text-red-600" />}
                      </div>
                      <h3 className="font-black italic text-white">{moto.name}</h3>
                      <p className="text-sm text-slate-400">SRP ₱{moto.price.toLocaleString()}</p>
                      <img
                        className="mt-4 w-full h-32 object-contain group-hover:scale-110 transition-transform"
                        alt={moto.name}
                        src={
                          moto.name === 'YZF-R1M'
                            ? 'https://lh3.googleusercontent.com/aida-public/AB6AXuBbcQFWPYIRUr9D0VKgeZ7zqXTf_FbXyl9c3GacM2MlncDw4btw3Vq6E-G_4re_D4nKYJdNty-kZJuXd7Q_7wFg7fYW_20w24I2JGqxfBIPclkcFYEd1KX8dFG3Ka265N1sqDQXW4rtw_Domcy-KIJKh1WSmMaadr04iuInRcjZUEAiIK2i28j9e_XF00mJc2sAshXrjeELGMefj4KSZkVGA6d_FZO9FlgkHtkLMCHf8xU9-hNzAgnbiMXOMWydyGnklKR26rOhPcM5'
                            : 'https://lh3.googleusercontent.com/aida-public/AB6AXuDf8lJAbmoJyfFWJfWBYitcH3WQG5Ps8VYjk-lJ7dHbg4vjKIj29YkSvZOU0IfiRi8kuR7e-GTwhmbDFnCg_56lJhOJmOGz9B4wQMHFa1Pg5TNytHdMn1GuPGJQQ18QZNYWgXEAq2LbOcF5Bf2Dl8Un-Ze1mxZ1U6TQhtYwOIC6Mnl1RwpsSgHvrhQqDuem5h06mFfQDNVddpMl8s6J1pVwPPOpNqYSOb2blLA97I-qtblYwf11bd1NUDFmVXKDfdjQjKYy0kPOdW'
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Configurator Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-400">Down Payment Option</label>
                  <div className="grid grid-cols-5 gap-1">
                    {[10, 20, 30, 40, 50].map((percent) => (
                      <button
                        key={percent}
                        onClick={() => setDownPaymentPercent(percent)}
                        type="button"
                        className={`py-3 text-xs font-bold transition-all ${
                          downPaymentPercent === percent
                            ? 'bg-red-600 text-white'
                            : 'bg-slate-800 text-slate-300 hover:bg-red-600 hover:text-white'
                        }`}
                      >
                        {percent}%
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-4">
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-400">Payment Term (Months)</label>
                  <div className="grid grid-cols-3 gap-1">
                    {[12, 24, 36].map((months) => (
                      <button
                        key={months}
                        onClick={() => setPaymentTerm(months)}
                        type="button"
                        className={`py-3 text-xs font-bold transition-all ${
                          paymentTerm === months
                            ? 'bg-red-600 text-white'
                            : 'bg-slate-800 text-slate-300 hover:bg-red-600 hover:text-white'
                        }`}
                      >
                        {months}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-400">Monthly Income Range</label>
                <select
                  value={incomeRange}
                  onChange={(e) => setIncomeRange(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-300 py-4 px-6 text-sm font-bold focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all"
                >
                  <option>₱10k - ₱20k</option>
                  <option>₱20k - ₱30k</option>
                  <option>₱30k - ₱50k</option>
                  <option>₱50k+</option>
                </select>
              </div>
            </form>

            {/* Real-time Results Banner */}
            <div className="mt-12 bg-slate-950 text-white p-8 grid grid-cols-1 md:grid-cols-3 gap-8 border border-slate-800">
              <div>
                <p className="text-[10px] uppercase tracking-widest opacity-60 mb-1">Down Payment</p>
                <p className="text-2xl font-black tracking-tight italic">₱{downPaymentAmount.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest opacity-60 mb-1">Remaining Balance</p>
                <p className="text-2xl font-black tracking-tight italic">₱{remainingBalance.toLocaleString()}</p>
              </div>
              <div className="md:border-l border-slate-700 md:pl-8">
                <p className="text-[10px] uppercase tracking-widest text-red-600 font-bold mb-1">Monthly Amortization</p>
                <p className="text-3xl font-black tracking-tighter italic text-red-600">₱{monthlyAmortization.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Right Column: Step 2 Application Form */}
          <div className="lg:col-span-5 bg-slate-950 p-8 md:p-12 border border-slate-800 shadow-2xl relative">
            <div className="flex items-center gap-4 mb-10">
              <span className="text-4xl font-black text-slate-700 opacity-30">02</span>
              <h2 className="text-3xl font-black italic tracking-tight uppercase">Application Form</h2>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Full Name</label>
                <input
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-100 p-4 text-sm font-medium focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all placeholder-slate-600"
                  placeholder="Johnathan Doe"
                  type="text"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Contact Number</label>
                  <input
                    name="contactNumber"
                    value={formData.contactNumber}
                    onChange={handleInputChange}
                    className="w-full bg-slate-900 border border-slate-700 text-slate-100 p-4 text-sm font-medium focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all placeholder-slate-600"
                    placeholder="+63 900 000 0000"
                    type="tel"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Pre-filled Unit</label>
                  <input
                    className="w-full bg-slate-800 border border-slate-700 text-slate-400 p-4 text-sm font-bold"
                    disabled
                    type="text"
                    value={selectedMotorcycle}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Address</label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-100 p-4 text-sm font-medium focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all placeholder-slate-600"
                  placeholder="Street, Barangay, City, Province"
                  rows="2"
                ></textarea>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Terms Applied</label>
                  <input
                    className="w-full bg-slate-800 border border-slate-700 text-slate-400 p-4 text-sm font-bold"
                    disabled
                    type="text"
                    value={`${downPaymentPercent}% / ${paymentTerm} Months`}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Income Range</label>
                  <input
                    className="w-full bg-slate-800 border border-slate-700 text-slate-400 p-4 text-sm font-bold"
                    disabled
                    type="text"
                    value={incomeRange}
                  />
                </div>
              </div>
              <div className="space-y-4">
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Verify Identity (Valid ID)</label>
                <div className="border-2 border-dashed border-slate-700 bg-slate-900 p-8 text-center cursor-pointer hover:bg-slate-900/80 hover:border-red-600/50 transition-all relative group">
                  <input
                    type="file"
                    onChange={handleFileUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    accept=".jpg,.jpeg,.png,.pdf"
                  />
                  <CloudUploadIcon className="text-4xl text-slate-600 mb-2 group-hover:text-red-600" />
                  <p className="text-xs font-bold text-slate-400 uppercase">Drag & Drop or Click to Upload</p>
                  {formData.identityFile && <p className="text-[10px] text-green-500 italic mt-2">{formData.identityFile.name}</p>}
                  {!formData.identityFile && <p className="text-[10px] text-slate-500 italic mt-1">JPG, PNG, PDF up to 5MB</p>}
                </div>
              </div>
              <div className="pt-6">
                <button
                  type="submit"
                  className="w-full py-5 bg-red-600 text-white font-black italic tracking-widest uppercase hover:bg-red-700 transition-all active:scale-[0.98] shadow-lg flex items-center justify-center gap-4"
                >
                  Submit Application
                  <TrendingFlatIcon />
                </button>
                <p className="text-[10px] text-center text-slate-500 mt-4 px-8">
                  By submitting, you agree to our Terms & Conditions and Data Privacy Policy. Your data is encrypted and handled with precision.
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-800">
        <div className="flex flex-col md:flex-row justify-between items-center px-8 py-12 w-full max-w-7xl mx-auto">
          <div className="mb-8 md:mb-0">
            <div className="text-lg font-bold text-white mb-2 uppercase tracking-tighter italic">Yamaha Kinetic Edge</div>
            <div className="text-xs uppercase tracking-widest text-slate-600">© 2024 Yamaha Motor Co., Ltd. All Rights Reserved.</div>
          </div>
          <div className="flex flex-wrap justify-center gap-8 text-xs uppercase tracking-widest">
            <a href="#" className="text-slate-500 hover:text-red-600 transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="text-slate-500 hover:text-red-600 transition-colors">
              Terms of Service
            </a>
            <a href="#" className="text-slate-500 hover:text-red-600 transition-colors">
              Dealer Locator
            </a>
            <a href="#" className="text-slate-500 hover:text-red-600 transition-colors">
              Contact Us
            </a>
          </div>
          <div className="mt-8 md:mt-0 flex gap-4">
            <a href="#" className="w-10 h-10 flex items-center justify-center bg-slate-900 text-white hover:text-red-600 transition-colors">
              <span className="material-symbols-outlined text-5xl">share</span>
            </a>
            <a href="#" className="w-10 h-10 flex items-center justify-center bg-slate-900 text-white hover:text-red-600 transition-colors">
              <span className="material-symbols-outlined text-5xl">language</span>
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
