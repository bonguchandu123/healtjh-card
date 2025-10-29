import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Calendar, Clock, User, Phone, Mail, Filter, Search, Eye, CheckCircle, XCircle, Activity } from 'lucide-react';

const DAppointmentsPage = () => {
  const { token } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchAppointments();
  }, []);

  useEffect(() => {
    filterAppointments();
  }, [appointments, statusFilter, dateFilter, searchQuery]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('http://localhost:8000/api/v1/doctor/appointments?limit=100', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to fetch appointments');

      const data = await response.json();
      setAppointments(data);

    } catch (err) {
      console.error('Fetch appointments error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filterAppointments = () => {
    let filtered = [...appointments];

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(apt => apt.status === statusFilter);
    }

    // Date filter
    if (dateFilter) {
      filtered = filtered.filter(apt => apt.scheduled_date === dateFilter);
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(apt =>
        apt.patient_name?.toLowerCase().includes(query) ||
        apt.patient_email?.toLowerCase().includes(query) ||
        apt.symptoms?.toLowerCase().includes(query)
      );
    }

    setFilteredAppointments(filtered);
  };

  const updateAppointmentStatus = async (appointmentId, newStatus, notes = '') => {
    try {
      const response = await fetch(
        `http://localhost:8000/api/v1/doctor/appointments/${appointmentId}/status?new_status=${newStatus}${notes ? `&notes=${encodeURIComponent(notes)}` : ''}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) throw new Error('Failed to update status');

      await fetchAppointments();
      setShowModal(false);
      setSelectedAppointment(null);

    } catch (err) {
      console.error('Update status error:', err);
      alert('Failed to update appointment status');
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
      in_progress: 'bg-purple-100 text-purple-800 border-purple-200',
      completed: 'bg-green-100 text-green-800 border-green-200',
      cancelled: 'bg-red-100 text-red-800 border-red-200'
    };
    return styles[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getStatusActions = (appointment) => {
    const { status } = appointment;
    
    if (status === 'completed' || status === 'cancelled') return null;

    return (
      <div className="flex items-center space-x-2">
        {status === 'confirmed' && (
          <button
            onClick={() => updateAppointmentStatus(appointment.id, 'in_progress')}
            className="px-3 py-1 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
          >
            Start
          </button>
        )}
        {(status === 'confirmed' || status === 'in_progress') && (
          <button
            onClick={() => updateAppointmentStatus(appointment.id, 'completed')}
            className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
          >
            Complete
          </button>
        )}
      </div>
    );
  };

  const AppointmentCard = ({ appointment }) => (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <h3 className="text-lg font-semibold text-gray-800">
              {appointment.patient_name}
            </h3>
            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadge(appointment.status)}`}>
              {appointment.status.replace('_', ' ').toUpperCase()}
            </span>
          </div>
          
          <div className="flex items-center text-sm text-gray-600 space-x-4 mb-3">
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-1" />
              <span>{appointment.scheduled_date || appointment.preferred_date}</span>
            </div>
            <div className="flex items-center">
              <Clock className="w-4 h-4 mr-1" />
              <span>{appointment.scheduled_time || appointment.preferred_time}</span>
            </div>
          </div>

          <div className="flex items-center text-sm text-gray-600 space-x-4">
            <div className="flex items-center">
              <Phone className="w-4 h-4 mr-1" />
              <span>{appointment.patient_phone || 'N/A'}</span>
            </div>
            <div className="flex items-center">
              <Mail className="w-4 h-4 mr-1" />
              <span>{appointment.patient_email}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <div>
          <p className="text-xs text-gray-500 mb-1">Appointment Type:</p>
          <p className="text-sm font-medium text-gray-700">{appointment.appointment_type}</p>
        </div>
        
        {appointment.symptoms && (
          <div>
            <p className="text-xs text-gray-500 mb-1">Symptoms:</p>
            <p className="text-sm text-gray-700">{appointment.symptoms}</p>
          </div>
        )}

        {appointment.reason_for_visit && (
          <div>
            <p className="text-xs text-gray-500 mb-1">Reason for Visit:</p>
            <p className="text-sm text-gray-700">{appointment.reason_for_visit}</p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        {getStatusActions(appointment)}
        <button
          onClick={() => {
            setSelectedAppointment(appointment);
            setShowModal(true);
          }}
          className="flex items-center space-x-1 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
        >
          <Eye className="w-4 h-4" />
          <span>View Details</span>
        </button>
      </div>
    </div>
  );

  const DetailModal = () => {
    if (!selectedAppointment) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-800">Appointment Details</h2>
            <button
              onClick={() => {
                setShowModal(false);
                setSelectedAppointment(null);
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              <XCircle className="w-6 h-6" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Patient Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Name</p>
                  <p className="font-medium">{selectedAppointment.patient_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{selectedAppointment.patient_email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="font-medium">{selectedAppointment.patient_phone || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadge(selectedAppointment.status)}`}>
                    {selectedAppointment.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Appointment Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Date</p>
                  <p className="font-medium">{selectedAppointment.scheduled_date || selectedAppointment.preferred_date}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Time</p>
                  <p className="font-medium">{selectedAppointment.scheduled_time || selectedAppointment.preferred_time}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Type</p>
                  <p className="font-medium">{selectedAppointment.appointment_type}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Hospital</p>
                  <p className="font-medium">{selectedAppointment.hospital_name}</p>
                </div>
              </div>
            </div>

            {selectedAppointment.symptoms && (
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Symptoms</h3>
                <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{selectedAppointment.symptoms}</p>
              </div>
            )}

            {selectedAppointment.reason_for_visit && (
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Reason for Visit</h3>
                <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{selectedAppointment.reason_for_visit}</p>
              </div>
            )}

            {selectedAppointment.medical_history && (
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Medical History</h3>
                <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{selectedAppointment.medical_history}</p>
              </div>
            )}

            {selectedAppointment.current_medications && (
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Current Medications</h3>
                <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{selectedAppointment.current_medications}</p>
              </div>
            )}

            {selectedAppointment.allergies && (
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Allergies</h3>
                <p className="text-gray-700 bg-red-50 p-3 rounded-lg border border-red-200">{selectedAppointment.allergies}</p>
              </div>
            )}

            <div className="flex items-center space-x-3 pt-4 border-t border-gray-200">
              <button
                onClick={() => window.location.href = `/doctor/patient/${selectedAppointment.patient_id}`}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                View Patient Records
              </button>
              {getStatusActions(selectedAppointment)}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading appointments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">My Appointments</h1>
          <p className="text-gray-600">Manage and track all your patient appointments</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search patients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>

            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />

            <button
              onClick={() => {
                setStatusFilter('all');
                setDateFilter('');
                setSearchQuery('');
              }}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        <div className="mb-4 flex items-center justify-between">
          <p className="text-gray-600">
            Showing {filteredAppointments.length} of {appointments.length} appointments
          </p>
        </div>

        {filteredAppointments.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">No appointments found</p>
            <p className="text-sm text-gray-500">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredAppointments.map((appointment) => (
              <AppointmentCard key={appointment.id} appointment={appointment} />
            ))}
          </div>
        )}

        {showModal && <DetailModal />}
      </div>
    </div>
  );
};

export default DAppointmentsPage;