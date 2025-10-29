import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  BarChart3,
  Calendar,
  TrendingUp,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  Activity,
  Download,
  RefreshCw,
  AlertCircle,
  Filter,
  Stethoscope,
  PieChart
} from 'lucide-react';

const API_BASE_URL = 'http://localhost:8000/api/v1';

const AdminAnalyticsPage = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const [dateRange, setDateRange] = useState({
    start_date: '',
    end_date: ''
  });
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    // Set default date range (last 30 days)
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    setDateRange({
      start_date: thirtyDaysAgo.toISOString().split('T')[0],
      end_date: today.toISOString().split('T')[0]
    });
  }, []);

  useEffect(() => {
    if (dateRange.start_date && dateRange.end_date) {
      fetchAnalytics();
    }
  }, [dateRange]);

// Replace the fetchAnalytics function in AdminAnalyticsPage.jsx

const fetchAnalytics = async () => {
  try {
    setMessage({ type: '', text: '' });
    const token = localStorage.getItem('token');
    
    // Use the correct endpoint
    let url = `${API_BASE_URL}/analytics/admin-reports`;
    const params = new URLSearchParams();
    if (dateRange.start_date) params.append('start_date', dateRange.start_date);
    if (dateRange.end_date) params.append('end_date', dateRange.end_date);
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    console.log('Fetching analytics from:', url); // DEBUG

    const response = await axios.get(url, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('Analytics response:', response.data); // DEBUG
    
    setAnalytics(response.data);
    setLoading(false);
    setRefreshing(false);
  } catch (err) {
    console.error('Error fetching analytics:', err);
    console.error('Error response:', err.response?.data); // DEBUG
    setMessage({
      type: 'error',
      text: err.response?.data?.detail || 'Failed to load analytics'
    });
    setLoading(false);
    setRefreshing(false);
  }
};

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAnalytics();
  };

  const handleExportReport = () => {
    if (!analytics) return;
    
    const reportData = {
      generated_at: new Date().toISOString(),
      period: dateRange,
      ...analytics
    };
    
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-report-${dateRange.start_date}-to-${dateRange.end_date}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    setMessage({ type: 'success', text: 'Report exported successfully!' });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const getStatusPercentage = (count, total) => {
    if (total === 0) return 0;
    return ((count / total) * 100).toFixed(1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading Analytics...</p>
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
                <BarChart3 className="w-10 h-10 text-blue-600" />
                Analytics & Reports
              </h1>
              <p className="text-gray-600 mt-2">Hospital performance and statistics</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 text-gray-700 font-medium disabled:opacity-50"
              >
                <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              
              <button
                onClick={handleExportReport}
                disabled={!analytics}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg shadow-md hover:shadow-lg hover:bg-green-700 transition-all duration-200 font-medium disabled:opacity-50"
              >
                <Download className="w-5 h-5" />
                Export
              </button>
            </div>
          </div>
        </div>

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

        {/* Date Range Filter */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Filter className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-800">Date Range</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={dateRange.start_date}
                onChange={(e) => setDateRange({...dateRange, start_date: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={dateRange.end_date}
                onChange={(e) => setDateRange({...dateRange, end_date: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="flex items-end gap-2">
              <button
                onClick={() => {
                  const today = new Date();
                  const sevenDaysAgo = new Date(today);
                  sevenDaysAgo.setDate(today.getDate() - 7);
                  setDateRange({
                    start_date: sevenDaysAgo.toISOString().split('T')[0],
                    end_date: today.toISOString().split('T')[0]
                  });
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
              >
                Last 7 Days
              </button>
              
              <button
                onClick={() => {
                  const today = new Date();
                  const thirtyDaysAgo = new Date(today);
                  thirtyDaysAgo.setDate(today.getDate() - 30);
                  setDateRange({
                    start_date: thirtyDaysAgo.toISOString().split('T')[0],
                    end_date: today.toISOString().split('T')[0]
                  });
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
              >
                Last 30 Days
              </button>
            </div>
          </div>
        </div>

        {/* Main Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Appointments</p>
                <p className="text-3xl font-bold text-gray-800 mt-2">
                  {analytics?.total_appointments || 0}
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <Calendar className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-gray-600">
              <TrendingUp className="w-4 h-4 mr-1 text-green-600" />
              <span>Selected period</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Pending</p>
                <p className="text-3xl font-bold text-gray-800 mt-2">
                  {analytics?.by_status?.pending || 0}
                </p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-full">
                <Clock className="w-8 h-8 text-yellow-600" />
              </div>
            </div>
            <div className="mt-4 text-sm text-gray-600">
              {getStatusPercentage(analytics?.by_status?.pending || 0, analytics?.total_appointments || 0)}% of total
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Completed</p>
                <p className="text-3xl font-bold text-gray-800 mt-2">
                  {analytics?.by_status?.completed || 0}
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <div className="mt-4 text-sm text-gray-600">
              {getStatusPercentage(analytics?.by_status?.completed || 0, analytics?.total_appointments || 0)}% of total
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Cancelled</p>
                <p className="text-3xl font-bold text-gray-800 mt-2">
                  {analytics?.by_status?.cancelled || 0}
                </p>
              </div>
              <div className="bg-red-100 p-3 rounded-full">
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
            </div>
            <div className="mt-4 text-sm text-gray-600">
              {getStatusPercentage(analytics?.by_status?.cancelled || 0, analytics?.total_appointments || 0)}% of total
            </div>
          </div>
        </div>

        {/* Status Breakdown Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <PieChart className="w-6 h-6 text-blue-600" />
              Status Distribution
            </h2>
            
            <div className="space-y-4">
              {analytics?.by_status && Object.entries(analytics.by_status).map(([status, count]) => {
                const percentage = getStatusPercentage(count, analytics.total_appointments);
                const colors = {
                  pending: 'bg-yellow-500',
                  confirmed: 'bg-blue-500',
                  completed: 'bg-green-500',
                  cancelled: 'bg-red-500',
                  in_progress: 'bg-purple-500'
                };
                
                return (
                  <div key={status}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-700 font-medium capitalize">{status}</span>
                      <span className="text-gray-600">{count} ({percentage}%)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full ${colors[status] || 'bg-gray-500'} transition-all duration-500`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Doctor Performance */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <Stethoscope className="w-6 h-6 text-blue-600" />
              Doctor Performance
            </h2>
            
            {analytics?.by_doctor && Object.keys(analytics.by_doctor).length > 0 ? (
              <div className="space-y-4">
                {Object.entries(analytics.by_doctor)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 5)
                  .map(([doctor, count]) => {
                    const percentage = getStatusPercentage(count, analytics.total_appointments);
                    
                    return (
                      <div key={doctor}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-gray-700 font-medium">Dr. {doctor}</span>
                          <span className="text-gray-600">{count} appointments</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div
                            className="bg-blue-500 h-3 rounded-full transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No doctor assignments in this period</p>
              </div>
            )}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center gap-3 mb-4">
              <Activity className="w-8 h-8" />
              <h3 className="text-xl font-bold">Success Rate</h3>
            </div>
            <p className="text-4xl font-bold mb-2">
              {analytics?.total_appointments > 0
                ? getStatusPercentage(
                    analytics.by_status?.completed || 0,
                    analytics.total_appointments
                  )
                : '0'}%
            </p>
            <p className="text-blue-100 text-sm">
              {analytics?.by_status?.completed || 0} completed appointments
            </p>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle className="w-8 h-8" />
              <h3 className="text-xl font-bold">Confirmed Rate</h3>
            </div>
            <p className="text-4xl font-bold mb-2">
              {analytics?.total_appointments > 0
                ? getStatusPercentage(
                    analytics.by_status?.confirmed || 0,
                    analytics.total_appointments
                  )
                : '0'}%
            </p>
            <p className="text-green-100 text-sm">
              {analytics?.by_status?.confirmed || 0} confirmed appointments
            </p>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center gap-3 mb-4">
              <Users className="w-8 h-8" />
              <h3 className="text-xl font-bold">Active Doctors</h3>
            </div>
            <p className="text-4xl font-bold mb-2">
              {analytics?.by_doctor ? Object.keys(analytics.by_doctor).length : 0}
            </p>
            <p className="text-purple-100 text-sm">
              Doctors with appointments
            </p>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">About Analytics</h3>
              <ul className="space-y-1 text-sm text-blue-800">
                <li>• Data is filtered based on the selected date range</li>
                <li>• Export reports as JSON for further analysis</li>
                <li>• Success rate shows percentage of completed appointments</li>
                <li>• Doctor performance shows top 5 doctors by appointment count</li>
                <li>• Refresh to get the latest data from the database</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalyticsPage;