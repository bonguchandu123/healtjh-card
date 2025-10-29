import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  ArrowLeft, User, Mail, Phone, Calendar, MapPin, Droplet,
  FileText, Pill, Activity, Heart, TrendingUp, AlertCircle,
  Download, Eye, Clock, ThermometerSun
} from 'lucide-react';

const PatientDetailPage = ({ patientId, onBack }) => {
  const { token } = useAuth();
  const [patientData, setPatientData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
   const VITE_API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

  useEffect(() => {
    if (patientId) {
      fetchPatientDetails();
    }
  }, [patientId]);

  const fetchPatientDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `${VITE_API_BASE_URL}/api/v1/doctor/patient/${patientId}/details`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Access denied to this patient\'s records');
        }
        throw new Error('Failed to fetch patient details');
      }

      const data = await response.json();
      setPatientData(data);

    } catch (err) {
      console.error('Fetch patient details error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-purple-100 text-purple-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return styles[status] || 'bg-gray-100 text-gray-800';
  };

  const OverviewTab = () => (
    <div className="space-y-6">
      {/* Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white">
          <FileText className="w-8 h-8 mb-3 opacity-80" />
          <p className="text-3xl font-bold mb-1">{patientData?.prescriptions?.length || 0}</p>
          <p className="text-blue-100">Total Prescriptions</p>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white">
          <Pill className="w-8 h-8 mb-3 opacity-80" />
          <p className="text-3xl font-bold mb-1">{patientData?.active_medications?.length || 0}</p>
          <p className="text-green-100">Active Medications</p>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-6 text-white">
          <Calendar className="w-8 h-8 mb-3 opacity-80" />
          <p className="text-3xl font-bold mb-1">{patientData?.appointment_history?.length || 0}</p>
          <p className="text-purple-100">Total Appointments</p>
        </div>
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-6 text-white">
          <Activity className="w-8 h-8 mb-3 opacity-80" />
          <p className="text-3xl font-bold mb-1">{patientData?.vitals?.length || 0}</p>
          <p className="text-orange-100">Vitals Records</p>
        </div>
      </div>

      {/* Emergency Contact */}
      {patientData?.patient?.emergency_contact && (
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-red-800 mb-4 flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            Emergency Contact
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">Name</p>
              <p className="font-semibold text-gray-800">{patientData.patient.emergency_contact.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Relationship</p>
              <p className="font-semibold text-gray-800">{patientData.patient.emergency_contact.relationship}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Phone Number</p>
              <p className="font-semibold text-gray-800">{patientData.patient.emergency_contact.phone}</p>
            </div>
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Activity</h3>
        <div className="space-y-4">
          {patientData?.appointment_history?.slice(0, 3).map((apt, index) => (
            <div key={index} className="flex items-start space-x-4 pb-4 border-b border-gray-100 last:border-0">
              <div className="flex-shrink-0">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  apt.status === 'completed' ? 'bg-green-100' : 'bg-blue-100'
                }`}>
                  <Calendar className={`w-5 h-5 ${
                    apt.status === 'completed' ? 'text-green-600' : 'text-blue-600'
                  }`} />
                </div>
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-800">{apt.reason_for_visit || apt.appointment_type}</p>
                <p className="text-sm text-gray-600">
                  {apt.scheduled_date || apt.preferred_date} at {apt.scheduled_time || apt.preferred_time}
                </p>
                {apt.symptoms && (
                  <p className="text-sm text-gray-500 mt-1">{apt.symptoms}</p>
                )}
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(apt.status)}`}>
                {apt.status.toUpperCase()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const PrescriptionsTab = () => (
    <div className="space-y-4">
      {patientData?.prescriptions && patientData.prescriptions.length > 0 ? (
        patientData.prescriptions.map((prescription, index) => (
          <div key={index} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start space-x-3">
                <FileText className="w-6 h-6 text-blue-600 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-800">{prescription.file_name}</h3>
                  <p className="text-sm text-gray-600">
                    Uploaded: {new Date(prescription.uploaded_at).toLocaleDateString()}
                  </p>
                  {prescription.doctor_name && (
                    <p className="text-sm text-gray-600">Doctor: {prescription.doctor_name}</p>
                  )}
                </div>
              </div>
              {prescription.file_url && (
                <a
                  href={prescription.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                >
                  <Eye className="w-4 h-4" />
                  <span>View</span>
                </a>
              )}
            </div>

            {prescription.summary && (
              <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-gray-700 mb-1">Summary:</p>
                <p className="text-sm text-gray-800">{prescription.summary}</p>
              </div>
            )}

            {prescription.medications && prescription.medications.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-3">Medications:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {prescription.medications.map((med, idx) => (
                    <div key={idx} className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <p className="font-semibold text-gray-800 mb-1">{med.name}</p>
                      <p className="text-sm text-gray-600">{med.dosage}</p>
                      <p className="text-sm text-gray-600">{med.frequency}</p>
                      {med.duration && (
                        <p className="text-sm text-gray-500">Duration: {med.duration}</p>
                      )}
                      {med.instructions && (
                        <p className="text-xs text-gray-500 mt-1">{med.instructions}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {prescription.extracted_text && (
              <div className="mt-4">
                <details className="cursor-pointer">
                  <summary className="text-sm font-medium text-gray-700">View Extracted Text</summary>
                  <div className="mt-2 p-3 bg-gray-50 rounded text-sm text-gray-700 whitespace-pre-wrap">
                    {prescription.extracted_text}
                  </div>
                </details>
              </div>
            )}
          </div>
        ))
      ) : (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600">No prescriptions available</p>
        </div>
      )}
    </div>
  );

  const MedicationsTab = () => (
    <div>
      {patientData?.active_medications && patientData.active_medications.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {patientData.active_medications.map((med, index) => (
            <div key={index} className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-1">{med.medication_name}</h3>
                  <p className="text-sm text-gray-600">{med.dosage}</p>
                </div>
                <Pill className="w-6 h-6 text-green-600" />
              </div>

              <div className="space-y-2">
                <div className="flex items-center text-sm text-gray-600">
                  <Clock className="w-4 h-4 mr-2" />
                  <span>{med.frequency}</span>
                </div>
                {med.times && med.times.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Times:</p>
                    <div className="flex flex-wrap gap-2">
                      {med.times.map((time, idx) => (
                        <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                          {time}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {med.duration_days && (
                  <p className="text-sm text-gray-600">Duration: {med.duration_days} days</p>
                )}
                {med.instructions && (
                  <div className="mt-3 p-3 bg-yellow-50 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Instructions:</p>
                    <p className="text-sm text-gray-700">{med.instructions}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <Pill className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600">No active medications</p>
        </div>
      )}
    </div>
  );

  const VitalsTab = () => (
    <div className="space-y-4">
      {patientData?.vitals && patientData.vitals.length > 0 ? (
        patientData.vitals.map((vital, index) => (
          <div key={index} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Activity className="w-5 h-5 text-orange-600" />
                <h3 className="text-lg font-semibold text-gray-800">
                  {new Date(vital.recorded_at).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </h3>
              </div>
              <span className="text-sm text-gray-500">
                {new Date(vital.recorded_at).toLocaleTimeString()}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {vital.heart_rate && (
                <div className="bg-red-50 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <Heart className="w-5 h-5 text-red-600 mr-2" />
                    <p className="text-sm text-gray-600">Heart Rate</p>
                  </div>
                  <p className="text-2xl font-bold text-gray-800">{vital.heart_rate}</p>
                  <p className="text-xs text-gray-500">bpm</p>
                </div>
              )}

              {vital.blood_pressure_systolic && vital.blood_pressure_diastolic && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <Activity className="w-5 h-5 text-blue-600 mr-2" />
                    <p className="text-sm text-gray-600">Blood Pressure</p>
                  </div>
                  <p className="text-2xl font-bold text-gray-800">
                    {vital.blood_pressure_systolic}/{vital.blood_pressure_diastolic}
                  </p>
                  <p className="text-xs text-gray-500">mmHg</p>
                </div>
              )}

              {vital.temperature && (
                <div className="bg-orange-50 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <ThermometerSun className="w-5 h-5 text-orange-600 mr-2" />
                    <p className="text-sm text-gray-600">Temperature</p>
                  </div>
                  <p className="text-2xl font-bold text-gray-800">{vital.temperature}</p>
                  <p className="text-xs text-gray-500">°F</p>
                </div>
              )}

              {vital.weight && (
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <TrendingUp className="w-5 h-5 text-green-600 mr-2" />
                    <p className="text-sm text-gray-600">Weight</p>
                  </div>
                  <p className="text-2xl font-bold text-gray-800">{vital.weight}</p>
                  <p className="text-xs text-gray-500">kg</p>
                </div>
              )}

              {vital.oxygen_saturation && (
                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <Activity className="w-5 h-5 text-purple-600 mr-2" />
                    <p className="text-sm text-gray-600">O₂ Saturation</p>
                  </div>
                  <p className="text-2xl font-bold text-gray-800">{vital.oxygen_saturation}</p>
                  <p className="text-xs text-gray-500">%</p>
                </div>
              )}

              {vital.blood_sugar && (
                <div className="bg-yellow-50 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <Droplet className="w-5 h-5 text-yellow-600 mr-2" />
                    <p className="text-sm text-gray-600">Blood Sugar</p>
                  </div>
                  <p className="text-2xl font-bold text-gray-800">{vital.blood_sugar}</p>
                  <p className="text-xs text-gray-500">mg/dL</p>
                </div>
              )}

              {vital.steps && (
                <div className="bg-indigo-50 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <Activity className="w-5 h-5 text-indigo-600 mr-2" />
                    <p className="text-sm text-gray-600">Steps</p>
                  </div>
                  <p className="text-2xl font-bold text-gray-800">{vital.steps}</p>
                  <p className="text-xs text-gray-500">steps</p>
                </div>
              )}

              {vital.sleep_hours && (
                <div className="bg-cyan-50 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <Clock className="w-5 h-5 text-cyan-600 mr-2" />
                    <p className="text-sm text-gray-600">Sleep</p>
                  </div>
                  <p className="text-2xl font-bold text-gray-800">{vital.sleep_hours}</p>
                  <p className="text-xs text-gray-500">hours</p>
                </div>
              )}
            </div>

            {vital.notes && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">{vital.notes}</p>
              </div>
            )}
          </div>
        ))
      ) : (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <Activity className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600">No vitals recorded</p>
        </div>
      )}
    </div>
  );

  const AppointmentsTab = () => (
    <div className="space-y-4">
      {patientData?.appointment_history && patientData.appointment_history.length > 0 ? (
        patientData.appointment_history.map((apt, index) => (
          <div key={index} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-1">
                  {apt.reason_for_visit || apt.appointment_type}
                </h3>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    <span>{apt.scheduled_date || apt.preferred_date}</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    <span>{apt.scheduled_time || apt.preferred_time}</span>
                  </div>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(apt.status)}`}>
                {apt.status.toUpperCase()}
              </span>
            </div>

            {apt.symptoms && (
              <div className="mb-3 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Symptoms:</p>
                <p className="text-sm text-gray-800">{apt.symptoms}</p>
              </div>
            )}

            {apt.doctor_notes && (
              <div className="p-3 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Doctor's Notes:</p>
                <p className="text-sm text-gray-800">{apt.doctor_notes}</p>
              </div>
            )}
          </div>
        ))
      ) : (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600">No appointment history</p>
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading patient details...</p>
        </div>
      </div>
    );
  }

  if (error || !patientData) {
    return (
      <div className="flex items-center justify-center min-h-screen p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h3 className="text-red-800 font-semibold mb-2">Error</h3>
          <p className="text-red-600 text-sm mb-4">{error || 'Patient data not found'}</p>
          <button
            onClick={onBack}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Back to Patients
          </button>
        </div>
      </div>
    );
  }

  const patient = patientData.patient;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <button
          onClick={onBack}
          className="flex items-center text-blue-600 hover:text-blue-700 mb-6"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Patients
        </button>

        {/* Patient Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">{patient.full_name}</h1>
                <div className="flex items-center space-x-4 mt-2 text-gray-600">
                  <div className="flex items-center">
                    <Mail className="w-4 h-4 mr-1" />
                    <span className="text-sm">{patient.email}</span>
                  </div>
                  {patient.phone_number && (
                    <div className="flex items-center">
                      <Phone className="w-4 h-4 mr-1" />
                      <span className="text-sm">{patient.phone_number}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="text-right">
              {patient.blood_group && (
                <div className="mb-2">
                  <span className="px-4 py-2 bg-red-100 text-red-800 rounded-lg font-semibold">
                    {patient.blood_group}
                  </span>
                </div>
              )}
              <div className="text-sm text-gray-600">
                {patient.gender && <p>Gender: {patient.gender}</p>}
                {patient.date_of_birth && <p>DOB: {patient.date_of_birth}</p>}
              </div>
            </div>
          </div>

          {patient.address && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center text-gray-600">
                <MapPin className="w-4 h-4 mr-2" />
                <span className="text-sm">{patient.address}</span>
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="flex border-b border-gray-200 overflow-x-auto">
            {[
              { id: 'overview', label: 'Overview', icon: Activity },
              { id: 'prescriptions', label: 'Prescriptions', icon: FileText },
              { id: 'medications', label: 'Medications', icon: Pill },
              { id: 'vitals', label: 'Vitals', icon: Heart },
              { id: 'appointments', label: 'Appointments', icon: Calendar }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-6 py-4 font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'overview' && <OverviewTab />}
          {activeTab === 'prescriptions' && <PrescriptionsTab />}
          {activeTab === 'medications' && <MedicationsTab />}
          {activeTab === 'vitals' && <VitalsTab />}
          {activeTab === 'appointments' && <AppointmentsTab />}
        </div>
      </div>
    </div>
  );
};

export default PatientDetailPage;