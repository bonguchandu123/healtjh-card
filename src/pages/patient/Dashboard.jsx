import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const DashboardPage = () => {
  const { user, api } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total_appointments: 0,
    upcoming_appointments: 0,
    total_prescriptions: 0,
    active_medications: 0,
  });
  const [recentAppointments, setRecentAppointments] = useState([]);
  const [recentPrescriptions, setRecentPrescriptions] = useState([]);
  const [latestVitals, setLatestVitals] = useState(null);
  const [upcomingMedications, setUpcomingMedications] = useState([]);
  const [healthTrends, setHealthTrends] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch all data in parallel
      const [
        appointmentsRes,
        prescriptionsRes,
        vitalsRes,
        medicationsRes,
        trendsRes,
      ] = await Promise.all([
        // GET /api/v1/patient/appointments
        api.get('/api/v1/patient/appointments?limit=5'),
        // GET /api/v1/patient/prescriptions
        api.get('/api/v1/patient/prescriptions?limit=5'),
        // GET /api/v1/vitals/latest
        api.get('/api/v1/vitals/latest').catch(() => ({ data: null })),
        // GET /api/v1/medications/reminders
        api.get('/api/v1/medications/reminders?active_only=true'),
        // GET /api/v1/analytics/patient-health-trends
        api.get('/api/v1/analytics/patient-health-trends?days=7').catch(() => ({ data: null })),
      ]);

      const appointments = appointmentsRes.data || [];
      const prescriptions = prescriptionsRes.data || [];
      const medications = medicationsRes.data || [];

      // Calculate stats manually (workaround for missing dashboard stats endpoint)
      const upcoming = appointments.filter(
        (apt) =>
          (apt.status === 'pending' || apt.status === 'confirmed') &&
          new Date(apt.scheduled_date || apt.created_at) >= new Date()
      );

      setStats({
        total_appointments: appointments.length,
        upcoming_appointments: upcoming.length,
        total_prescriptions: prescriptions.length,
        active_medications: medications.length,
      });

      setRecentAppointments(appointments.slice(0, 5));
      setRecentPrescriptions(prescriptions.slice(0, 4));
      setLatestVitals(vitalsRes.data);
      setUpcomingMedications(medications.slice(0, 4));
      setHealthTrends(trendsRes.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {getGreeting()}, {user?.full_name?.split(' ')[0]}! 👋
          </h1>
          <p className="text-gray-600 mt-1">Here's your health overview for today</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Appointments</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total_appointments}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <Link to="/patient/appointments" className="text-blue-600 text-sm font-medium mt-4 inline-block hover:underline">
              View all →
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Upcoming</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.upcoming_appointments}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <Link to="/patient/book-appointment" className="text-green-600 text-sm font-medium mt-4 inline-block hover:underline">
              Book new →
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Prescriptions</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total_prescriptions}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
            <Link to="/patient/prescriptions" className="text-purple-600 text-sm font-medium mt-4 inline-block hover:underline">
              View all →
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-orange-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Medications</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.active_medications}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              </div>
            </div>
            <Link to="/patient/medications" className="text-orange-600 text-sm font-medium mt-4 inline-block hover:underline">
              Manage →
            </Link>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - 2/3 width */}
          <div className="lg:col-span-2 space-y-8">
            {/* Recent Appointments */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">Recent Appointments</h2>
                  <Link to="/patient/appointments" className="text-blue-600 text-sm font-medium hover:underline">
                    View All
                  </Link>
                </div>
              </div>
              <div className="p-6">
                {recentAppointments.length === 0 ? (
                  <div className="text-center py-8">
                    <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-gray-500 mb-4">No appointments yet</p>
                    <Link to="/patient/book-appointment" className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                      Book Your First Appointment
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentAppointments.map((appointment) => (
                      <div key={appointment.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">
                              {appointment.doctor_name || appointment.hospital_name}
                            </p>
                            <p className="text-sm text-gray-600">
                              {formatDate(appointment.scheduled_date || appointment.preferred_date)}
                              {appointment.scheduled_time && ` at ${appointment.scheduled_time}`}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">{appointment.appointment_type}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                            {appointment.status}
                          </span>
                          <Link to={`/patient/appointments`} className="text-blue-600 hover:text-blue-700">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Recent Prescriptions */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">Recent Prescriptions</h2>
                  <Link to="/patient/prescriptions" className="text-blue-600 text-sm font-medium hover:underline">
                    View All
                  </Link>
                </div>
              </div>
              <div className="p-6">
                {recentPrescriptions.length === 0 ? (
                  <div className="text-center py-8">
                    <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-gray-500 mb-4">No prescriptions uploaded</p>
                    <Link to="/patient/upload-prescription" className="inline-block px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                      Upload Prescription
                    </Link>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-4">
                    {recentPrescriptions.map((prescription) => (
                      <Link
                        key={prescription.id}
                        to={`/patient/prescriptions/${prescription.id}`}
                        className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-blue-300"
                      >
                        <div className="flex items-start space-x-3">
                          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">
                              {prescription.file_name}
                            </p>
                            <p className="text-sm text-gray-600">
                              {prescription.doctor_name || 'Doctor Not Specified'}
                            </p>
                            <div className="flex items-center space-x-2 mt-2">
                              <span className="text-xs text-gray-500">
                                {formatDate(prescription.uploaded_at)}
                              </span>
                              {prescription.ai_processed && (
                                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                                  AI Processed
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - 1/3 width */}
          <div className="space-y-8">
            {/* Latest Vitals */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">Latest Vitals</h2>
                  <Link to="/patient/health-vitals" className="text-blue-600 text-sm font-medium hover:underline">
                    Update
                  </Link>
                </div>
              </div>
              <div className="p-6">
                {latestVitals ? (
                  <div className="space-y-4">
                    {latestVitals.heart_rate && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Heart Rate</span>
                        <span className="font-semibold text-gray-900">{latestVitals.heart_rate} bpm</span>
                      </div>
                    )}
                    {latestVitals.blood_pressure_systolic && latestVitals.blood_pressure_diastolic && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Blood Pressure</span>
                        <span className="font-semibold text-gray-900">
                          {latestVitals.blood_pressure_systolic}/{latestVitals.blood_pressure_diastolic} mmHg
                        </span>
                      </div>
                    )}
                    {latestVitals.temperature && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Temperature</span>
                        <span className="font-semibold text-gray-900">{latestVitals.temperature}°F</span>
                      </div>
                    )}
                    {latestVitals.weight && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Weight</span>
                        <span className="font-semibold text-gray-900">{latestVitals.weight} kg</span>
                      </div>
                    )}
                    <p className="text-xs text-gray-500 mt-4">
                      Last updated: {formatDate(latestVitals.recorded_at)}
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    <p className="text-sm text-gray-500 mb-3">No vitals recorded</p>
                    <Link to="/patient/health-vitals" className="text-blue-600 text-sm font-medium hover:underline">
                      Record Vitals
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Upcoming Medications */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">Medications Today</h2>
                  <Link to="/patient/medications" className="text-blue-600 text-sm font-medium hover:underline">
                    View All
                  </Link>
                </div>
              </div>
              <div className="p-6">
                {upcomingMedications.length === 0 ? (
                  <div className="text-center py-8">
                    <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                    <p className="text-sm text-gray-500">No active medications</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {upcomingMedications.map((med) => (
                      <div key={med.id} className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                        <p className="font-semibold text-gray-900 text-sm">{med.medication_name}</p>
                        <p className="text-xs text-gray-600 mt-1">{med.dosage} - {med.frequency}</p>
                        {med.times && med.times.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {med.times.map((time, idx) => (
                              <span key={idx} className="px-2 py-0.5 bg-orange-200 text-orange-800 text-xs rounded">
                                {time}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <Link
                  to="/patient/book-appointment"
                  className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100"
                >
                  <span className="text-sm font-medium text-blue-900">Book Appointment</span>
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
                <Link
                  to="/patient/upload-prescription"
                  className="flex items-center justify-between p-3 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100"
                >
                  <span className="text-sm font-medium text-purple-900">Upload Prescription</span>
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
                <Link
                  to="/patient/hospitals"
                  className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100"
                >
                  <span className="text-sm font-medium text-green-900">Find Hospitals</span>
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
                <Link
                  to="/patient/qr-code"
                  className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100"
                >
                  <span className="text-sm font-medium text-gray-900">My QR Code</span>
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;