import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import {
  Calendar,
  Clock,
  User,
  Stethoscope,
  Search,
  Filter,
  ChevronDown,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  RefreshCw,
  FileText,
  Phone,
  Mail,
  Bug
} from 'lucide-react';

const API_BASE_URL = 'http://localhost:8000/api/v1';

const AdminAppointmentsPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all');
  const [showFilters, setShowFilters] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [debugInfo, setDebugInfo] = useState(null);
  const [showDebug, setShowDebug] = useState(false);

  useEffect(() => {
    fetchAppointments();
  }, [statusFilter]);

  const fetchAppointments = async () => {
    try {
      setMessage({ type: '', text: '' });
      const token = localStorage.getItem('token');
      
      let url = `${API_BASE_URL}/admin/appointments?limit=100`;
      if (statusFilter !== 'all') {
        url += `&status_filter=${statusFilter}`;
      }

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setAppointments(response.data);
      setLoading(false);
      setRefreshing(false);
    } catch (err) {
      console.error('Error fetching appointments:', err);
      setMessage({
        type: 'error',
        text: err.response?.data?.detail || 'Failed to load appointments'
      });
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAppointments();
  };

  // ✅ NEW: Debug function
  const handleDebug = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/admin/debug-appointments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDebugInfo(response.data);
      setShowDebug(true);
      console.log('🔍 Debug Info:', response.data);
    } catch (err) {
      console.error('Debug error:', err);
      setMessage({
        type: 'error',
        text: 'Failed to fetch debug information'
      });
    }
  };

  const handleStatusFilterChange = (status) => {
    setStatusFilter(status);
    if (status !== 'all') {
      setSearchParams({ status });
    } else {
      setSearchParams({});
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
        return <Clock className="w-4 h-4" />;
      case 'confirmed':
        return <CheckCircle className="w-4 h-4" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4" />;
      case 'in_progress':
        return <Stethoscope className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getStatusCounts = () => {
    return {
      all: appointments.length,
      pending: appointments.filter(a => a.status === 'pending').length,
      confirmed: appointments.filter(a => a.status === 'confirmed').length,
      completed: appointments.filter(a => a.status === 'completed').length,
      cancelled: appointments.filter(a => a.status === 'cancelled').length
    };
  };

  const filteredAppointments = appointments.filter(appointment => {
    const matchesSearch = 
      appointment.patient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.doctor_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.appointment_type?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const statusCounts = getStatusCounts();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading Appointments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-800 flex items-center gap-3">
                <Calendar className="w-10 h-10 text-blue-600" />
                Manage Appointments
              </h1>
              <p className="text-gray-600 mt-2">Review and assign patient appointments</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleDebug}
                className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg shadow-md hover:bg-orange-600 transition-all duration-200 font-medium"
              >
                <Bug className="w-5 h-5" />
                Debug
              </button>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 text-gray-700 font-medium disabled:opacity-50"
              >
                <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Debug Info Panel */}
        {showDebug && debugInfo && (
          <div className="mb-6 bg-gray-900 text-white rounded-xl p-6 shadow-xl">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <Bug className="w-6 h-6 text-orange-400" />
                <h3 className="text-xl font-bold">Debug Information</h3>
              </div>
              <button
                onClick={() => setShowDebug(false)}
                className="text-gray-400 hover:text-white"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 font-mono text-sm">
              <div className="bg-gray-800 p-3 rounded">
                <p className="text-orange-400 font-semibold mb-2">🔑 Admin Info:</p>
                <p>Email: {debugInfo.admin_email}</p>
                <p>Hospital ID: {debugInfo.admin_hospital_id}</p>
              </div>

              <div className="bg-gray-800 p-3 rounded">
                <p className="text-blue-400 font-semibold mb-2">🏥 Hospital Info:</p>
                <p>Name: {debugInfo.hospital?.name || 'NOT FOUND'}</p>
                <p>ID: {debugInfo.hospital?.id}</p>
                <p className={debugInfo.hospital?.exists ? 'text-green-400' : 'text-red-400'}>
                  Exists: {debugInfo.hospital?.exists ? '✅ Yes' : '❌ No'}
                </p>
              </div>

              <div className="bg-gray-800 p-3 rounded">
                <p className="text-green-400 font-semibold mb-2">📊 Appointments:</p>
                <p>Total in Database: {debugInfo.appointments?.total_in_database}</p>
                <p>For Your Hospital (by ID): {debugInfo.appointments?.for_this_hospital_by_id}</p>
                <p>For Your Hospital (by Name): {debugInfo.appointments?.for_this_hospital_by_name}</p>
              </div>

              {debugInfo.sample_appointments && debugInfo.sample_appointments.length > 0 && (
                <div className="bg-gray-800 p-3 rounded">
                  <p className="text-purple-400 font-semibold mb-2">📋 Sample Appointments:</p>
                  {debugInfo.sample_appointments.map((apt, idx) => (
                    <div key={idx} className="ml-4 mt-2 text-xs border-l-2 border-gray-600 pl-2">
                      <p>Patient: {apt.patient}</p>
                      <p>Hospital: {apt.hospital_name} (ID: {apt.hospital_id})</p>
                      <p className={apt.matches_admin_hospital ? 'text-green-400' : 'text-red-400'}>
                        Matches: {apt.matches_admin_hospital ? '✅ Yes' : '❌ No'}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              <div className="bg-red-900 p-3 rounded">
                <p className="text-red-300 font-semibold mb-2">🔍 Diagnosis:</p>
                <p>{debugInfo.diagnosis?.possible_issue}</p>
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

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <button
            onClick={() => handleStatusFilterChange('all')}
            className={`p-4 rounded-lg border-2 transition-all ${
              statusFilter === 'all'
                ? 'border-blue-600 bg-blue-50'
                : 'border-gray-200 bg-white hover:border-blue-300'
            }`}
          >
            <p className="text-2xl font-bold text-gray-800">{statusCounts.all}</p>
            <p className="text-sm text-gray-600">All</p>
          </button>

          <button
            onClick={() => handleStatusFilterChange('pending')}
            className={`p-4 rounded-lg border-2 transition-all ${
              statusFilter === 'pending'
                ? 'border-yellow-600 bg-yellow-50'
                : 'border-gray-200 bg-white hover:border-yellow-300'
            }`}
          >
            <p className="text-2xl font-bold text-yellow-600">{statusCounts.pending}</p>
            <p className="text-sm text-gray-600">Pending</p>
          </button>

          <button
            onClick={() => handleStatusFilterChange('confirmed')}
            className={`p-4 rounded-lg border-2 transition-all ${
              statusFilter === 'confirmed'
                ? 'border-blue-600 bg-blue-50'
                : 'border-gray-200 bg-white hover:border-blue-300'
            }`}
          >
            <p className="text-2xl font-bold text-blue-600">{statusCounts.confirmed}</p>
            <p className="text-sm text-gray-600">Confirmed</p>
          </button>

          <button
            onClick={() => handleStatusFilterChange('completed')}
            className={`p-4 rounded-lg border-2 transition-all ${
              statusFilter === 'completed'
                ? 'border-green-600 bg-green-50'
                : 'border-gray-200 bg-white hover:border-green-300'
            }`}
          >
            <p className="text-2xl font-bold text-green-600">{statusCounts.completed}</p>
            <p className="text-sm text-gray-600">Completed</p>
          </button>

          <button
            onClick={() => handleStatusFilterChange('cancelled')}
            className={`p-4 rounded-lg border-2 transition-all ${
              statusFilter === 'cancelled'
                ? 'border-red-600 bg-red-50'
                : 'border-gray-200 bg-white hover:border-red-300'
            }`}
          >
            <p className="text-2xl font-bold text-red-600">{statusCounts.cancelled}</p>
            <p className="text-sm text-gray-600">Cancelled</p>
          </button>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by patient name, doctor, or appointment type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Appointments List */}
        {filteredAppointments.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <Calendar className="w-20 h-20 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              {searchTerm ? 'No appointments found' : `No ${statusFilter !== 'all' ? statusFilter : ''} appointments`}
            </h3>
            <p className="text-gray-500 mb-4">
              {searchTerm 
                ? 'Try adjusting your search terms' 
                : statusFilter !== 'all'
                ? `There are no ${statusFilter} appointments at the moment`
                : 'Appointments will appear here when patients book'
              }
            </p>
            <button
              onClick={handleDebug}
              className="mx-auto flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
            >
              <Bug className="w-4 h-4" />
              Run Debug to Find Out Why
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAppointments.map((appointment) => (
              <div
                key={appointment.id}
                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-200"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <User className="w-5 h-5 text-gray-600" />
                        <h3 className="text-xl font-bold text-gray-800">
                          {appointment.patient_name}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1 ${getStatusColor(appointment.status)}`}>
                          {getStatusIcon(appointment.status)}
                          {appointment.status}
                        </span>
                      </div>
                      
                      <div className="ml-8 space-y-2 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          <span className="font-medium">{appointment.appointment_type || 'General Consultation'}</span>
                        </div>
                        
                        {appointment.preferred_date && (
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>
                              {appointment.scheduled_date || appointment.preferred_date} at{' '}
                              {appointment.scheduled_time || appointment.preferred_time || 'Not set'}
                            </span>
                          </div>
                        )}
                        
                        {appointment.doctor_name ? (
                          <div className="flex items-center gap-2 text-blue-600">
                            <Stethoscope className="w-4 h-4" />
                            <span>Assigned to Dr. {appointment.doctor_name}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-yellow-600">
                            <AlertCircle className="w-4 h-4" />
                            <span>Not assigned to any doctor yet</span>
                          </div>
                        )}

                        {appointment.symptoms && (
                          <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                            <p className="text-xs font-medium text-gray-700 mb-1">Symptoms:</p>
                            <p className="text-sm text-gray-600">{appointment.symptoms}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => navigate(`/admin/appointments/${appointment.id}`)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                      >
                        <Eye className="w-4 h-4" />
                        View Details
                      </button>

                      {appointment.status === 'pending' && (
                        <button
                          onClick={() => navigate(`/admin/appointments/${appointment.id}`)}
                          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                        >
                          <Stethoscope className="w-4 h-4" />
                          Assign Doctor
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="flex items-center gap-6 mt-4 pt-4 border-t border-gray-200">
                    {appointment.patient_phone && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="w-4 h-4" />
                        <a 
                          href={`tel:${appointment.patient_phone}`}
                          className="hover:text-blue-600"
                        >
                          {appointment.patient_phone}
                        </a>
                      </div>
                    )}
                    {appointment.patient_email && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail className="w-4 h-4" />
                        <a 
                          href={`mailto:${appointment.patient_email}`}
                          className="hover:text-blue-600"
                        >
                          {appointment.patient_email}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Results Count */}
        {filteredAppointments.length > 0 && (
          <div className="mt-6 text-center text-gray-600">
            Showing {filteredAppointments.length} of {appointments.length} appointments
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAppointmentsPage;