import { useState, useEffect } from 'react';
import { 
  User, Droplet, Phone, Calendar, Mail, MapPin, Heart, Activity,
  FileText, Pill, AlertCircle, Shield, Clock, Hospital, Download,
  Eye, Stethoscope
} from 'lucide-react';

const PublicScanPage = () => {
  const patientId = window.location.pathname.split('/scan/')[1];
  
  const [healthData, setHealthData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const VITE_API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

  useEffect(() => {
    if (patientId) {
      fetchHealthData();
    } else {
      setError('Invalid QR code - No patient ID found');
      setLoading(false);
    }
  }, [patientId]);

  const fetchHealthData = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${VITE_API_BASE_URL}/api/v1/public/patient/${patientId}/health-card`
      );
      
      if (response.ok) {
        const data = await response.json();
        setHealthData(data);
      } else {
        setError('Patient not found or QR code invalid');
      }
    } catch (error) {
      console.error('Error fetching health data:', error);
      setError('Failed to load health information');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Health Information...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
          <AlertCircle className="text-red-500 mx-auto mb-4" size={64} />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">QR Code Error</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!healthData) return null;

  const { patient, latest_vitals, active_medications, prescriptions, appointment_history, summary } = healthData;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border-l-4 border-blue-600">
          <div className="flex items-start space-x-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <Shield className="text-white" size={32} />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">🏥 Digital Health Card</h1>
              <p className="text-gray-600">Emergency Access - Patient Health Information</p>
              <div className="mt-3 flex items-center space-x-2 text-sm text-blue-600">
                <Clock size={16} />
                <span>Scanned: {new Date().toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Patient Information */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="text-blue-600" size={24} />
              </div>
              <h2 className="text-2xl font-bold text-gray-800">Patient Information</h2>
            </div>

            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-2xl font-bold text-gray-800 mb-1">{patient.name}</h3>
                <p className="text-gray-600">{patient.email}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2 text-gray-700">
                  <Droplet className="text-red-600" size={20} />
                  <div>
                    <p className="text-xs text-gray-500">Blood Group</p>
                    <p className="font-bold text-lg text-red-600">{patient.blood_group || 'N/A'}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 text-gray-700">
                  <Calendar className="text-blue-600" size={20} />
                  <div>
                    <p className="text-xs text-gray-500">Date of Birth</p>
                    <p className="font-semibold">{patient.date_of_birth || 'N/A'}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 text-gray-700">
                  <Phone className="text-green-600" size={20} />
                  <div>
                    <p className="text-xs text-gray-500">Phone</p>
                    <p className="font-semibold">{patient.phone || 'N/A'}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 text-gray-700">
                  <User className="text-purple-600" size={20} />
                  <div>
                    <p className="text-xs text-gray-500">Gender</p>
                    <p className="font-semibold">{patient.gender || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {patient.address && (
                <div className="flex items-start space-x-2 text-gray-700 bg-gray-50 p-3 rounded-lg">
                  <MapPin className="text-gray-600 mt-1" size={20} />
                  <div>
                    <p className="text-xs text-gray-500">Address</p>
                    <p className="font-semibold">{patient.address}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Emergency Contact */}
          {patient.emergency_contact && (
            <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-xl shadow-lg p-6 border-2 border-red-300">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center">
                  <AlertCircle className="text-white" size={24} />
                </div>
                <h2 className="text-2xl font-bold text-red-800">Emergency Contact</h2>
              </div>

              <div className="space-y-3">
                <div className="bg-white p-3 rounded-lg">
                  <p className="text-sm text-gray-600">Name</p>
                  <p className="font-bold text-gray-800">{patient.emergency_contact.name}</p>
                </div>

                <div className="bg-white p-3 rounded-lg">
                  <p className="text-sm text-gray-600">Relationship</p>
                  <p className="font-bold text-gray-800">{patient.emergency_contact.relationship}</p>
                </div>

                <div className="bg-white p-3 rounded-lg">
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="font-bold text-red-600 text-xl">{patient.emergency_contact.phone}</p>
                </div>
              </div>
            </div>
          )}

          {/* Latest Vitals */}
          {latest_vitals && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Activity className="text-green-600" size={24} />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Latest Vitals</h2>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {latest_vitals.heart_rate && (
                  <div className="bg-red-50 p-4 rounded-lg text-center">
                    <Heart className="text-red-600 mx-auto mb-2" size={24} />
                    <p className="text-2xl font-bold text-red-600">{latest_vitals.heart_rate}</p>
                    <p className="text-sm text-gray-600">bpm</p>
                  </div>
                )}

                {latest_vitals.blood_pressure_systolic && (
                  <div className="bg-blue-50 p-4 rounded-lg text-center">
                    <Activity className="text-blue-600 mx-auto mb-2" size={24} />
                    <p className="text-2xl font-bold text-blue-600">
                      {latest_vitals.blood_pressure_systolic}/{latest_vitals.blood_pressure_diastolic}
                    </p>
                    <p className="text-sm text-gray-600">mmHg</p>
                  </div>
                )}

                {latest_vitals.temperature && (
                  <div className="bg-orange-50 p-4 rounded-lg text-center">
                    <Activity className="text-orange-600 mx-auto mb-2" size={24} />
                    <p className="text-2xl font-bold text-orange-600">{latest_vitals.temperature}°</p>
                    <p className="text-sm text-gray-600">Fahrenheit</p>
                  </div>
                )}

                {latest_vitals.weight && (
                  <div className="bg-purple-50 p-4 rounded-lg text-center">
                    <Activity className="text-purple-600 mx-auto mb-2" size={24} />
                    <p className="text-2xl font-bold text-purple-600">{latest_vitals.weight}</p>
                    <p className="text-sm text-gray-600">kg</p>
                  </div>
                )}
              </div>

              <p className="text-xs text-gray-500 text-center mt-4">
                Recorded: {new Date(latest_vitals.recorded_at).toLocaleString()}
              </p>
            </div>
          )}

          {/* Active Medications */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Pill className="text-purple-600" size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Active Medications</h2>
                <p className="text-sm text-gray-600">{active_medications.length} medication(s)</p>
              </div>
            </div>

            {active_medications.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {active_medications.map((med, index) => (
                  <div key={index} className="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-600">
                    <h3 className="font-bold text-gray-800">{med.medication_name}</h3>
                    <p className="text-sm text-gray-600">Dosage: {med.dosage}</p>
                    <p className="text-sm text-gray-600">Frequency: {med.frequency}</p>
                    {med.instructions && (
                      <p className="text-xs text-gray-500 mt-2 italic">{med.instructions}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No active medications</p>
            )}
          </div>
        </div>

        {/* Prescriptions Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 mt-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
              <FileText className="text-indigo-600" size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Prescriptions</h2>
              <p className="text-sm text-gray-600">
                {summary.total_prescriptions} prescription(s) on file
              </p>
            </div>
          </div>

          {prescriptions && prescriptions.length > 0 ? (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {prescriptions.map((presc, index) => (
                <div key={index} className="bg-indigo-50 p-4 rounded-lg border-l-4 border-indigo-600">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <Stethoscope className="text-indigo-600" size={18} />
                        <h3 className="font-bold text-gray-800">
                          {presc.doctor_name || 'Doctor Name Not Available'}
                        </h3>
                      </div>
                      <p className="text-sm text-gray-600">
                        Date: {presc.date_prescribed || new Date(presc.uploaded_at).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-gray-500">
                        Uploaded: {new Date(presc.uploaded_at).toLocaleString()}
                      </p>
                    </div>
                    
                    {presc.ai_processed && (
                      <span className="bg-green-100 text-green-700 text-xs px-3 py-1 rounded-full font-semibold">
                        AI Processed
                      </span>
                    )}
                  </div>

                  {presc.summary && (
                    <div className="bg-white p-3 rounded-lg mb-3">
                      <p className="text-xs text-gray-500 mb-1">AI Summary:</p>
                      <p className="text-sm text-gray-700">{presc.summary}</p>
                    </div>
                  )}

                  {presc.medications && presc.medications.length > 0 && (
                    <div className="bg-white p-3 rounded-lg mb-3">
                      <p className="text-xs text-gray-500 mb-2">Medications:</p>
                      <div className="space-y-2">
                        {presc.medications.map((med, medIdx) => (
                          <div key={medIdx} className="text-sm">
                            <span className="font-semibold text-gray-800">{med.name}</span>
                            {' - '}
                            <span className="text-gray-600">{med.dosage}</span>
                            {' - '}
                            <span className="text-gray-600">{med.frequency}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {presc.notes && (
                    <div className="bg-white p-3 rounded-lg mb-3">
                      <p className="text-xs text-gray-500 mb-1">Notes:</p>
                      <p className="text-sm text-gray-700 italic">{presc.notes}</p>
                    </div>
                  )}

                  <div className="flex space-x-2 mt-3">
                    <a
                      href={presc.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition text-sm"
                    >
                      <Eye size={16} />
                      <span>View</span>
                    </a>
                    <a
                      href={presc.file_url}
                      download
                      className="flex items-center space-x-1 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition text-sm"
                    >
                      <Download size={16} />
                      <span>Download</span>
                    </a>
                    <span className="text-xs text-gray-500 px-3 py-2 bg-gray-100 rounded-lg">
                      {presc.file_type === 'application/pdf' ? 'PDF' : 'Image'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No prescriptions uploaded</p>
          )}
        </div>

        {/* Appointment History */}
        <div className="bg-white rounded-xl shadow-lg p-6 mt-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Hospital className="text-blue-600" size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Recent Appointments</h2>
              <p className="text-sm text-gray-600">
                {summary.total_appointments} total appointments
                {summary.google_hospital_visits > 0 &&
                  ` • ${summary.google_hospital_visits} at Google-listed hospitals`
                }
              </p>
            </div>
          </div>

          {appointment_history.length > 0 ? (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {appointment_history.slice(0, 10).map((apt, index) => (
                <div key={index} className="bg-gray-50 p-4 rounded-lg border-l-4 border-blue-600">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-bold text-gray-800">{apt.hospital_name}</h3>
                      {apt.hospital_details && (
                        <p className="text-sm text-gray-600">
                          {apt.hospital_details.address}
                          {apt.hospital_details.is_google_hospital && (
                            <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                              Google Hospital
                            </span>
                          )}
                        </p>
                      )}
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      apt.status === 'completed' ? 'bg-green-100 text-green-700' :
                      apt.status === 'confirmed' ? 'bg-blue-100 text-blue-700' :
                      apt.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {apt.status}
                    </span>
                  </div>

                  {apt.doctor_name && (
                    <p className="text-sm text-gray-700">Doctor: {apt.doctor_name}</p>
                  )}

                  <p className="text-xs text-gray-500 mt-2">
                    {apt.scheduled_date ? `Scheduled: ${apt.scheduled_date}` :
                     `Created: ${new Date(apt.created_at).toLocaleDateString()}`}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No appointment history</p>
          )}
        </div>

        {/* Security Footer */}
        <div className="mt-6 bg-yellow-50 border-2 border-yellow-300 rounded-xl p-6">
          <div className="flex items-start space-x-3">
            <Shield className="text-yellow-600 mt-1 flex-shrink-0" size={24} />
            <div>
              <h3 className="font-bold text-yellow-800 mb-2">⚠️ Medical Professional Notice</h3>
              <p className="text-sm text-yellow-700">
                This health information is provided for emergency medical care purposes only.
                Access is logged for security. Always verify patient identity and obtain consent
                when possible. This QR code works with ANY hospital - database-registered or
                Google Maps-listed facilities.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicScanPage;