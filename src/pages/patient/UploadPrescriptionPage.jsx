import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Upload, 
  FileText, 
  Image as ImageIcon, 
  X, 
  CheckCircle,
  AlertCircle,
  User,
  Calendar,
  FileCheck,
  Sparkles
} from 'lucide-react';

const UploadPrescriptionPage = () => {
  const navigate = useNavigate();
  
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [dragging, setDragging] = useState(false);
  
  const [formData, setFormData] = useState({
    doctor_name: '',
    date_prescribed: '',
    notes: ''
  });
  const VITE_API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
  const maxSize = 10 * 1024 * 1024; // 10MB

  const handleFileSelect = (selectedFile) => {
    setError('');
    
    if (!selectedFile) return;

    // Validate file type
    if (!allowedTypes.includes(selectedFile.type)) {
      setError('Invalid file type. Please upload JPG, PNG, or PDF files only.');
      return;
    }

    // Validate file size
    if (selectedFile.size > maxSize) {
      setError('File size exceeds 10MB. Please upload a smaller file.');
      return;
    }

    setFile(selectedFile);

    // Create preview for images
    if (selectedFile.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      setPreview(null);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    
    const droppedFile = e.dataTransfer.files[0];
    handleFileSelect(droppedFile);
  };

  const handleFileInputChange = (e) => {
    const selectedFile = e.target.files[0];
    handleFileSelect(selectedFile);
  };

  const removeFile = () => {
    setFile(null);
    setPreview(null);
  };

  const handleSubmit = async () => {
    if (!file) {
      setError('Please select a file to upload');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      
      // Create FormData
      const formDataToSend = new FormData();
      formDataToSend.append('file', file);
      
      if (formData.doctor_name) {
        formDataToSend.append('doctor_name', formData.doctor_name);
      }
      if (formData.date_prescribed) {
        formDataToSend.append('date_prescribed', formData.date_prescribed);
      }
      if (formData.notes) {
        formDataToSend.append('notes', formData.notes);
      }

      const response = await fetch(`${VITE_API_BASE_URL}/api/v1/patient/prescriptions/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataToSend
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to upload prescription');
      }

      const data = await response.json();
      setSuccess(true);
      
      // Redirect after 2 seconds
      setTimeout(() => {
        navigate(`/patient/prescriptions/${data.id}`);
      }, 2000);

    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  if (success) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload Successful!</h2>
          <p className="text-gray-600 mb-4">
            Your prescription has been uploaded successfully to Cloudinary.
          </p>
          <p className="text-sm text-gray-500">Redirecting to prescription details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/patient/prescriptions')}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Prescriptions</span>
        </button>

        <div className="flex items-center space-x-3 mb-2">
          <div className="bg-blue-100 p-3 rounded-lg">
            <Upload className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Upload Prescription</h1>
            <p className="text-gray-600">Upload your prescription to analyze with AI</p>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-start space-x-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-6">
        {/* File Upload Area */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            <FileCheck className="w-5 h-5 inline mr-2" />
            Select File
          </h2>

          {!file ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                dragging
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <input
                type="file"
                id="file-input"
                accept=".jpg,.jpeg,.png,.pdf"
                onChange={handleFileInputChange}
                className="hidden"
              />
              
              <div className="flex flex-col items-center space-y-4">
                <div className="bg-blue-100 p-6 rounded-full">
                  <Upload className="w-12 h-12 text-blue-600" />
                </div>
                
                <div>
                  <p className="text-lg font-medium text-gray-900 mb-1">
                    Drop your file here, or{' '}
                    <label htmlFor="file-input" className="text-blue-600 hover:text-blue-700 cursor-pointer">
                      browse
                    </label>
                  </p>
                  <p className="text-sm text-gray-500">
                    Supports: JPG, PNG, PDF (Max 10MB)
                  </p>
                </div>

                <button
                  onClick={() => document.getElementById('file-input').click()}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
                >
                  Choose File
                </button>
              </div>
            </div>
          ) : (
            <div className="border border-gray-200 rounded-lg p-6">
              <div className="flex items-start space-x-4">
                {/* Preview */}
                <div className="flex-shrink-0">
                  {preview ? (
                    <img
                      src={preview}
                      alt="Preview"
                      className="w-32 h-32 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-16 h-16 text-gray-400" />
                    </div>
                  )}
                </div>

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-lg font-medium text-gray-900 truncate">
                        {file.name}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {formatFileSize(file.size)} • {file.type.split('/')[1].toUpperCase()}
                      </p>
                    </div>
                    <button
                      onClick={removeFile}
                      className="ml-4 text-red-600 hover:text-red-700"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {file.type.startsWith('image/') && (
                    <div className="mt-4 flex items-center space-x-2 text-sm text-green-600">
                      <CheckCircle className="w-4 h-4" />
                      <span>Ready for AI analysis</span>
                    </div>
                  )}

                  {file.type === 'application/pdf' && (
                    <div className="mt-4 flex items-center space-x-2 text-sm text-orange-600">
                      <AlertCircle className="w-4 h-4" />
                      <span>PDF files require manual text extraction</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Additional Details Form */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Additional Details (Optional)
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="w-4 h-4 inline mr-2" />
                Doctor Name
              </label>
              <input
                type="text"
                value={formData.doctor_name}
                onChange={(e) => setFormData({ ...formData, doctor_name: e.target.value })}
                placeholder="Dr. John Smith"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-2" />
                Date Prescribed
              </label>
              <input
                type="date"
                value={formData.date_prescribed}
                onChange={(e) => setFormData({ ...formData, date_prescribed: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FileText className="w-4 h-4 inline mr-2" />
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Add any additional notes about this prescription..."
                rows="4"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* AI Features Info */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg shadow-md p-6">
          <div className="flex items-start space-x-3">
            <Sparkles className="w-6 h-6 text-purple-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                AI-Powered Analysis
              </h3>
              <p className="text-gray-700 mb-3">
                After uploading, you can use our AI to:
              </p>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Extract text from prescription images using Gemini AI</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Automatically identify medications, dosages, and timings</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Chat with AI to ask questions about your prescription</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Create medication reminders automatically</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/patient/prescriptions')}
            disabled={uploading}
            className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!file || uploading}
            className="flex-1 flex items-center justify-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Uploading to Cloudinary...</span>
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                <span>Upload Prescription</span>
              </>
            )}
          </button>
        </div>

        {/* Upload Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> Your prescription will be securely uploaded to Cloudinary cloud storage. 
            The file will be stored safely and can be accessed anytime. Images are recommended for best AI analysis results.
          </p>
        </div>
      </div>
    </div>
  );
};

export default UploadPrescriptionPage;