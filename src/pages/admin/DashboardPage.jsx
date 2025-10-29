import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Calendar,
  Users,
  Activity,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
  Hospital,
  UserCheck,
  Stethoscope,
  BarChart3,
  RefreshCw
} from 'lucide-react';

const API_BASE_URL = 'http://localhost:8000/api/v1';

const AdminDashboardPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    total_appointments: 0,
    pending_appointments: 0,
    confirmed_appointments: 0,
    completed_appointments: 0,
    cancelled_appointments: 0,
    total_doctors: 0,
    today_appointments: 0
  });
  const [recentAppointments, setRecentAppointments] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setError('');
      const token = localStorage.getItem('token');
      
      // Fetch dashboard stats
      const statsResponse = await axios.get(
        `${API_BASE_URL}/admin/dashboard/stats`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setStats(statsResponse.data);

      // Fetch recent appointments
      const appointmentsResponse = await axios.get(
        `${API_BASE_URL}/admin/appointments?limit=5`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setRecentAppointments(appointmentsResponse.data);

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err.response?.data?.detail || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      confirmed: 'bg-blue-100 text-blue-800 border-blue-300',
      completed: 'bg-green-100 text-green-800 border-green-300',
      cancelled: 'bg-red-100 text-red-800 border-red-300'
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
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading Admin Dashboard...</p>
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
                <Hospital className="w-10 h-10 text-blue-600" />
                Admin Dashboard
              </h1>
              <p className="text-gray-600 mt-2">
                CarePlus Hospital Management System
              </p>
            </div>
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

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-800 font-medium">Error</p>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Appointments */}
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500 hover:shadow-xl transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Appointments</p>
                <p className="text-3xl font-bold text-gray-800 mt-2">{stats.total_appointments}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <Calendar className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-gray-600">
              <TrendingUp className="w-4 h-4 mr-1 text-green-600" />
              <span>All time</span>
            </div>
          </div>

          {/* Pending Appointments */}
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-500 hover:shadow-xl transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Pending</p>
                <p className="text-3xl font-bold text-gray-800 mt-2">{stats.pending_appointments}</p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-full">
                <Clock className="w-8 h-8 text-yellow-600" />
              </div>
            </div>
            <div className="mt-4">
              <button
                onClick={() => navigate('/admin/appointments?status=pending')}
                className="text-sm text-yellow-600 hover:text-yellow-700 font-medium"
              >
                Review pending →
              </button>
            </div>
          </div>

          {/* Today's Appointments */}
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500 hover:shadow-xl transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Today</p>
                <p className="text-3xl font-bold text-gray-800 mt-2">{stats.today_appointments}</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <Activity className="w-8 h-8 text-purple-600" />
              </div>
            </div>
            <div className="mt-4">
              <button
                onClick={() => navigate('/admin/appointments')}
                className="text-sm text-purple-600 hover:text-purple-700 font-medium"
              >
                View schedule →
              </button>
            </div>
          </div>

          {/* Total Doctors */}
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500 hover:shadow-xl transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Doctors</p>
                <p className="text-3xl font-bold text-gray-800 mt-2">{stats.total_doctors}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <Stethoscope className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <div className="mt-4">
              <button
                onClick={() => navigate('/admin/doctors')}
                className="text-sm text-green-600 hover:text-green-700 font-medium"
              >
                Manage doctors →
              </button>
            </div>
          </div>
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800">Confirmed</h3>
              <CheckCircle className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-blue-600">{stats.confirmed_appointments}</p>
            <p className="text-sm text-gray-600 mt-2">Scheduled appointments</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800">Completed</h3>
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-3xl font-bold text-green-600">{stats.completed_appointments}</p>
            <p className="text-sm text-gray-600 mt-2">Finished consultations</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800">Cancelled</h3>
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
            <p className="text-3xl font-bold text-red-600">{stats.cancelled_appointments}</p>
            <p className="text-sm text-gray-600 mt-2">Cancelled by users</p>
          </div>
        </div>

        {/* Recent Appointments */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Users className="w-6 h-6 text-blue-600" />
              Recent Appointments
            </h2>
            <button
              onClick={() => navigate('/admin/appointments')}
              className="text-blue-600 hover:text-blue-700 font-medium text-sm"
            >
              View All →
            </button>
          </div>

          {recentAppointments.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">No appointments yet</p>
              <p className="text-gray-400 text-sm mt-2">Appointments will appear here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200 cursor-pointer"
                  onClick={() => navigate(`/admin/appointments/${appointment.id}`)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <UserCheck className="w-5 h-5 text-gray-600" />
                        <h3 className="font-semibold text-gray-800">
                          {appointment.patient_name}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1 ${getStatusColor(appointment.status)}`}>
                          {getStatusIcon(appointment.status)}
                          {appointment.status}
                        </span>
                      </div>
                      
                      <div className="ml-8 space-y-1 text-sm text-gray-600">
                        <p className="flex items-center gap-2">
                          <Stethoscope className="w-4 h-4" />
                          {appointment.appointment_type || 'General Consultation'}
                        </p>
                        {appointment.preferred_date && (
                          <p className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            {appointment.preferred_date} at {appointment.preferred_time || 'Not set'}
                          </p>
                        )}
                        {appointment.doctor_name && (
                          <p className="flex items-center gap-2 text-blue-600">
                            <UserCheck className="w-4 h-4" />
                            Assigned to Dr. {appointment.doctor_name}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {appointment.status === 'pending' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/admin/appointments/${appointment.id}`);
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                      >
                        Assign Doctor
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
          <button
            onClick={() => navigate('/admin/appointments')}
            className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-200 text-left group"
          >
            <Calendar className="w-8 h-8 text-blue-600 mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="font-semibold text-gray-800 mb-1">Manage Appointments</h3>
            <p className="text-sm text-gray-600">View and assign appointments</p>
          </button>

          <button
            onClick={() => navigate('/admin/doctors')}
            className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-200 text-left group"
          >
            <Stethoscope className="w-8 h-8 text-green-600 mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="font-semibold text-gray-800 mb-1">Manage Doctors</h3>
            <p className="text-sm text-gray-600">View hospital doctors</p>
          </button>

          <button
            onClick={() => navigate('/admin/analytics')}
            className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-200 text-left group"
          >
            <BarChart3 className="w-8 h-8 text-purple-600 mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="font-semibold text-gray-800 mb-1">Analytics</h3>
            <p className="text-sm text-gray-600">View reports and stats</p>
          </button>

          <button
            onClick={() => navigate('/admin/chat')}
            className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-200 text-left group"
          >
            <Users className="w-8 h-8 text-indigo-600 mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="font-semibold text-gray-800 mb-1">Messages</h3>
            <p className="text-sm text-gray-600">Chat with patients & doctors</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;