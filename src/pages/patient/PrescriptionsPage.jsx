import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  Upload, 
  Calendar, 
  User, 
  Eye, 
  Trash2, 
  Search,
  Filter,
  Download,
  Sparkles,
  CheckCircle,
  Clock
} from 'lucide-react';

const PrescriptionsPage = () => {
  const navigate = useNavigate();
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, processed, unprocessed
  const [deleteModal, setDeleteModal] = useState({ show: false, id: null });
  const [deleting, setDeleting] = useState(false);
  const VITE_API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const fetchPrescriptions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${VITE_API_BASE_URL}/api/v1/patient/prescriptions?limit=100`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch prescriptions');

      const data = await response.json();
      setPrescriptions(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    setDeleting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${VITE_API_BASE_URL}/api/v1/patient/prescriptions/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to delete prescription');

      setPrescriptions(prescriptions.filter(p => p.id !== id));
      setDeleteModal({ show: false, id: null });
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleting(false);
    }
  };

  const handleDownload = async (prescription) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
       `${VITE_API_BASE_URL}/api/v1/prescriptions/${prescription.id}/download`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) throw new Error('Failed to get download URL');

      const data = await response.json();
      window.open(data.download_url, '_blank');
    } catch (err) {
      setError(err.message);
    }
  };

  const filteredPrescriptions = prescriptions.filter(prescription => {
    const matchesSearch = 
      prescription.file_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (prescription.doctor_name && prescription.doctor_name.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesFilter = 
      filterStatus === 'all' ||
      (filterStatus === 'processed' && prescription.ai_processed) ||
      (filterStatus === 'unprocessed' && !prescription.ai_processed);

    return matchesSearch && matchesFilter;
  });

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Prescriptions</h1>
          <p className="text-gray-600 mt-1">Manage and view your medical prescriptions</p>
        </div>
        <button
          onClick={() => navigate('/patient/prescriptions/upload')}
          className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 shadow-lg"
        >
          <Upload className="w-5 h-5" />
          <span>Upload New</span>
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Search and Filter Bar */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:space-x-4 space-y-4 md:space-y-0">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by file name or doctor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Filter */}
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-500" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Prescriptions</option>
              <option value="processed">AI Processed</option>
              <option value="unprocessed">Not Processed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Prescriptions</p>
              <p className="text-3xl font-bold text-gray-900">{prescriptions.length}</p>
            </div>
            <FileText className="w-12 h-12 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">AI Processed</p>
              <p className="text-3xl font-bold text-green-600">
                {prescriptions.filter(p => p.ai_processed).length}
              </p>
            </div>
            <Sparkles className="w-12 h-12 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Pending Processing</p>
              <p className="text-3xl font-bold text-orange-600">
                {prescriptions.filter(p => !p.ai_processed).length}
              </p>
            </div>
            <Clock className="w-12 h-12 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Prescriptions Grid */}
      {filteredPrescriptions.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No prescriptions found</h3>
          <p className="text-gray-600 mb-6">
            {searchQuery || filterStatus !== 'all' 
              ? 'Try adjusting your search or filter' 
              : 'Upload your first prescription to get started'}
          </p>
          {!searchQuery && filterStatus === 'all' && (
            <button
              onClick={() => navigate('/patient/prescriptions/upload')}
              className="inline-flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
            >
              <Upload className="w-5 h-5" />
              <span>Upload Prescription</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPrescriptions.map((prescription) => (
            <div key={prescription.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow">
              {/* Prescription Image/Preview */}
              <div className="h-48 bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center relative">
                {prescription.file_type?.startsWith('image/') ? (
                  <img 
                    src={prescription.file_url} 
                    alt={prescription.file_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <FileText className="w-20 h-20 text-blue-600" />
                )}
                
                {/* AI Processed Badge */}
                {prescription.ai_processed && (
                  <div className="absolute top-2 right-2 bg-green-500 text-white px-3 py-1 rounded-full text-xs flex items-center space-x-1">
                    <CheckCircle className="w-3 h-3" />
                    <span>AI Processed</span>
                  </div>
                )}
              </div>

              {/* Prescription Details */}
              <div className="p-6">
                <h3 className="font-semibold text-gray-900 mb-2 truncate">
                  {prescription.file_name}
                </h3>

                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  {prescription.doctor_name && (
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4" />
                      <span>{prescription.doctor_name}</span>
                    </div>
                  )}

                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4" />
                    <span>Uploaded: {formatDate(prescription.uploaded_at)}</span>
                  </div>

                  {prescription.date_prescribed && (
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4" />
                      <span>Prescribed: {prescription.date_prescribed}</span>
                    </div>
                  )}

                  <div className="text-xs text-gray-500">
                    Size: {formatFileSize(prescription.file_size)}
                  </div>
                </div>

                {/* Medications Count */}
                {prescription.medications && prescription.medications.length > 0 && (
                  <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-900">
                      <Sparkles className="w-4 h-4 inline mr-1" />
                      {prescription.medications.length} medication(s) extracted
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => navigate(`/patient/prescriptions/${prescription.id}`)}
                    className="flex-1 flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                  >
                    <Eye className="w-4 h-4" />
                    <span>View</span>
                  </button>

                  <button
                    onClick={() => handleDownload(prescription)}
                    className="flex items-center justify-center bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200"
                  >
                    <Download className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setDeleteModal({ show: true, id: prescription.id })}
                    className="flex items-center justify-center bg-red-50 text-red-600 px-4 py-2 rounded-lg hover:bg-red-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Delete Prescription?</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this prescription? This action cannot be undone.
            </p>
            <div className="flex space-x-4">
              <button
                onClick={() => setDeleteModal({ show: false, id: null })}
                disabled={deleting}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteModal.id)}
                disabled={deleting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrescriptionsPage;