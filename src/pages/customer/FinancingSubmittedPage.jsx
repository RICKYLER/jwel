import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded'

export default function FinancingSubmittedPage({ referenceId, onNavigateToShowroom, onTrackApplication }) {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-20">
        <div className="pointer-events-none absolute right-0 top-0 -z-10 h-full w-1/2 translate-x-24 -skew-x-12 bg-slate-200" />

        <div className="grid w-full max-w-4xl items-stretch bg-white shadow-[0px_20px_40px_rgba(26,28,30,0.06)] md:grid-cols-2">
          <div className="group relative min-h-75 overflow-hidden md:min-h-full">
            <img
              className="absolute inset-0 h-full w-full object-cover"
              alt="Close-up of a sleek red sportbike fuel tank with chrome Yamaha badge"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuChRzd7zwwLzJTjJ0Umhp_tJJmKGQlJPYMsWpiX9RkJQbypU6gbiEyZNCzxVv5Bs7q_VA7ngHFsu_L4-6CRQiXW48bhpgZkuEkIMsLfmb50ZaSS3NYCUOQINERkcjQVIaE_2FTwmLSKS2IfrpB5hPmXMAf9zaai1gRFv6wt-ve90qOTkd9LFQRl284VQE0mUeiHIUBH6AgEuulI4eNcMfi2f4xgmN5OgwAXJduCRUsivtn3-cKyagpsgK4AARdQYyJt0Lu2DRtgTGk"
            />
            <div className="absolute inset-0 bg-red-700/20 mix-blend-multiply" />
            <div className="absolute bottom-0 left-0 p-8">
              <span className="mb-2 inline-block bg-red-600 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white">Confirmed</span>
              <h2 className="text-4xl font-black italic leading-none tracking-tighter text-white">THE KINETIC EDGE</h2>
            </div>
          </div>

          <div className="flex flex-col justify-center p-8 md:p-12 lg:p-16">
            <div className="mb-8">
              <div className="mb-4 flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center bg-red-600">
                  <CheckCircleRoundedIcon sx={{ fontSize: 34 }} className="text-white" />
                </div>
                <h1 className="text-3xl font-black italic uppercase leading-none tracking-tighter md:text-4xl">
                  Application
                  <br />
                  Submitted
                </h1>
              </div>

              <div className="border-l-4 border-red-600 bg-slate-100 p-4">
                <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">Reference ID</p>
                <p className="font-mono text-xl font-bold tracking-tight text-slate-900">
                  {referenceId || 'REF-PENDING'}
                </p>
              </div>
            </div>

            <div className="mb-10 space-y-6">
              <h3 className="text-sm font-extrabold uppercase tracking-widest text-red-600">What's Next</h3>
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="mt-2 h-2 w-2 bg-red-600" />
                  <div className="mt-1 h-full w-0.5 bg-slate-200" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">Review in Progress</h4>
                  <p className="text-sm leading-relaxed text-slate-600">
                    Our financing team is auditing your application data against underwriting standards.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="mt-2 h-2 w-2 bg-red-600" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">Timing Estimate</h4>
                  <p className="text-sm leading-relaxed text-slate-600">
                    A formal decision will be sent through your account and email within 24 to 48 hours.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={onNavigateToShowroom}
                className="group relative bg-red-600 px-8 py-4 text-center text-xs font-black uppercase tracking-widest text-white transition-all hover:bg-red-700"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  Back to Showroom
                  <ArrowForwardRoundedIcon className="transition-transform group-hover:translate-x-1" sx={{ fontSize: 18 }} />
                </span>
              </button>
              <button
                onClick={onTrackApplication}
                className="bg-slate-300 px-8 py-4 text-center text-xs font-black uppercase tracking-widest text-slate-900 transition-all hover:bg-slate-900 hover:text-white"
              >
                Track Application Status
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8 max-w-md text-center">
          <p className="text-[10px] font-bold uppercase tracking-widest leading-loose text-slate-600">
            Need immediate assistance? Contact our support desk at
            <span className="ml-1 text-red-600 underline">1-800-YAM-EDGE</span>
            .
          </p>
        </div>
      </main>
    </div>
  )
}
