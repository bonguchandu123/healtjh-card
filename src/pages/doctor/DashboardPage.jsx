import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Calendar, Users, Clock, CheckCircle, Activity, TrendingUp } from 'lucide-react';

const DDashboardPage = () => {
  const { token } = useAuth();
  const [stats, setStats] = useState(null);
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch dashboard stats
      const statsResponse = await fetch('http://localhost:8000/api/v1/doctor/dashboard/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!statsResponse.ok) throw new Error('Failed to fetch stats');
      const statsData = await statsResponse.json();
      setStats(statsData);

      // Fetch today's appointments
      const today = new Date().toISOString().split('T')[0];
      const appointmentsResponse = await fetch(
        `http://localhost:8000/api/v1/doctor/appointments?date_filter=${today}&limit=10`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!appointmentsResponse.ok) throw new Error('Failed to fetch appointments');
      const appointmentsData = await appointmentsResponse.json();
      setTodayAppointments(appointmentsData);

    } catch (err) {
      console.error('Dashboard error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-purple-100 text-purple-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const StatCard = ({ icon: Icon, title, value, color, trend }) => (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        {trend && (
          <div className="flex items-center text-green-600 text-sm">
            <TrendingUp className="w-4 h-4 mr-1" />
            <span>{trend}</span>
          </div>
        )}
      </div>
      <h3 className="text-gray-600 text-sm font-medium mb-1">{title}</h3>
      <p className="text-3xl font-bold text-gray-800">{value}</p>
    </div>
  );

  const AppointmentCard = ({ appointment }) => (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h4 className="font-semibold text-gray-800 mb-1">
            {appointment.patient_name}
          </h4>
          <p className="text-sm text-gray-600">{appointment.reason_for_visit}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
          {appointment.status.replace('_', ' ').toUpperCase()}
        </span>
      </div>
      
      <div className="flex items-center text-sm text-gray-600 space-x-4">
        <div className="flex items-center">
          <Clock className="w-4 h-4 mr-1" />
          <span>{appointment.scheduled_time || appointment.preferred_time}</span>
        </div>
        <div className="flex items-center">
          <Activity className="w-4 h-4 mr-1" />
          <span>{appointment.appointment_type}</span>
        </div>
      </div>

      {appointment.symptoms && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-500 mb-1">Symptoms:</p>
          <p className="text-sm text-gray-700">{appointment.symptoms}</p>
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h3 className="text-red-800 font-semibold mb-2">Error Loading Dashboard</h3>
          <p className="text-red-600 text-sm">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Doctor Dashboard</h1>
          <p className="text-gray-600">Welcome back! Here's your overview for today.</p>
        </div>

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              icon={Calendar}
              title="Total Appointments"
              value={stats.total_appointments || 0}
              color="bg-blue-500"
            />
            <StatCard
              icon={Clock}
              title="Today's Appointments"
              value={stats.today_appointments || 0}
              color="bg-purple-500"
              trend="+12%"
            />
            <StatCard
              icon={CheckCircle}
              title="Completed"
              value={stats.completed_appointments || 0}
              color="bg-green-500"
            />
            <StatCard
              icon={Users}
              title="Total Patients"
              value={stats.total_patients || 0}
              color="bg-orange-500"
            />
          </div>
        )}

        {/* Today's Appointments */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800">Today's Schedule</h2>
            <span className="text-sm text-gray-600">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </span>
          </div>

          {todayAppointments.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">No appointments scheduled for today</p>
              <p className="text-sm text-gray-500">Enjoy your day!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {todayAppointments.map((appointment) => (
                <AppointmentCard key={appointment.id} appointment={appointment} />
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <a
            href="/doctor/appointments"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow text-center group"
          >
            <Calendar className="w-12 h-12 text-blue-600 mx-auto mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="font-semibold text-gray-800 mb-1">View All Appointments</h3>
            <p className="text-sm text-gray-600">Manage your schedule</p>
          </a>

          <a
            href="/doctor/patients"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow text-center group"
          >
            <Users className="w-12 h-12 text-green-600 mx-auto mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="font-semibold text-gray-800 mb-1">Patient Records</h3>
            <p className="text-sm text-gray-600">Access patient history</p>
          </a>

          <a
            href="/doctor/scan-qr"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow text-center group"
          >
            <Activity className="w-12 h-12 text-purple-600 mx-auto mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="font-semibold text-gray-800 mb-1">Scan QR Code</h3>
            <p className="text-sm text-gray-600">Quick patient lookup</p>
          </a>
        </div>
      </div>
    </div>
  );
};

export default DDashboardPage;