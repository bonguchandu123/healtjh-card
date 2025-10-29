import { useState, useEffect, useRef } from 'react';
import { 
  QrCode, User, Mail, Phone, Droplet, Calendar, AlertCircle,
  FileText, Pill, Activity, Heart, CheckCircle, XCircle, Search,
  Camera, Upload, X
} from 'lucide-react';
import jsQR from 'jsqr';

const ScanQRPage = () => {
  const [scanMode, setScanMode] = useState('manual');
  const [patientId, setPatientId] = useState('');
  const [scannedData, setScannedData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [scanning, setScanning] = useState(false);
   const VITE_API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const scanIntervalRef = useRef(null);

  const token = localStorage.getItem('token');

  useEffect(() => {
    if (scanMode === 'camera' && !cameraActive) {
      startCamera();
    } else if (scanMode !== 'camera' && cameraActive) {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [scanMode]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment', width: 640, height: 480 } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
        
        // Start continuous scanning
        videoRef.current.play();
        startContinuousScanning();
      }
    } catch (err) {
      setError('Failed to access camera. Please check permissions.');
      console.error('Camera error:', err);
    }
  };

  const stopCamera = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      setCameraActive(false);
    }
  };

  const startContinuousScanning = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
    }

    scanIntervalRef.current = setInterval(() => {
      scanQRFromVideo();
    }, 500); // Scan every 500ms
  };

  const scanQRFromVideo = () => {
    if (!videoRef.current || !canvasRef.current || !cameraActive || scanning) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);
      
      if (code) {
        setScanning(true);
        processQRData(code.data);
      }
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      await processQRImage(file);
    }
  };

  const processQRImage = async (imageFile) => {
    try {
      setLoading(true);
      setError(null);

      const img = new Image();
      const reader = new FileReader();

      reader.onload = (e) => {
        img.src = e.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);

          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          
          if (code) {
            processQRData(code.data);
          } else {
            setError('Could not read QR code. Please ensure the image is clear and try again.');
            setLoading(false);
          }
        };
      };

      reader.readAsDataURL(imageFile);
    } catch (err) {
      setError('Failed to process QR code image');
      console.error(err);
      setLoading(false);
    }
  };

  const processQRData = (qrDataString) => {
    try {
      console.log('QR Data:', qrDataString);
      
      // Parse the QR data
      const qrData = JSON.parse(qrDataString);
      
      if (qrData.patient_id) {
        setPatientId(qrData.patient_id);
        handleScanQR(null, qrData.patient_id);
      } else {
        setError('No patient ID found in QR code');
        setLoading(false);
        setScanning(false);
      }
    } catch (err) {
      // If JSON parse fails, maybe it's just the patient ID
      if (qrDataString.length === 24) { // MongoDB ObjectId length
        setPatientId(qrDataString);
        handleScanQR(null, qrDataString);
      } else {
        setError('Invalid QR code format. Please try manual entry.');
        setLoading(false);
        setScanning(false);
      }
    }
  };

  const handleScanQR = async (e, directPatientId = null) => {
    if (e) e.preventDefault();
    
    const idToUse = directPatientId || patientId;
    
    if (!idToUse.trim()) {
      setError('Please enter a patient ID');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(false);
      setScannedData(null);

      const response = await fetch(
        `${VITE_API_BASE_URL}/api/v1/doctor/scan-qr?patient_id=${idToUse}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to scan QR code');
      }

      const data = await response.json();
      setScannedData(data);
      setSuccess(true);
      stopCamera();

    } catch (err) {
      console.error('Scan QR error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
      setScanning(false);
    }
  };

  const handleReset = () => {
    setPatientId('');
    setScannedData(null);
    setError(null);
    setSuccess(false);
    setScanMode('manual');
    setScanning(false);
  };

  const QuickInfoCard = ({ icon: Icon, label, value, color }) => (
    <div className={`${color} rounded-lg p-4`}>
      <div className="flex items-center mb-2">
        <Icon className="w-5 h-5 mr-2 opacity-80" />
        <p className="text-sm opacity-90">{label}</p>
      </div>
      <p className="text-lg font-bold">{value || 0}</p>
    </div>
  );

  if (scannedData) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6 text-center">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Patient Information Retrieved</h1>
            <button
              onClick={handleReset}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              ← Scan Another Patient
            </button>
          </div>

          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg shadow-lg p-6 text-white mb-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <User className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-1">{scannedData.patient?.full_name}</h2>
                  <div className="flex items-center space-x-4 text-blue-100">
                    <div className="flex items-center">
                      <Mail className="w-4 h-4 mr-1" />
                      <span className="text-sm">{scannedData.patient?.email}</span>
                    </div>
                    {scannedData.patient?.phone_number && (
                      <div className="flex items-center">
                        <Phone className="w-4 h-4 mr-1" />
                        <span className="text-sm">{scannedData.patient.phone_number}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              {scannedData.patient?.blood_group && (
                <div className="px-4 py-2 bg-red-500 rounded-lg">
                  <p className="text-xs opacity-90 mb-1">Blood Group</p>
                  <p className="text-xl font-bold">{scannedData.patient.blood_group}</p>
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-white border-opacity-20">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="opacity-75">Gender</p>
                  <p className="font-semibold">{scannedData.patient?.gender || 'N/A'}</p>
                </div>
                <div>
                  <p className="opacity-75">Date of Birth</p>
                  <p className="font-semibold">{scannedData.patient?.date_of_birth || 'N/A'}</p>
                </div>
                <div>
                  <p className="opacity-75">Address</p>
                  <p className="font-semibold text-xs">{scannedData.patient?.address || 'N/A'}</p>
                </div>
                <div>
                  <p className="opacity-75">Member Since</p>
                  <p className="font-semibold">
                    {scannedData.patient?.created_at 
                      ? new Date(scannedData.patient.created_at).toLocaleDateString() 
                      : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {scannedData.patient?.emergency_contact && (
            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-red-800 mb-4 flex items-center">
                <AlertCircle className="w-5 h-5 mr-2" />
                Emergency Contact
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Name</p>
                  <p className="font-semibold text-gray-800">{scannedData.patient.emergency_contact.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Relationship</p>
                  <p className="font-semibold text-gray-800">{scannedData.patient.emergency_contact.relationship}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Phone Number</p>
                  <p className="font-semibold text-gray-800">{scannedData.patient.emergency_contact.phone}</p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <QuickInfoCard icon={FileText} label="Prescriptions" value={scannedData.prescriptions?.length} color="bg-blue-100 text-blue-800" />
            <QuickInfoCard icon={Pill} label="Active Medications" value={scannedData.active_medications?.length} color="bg-green-100 text-green-800" />
            <QuickInfoCard icon={Calendar} label="Appointments" value={scannedData.appointment_history?.length} color="bg-purple-100 text-purple-800" />
            <QuickInfoCard icon={Activity} label="Vitals Records" value={scannedData.vitals?.length} color="bg-orange-100 text-orange-800" />
          </div>

          {scannedData.vitals && scannedData.vitals.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <Activity className="w-5 h-5 mr-2 text-orange-600" />
                Latest Vital Signs
              </h3>
              {(() => {
                const latestVital = scannedData.vitals[0];
                return (
                  <div>
                    <p className="text-sm text-gray-600 mb-4">
                      Recorded: {new Date(latestVital.recorded_at).toLocaleString()}
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {latestVital.heart_rate && (
                        <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                          <Heart className="w-5 h-5 text-red-600 mb-2" />
                          <p className="text-sm text-gray-600">Heart Rate</p>
                          <p className="text-2xl font-bold text-gray-800">{latestVital.heart_rate} <span className="text-xs">bpm</span></p>
                        </div>
                      )}
                      {latestVital.blood_pressure_systolic && (
                        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                          <Activity className="w-5 h-5 text-blue-600 mb-2" />
                          <p className="text-sm text-gray-600">Blood Pressure</p>
                          <p className="text-2xl font-bold text-gray-800">{latestVital.blood_pressure_systolic}/{latestVital.blood_pressure_diastolic}</p>
                        </div>
                      )}
                      {latestVital.temperature && (
                        <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                          <Activity className="w-5 h-5 text-orange-600 mb-2" />
                          <p className="text-sm text-gray-600">Temperature</p>
                          <p className="text-2xl font-bold text-gray-800">{latestVital.temperature}°F</p>
                        </div>
                      )}
                      {latestVital.weight && (
                        <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                          <Activity className="w-5 h-5 text-purple-600 mb-2" />
                          <p className="text-sm text-gray-600">Weight</p>
                          <p className="text-2xl font-bold text-gray-800">{latestVital.weight} kg</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {scannedData.active_medications && scannedData.active_medications.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <Pill className="w-5 h-5 mr-2 text-green-600" />
                Current Medications ({scannedData.active_medications.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {scannedData.active_medications.map((med, index) => (
                  <div key={index} className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="font-semibold text-gray-800 mb-1">{med.medication_name}</p>
                    <p className="text-sm text-gray-600 mb-2">{med.dosage} - {med.frequency}</p>
                    {med.instructions && <p className="text-xs text-gray-500">{med.instructions}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {scannedData.prescriptions && scannedData.prescriptions.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-blue-600" />
                Recent Prescriptions ({scannedData.prescriptions.length})
              </h3>
              <div className="space-y-3">
                {scannedData.prescriptions.slice(0, 5).map((prescription, index) => (
                  <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-gray-800 mb-1">{prescription.file_name}</p>
                        <p className="text-sm text-gray-600">Uploaded: {new Date(prescription.uploaded_at).toLocaleDateString()}</p>
                        {prescription.summary && <p className="text-sm text-gray-700 mt-2 line-clamp-2">{prescription.summary}</p>}
                      </div>
                      {prescription.file_url && (
                        <a href={prescription.file_url} target="_blank" rel="noopener noreferrer" className="ml-4 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">
                          View
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <QrCode className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Scan Patient QR Code</h1>
          <p className="text-gray-600">Choose your preferred scanning method</p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="grid grid-cols-3 gap-4 mb-6">
            <button onClick={() => setScanMode('manual')} className={`p-4 rounded-lg border-2 transition-all ${scanMode === 'manual' ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
              <Search className={`w-8 h-8 mx-auto mb-2 ${scanMode === 'manual' ? 'text-blue-600' : 'text-gray-400'}`} />
              <p className={`text-sm font-medium ${scanMode === 'manual' ? 'text-blue-600' : 'text-gray-600'}`}>Manual Entry</p>
            </button>

            <button onClick={() => setScanMode('camera')} className={`p-4 rounded-lg border-2 transition-all ${scanMode === 'camera' ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
              <Camera className={`w-8 h-8 mx-auto mb-2 ${scanMode === 'camera' ? 'text-blue-600' : 'text-gray-400'}`} />
              <p className={`text-sm font-medium ${scanMode === 'camera' ? 'text-blue-600' : 'text-gray-600'}`}>Scan with Camera</p>
            </button>

            <button onClick={() => setScanMode('upload')} className={`p-4 rounded-lg border-2 transition-all ${scanMode === 'upload' ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
              <Upload className={`w-8 h-8 mx-auto mb-2 ${scanMode === 'upload' ? 'text-blue-600' : 'text-gray-400'}`} />
              <p className={`text-sm font-medium ${scanMode === 'upload' ? 'text-blue-600' : 'text-gray-600'}`}>Upload QR Image</p>
            </button>
          </div>

          {scanMode === 'manual' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Patient ID</label>
              <div className="relative">
                <Search className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                <input type="text" value={patientId} onChange={(e) => setPatientId(e.target.value)} placeholder="Enter patient ID from QR code..." className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" disabled={loading} />
              </div>
              <button onClick={handleScanQR} disabled={loading || !patientId.trim()} className="w-full mt-4 flex items-center justify-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Retrieving...</span>
                  </>
                ) : (
                  <>
                    <QrCode className="w-5 h-5" />
                    <span>Get Patient Info</span>
                  </>
                )}
              </button>
            </div>
          )}

          {scanMode === 'camera' && (
            <div>
              <div className="relative bg-black rounded-lg overflow-hidden mb-4" style={{ height: '400px' }}>
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                <canvas ref={canvasRef} className="hidden" />
                {scanning && (
                  <div className="absolute inset-0 flex items-center justify-center bg-green-500 bg-opacity-20">
                    <div className="bg-white rounded-lg p-4 shadow-lg">
                      <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                      <p className="text-green-800 font-medium">QR Code Detected!</p>
                    </div>
                  </div>
                )}
                {!cameraActive && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50">
                    <p className="text-white">Initializing camera...</p>
                  </div>
                )}
                <div className="absolute inset-0 border-4 border-blue-500 border-dashed m-20 rounded-lg pointer-events-none"></div>
              </div>
              <p className="text-sm text-center text-gray-600 mb-2">Position the QR code within the frame - scanning automatically</p>
              <p className="text-xs text-center text-gray-500">{cameraActive ? '📷 Camera active - Point at QR code' : '⏳ Starting camera...'}</p>
            </div>
          )}

          {scanMode === 'upload' && (
            <div>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
              <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-700 font-medium mb-2">Click to upload QR code image</p>
                <p className="text-sm text-gray-500">Supports JPG, PNG formats</p>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
              <XCircle className="w-5 h-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-800 font-medium">Scan Failed</p>
                <p className="text-red-600 text-sm mt-1">{error}</p>
              </div>
            </div>
          )}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-3">Quick Guide</h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li>• <strong>Manual Entry:</strong> Type the patient ID shown in the QR code</li>
            <li>• <strong>Camera Scan:</strong> Point camera at QR code - scans automatically</li>
            <li>• <strong>Upload Image:</strong> Upload a photo of the QR code from your device</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ScanQRPage;