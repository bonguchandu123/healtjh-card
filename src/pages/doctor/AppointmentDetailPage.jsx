import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  ArrowLeft, Calendar, Clock, User, Phone, Mail, MapPin, 
  FileText, Pill, AlertCircle, Activity, CheckCircle, 
  XCircle, PlayCircle, Save, Eye
} from 'lucide-react';

const AppointmentDetailPage = ({ appointmentId, onBack }) => {
  const { token } = useAuth();
  
  const [appointment, setAppointment] = useState(null);
  const [patientDetails, setPatientDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [notes, setNotes] = useState('');
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [actionType, setActionType] = useState('');

  useEffect(() => {
    if (appointmentId) {
      fetchAppointmentDetails();
    }
  }, [appointmentId]);

  const fetchAppointmentDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const appointmentsResponse = await fetch(
        'http://localhost:8000/api/v1/doctor/appointments?limit=1000',
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!appointmentsResponse.ok) throw new Error('Failed to fetch appointment');

      const appointments = await appointmentsResponse.json();
      const foundAppointment = appointments.find(apt => apt.id === appointmentId);

      if (!foundAppointment) {
        throw new Error('Appointment not found');
      }

      setAppointment(foundAppointment);

      if (foundAppointment.patient_id) {
        const patientResponse = await fetch(
          `http://localhost:8000/api/v1/doctor/patient/${foundAppointment.patient_id}/details`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (patientResponse.ok) {
          const patientData = await patientResponse.json();
          setPatientDetails(patientData);
        }
      }

    } catch (err) {
      console.error('Fetch appointment error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateAppointmentStatus = async (newStatus, doctorNotes = '') => {
    try {
      setUpdating(true);
      setError(null);

      const url = `http://localhost:8000/api/v1/doctor/appointments/${appointmentId}/status?new_status=${newStatus}${doctorNotes ? `&notes=${encodeURIComponent(doctorNotes)}` : ''}`;

      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to update status');

      setSuccess(`Appointment ${newStatus} successfully!`);
      setShowNotesModal(false);
      setNotes('');
      
      await fetchAppointmentDetails();

      setTimeout(() => setSuccess(null), 3000);

    } catch (err) {
      console.error('Update status error:', err);
      setError(err.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleStatusAction = (status) => {
    setActionType(status);
    setShowNotesModal(true);
  };

  const confirmStatusUpdate = () => {
    updateAppointmentStatus(actionType, notes);
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      confirmed: 'bg-blue-100 text-blue-800 border-blue-300',
      in_progress: 'bg-purple-100 text-purple-800 border-purple-300',
      completed: 'bg-green-100 text-green-800 border-green-300',
      cancelled: 'bg-red-100 text-red-800 border-red-300'
    };
    return styles[status] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const NotesModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">
          {actionType === 'in_progress' ? 'Start Appointment' : 
           actionType === 'completed' ? 'Complete Appointment' : 
           'Update Status'}
        </h3>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Add Notes (Optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Enter any notes or observations..."
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => {
              setShowNotesModal(false);
              setNotes('');
            }}
            disabled={updating}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={confirmStatusUpdate}
            disabled={updating}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {updating ? 'Updating...' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading appointment details...</p>
        </div>
      </div>
    );
  }

  if (error || !appointment) {
    return (
      <div className="flex items-center justify-center min-h-screen p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h3 className="text-red-800 font-semibold mb-2">Error</h3>
          <p className="text-red-600 text-sm mb-4">{error || 'Appointment not found'}</p>
          <button
            onClick={onBack}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Back to Appointments
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <button
            onClick={onBack}
            className="flex items-center text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Appointments
          </button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Appointment Details</h1>
              <p className="text-gray-600">Complete information about this appointment</p>
            </div>
            
            <span className={`px-4 py-2 rounded-full text-sm font-medium border-2 ${getStatusBadge(appointment.status)}`}>
              {appointment.status.replace('_', ' ').toUpperCase()}
            </span>
          </div>
        </div>

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
            <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
            <span className="text-green-800">{success}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <User className="w-5 h-5 mr-2 text-blue-600" />
                Patient Information
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Full Name</p>
                  <p className="font-medium text-gray-800">{appointment.patient_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Email</p>
                  <p className="font-medium text-gray-800 flex items-center text-sm">
                    <Mail className="w-4 h-4 mr-1 text-gray-400" />
                    {appointment.patient_email}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Phone</p>
                  <p className="font-medium text-gray-800 flex items-center">
                    <Phone className="w-4 h-4 mr-1 text-gray-400" />
                    {appointment.patient_phone || 'Not provided'}
                  </p>
                </div>
                {patientDetails?.patient?.blood_group && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Blood Group</p>
                    <p className="font-medium text-gray-800">{patientDetails.patient.blood_group}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-blue-600" />
                Appointment Details
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Date</p>
                  <p className="font-medium text-gray-800 flex items-center">
                    <Calendar className="w-4 h-4 mr-1 text-gray-400" />
                    {appointment.scheduled_date || appointment.preferred_date}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Time</p>
                  <p className="font-medium text-gray-800 flex items-center">
                    <Clock className="w-4 h-4 mr-1 text-gray-400" />
                    {appointment.scheduled_time || appointment.preferred_time}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Appointment Type</p>
                  <p className="font-medium text-gray-800">{appointment.appointment_type}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Hospital</p>
                  <p className="font-medium text-gray-800 flex items-center text-sm">
                    <MapPin className="w-4 h-4 mr-1 text-gray-400" />
                    {appointment.hospital_name}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-blue-600" />
                Medical Information
              </h2>
              
              {appointment.symptoms && (
                <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-500 mb-2 font-medium">Symptoms</p>
                  <p className="text-gray-800">{appointment.symptoms}</p>
                </div>
              )}

              {appointment.reason_for_visit && (
                <div className="mb-4 p-4 bg-purple-50 rounded-lg">
                  <p className="text-sm text-gray-500 mb-2 font-medium">Reason for Visit</p>
                  <p className="text-gray-800">{appointment.reason_for_visit}</p>
                </div>
              )}

              {appointment.medical_history && (
                <div className="mb-4 p-4 bg-yellow-50 rounded-lg">
                  <p className="text-sm text-gray-500 mb-2 font-medium">Medical History</p>
                  <p className="text-gray-800">{appointment.medical_history}</p>
                </div>
              )}

              {appointment.current_medications && (
                <div className="mb-4 p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-gray-500 mb-2 font-medium flex items-center">
                    <Pill className="w-4 h-4 mr-1" />
                    Current Medications
                  </p>
                  <p className="text-gray-800">{appointment.current_medications}</p>
                </div>
              )}

              {appointment.allergies && (
                <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                  <p className="text-sm text-red-600 mb-2 font-medium flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    Allergies - IMPORTANT
                  </p>
                  <p className="text-red-800 font-medium">{appointment.allergies}</p>
                </div>
              )}
            </div>

            {appointment.doctor_notes && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Doctor's Notes</h2>
                <p className="text-gray-800 bg-blue-50 p-4 rounded-lg">{appointment.doctor_notes}</p>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
              
              <div className="space-y-3">
                {appointment.status === 'confirmed' && (
                  <button
                    onClick={() => handleStatusAction('in_progress')}
                    disabled={updating}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                  >
                    <PlayCircle className="w-5 h-5" />
                    <span>Start Appointment</span>
                  </button>
                )}

                {(appointment.status === 'confirmed' || appointment.status === 'in_progress') && (
                  <button
                    onClick={() => handleStatusAction('completed')}
                    disabled={updating}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    <CheckCircle className="w-5 h-5" />
                    <span>Complete</span>
                  </button>
                )}
              </div>
            </div>

            {patientDetails && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Patient Summary</h3>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">Prescriptions</span>
                    <span className="font-semibold text-gray-800">
                      {patientDetails.prescriptions?.length || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">Active Meds</span>
                    <span className="font-semibold text-gray-800">
                      {patientDetails.active_medications?.length || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">Past Visits</span>
                    <span className="font-semibold text-gray-800">
                      {patientDetails.appointment_history?.length || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Vitals</span>
                    <span className="font-semibold text-gray-800">
                      {patientDetails.vitals?.length || 0}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {showNotesModal && <NotesModal />}
      </div>
    </div>
  );
};

export default AppointmentDetailPage;