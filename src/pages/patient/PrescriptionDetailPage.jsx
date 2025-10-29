
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  FileText, 
  Calendar, 
  User, 
  Download, 
  Trash2,
  Sparkles,
  MessageSquare,
  Send,
  Clock,
  Pill,
  Brain,
  Eye,
  Loader
} from 'lucide-react';

const PrescriptionDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [prescription, setPrescription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('details'); // details, extracted, medications, chat
  
  // AI Processing States
  const [extracting, setExtracting] = useState(false);
  const [summarizing, setSummarizing] = useState(false);
  
  // Chat States
  const [chatHistory, setChatHistory] = useState([]);
  const [chatMessage, setChatMessage] = useState('');
  const [sendingChat, setSendingChat] = useState(false);
  const [loadingChat, setLoadingChat] = useState(false);
  
  // Delete Modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);


  useEffect(() => {
  if (prescription) {
    console.log('=== PRESCRIPTION DEBUG ===');
    console.log('Full prescription data:', prescription);
    console.log('File URL:', prescription.file_url);
    console.log('File type:', prescription.file_type);
    console.log('File name:', prescription.file_name);
    console.log('========================');
  }
}, [prescription]);


  useEffect(() => {
    fetchPrescription();
  }, [id]);

  useEffect(() => {
    if (activeTab === 'chat') {
      fetchChatHistory();
    }
  }, [activeTab]);

  const fetchPrescription = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/api/v1/patient/prescriptions/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to fetch prescription');
      const data = await response.json();
      setPrescription(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExtractText = async () => {
    try {
      setExtracting(true);
      setError('');
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:8000/api/v1/patient/prescriptions/${id}/extract`,
        {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      if (!response.ok) throw new Error('Failed to extract text');
      await fetchPrescription();
      setActiveTab('extracted');
    } catch (err) {
      setError(err.message);
    } finally {
      setExtracting(false);
    }
  };

  const handleSummarize = async () => {
    try {
      setSummarizing(true);
      setError('');
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:8000/api/v1/patient/prescriptions/${id}/summarize`,
        {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      if (!response.ok) throw new Error('Failed to summarize prescription');
      await fetchPrescription();
      setActiveTab('medications');
    } catch (err) {
      setError(err.message);
    } finally {
      setSummarizing(false);
    }
  };

  const fetchChatHistory = async () => {
    try {
      setLoadingChat(true);
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:8000/api/v1/patient/prescriptions/${id}/chat-history`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      if (!response.ok) throw new Error('Failed to fetch chat history');
      const data = await response.json();
      setChatHistory(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingChat(false);
    }
  };

  const handleSendChat = async () => {
    if (!chatMessage.trim()) return;

    try {
      setSendingChat(true);
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:8000/api/v1/patient/prescriptions/${id}/chat`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ prompt: chatMessage })
        }
      );

      if (!response.ok) throw new Error('Failed to send message');
      
      setChatMessage('');
      await fetchChatHistory();
    } catch (err) {
      setError(err.message);
    } finally {
      setSendingChat(false);
    }
  };

  const handleDownload = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:8000/api/v1/prescriptions/${id}/download`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      if (!response.ok) throw new Error('Failed to get download URL');
      const data = await response.json();
      window.open(data.download_url, '_blank');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:8000/api/v1/patient/prescriptions/${id}`,
        {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      if (!response.ok) throw new Error('Failed to delete prescription');
      navigate('/patient/prescriptions');
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!prescription) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center">
        <p className="text-red-600">Prescription not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/patient/prescriptions')}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Prescriptions</span>
        </button>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-4">
              <div className="bg-blue-100 p-3 rounded-lg">
                <FileText className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{prescription.file_name}</h1>
                <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                  {prescription.doctor_name && (
                    <div className="flex items-center space-x-1">
                      <User className="w-4 h-4" />
                      <span>{prescription.doctor_name}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4" />
                    <span>Uploaded: {formatDate(prescription.uploaded_at)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleDownload}
                className="flex items-center space-x-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200"
              >
                <Download className="w-4 h-4" />
                <span>Download</span>
              </button>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="flex items-center space-x-2 bg-red-50 text-red-600 px-4 py-2 rounded-lg hover:bg-red-100"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </button>
            </div>
          </div>

          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Image/File Preview */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Preview</h2>
          <div className="aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden">
  {prescription.file_type?.startsWith('image/') && prescription.file_url ? (
    <img
      src={prescription.file_url}
      alt={prescription.file_name}
      className="w-full h-full object-contain"
      onError={(e) => {
        console.error('Image failed to load:', prescription.file_url);
        e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"/>';
      }}
    />
  ) : prescription.file_url ? (
    <div className="w-full h-full flex flex-col items-center justify-center p-4">
      <FileText className="w-24 h-24 text-gray-400 mb-4" />
      <p className="text-sm text-gray-600 text-center">
        {prescription.file_type === 'application/pdf' ? 'PDF Document' : 'File Preview'}
      </p>
      <a 
        href={prescription.file_url} 
        target="_blank" 
        rel="noopener noreferrer"
        className="mt-4 text-blue-600 hover:underline text-sm"
      >
        Open in New Tab
      </a>
    </div>
  ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <FileText className="w-24 h-24 text-gray-400" />
                </div>
              )}
            </div>

            {/* AI Processing Buttons */}
            <div className="mt-4 space-y-3">
              {!prescription.ocr_processed && (
                <button
                  onClick={handleExtractText}
                  disabled={extracting}
                  className="w-full flex items-center justify-center space-x-2 bg-purple-600 text-white px-4 py-3 rounded-lg hover:bg-purple-700 disabled:opacity-50"
                >
                  {extracting ? (
                    <Loader className="w-5 h-5 animate-spin" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                  <span>{extracting ? 'Extracting...' : 'Extract Text with AI'}</span>
                </button>
              )}

              {prescription.ocr_processed && !prescription.ai_processed && (
                <button
                  onClick={handleSummarize}
                  disabled={summarizing}
                  className="w-full flex items-center justify-center space-x-2 bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {summarizing ? (
                    <Loader className="w-5 h-5 animate-spin" />
                  ) : (
                    <Brain className="w-5 h-5" />
                  )}
                  <span>{summarizing ? 'Processing...' : 'Analyze with AI'}</span>
                </button>
              )}

              {prescription.ai_processed && (
                <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg text-center">
                  <Sparkles className="w-5 h-5 inline mr-2" />
                  AI Processing Complete
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Details */}
        <div className="lg:col-span-2">
          {/* Tabs */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="border-b border-gray-200">
              <div className="flex">
                <button
                  onClick={() => setActiveTab('details')}
                  className={`flex-1 px-6 py-4 text-sm font-medium ${
                    activeTab === 'details'
                      ? 'border-b-2 border-blue-600 text-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Details
                </button>
                <button
                  onClick={() => setActiveTab('extracted')}
                  disabled={!prescription.ocr_processed}
                  className={`flex-1 px-6 py-4 text-sm font-medium ${
                    activeTab === 'extracted'
                      ? 'border-b-2 border-blue-600 text-blue-600'
                      : 'text-gray-600 hover:text-gray-900 disabled:text-gray-400 disabled:cursor-not-allowed'
                  }`}
                >
                  Extracted Text
                </button>
                <button
                  onClick={() => setActiveTab('medications')}
                  disabled={!prescription.ai_processed}
                  className={`flex-1 px-6 py-4 text-sm font-medium ${
                    activeTab === 'medications'
                      ? 'border-b-2 border-blue-600 text-blue-600'
                      : 'text-gray-600 hover:text-gray-900 disabled:text-gray-400 disabled:cursor-not-allowed'
                  }`}
                >
                  Medications
                </button>
                <button
                  onClick={() => setActiveTab('chat')}
                  disabled={!prescription.ai_processed}
                  className={`flex-1 px-6 py-4 text-sm font-medium ${
                    activeTab === 'chat'
                      ? 'border-b-2 border-blue-600 text-blue-600'
                      : 'text-gray-600 hover:text-gray-900 disabled:text-gray-400 disabled:cursor-not-allowed'
                  }`}
                >
                  AI Chat
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Details Tab */}
              {activeTab === 'details' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">File Name</label>
                    <p className="mt-1 text-gray-900">{prescription.file_name}</p>
                  </div>

                  {prescription.doctor_name && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Doctor Name</label>
                      <p className="mt-1 text-gray-900">{prescription.doctor_name}</p>
                    </div>
                  )}

                  {prescription.date_prescribed && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Date Prescribed</label>
                      <p className="mt-1 text-gray-900">{prescription.date_prescribed}</p>
                    </div>
                  )}

                  {prescription.notes && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Notes</label>
                      <p className="mt-1 text-gray-900">{prescription.notes}</p>
                    </div>
                  )}

                  <div>
                    <label className="text-sm font-medium text-gray-700">File Size</label>
                    <p className="mt-1 text-gray-900">
                      {(prescription.file_size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700">Uploaded At</label>
                    <p className="mt-1 text-gray-900">{formatDate(prescription.uploaded_at)}</p>
                  </div>
                </div>
              )}

              {/* Extracted Text Tab */}
              {activeTab === 'extracted' && (
                <div>
                  {prescription.extracted_text ? (
                    <div className="prose max-w-none">
                      <pre className="whitespace-pre-wrap bg-gray-50 p-4 rounded-lg text-sm">
                        {prescription.extracted_text}
                      </pre>
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">
                      No extracted text available. Click "Extract Text with AI" to process.
                    </p>
                  )}
                </div>
              )}

              {/* Medications Tab */}
              {activeTab === 'medications' && (
                <div className="space-y-6">
                  {prescription.summary && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h3 className="font-semibold text-blue-900 mb-2">Summary</h3>
                      <p className="text-blue-800">{prescription.summary}</p>
                    </div>
                  )}

                  {prescription.medications && prescription.medications.length > 0 ? (
                    <div className="space-y-4">
                      <h3 className="font-semibold text-gray-900">
                        Medications ({prescription.medications.length})
                      </h3>
                      {prescription.medications.map((med, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center space-x-2">
                              <Pill className="w-5 h-5 text-blue-600" />
                              <h4 className="font-semibold text-lg text-gray-900">{med.name}</h4>
                            </div>
                            <span className="text-sm font-medium text-blue-600">{med.dosage}</span>
                          </div>

                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-600">Frequency:</span>
                              <p className="text-gray-900 font-medium">{med.frequency}</p>
                            </div>
                            <div>
                              <span className="text-gray-600">Duration:</span>
                              <p className="text-gray-900 font-medium">{med.duration}</p>
                            </div>
                          </div>

                          {med.instructions && (
                            <div className="mt-3 text-sm">
                              <span className="text-gray-600">Instructions:</span>
                              <p className="text-gray-900">{med.instructions}</p>
                            </div>
                          )}

                          {med.times && med.times.length > 0 && (
                            <div className="mt-3 flex items-center space-x-2">
                              <Clock className="w-4 h-4 text-gray-500" />
                              <div className="flex flex-wrap gap-2">
                                {med.times.map((time, idx) => (
                                  <span key={idx} className="bg-gray-100 px-3 py-1 rounded-full text-sm">
                                    {time}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">
                      No medications found. Click "Analyze with AI" to extract medications.
                    </p>
                  )}
                </div>
              )}

              {/* Chat Tab */}
              {activeTab === 'chat' && (
                <div className="space-y-4">
                  {/* Chat History */}
                  <div className="h-96 overflow-y-auto space-y-4 bg-gray-50 rounded-lg p-4">
                    {loadingChat ? (
                      <div className="flex justify-center items-center h-full">
                        <Loader className="w-6 h-6 animate-spin text-blue-600" />
                      </div>
                    ) : chatHistory.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-center">
                        <MessageSquare className="w-12 h-12 text-gray-300 mb-4" />
                        <p className="text-gray-500">No chat history yet.</p>
                        <p className="text-sm text-gray-400">Ask AI about this prescription!</p>
                      </div>
                    ) : (
                      chatHistory.map((chat, index) => (
                        <div key={index} className="space-y-3">
                          {/* User Message */}
                          <div className="flex justify-end">
                            <div className="bg-blue-600 text-white rounded-lg px-4 py-2 max-w-md">
                              <p className="text-sm">{chat.user_message}</p>
                            </div>
                          </div>
                          {/* AI Response */}
                          <div className="flex justify-start">
                            <div className="bg-white border border-gray-200 rounded-lg px-4 py-2 max-w-md">
                              <p className="text-sm text-gray-900">{chat.ai_response}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Chat Input */}
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={chatMessage}
                      onChange={(e) => setChatMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendChat()}
                      placeholder="Ask AI about this prescription..."
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      disabled={sendingChat}
                    />
                    <button
                      onClick={handleSendChat}
                      disabled={sendingChat || !chatMessage.trim()}
                      className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      {sendingChat ? (
                        <Loader className="w-5 h-5 animate-spin" />
                      ) : (
                        <Send className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Delete Prescription?</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this prescription? This will also delete all extracted data and chat history.
            </p>
            <div className="flex space-x-4">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
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

export default PrescriptionDetailPage;