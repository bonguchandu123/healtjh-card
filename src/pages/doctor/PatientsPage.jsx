import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  Search, User, Mail, Phone, Calendar, Activity, 
  FileText, Eye, TrendingUp, AlertCircle, Pill
} from 'lucide-react';

const PatientsPage = () => {
  const { token } = useAuth();
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientDetails, setPatientDetails] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    filterPatients();
  }, [patients, searchQuery]);

 const fetchPatients = async () => {
  try {
    setLoading(true);
    setError(null);

    // Fetch all appointments to extract unique patients (max limit is 100)
    const response = await fetch('http://localhost:8000/api/v1/doctor/appointments?limit=100', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) throw new Error('Failed to fetch patients');

    const appointments = await response.json();
    
    // Extract unique patients from appointments
    const patientsMap = new Map();
    appointments.forEach(apt => {
      if (!patientsMap.has(apt.patient_id)) {
        patientsMap.set(apt.patient_id, {
          id: apt.patient_id,
          name: apt.patient_name,
          email: apt.patient_email,
          phone: apt.patient_phone,
          appointments: []
        });
      }
      patientsMap.get(apt.patient_id).appointments.push(apt);
    });

    const uniquePatients = Array.from(patientsMap.values());
    setPatients(uniquePatients);

  } catch (err) {
    console.error('Fetch patients error:', err);
    setError(err.message);
  } finally {
    setLoading(false);
  }
};
  const filterPatients = () => {
    if (!searchQuery.trim()) {
      setFilteredPatients(patients);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = patients.filter(patient =>
      patient.name?.toLowerCase().includes(query) ||
      patient.email?.toLowerCase().includes(query) ||
      patient.phone?.toLowerCase().includes(query)
    );
    setFilteredPatients(filtered);
  };

  const fetchPatientDetails = async (patientId) => {
    try {
      setLoadingDetails(true);

      const response = await fetch(
        `http://localhost:8000/api/v1/doctor/patient/${patientId}/details`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) throw new Error('Failed to fetch patient details');

      const data = await response.json();
      setPatientDetails(data);

    } catch (err) {
      console.error('Fetch patient details error:', err);
      alert('Failed to load patient details');
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleViewPatient = async (patient) => {
    setSelectedPatient(patient);
    setShowModal(true);
    await fetchPatientDetails(patient.id);
  };

  const PatientCard = ({ patient }) => {
    const lastAppointment = patient.appointments.sort((a, b) => 
      new Date(b.created_at) - new Date(a.created_at)
    )[0];

    const completedCount = patient.appointments.filter(apt => apt.status === 'completed').length;

    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">{patient.name}</h3>
              <p className="text-sm text-gray-600">{patient.email}</p>
            </div>
          </div>
          
          <button
            onClick={() => handleViewPatient(patient)}
            className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
          >
            View Details
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center text-sm text-gray-600">
            <Phone className="w-4 h-4 mr-2 text-gray-400" />
            <span>{patient.phone || 'N/A'}</span>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <Calendar className="w-4 h-4 mr-2 text-gray-400" />
            <span>{patient.appointments.length} visits</span>
          </div>
        </div>

        {lastAppointment && (
          <div className="pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-500 mb-1">Last Visit</p>
            <p className="text-sm text-gray-700">
              {lastAppointment.scheduled_date || lastAppointment.preferred_date} - {lastAppointment.reason_for_visit || 'General Checkup'}
            </p>
          </div>
        )}

        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="text-xs text-gray-600">
              <span className="font-semibold text-green-600">{completedCount}</span> completed
            </span>
            <span className="text-xs text-gray-600">
              <span className="font-semibold text-blue-600">{patient.appointments.length}</span> total
            </span>
          </div>
        </div>
      </div>
    );
  };

  const PatientDetailsModal = () => {
    if (!selectedPatient) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
        <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white p-6 border-b border-gray-200 flex items-center justify-between z-10">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">{selectedPatient.name}</h2>
                <p className="text-sm text-gray-600">{selectedPatient.email}</p>
              </div>
            </div>
            <button
              onClick={() => {
                setShowModal(false);
                setSelectedPatient(null);
                setPatientDetails(null);
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          {loadingDetails ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading patient details...</p>
            </div>
          ) : patientDetails ? (
            <div className="p-6 space-y-6">
              {/* Patient Basic Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Basic Information</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-medium text-gray-800">{patientDetails.patient?.phone_number || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Blood Group</p>
                    <p className="font-medium text-gray-800">{patientDetails.patient?.blood_group || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Gender</p>
                    <p className="font-medium text-gray-800">{patientDetails.patient?.gender || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Date of Birth</p>
                    <p className="font-medium text-gray-800">{patientDetails.patient?.date_of_birth || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Emergency Contact */}
              {patientDetails.patient?.emergency_contact && (
                <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                  <h3 className="text-lg font-semibold text-red-800 mb-3 flex items-center">
                    <AlertCircle className="w-5 h-5 mr-2" />
                    Emergency Contact
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Name</p>
                      <p className="font-medium text-gray-800">{patientDetails.patient.emergency_contact.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Relationship</p>
                      <p className="font-medium text-gray-800">{patientDetails.patient.emergency_contact.relationship}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm text-gray-600">Phone</p>
                      <p className="font-medium text-gray-800">{patientDetails.patient.emergency_contact.phone}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Statistics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <FileText className="w-8 h-8 text-blue-600 mb-2" />
                  <p className="text-2xl font-bold text-gray-800">{patientDetails.prescriptions?.length || 0}</p>
                  <p className="text-sm text-gray-600">Prescriptions</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <Pill className="w-8 h-8 text-green-600 mb-2" />
                  <p className="text-2xl font-bold text-gray-800">{patientDetails.active_medications?.length || 0}</p>
                  <p className="text-sm text-gray-600">Active Meds</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <Calendar className="w-8 h-8 text-purple-600 mb-2" />
                  <p className="text-2xl font-bold text-gray-800">{patientDetails.appointment_history?.length || 0}</p>
                  <p className="text-sm text-gray-600">Appointments</p>
                </div>
                <div className="bg-orange-50 rounded-lg p-4">
                  <Activity className="w-8 h-8 text-orange-600 mb-2" />
                  <p className="text-2xl font-bold text-gray-800">{patientDetails.vitals?.length || 0}</p>
                  <p className="text-sm text-gray-600">Vitals Records</p>
                </div>
              </div>

              {/* Recent Prescriptions */}
              {patientDetails.prescriptions && patientDetails.prescriptions.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Recent Prescriptions</h3>
                  <div className="space-y-3">
                    {patientDetails.prescriptions.slice(0, 3).map((prescription, index) => (
                      <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-medium text-gray-800">{prescription.file_name}</p>
                          <span className="text-xs text-gray-500">
                            {new Date(prescription.uploaded_at).toLocaleDateString()}
                          </span>
                        </div>
                        {prescription.summary && (
                          <p className="text-sm text-gray-600 line-clamp-2">{prescription.summary}</p>
                        )}
                        {prescription.medications && prescription.medications.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs text-gray-500 mb-1">Medications:</p>
                            <div className="flex flex-wrap gap-2">
                              {prescription.medications.slice(0, 3).map((med, idx) => (
                                <span key={idx} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                  {med.name}
                                </span>
                              ))}
                              {prescription.medications.length > 3 && (
                                <span className="text-xs text-gray-500">+{prescription.medications.length - 3} more</span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Active Medications */}
              {patientDetails.active_medications && patientDetails.active_medications.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                    <Pill className="w-5 h-5 mr-2 text-green-600" />
                    Active Medications
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {patientDetails.active_medications.map((med, index) => (
                      <div key={index} className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <p className="font-semibold text-gray-800 mb-1">{med.medication_name}</p>
                        <p className="text-sm text-gray-600 mb-2">{med.dosage} - {med.frequency}</p>
                        {med.instructions && (
                          <p className="text-xs text-gray-500">{med.instructions}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Vitals */}
              {patientDetails.vitals && patientDetails.vitals.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                    <Activity className="w-5 h-5 mr-2 text-orange-600" />
                    Recent Vitals
                  </h3>
                  <div className="space-y-3">
                    {patientDetails.vitals.slice(0, 3).map((vital, index) => (
                      <div key={index} className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-medium text-gray-800">
                            {new Date(vital.recorded_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                          {vital.heart_rate && (
                            <div>
                              <p className="text-gray-500">Heart Rate</p>
                              <p className="font-semibold">{vital.heart_rate} bpm</p>
                            </div>
                          )}
                          {vital.blood_pressure_systolic && (
                            <div>
                              <p className="text-gray-500">BP</p>
                              <p className="font-semibold">{vital.blood_pressure_systolic}/{vital.blood_pressure_diastolic}</p>
                            </div>
                          )}
                          {vital.temperature && (
                            <div>
                              <p className="text-gray-500">Temperature</p>
                              <p className="font-semibold">{vital.temperature}°F</p>
                            </div>
                          )}
                          {vital.weight && (
                            <div>
                              <p className="text-gray-500">Weight</p>
                              <p className="font-semibold">{vital.weight} kg</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Appointment History */}
              {patientDetails.appointment_history && patientDetails.appointment_history.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Appointment History</h3>
                  <div className="space-y-2">
                    {patientDetails.appointment_history.slice(0, 5).map((apt, index) => (
                      <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-3 flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-800">{apt.reason_for_visit || apt.appointment_type}</p>
                          <p className="text-sm text-gray-600">
                            {apt.scheduled_date || apt.preferred_date} at {apt.scheduled_time || apt.preferred_time}
                          </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          apt.status === 'completed' ? 'bg-green-100 text-green-800' :
                          apt.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {apt.status.toUpperCase()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-12 text-center">
              <p className="text-gray-600">No details available</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading patients...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">My Patients</h1>
          <p className="text-gray-600">View and manage your patient records</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search patients by name, email, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        <div className="mb-4">
          <p className="text-gray-600">
            Showing {filteredPatients.length} of {patients.length} patients
          </p>
        </div>

        {filteredPatients.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">No patients found</p>
            <p className="text-sm text-gray-500">
              {searchQuery ? 'Try a different search term' : 'Patients will appear here after appointments'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPatients.map((patient) => (
              <PatientCard key={patient.id} patient={patient} />
            ))}
          </div>
        )}

        {showModal && <PatientDetailsModal />}
      </div>
    </div>
  );
};

export default PatientsPage;