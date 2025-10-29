import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Stethoscope,
  Search,
  Mail,
  Phone,
  Calendar,
  Award,
  UserCheck,
  Clock,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  MessageSquare,
  FileText
} from 'lucide-react';

const API_BASE_URL = 'http://localhost:8000/api/v1';

const AdminDoctorsPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [doctors, setDoctors] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      setMessage({ type: '', text: '' });
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/admin/doctors`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDoctors(response.data);
      setLoading(false);
      setRefreshing(false);
    } catch (err) {
      console.error('Error fetching doctors:', err);
      setMessage({
        type: 'error',
        text: err.response?.data?.detail || 'Failed to load doctors'
      });
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDoctors();
  };

  const filteredDoctors = doctors.filter(doctor =>
    doctor.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doctor.specialization?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doctor.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getAvailabilityColor = (availability) => {
    if (!availability || availability.length === 0) return 'bg-red-100 text-red-800';
    if (availability.length >= 5) return 'bg-green-100 text-green-800';
    return 'bg-yellow-100 text-yellow-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading Doctors...</p>
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
                <Stethoscope className="w-10 h-10 text-blue-600" />
                Hospital Doctors
              </h1>
              <p className="text-gray-600 mt-2">
                Manage your medical team at CarePlus Hospital
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

        {/* Stats Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Doctors</p>
                <p className="text-3xl font-bold text-gray-800 mt-2">{doctors.length}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <Stethoscope className="w-8 h-8 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Active Doctors</p>
                <p className="text-3xl font-bold text-gray-800 mt-2">
                  {doctors.filter(d => d.is_active).length}
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <UserCheck className="w-8 h-8 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Specializations</p>
                <p className="text-3xl font-bold text-gray-800 mt-2">
                  {new Set(doctors.map(d => d.specialization)).size}
                </p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <Award className="w-8 h-8 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, specialization, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Doctors Grid */}
        {filteredDoctors.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <Stethoscope className="w-20 h-20 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              {searchTerm ? 'No doctors found' : 'No doctors yet'}
            </h3>
            <p className="text-gray-500">
              {searchTerm 
                ? 'Try adjusting your search terms' 
                : 'Doctors will appear here when they register'
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDoctors.map((doctor) => (
              <div
                key={doctor.id}
                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-200 border-2 border-transparent hover:border-blue-300"
              >
                {/* Doctor Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
                  <div className="flex items-center gap-4">
                    <div className="bg-white/20 p-3 rounded-full">
                      <Stethoscope className="w-8 h-8" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold">Dr. {doctor.full_name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Award className="w-4 h-4" />
                        <p className="text-sm text-blue-100">
                          {doctor.specialization || 'General Physician'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Doctor Details */}
                <div className="p-6 space-y-4">
                  {/* Status Badge */}
                  <div className="flex items-center justify-between">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      doctor.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {doctor.is_active ? '● Active' : '● Inactive'}
                    </span>
                    
                    {doctor.experience_years && (
                      <span className="text-sm text-gray-600">
                        {doctor.experience_years} years exp.
                      </span>
                    )}
                  </div>

                  {/* License Number */}
                  {doctor.license_number && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-600 mb-1">License Number</p>
                      <p className="text-sm font-mono font-medium text-gray-800">
                        {doctor.license_number}
                      </p>
                    </div>
                  )}

                  {/* Contact Info */}
                  <div className="space-y-2">
                    {doctor.email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <a 
                          href={`mailto:${doctor.email}`}
                          className="text-blue-600 hover:text-blue-700 truncate"
                        >
                          {doctor.email}
                        </a>
                      </div>
                    )}

                    {doctor.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <a 
                          href={`tel:${doctor.phone}`}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          {doctor.phone}
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Availability */}
                  {doctor.availability && doctor.availability.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="w-4 h-4 text-gray-600" />
                        <p className="text-sm font-medium text-gray-700">Available Days:</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {doctor.availability.map((day, index) => (
                          <span
                            key={index}
                            className={`px-2 py-1 rounded text-xs font-medium ${getAvailabilityColor(doctor.availability)}`}
                          >
                            {day}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Created Date */}
                  {doctor.created_at && (
                    <div className="flex items-center gap-2 text-xs text-gray-500 pt-3 border-t border-gray-200">
                      <Calendar className="w-3 h-3" />
                      <span>
                        Joined: {new Date(doctor.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => navigate(`/admin/chat?user=${doctor.id}`)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      <MessageSquare className="w-4 h-4" />
                      Message
                    </button>
                    
                    <button
                      onClick={() => navigate(`/admin/appointments?doctor=${doctor.id}`)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                    >
                      <FileText className="w-4 h-4" />
                      Appointments
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Info Box */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">About Hospital Doctors</h3>
              <ul className="space-y-1 text-sm text-blue-800">
                <li>• Doctors are registered through the signup process with role "doctor"</li>
                <li>• Each doctor is linked to your hospital automatically</li>
                <li>• You can assign doctors to patient appointments</li>
                <li>• Contact doctors directly through the messaging system</li>
                <li>• View all appointments assigned to each doctor</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Results Count */}
        {filteredDoctors.length > 0 && (
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Showing {filteredDoctors.length} of {doctors.length} doctors
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDoctorsPage;