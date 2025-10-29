import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Calendar,
  Clock,
  User,
  Stethoscope,
  ArrowLeft,
  CheckCircle,
  XCircle,
  AlertCircle,
  Phone,
  Mail,
  FileText,
  MapPin,
  Activity,
  Save,
  UserCheck,
  AlertTriangle
} from 'lucide-react';

const API_BASE_URL =`${import.meta.env.VITE_API_BASE_URL}/api/v1`;

const AdminAppointmentDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [appointment, setAppointment] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [assigning, setAssigning] = useState(false);
  const [debugInfo, setDebugInfo] = useState(null);

  useEffect(() => {
    fetchAppointmentDetails();
    fetchDoctors();
  }, [id]);

  const fetchAppointmentDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Try to fetch with hospital filter first
      let response;
      try {
        response = await axios.get(`${API_BASE_URL}/admin/appointments/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setAppointment(response.data);
        setScheduledDate(response.data.preferred_date || '');
        setScheduledTime(response.data.preferred_time || '');
      } catch (err) {
        // If 404, try fetching without hospital filter (direct from DB)
        if (err.response?.status === 404) {
          console.log('Appointment not found with hospital filter, trying direct fetch...');
          
          // Fetch all appointments and find this one
          const allResponse = await axios.get(`${API_BASE_URL}/admin/appointments?limit=1000`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          const found = allResponse.data.find(apt => apt.id === id);
          
          if (found) {
            setAppointment(found);
            setScheduledDate(found.preferred_date || '');
            setScheduledTime(found.preferred_time || '');
            
            // Show warning that hospital ID mismatch
            setDebugInfo({
              issue: 'Hospital ID Mismatch',
              message: `This appointment belongs to hospital: ${found.hospital_name} (ID: ${found.hospital_id}), but you might be assigned to a different hospital.`
            });
          } else {
            throw new Error('Appointment not found');
          }
        } else {
          throw err;
        }
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching appointment:', err);
      setMessage({
        type: 'error',
        text: err.response?.data?.detail || 'Failed to load appointment details'
      });
      setLoading(false);
    }
  };

  const fetchDoctors = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/admin/doctors`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDoctors(response.data);
    } catch (err) {
      console.error('Error fetching doctors:', err);
    }
  };

  const handleAssignDoctor = async () => {
    if (!selectedDoctor) {
      setMessage({ type: 'error', text: 'Please select a doctor' });
      return;
    }

    if (!scheduledDate || !scheduledTime) {
      setMessage({ type: 'error', text: 'Please set date and time' });
      return;
    }

    try {
      setAssigning(true);
      const token = localStorage.getItem('token');

      await axios.put(
        `${API_BASE_URL}/admin/appointments/${id}/assign`,
        {
          doctor_id: selectedDoctor,
          scheduled_date: scheduledDate,
          scheduled_time: scheduledTime,
          notes: adminNotes
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessage({
        type: 'success',
        text: 'Doctor assigned successfully! Patient has been notified.'
      });

      setTimeout(() => {
        navigate('/admin/appointments');
      }, 2000);
    } catch (err) {
      console.error('Error assigning doctor:', err);
      setMessage({
        type: 'error',
        text: err.response?.data?.detail || 'Failed to assign doctor'
      });
    } finally {
      setAssigning(false);
    }
  };

  const handleCancelAppointment = async () => {
    if (!confirm('Are you sure you want to cancel this appointment?')) return;

    try {
      const token = localStorage.getItem('token');
      const reason = prompt('Please provide a reason for cancellation:');
      
      if (!reason) return;

      await axios.delete(`${API_BASE_URL}/admin/appointments/${id}?reason=${encodeURIComponent(reason)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setMessage({
        type: 'success',
        text: 'Appointment cancelled successfully'
      });

      setTimeout(() => {
        navigate('/admin/appointments');
      }, 1500);
    } catch (err) {
      console.error('Error cancelling appointment:', err);
      setMessage({
        type: 'error',
        text: err.response?.data?.detail || 'Failed to cancel appointment'
      });
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      confirmed: 'bg-blue-100 text-blue-800 border-blue-300',
      completed: 'bg-green-100 text-green-800 border-green-300',
      cancelled: 'bg-red-100 text-red-800 border-red-300',
      in_progress: 'bg-purple-100 text-purple-800 border-purple-300'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5" />;
      case 'confirmed':
        return <CheckCircle className="w-5 h-5" />;
      case 'completed':
        return <CheckCircle className="w-5 h-5" />;
      case 'cancelled':
        return <XCircle className="w-5 h-5" />;
      case 'in_progress':
        return <Stethoscope className="w-5 h-5" />;
      default:
        return <AlertCircle className="w-5 h-5" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading Appointment...</p>
        </div>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <AlertCircle className="w-20 h-20 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Appointment Not Found</h2>
            <p className="text-gray-600 mb-6">The appointment you're looking for doesn't exist.</p>
            <button
              onClick={() => navigate('/admin/appointments')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Back to Appointments
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/admin/appointments')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Appointments
          </button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Appointment Details</h1>
              <p className="text-gray-600 mt-1">Manage appointment and assign doctor</p>
            </div>
            
            <span className={`px-4 py-2 rounded-full text-sm font-medium border flex items-center gap-2 ${getStatusColor(appointment.status)}`}>
              {getStatusIcon(appointment.status)}
              {appointment.status.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Debug Warning */}
        {debugInfo && (
          <div className="mb-6 bg-orange-50 border border-orange-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-orange-800">{debugInfo.issue}</h3>
                <p className="text-sm text-orange-700 mt-1">{debugInfo.message}</p>
              </div>
            </div>
          </div>
        )}

        {/* Message Alert */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-lg flex items-start gap-3 ${
            message.type === 'success' 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            )}
            <p className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
              {message.text}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Patient Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Patient Information */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <User className="w-6 h-6 text-blue-600" />
                Patient Information
              </h2>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Full Name</p>
                  <p className="text-lg font-semibold text-gray-800">{appointment.patient_name}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {appointment.patient_phone && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Phone Number</p>
                      <a 
                        href={`tel:${appointment.patient_phone}`}
                        className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors"
                      >
                        <Phone className="w-4 h-4" />
                        {appointment.patient_phone}
                      </a>
                    </div>
                  )}

                  {appointment.patient_email && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Email Address</p>
                      <a 
                        href={`mailto:${appointment.patient_email}`}
                        className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors"
                      >
                        <Mail className="w-4 h-4" />
                        {appointment.patient_email}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Appointment Details */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <FileText className="w-6 h-6 text-blue-600" />
                Appointment Details
              </h2>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Appointment Type</p>
                  <p className="text-lg font-semibold text-gray-800">
                    {appointment.appointment_type || 'General Consultation'}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-1">Reason for Visit</p>
                  <p className="text-gray-800">{appointment.reason_for_visit || 'Not specified'}</p>
                </div>

                {appointment.symptoms && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Symptoms</p>
                    <p className="text-gray-800">{appointment.symptoms}</p>
                  </div>
                )}

                {appointment.medical_history && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Medical History</p>
                    <p className="text-gray-800">{appointment.medical_history}</p>
                  </div>
                )}

                {appointment.current_medications && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Current Medications</p>
                    <p className="text-gray-800">{appointment.current_medications}</p>
                  </div>
                )}

                {appointment.allergies && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Allergies</p>
                    <p className="text-red-600 font-medium">{appointment.allergies}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Preferred Date</p>
                    <div className="flex items-center gap-2 text-gray-800">
                      <Calendar className="w-4 h-4" />
                      {appointment.preferred_date || 'Not set'}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 mb-1">Preferred Time</p>
                    <div className="flex items-center gap-2 text-gray-800">
                      <Clock className="w-4 h-4" />
                      {appointment.preferred_time || 'Not set'}
                    </div>
                  </div>
                </div>

                {appointment.hospital_name && (
                  <div className="pt-4 border-t">
                    <p className="text-sm text-gray-600 mb-1">Hospital</p>
                    <div className="flex items-center gap-2 text-gray-800">
                      <MapPin className="w-4 h-4" />
                      {appointment.hospital_name}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Current Assignment */}
            {appointment.doctor_name && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <UserCheck className="w-6 h-6 text-blue-600" />
                  Currently Assigned
                </h2>
                
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                    <Stethoscope className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">Dr. {appointment.doctor_name}</p>
                    {appointment.scheduled_date && (
                      <p className="text-sm text-gray-600">
                        Scheduled: {appointment.scheduled_date} at {appointment.scheduled_time}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Assignment Panel */}
          <div className="space-y-6">
            {appointment.status === 'pending' && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Stethoscope className="w-6 h-6 text-blue-600" />
                  Assign Doctor
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Doctor *
                    </label>
                    <select
                      value={selectedDoctor}
                      onChange={(e) => setSelectedDoctor(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Choose a doctor...</option>
                      {doctors.map((doctor) => (
                        <option key={doctor.id} value={doctor.id}>
                          Dr. {doctor.full_name} - {doctor.specialization}
                        </option>
                      ))}
                    </select>
                    {doctors.length === 0 && (
                      <p className="text-sm text-red-600 mt-1">No doctors available in your hospital</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Scheduled Date *
                    </label>
                    <input
                      type="date"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Scheduled Time *
                    </label>
                    <input
                      type="time"
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Admin Notes (Optional)
                    </label>
                    <textarea
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="Add any special instructions or notes..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <button
                    onClick={handleAssignDoctor}
                    disabled={assigning || !selectedDoctor || !scheduledDate || !scheduledTime}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {assigning ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Assigning...
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5" />
                        Assign Doctor & Notify Patient
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Actions</h2>
              
              <div className="space-y-3">
                <button
                  onClick={() => navigate(`/admin/chat?user=${appointment.patient_id}`)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  <Mail className="w-5 h-5" />
                  Message Patient
                </button>

                {appointment.status !== 'cancelled' && appointment.status !== 'completed' && (
                  <button
                    onClick={handleCancelAppointment}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                  >
                    <XCircle className="w-5 h-5" />
                    Cancel Appointment
                  </button>
                )}
              </div>
            </div>

            {/* Metadata */}
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs text-gray-600">
                Created: {new Date(appointment.created_at).toLocaleString()}
              </p>
              {appointment.updated_at && (
                <p className="text-xs text-gray-600 mt-1">
                  Updated: {new Date(appointment.updated_at).toLocaleString()}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAppointmentDetailPage;