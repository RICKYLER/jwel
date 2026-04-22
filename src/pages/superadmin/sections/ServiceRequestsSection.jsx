import './ServiceRequestsSection.css'
import { useState } from 'react'
import useMechanicsPersonnel from '../../../hooks/useMechanicsPersonnel'
import AssignMechanicModal from '../components/AssignMechanicModal'

export default function ServiceRequestsSection({
  requests,
  canEditOperations,
  handleCollectionUpdate,
  formatCurrency,
  formatDate,
  getStatusClasses,
  isDarkMode = true,
  mechanics: _mechanics = [], // mechanics can be passed as prop, but default to []
}) {
  // Fetch mechanics from Firestore
  const mechanicsFromFirestore = useMechanicsPersonnel();
  const mechanics = mechanicsFromFirestore.length ? mechanicsFromFirestore : _mechanics;

  // Helper to get conditional text colors
  const getTextClass = (intensity) => {
    if (isDarkMode) {
      return intensity === 'main' ? 'text-white' : intensity === 'secondary' ? 'text-white/70' : 'text-white/40'
    }
    return intensity === 'main' ? 'text-gray-900' : intensity === 'secondary' ? 'text-gray-600' : 'text-gray-500'
  }

  const getBgClass = () => isDarkMode ? 'bg-white/5' : 'bg-gray-100'
  
  const [assignModalOpen, setAssignModalOpen] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState(null)

  const handleAcceptRequest = (request) => {
    setSelectedRequest(request)
    setAssignModalOpen(true)
  }

  const handleAssignMechanic = (mechanicId) => {
    if (selectedRequest && mechanicId) {
      handleCollectionUpdate('serviceBookings', selectedRequest.id, { status: 'In Progress', assignedTechnician: mechanicId })
    }
    setAssignModalOpen(false)
    setSelectedRequest(null)
  }

  const handleCloseModal = () => {
    setAssignModalOpen(false)
    setSelectedRequest(null)
  }

  return (
    <section className={`service-requests-section rounded-xl p-6 ${!isDarkMode ? 'light-mode' : ''}`}>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h3 className={`font-['Epilogue'] text-xl font-extrabold uppercase italic tracking-tighter ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Service Requests
          </h3>
          <p className={`text-sm ${getTextClass('tertiary')}`}>Realtime booking queue from `serviceBookings`.</p>
        </div>
        <div className={`rounded-full ${getBgClass()} px-4 py-2 text-xs font-bold ${getTextClass('secondary')}`}>
          {requests.length} synced requests
        </div>
      </div>

      <div className="service-requests-list grid gap-4">
        {requests.map((request) => (
          <div key={request.id} className={`service-request-card grid gap-4 rounded-2xl p-4 lg:grid-cols-[1.2fr_1fr_0.8fr] lg:items-center`}>
            <div>
              <p className={`text-xs uppercase tracking-[0.24em] ${getTextClass('tertiary')}`}>{request.bookingId || request.id}</p>
              <h4 className={`mt-2 text-lg font-bold ${getTextClass('main')}`}>{request.customerName || request.customer || 'Walk-in Client'}</h4>
              <p className={`text-sm ${getTextClass('secondary')}`}>
                {request.model || 'Yamaha Unit'} • {request.service || 'General Service'}
              </p>
              <p className={`mt-1 text-xs ${getTextClass('tertiary')}`}>Updated {formatDate(request.updatedAt || request.createdAt)}</p>
            </div>
            <div className={`space-y-2 text-sm ${getTextClass('secondary')}`}>
              <p>Package: <span className={`font-semibold ${getTextClass('main')}`}>{request.package || 'Standard'}</span></p>
              <p>Est. Hours: <span className={`font-semibold ${getTextClass('main')}`}>{request.estimatedHours ?? 4}</span></p>
              <p>Cost: <span className={`font-semibold ${getTextClass('main')}`}>{formatCurrency(request.cost ?? 0)}</span></p>
            </div>
            <div className="space-y-2">
              {request.status === 'Pending' && (
                <button
                  className="w-full rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold px-3 py-2 text-sm transition"
                  onClick={() => handleAcceptRequest(request)}
                  disabled={!canEditOperations}
                >
                  Accept & Assign Mechanic
                </button>
              )}
              <span className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase ${getStatusClasses(request.status)}`}>
                {request.status || 'Pending'}
              </span>
              {request.status === 'In Progress' && (
                <button
                  className="w-full mt-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-2 text-sm transition"
                  onClick={() => handleCollectionUpdate('serviceBookings', request.id, { status: 'Services Completed' })}
                  disabled={!canEditOperations}
                >
                  SERVICE COMPLETED
                </button>
              )}
            </div>
          </div>
        ))}

        {!requests.length && (
          <div className={`service-request-empty rounded-2xl p-8 text-center ${getTextClass('secondary')}`}>
            No Firebase service requests found yet.
          </div>
        )}
      </div>
      <AssignMechanicModal
        open={assignModalOpen}
        onClose={handleCloseModal}
        onAssign={handleAssignMechanic}
        mechanics={mechanics}
        request={selectedRequest}
      />
    </section>
  )
}
