import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  QrCode, Download, Printer, AlertCircle, User, Droplet,
  Phone, Calendar, Mail, RefreshCw, Shield, Heart, Info, ExternalLink
} from 'lucide-react';

const QRCodePage = () => {
  const { token, user } = useAuth();
  const [qrData, setQrData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const VITE_API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
  const VITE_FRONTEND_BASE_URL = import.meta.env.VITE_FRONTEND_BASE_URL || 'http://localhost:3000';

  useEffect(() => {
    generateQRCode();
  }, []);

  const generateQRCode = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${VITE_API_BASE_URL}/api/v1/patient/qr-code`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setQrData(data);
        
        // ✅ FIX: Generate URL instead of JSON string
        // This URL points to the public scan page
        const scanUrl = `${window.location.origin}/scan/${data.patient_id}`;
        
        // Generate QR code that contains the URL
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(scanUrl)}`;
        setQrCodeUrl(qrUrl);
      }
    } catch (error) {
      console.error('Error generating QR code:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadQRCode = () => {
    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = `${user.full_name.replace(/\s+/g, '_')}_Health_QR.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const printQRCode = () => {
    const scanUrl = `${window.location.origin}/scan/${qrData.patient_id}`;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Health QR Code - ${user.full_name}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              padding: 20px;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
            }
            .header h1 {
              color: #1f2937;
              margin-bottom: 10px;
            }
            .qr-container {
              border: 3px solid #3b82f6;
              padding: 20px;
              border-radius: 10px;
              margin-bottom: 30px;
            }
            .scan-url {
              background: #f3f4f6;
              padding: 15px;
              border-radius: 8px;
              margin-bottom: 20px;
              font-family: monospace;
              word-break: break-all;
            }
            .info-section {
              width: 100%;
              max-width: 600px;
              border: 1px solid #e5e7eb;
              border-radius: 10px;
              padding: 20px;
              margin-bottom: 20px;
            }
            .info-row {
              display: flex;
              justify-content: space-between;
              padding: 10px 0;
              border-bottom: 1px solid #e5e7eb;
            }
            .info-row:last-child {
              border-bottom: none;
            }
            .emergency {
              background-color: #fef2f2;
              border: 2px solid #ef4444;
              padding: 15px;
              border-radius: 8px;
              margin-top: 20px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🏥 Digital Health Card</h1>
            <h2>${user.full_name}</h2>
            <p>Emergency Access QR Code</p>
          </div>
          
          <div class="qr-container">
            <img src="${qrCodeUrl}" alt="Health QR Code" style="width: 300px; height: 300px;" />
          </div>
          
          <div class="scan-url">
            <strong>Scan URL:</strong><br/>
            ${scanUrl}
          </div>
          
          <div class="info-section">
            <h3>Patient Information</h3>
            <div class="info-row">
              <span><strong>Name:</strong></span>
              <span>${qrData?.patient_name || 'N/A'}</span>
            </div>
            <div class="info-row">
              <span><strong>Blood Group:</strong></span>
              <span style="color: #dc2626; font-weight: bold;">${qrData?.blood_group || 'N/A'}</span>
            </div>
            <div class="info-row">
              <span><strong>Date of Birth:</strong></span>
              <span>${qrData?.date_of_birth || 'N/A'}</span>
            </div>
            <div class="info-row">
              <span><strong>Phone:</strong></span>
              <span>${qrData?.phone_number || 'N/A'}</span>
            </div>
          </div>
          
          ${qrData?.emergency_contact ? `
            <div class="emergency">
              <h3>⚠️ Emergency Contact</h3>
              <p><strong>Name:</strong> ${qrData.emergency_contact.name}</p>
              <p><strong>Relationship:</strong> ${qrData.emergency_contact.relationship}</p>
              <p><strong>Phone:</strong> ${qrData.emergency_contact.phone}</p>
            </div>
          ` : ''}
          
          <p style="text-align: center; color: #6b7280; margin-top: 30px; font-size: 12px;">
            Generated on ${new Date().toLocaleString()}
          </p>
        </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const testScanUrl = () => {
    const scanUrl = `${window.location.origin}/scan/${qrData.patient_id}`;
    window.open(scanUrl, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Generating QR Code...</p>
        </div>
      </div>
    );
  }

  const scanUrl = qrData ? `${window.location.origin}/scan/${qrData.patient_id}` : '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">🔲 My Health QR Code</h1>
          <p className="text-gray-600">Quick access to your emergency health information</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* QR Code Section */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-4">
                <QrCode className="text-white" size={32} />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Your Health QR Code</h2>
              <p className="text-sm text-gray-600 mb-6">
                Scan this code for instant access to your emergency health information
              </p>

              {/* QR Code Display */}
              {qrCodeUrl && (
                <div className="bg-gradient-to-br from-blue-100 to-purple-100 p-6 rounded-xl mb-6 inline-block">
                  <div className="bg-white p-4 rounded-lg shadow-lg">
                    <img 
                      src={qrCodeUrl} 
                      alt="Health QR Code"
                      className="w-64 h-64 mx-auto"
                    />
                  </div>
                </div>
              )}

              {/* Scan URL Display */}
              {scanUrl && (
                <div className="bg-gray-50 p-4 rounded-lg mb-4 border border-gray-200">
                  <p className="text-xs text-gray-500 mb-2">Scan URL:</p>
                  <p className="text-xs font-mono text-gray-700 break-all">{scanUrl}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col space-y-3">
                <button
                  onClick={testScanUrl}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 rounded-lg font-semibold hover:from-green-600 hover:to-emerald-700 transition-all flex items-center justify-center space-x-2"
                >
                  <ExternalLink size={20} />
                  <span>Test QR Scan Page</span>
                </button>

                <button
                  onClick={downloadQRCode}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all flex items-center justify-center space-x-2"
                >
                  <Download size={20} />
                  <span>Download QR Code</span>
                </button>

                <button
                  onClick={printQRCode}
                  className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2"
                >
                  <Printer size={20} />
                  <span>Print QR Code</span>
                </button>

                <button
                  onClick={generateQRCode}
                  className="w-full border-2 border-blue-500 text-blue-600 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors flex items-center justify-center space-x-2"
                >
                  <RefreshCw size={20} />
                  <span>Regenerate Code</span>
                </button>
              </div>
            </div>
          </div>

          {/* Information Section - Same as before */}
          <div className="space-y-6">
            {/* Patient Information */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="text-blue-600" size={20} />
                </div>
                <h3 className="text-xl font-bold text-gray-800">Patient Information</h3>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-600 flex items-center space-x-2">
                    <User size={16} />
                    <span>Name</span>
                  </span>
                  <span className="font-semibold text-gray-800">{qrData?.patient_name || 'N/A'}</span>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-600 flex items-center space-x-2">
                    <Mail size={16} />
                    <span>Email</span>
                  </span>
                  <span className="font-semibold text-gray-800 text-sm">{qrData?.patient_email || 'N/A'}</span>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-600 flex items-center space-x-2">
                    <Droplet size={16} />
                    <span>Blood Group</span>
                  </span>
                  <span className="font-semibold text-red-600 text-lg">{qrData?.blood_group || 'N/A'}</span>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-600 flex items-center space-x-2">
                    <Calendar size={16} />
                    <span>Date of Birth</span>
                  </span>
                  <span className="font-semibold text-gray-800">{qrData?.date_of_birth || 'N/A'}</span>
                </div>

                <div className="flex items-center justify-between py-2">
                  <span className="text-gray-600 flex items-center space-x-2">
                    <Phone size={16} />
                    <span>Phone</span>
                  </span>
                  <span className="font-semibold text-gray-800">{qrData?.phone_number || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            {qrData?.emergency_contact && (
              <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-xl shadow-lg p-6 border-2 border-red-200">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center">
                    <AlertCircle className="text-white" size={20} />
                  </div>
                  <h3 className="text-xl font-bold text-red-800">Emergency Contact</h3>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2 border-b border-red-200">
                    <span className="text-red-700 flex items-center space-x-2">
                      <User size={16} />
                      <span>Name</span>
                    </span>
                    <span className="font-semibold text-red-900">{qrData.emergency_contact.name}</span>
                  </div>

                  <div className="flex items-center justify-between py-2 border-b border-red-200">
                    <span className="text-red-700 flex items-center space-x-2">
                      <Heart size={16} />
                      <span>Relationship</span>
                    </span>
                    <span className="font-semibold text-red-900">{qrData.emergency_contact.relationship}</span>
                  </div>

                  <div className="flex items-center justify-between py-2">
                    <span className="text-red-700 flex items-center space-x-2">
                      <Phone size={16} />
                      <span>Phone</span>
                    </span>
                    <span className="font-semibold text-red-900">{qrData.emergency_contact.phone}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Usage Instructions */}
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl shadow-lg p-6 border border-blue-200">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                  <Info className="text-white" size={20} />
                </div>
                <h3 className="text-xl font-bold text-gray-800">How to Use</h3>
              </div>

              <ul className="space-y-3 text-sm text-gray-700">
                <li className="flex items-start space-x-2">
                  <Shield className="text-blue-600 mt-1 flex-shrink-0" size={16} />
                  <span>Download or print your QR code and keep it accessible</span>
                </li>
                <li className="flex items-start space-x-2">
                  <Shield className="text-blue-600 mt-1 flex-shrink-0" size={16} />
                  <span>Medical professionals can scan with any QR reader</span>
                </li>
                <li className="flex items-start space-x-2">
                  <Shield className="text-blue-600 mt-1 flex-shrink-0" size={16} />
                  <span>Works at ANY hospital - no login required</span>
                </li>
                <li className="flex items-start space-x-2">
                  <Shield className="text-blue-600 mt-1 flex-shrink-0" size={16} />
                  <span>All scans are logged for your security</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-8 bg-yellow-50 border-2 border-yellow-300 rounded-xl p-6">
          <div className="flex items-start space-x-3">
            <AlertCircle className="text-yellow-600 mt-1 flex-shrink-0" size={24} />
            <div>
              <h3 className="font-bold text-yellow-800 mb-2">Security Notice</h3>
              <p className="text-sm text-yellow-700">
                This QR code provides PUBLIC access to your health information for emergency situations. 
                Anyone with this code can view your medical data. Keep it secure and only share with 
                trusted healthcare providers.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRCodePage;