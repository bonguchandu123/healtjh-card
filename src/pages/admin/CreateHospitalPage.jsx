import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Globe,
  Save,
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  Navigation,
  Plus,
  X,
  Clock
} from 'lucide-react';

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api/v1`;

const CreateHospitalPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    operating_hours: '',
    location: {
      type: 'Point',
      coordinates: []
    }
  });

  const [services, setServices] = useState([]);
  const [currentService, setCurrentService] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleAddService = () => {
    if (currentService.trim() && !services.includes(currentService.trim())) {
      setServices([...services, currentService.trim()]);
      setCurrentService('');
    }
  };

  const handleRemoveService = (index) => {
    setServices(services.filter((_, i) => i !== index));
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddService();
    }
  };

  const getCurrentLocation = () => {
    setGettingLocation(true);
    setMessage({ type: '', text: '' });

    if (!navigator.geolocation) {
      setMessage({ type: 'error', text: 'Geolocation is not supported by your browser' });
      setGettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData({
          ...formData,
          location: {
            type: 'Point',
            coordinates: [position.coords.longitude, position.coords.latitude]
          }
        });
        setMessage({ 
          type: 'success', 
          text: `Location acquired: ${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}` 
        });
        setGettingLocation(false);
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      },
      (error) => {
        console.error('Error getting location:', error);
        setMessage({ 
          type: 'error', 
          text: 'Unable to get location. Please enable location services.' 
        });
        setGettingLocation(false);
      }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const token = localStorage.getItem('token');
      
      const hospitalData = {
        ...formData,
        services: services.length > 0 ? services : undefined,
        location: formData.location.coordinates.length > 0 ? formData.location : undefined
      };

      await axios.post(
        `${API_BASE_URL}/admin/hospitals`,
        hospitalData,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setMessage({ type: 'success', text: 'Hospital created successfully!' });
      
      setTimeout(() => {
        navigate('/admin/hospitals');
      }, 1500);
      
    } catch (err) {
      console.error('Error creating hospital:', err);
      setMessage({
        type: 'error',
        text: err.response?.data?.detail || 'Failed to create hospital'
      });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/admin/hospitals')}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Hospitals
          </button>
          
          <h1 className="text-4xl font-bold text-gray-800 flex items-center gap-3">
            <Building2 className="w-10 h-10 text-blue-600" />
            Create New Hospital
          </h1>
          <p className="text-gray-600 mt-2">Add a new hospital to your network</p>
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

        {/* Form Card */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Hospital Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hospital Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., City General Hospital"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Complete address with city, state, and postal code"
                  rows="3"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>

            {/* Location Coordinates */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location Coordinates (Optional)
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={getCurrentLocation}
                  disabled={gettingLocation}
                  className="flex items-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Navigation className={`w-5 h-5 ${gettingLocation ? 'animate-pulse' : ''}`} />
                  {gettingLocation ? 'Getting Location...' : 'Get Current Location'}
                </button>
                
                {formData.location.coordinates.length > 0 && (
                  <div className="flex-1 px-4 py-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-800">
                      <span className="font-medium">Coordinates: </span>
                      Lat: {formData.location.coordinates[1].toFixed(4)}, 
                      Lng: {formData.location.coordinates[0].toFixed(4)}
                    </p>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Used for nearby hospital search. You can set this manually or use your current location.
              </p>
            </div>

            {/* Phone & Email */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+1-555-0123"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="contact@hospital.com"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Website */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Website
              </label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="url"
                  name="website"
                  value={formData.website}
                  onChange={handleInputChange}
                  placeholder="https://hospital.com"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Operating Hours */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Operating Hours
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  name="operating_hours"
                  value={formData.operating_hours}
                  onChange={handleInputChange}
                  placeholder="e.g., 24/7 Emergency Services or Mon-Fri: 9AM-6PM"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Services */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Services Offered
              </label>
              
              <div className="flex gap-3 mb-3">
                <input
                  type="text"
                  value={currentService}
                  onChange={(e) => setCurrentService(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="e.g., Emergency Care, Surgery, Cardiology"
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={handleAddService}
                  className="flex items-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  <Plus className="w-5 h-5" />
                  Add
                </button>
              </div>

              {services.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {services.map((service, index) => (
                    <span
                      key={index}
                      className="flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg font-medium"
                    >
                      {service}
                      <button
                        type="button"
                        onClick={() => handleRemoveService(index)}
                        className="hover:bg-blue-200 rounded-full p-1 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Quick Tips:</p>
                  <ul className="list-disc list-inside space-y-1 text-blue-700">
                    <li>Use the location button to automatically set coordinates</li>
                    <li>Add multiple services by typing and clicking "Add"</li>
                    <li>Complete address helps patients find your hospital easily</li>
                    <li>Fields marked with * are required</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-4 pt-6 border-t border-gray-200">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-lg disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
              >
                <Save className="w-5 h-5" />
                {loading ? 'Creating Hospital...' : 'Create Hospital'}
              </button>
              
              <button
                type="button"
                onClick={() => navigate('/admin/hospitals')}
                className="px-8 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium text-lg"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>

        {/* Preview Section */}
        {formData.name && (
          <div className="mt-6 bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              Hospital Preview
            </h3>
            
            <div className="space-y-2 text-sm">
              <p><span className="font-medium text-gray-700">Name:</span> {formData.name}</p>
              {formData.address && (
                <p><span className="font-medium text-gray-700">Address:</span> {formData.address}</p>
              )}
              {formData.phone && (
                <p><span className="font-medium text-gray-700">Phone:</span> {formData.phone}</p>
              )}
              {formData.email && (
                <p><span className="font-medium text-gray-700">Email:</span> {formData.email}</p>
              )}
              {formData.website && (
                <p><span className="font-medium text-gray-700">Website:</span> {formData.website}</p>
              )}
              {formData.operating_hours && (
                <p><span className="font-medium text-gray-700">Hours:</span> {formData.operating_hours}</p>
              )}
              {services.length > 0 && (
                <p><span className="font-medium text-gray-700">Services:</span> {services.join(', ')}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateHospitalPage;