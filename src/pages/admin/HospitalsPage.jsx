import { useState, useEffect } from 'react';
import {
  Building,
  MapPin,
  Phone,
  Mail,
  Globe,
  Plus,
  Edit,
  Trash2,
  Star,
  StarOff,
  Loader,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
  RefreshCw
} from 'lucide-react';

const API_BASE_URL = 'http://localhost:8000/api/v1';

const AdminHospitalsPage = () => {
  const navigate = (path) => {
    console.log('Navigate to:', path);
    window.location.href = path;
  };

  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    fetchHospitals();
  }, []);

  const fetchHospitals = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');

      const response = await fetch(`${API_BASE_URL}/admin/hospitals`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to fetch hospitals');

      const data = await response.json();
      console.log('Fetched hospitals:', data);
      setHospitals(data);
    } catch (err) {
      console.error('Error fetching hospitals:', err);
      setError(err.message || 'Failed to load hospitals');
    } finally {
      setLoading(false);
    }
  };

  const togglePinHospital = async (hospitalId, currentPinStatus) => {
    try {
      setProcessingId(hospitalId);
      setError('');
      setSuccess('');
      
      const token = localStorage.getItem('token');
      const newPinStatus = !currentPinStatus;

      const response = await fetch(
        `${API_BASE_URL}/admin/hospitals/${hospitalId}/pin?pin=${newPinStatus}`,
        {
          method: 'PUT',
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) throw new Error('Failed to update hospital');

      const data = await response.json();
      console.log('Pin toggle response:', data);
      setSuccess(data.message);
      
      // Update local state
      setHospitals(hospitals.map(h => 
        h.id === hospitalId ? { ...h, is_pinned: newPinStatus } : h
      ));

      setTimeout(() => setSuccess(''), 3000);

    } catch (err) {
      console.error('Error toggling pin:', err);
      setError(err.message || 'Failed to update hospital');
    } finally {
      setProcessingId(null);
    }
  };

  const deleteHospital = async (hospitalId, hospitalName) => {
    if (!window.confirm(`Are you sure you want to delete ${hospitalName}?`)) {
      return;
    }

    try {
      setProcessingId(hospitalId);
      setError('');
      const token = localStorage.getItem('token');

      const response = await fetch(`${API_BASE_URL}/admin/hospitals/${hospitalId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to delete hospital');

      setSuccess('Hospital deleted successfully');
      setHospitals(hospitals.filter(h => h.id !== hospitalId));
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error deleting hospital:', err);
      setError(err.message || 'Failed to delete hospital');
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <Loader className="w-16 h-16 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading hospitals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Dashboard
          </button>

          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-800 flex items-center gap-3">
                <Building className="w-10 h-10 text-blue-600" />
                Hospital Management
              </h1>
              <p className="text-gray-600 mt-2">
                Manage your hospitals and set featured status
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={fetchHospitals}
                className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 text-gray-700 font-medium"
              >
                <RefreshCw className="w-5 h-5" />
                Refresh
              </button>
              <button
                onClick={() => navigate('/admin/hospitals/create')}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg shadow-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <Plus className="w-5 h-5" />
                Add Hospital
              </button>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-green-800 font-medium">{success}</p>
            </div>
          </div>
        )}

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

        {/* Info Box */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">What does "Featured" mean?</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Featured hospitals appear first in patient booking lists</li>
                <li>Featured hospitals are visible to doctors during signup</li>
                <li>Click the star button to toggle featured status</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Hospitals List */}
        {hospitals.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <Building className="w-24 h-24 text-gray-300 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">No Hospitals Yet</h2>
            <p className="text-gray-600 mb-6">
              Get started by adding your first hospital
            </p>
            <button
              onClick={() => navigate('/admin/hospitals/create')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <Plus className="w-5 h-5" />
              Add Hospital
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {hospitals.map((hospital) => (
              <div
                key={hospital.id}
                className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-200"
              >
                <div className="flex items-start justify-between flex-wrap gap-4">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className={`p-3 rounded-lg flex-shrink-0 ${hospital.is_pinned ? 'bg-yellow-100' : 'bg-gray-100'}`}>
                      <Building className={`w-8 h-8 ${hospital.is_pinned ? 'text-yellow-600' : 'text-gray-600'}`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h3 className="text-xl font-bold text-gray-800">
                          {hospital.name}
                        </h3>
                        {hospital.is_pinned && (
                          <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold flex items-center gap-1">
                            <Star className="w-3 h-3 fill-yellow-600" />
                            Featured
                          </span>
                        )}
                        {hospital.is_demo && (
                          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                            Demo
                          </span>
                        )}
                      </div>

                      <div className="space-y-2 text-sm text-gray-600">
                        <p className="flex items-start gap-2">
                          <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                          <span className="break-words">{hospital.address}</span>
                        </p>
                        {hospital.phone && (
                          <p className="flex items-center gap-2">
                            <Phone className="w-4 h-4 flex-shrink-0" />
                            {hospital.phone}
                          </p>
                        )}
                        {hospital.email && (
                          <p className="flex items-center gap-2">
                            <Mail className="w-4 h-4 flex-shrink-0" />
                            {hospital.email}
                          </p>
                        )}
                        {hospital.website && (
                          <p className="flex items-center gap-2">
                            <Globe className="w-4 h-4 flex-shrink-0" />
                            <a
                              href={hospital.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline break-all"
                            >
                              {hospital.website}
                            </a>
                          </p>
                        )}
                      </div>

                      {hospital.services && hospital.services.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {hospital.services.map((service, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium"
                            >
                              {service}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => togglePinHospital(hospital.id, hospital.is_pinned)}
                      disabled={processingId === hospital.id}
                      className={`p-2 rounded-lg transition-all duration-200 ${
                        hospital.is_pinned
                          ? 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                      title={hospital.is_pinned ? 'Remove from featured' : 'Set as featured'}
                    >
                      {processingId === hospital.id ? (
                        <Loader className="w-5 h-5 animate-spin" />
                      ) : hospital.is_pinned ? (
                        <StarOff className="w-5 h-5" />
                      ) : (
                        <Star className="w-5 h-5" />
                      )}
                    </button>

                    <button
                      onClick={() => navigate(`/admin/hospitals/${hospital.id}/edit`)}
                      className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                      title="Edit hospital"
                    >
                      <Edit className="w-5 h-5" />
                    </button>

                    {!hospital.is_demo && !hospital.is_pinned && (
                      <button
                        onClick={() => deleteHospital(hospital.id, hospital.name)}
                        disabled={processingId === hospital.id}
                        className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Delete hospital"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Summary Stats */}
        {hospitals.length > 0 && (
          <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-600">{hospitals.length}</p>
                <p className="text-sm text-gray-600 mt-1">Total Hospitals</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-yellow-600">
                  {hospitals.filter(h => h.is_pinned).length}
                </p>
                <p className="text-sm text-gray-600 mt-1">Featured Hospitals</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-green-600">
                  {hospitals.filter(h => !h.is_pinned && !h.is_demo).length}
                </p>
                <p className="text-sm text-gray-600 mt-1">Regular Hospitals</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminHospitalsPage;