import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MapPin,
  Navigation,
  Search,
  Phone,
  Mail,
  Globe,
  Star,
  Clock,
  Building,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader,
  Calendar,
  Award
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const HospitalsPage = () => {
  const navigate = useNavigate();
  
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const { token } = useAuth();
  
  const [location, setLocation] = useState({
    latitude: null,
    longitude: null,
    city: ''
  });
  const VITE_API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
  const [radius, setRadius] = useState(10); // Default 10km
  const [gettingLocation, setGettingLocation] = useState(false);

  const getCurrentLocation = () => {
    setGettingLocation(true);
    setError('');

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setGettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setLocation({ latitude, longitude, city: 'Current Location' });
        setGettingLocation(false);
        
        // Auto-fetch hospitals
        await fetchNearbyHospitals(latitude, longitude, radius);
      },
      (error) => {
        setError('Unable to get your location. Please enable location services.');
        setGettingLocation(false);
        console.error('Geolocation error:', error);
      }
    );
  };

  const fetchNearbyHospitals = async (lat, lng, rad) => {
    try {
      setLoading(true);
      setError('');
      
   
      const response = await fetch(`${VITE_API_BASE_URL}/api/v1/patient/hospitals/nearby`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          latitude: lat,
          longitude: lng,
          radius: rad
        })
      });

      if (!response.ok) throw new Error('Failed to fetch nearby hospitals');

      const data = await response.json();
      setHospitals(data.hospitals || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (location.latitude && location.longitude) {
      fetchNearbyHospitals(location.latitude, location.longitude, radius);
    } else {
      setError('Please get your current location first');
    }
  };

  const filteredHospitals = hospitals.filter(hospital => 
    hospital.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    hospital.address?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderRating = (rating, totalRatings) => {
    if (!rating) return null;
    
    return (
      <div className="flex items-center space-x-2">
        <div className="flex items-center">
          <Star className="w-4 h-4 text-yellow-500 fill-current" />
          <span className="ml-1 text-sm font-medium text-gray-900">{rating.toFixed(1)}</span>
        </div>
        {totalRatings && (
          <span className="text-xs text-gray-500">({totalRatings} reviews)</span>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="bg-blue-100 p-3 rounded-lg">
            <MapPin className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Find Nearby Hospitals</h1>
            <p className="text-gray-600">Discover hospitals near you with Google Maps integration</p>
          </div>
        </div>
      </div>

      {/* Location & Search Controls */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="space-y-4">
          {/* Get Location Button */}
          <div className="flex items-center space-x-4">
            <button
              onClick={getCurrentLocation}
              disabled={gettingLocation}
              className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {gettingLocation ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  <span>Getting Location...</span>
                </>
              ) : (
                <>
                  <Navigation className="w-5 h-5" />
                  <span>Get My Location</span>
                </>
              )}
            </button>

            {location.latitude && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span>Location: {location.city}</span>
                <span className="text-xs text-gray-400">
                  ({location.latitude.toFixed(4)}, {location.longitude.toFixed(4)})
                </span>
              </div>
            )}
          </div>

          {/* Radius Selector */}
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700">Search Radius:</label>
            <select
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value={5}>5 km</option>
              <option value={10}>10 km</option>
              <option value={15}>15 km</option>
              <option value={20}>20 km</option>
              <option value={30}>30 km</option>
            </select>

            <button
              onClick={handleSearch}
              disabled={!location.latitude || loading}
              className="flex items-center space-x-2 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              <Search className="w-5 h-5" />
              <span>Search Hospitals</span>
            </button>
          </div>

          {/* Search Filter */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Filter by hospital name or address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
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

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start space-x-3">
          <MapPin className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-semibold mb-1">How it works:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Click "Get My Location" to allow location access</li>
              <li>Choose your preferred search radius (5-30 km)</li>
              <li>Click "Search Hospitals" to find nearby hospitals</li>
              <li>View real hospitals from Google Maps + our demo CarePlus Hospital</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Searching for nearby hospitals...</p>
          </div>
        </div>
      )}

      {/* Hospitals List */}
      {!loading && filteredHospitals.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Found {filteredHospitals.length} Hospital{filteredHospitals.length !== 1 ? 's' : ''}
            </h2>
          </div>

          <div className="space-y-4">
            {filteredHospitals.map((hospital, index) => (
              <div 
                key={hospital.place_id || hospital.id || index}
                className={`bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow ${
                  hospital.is_pinned ? 'ring-2 ring-blue-500' : ''
                }`}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className={`p-3 rounded-lg ${
                        hospital.is_pinned ? 'bg-blue-100' : 'bg-gray-100'
                      }`}>
                        <Building className={`w-8 h-8 ${
                          hospital.is_pinned ? 'text-blue-600' : 'text-gray-600'
                        }`} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <h3 className="text-xl font-semibold text-gray-900">
                                {hospital.name}
                              </h3>
                              {hospital.is_pinned && (
                                <span className="inline-flex items-center space-x-1 px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                                  <Award className="w-3 h-3" />
                                  <span>Demo Hospital</span>
                                </span>
                              )}
                            </div>
                            
                            {renderRating(hospital.rating, hospital.total_ratings)}
                          </div>
                        </div>

                        <div className="mt-3 space-y-2">
                          <div className="flex items-start text-sm text-gray-600">
                            <MapPin className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" />
                            <span>{hospital.address}</span>
                          </div>

                          {hospital.phone && (
                            <div className="flex items-center text-sm text-gray-600">
                              <Phone className="w-4 h-4 mr-2 flex-shrink-0" />
                              <span>{hospital.phone}</span>
                            </div>
                          )}

                          {hospital.email && (
                            <div className="flex items-center text-sm text-gray-600">
                              <Mail className="w-4 h-4 mr-2 flex-shrink-0" />
                              <span>{hospital.email}</span>
                            </div>
                          )}

                          {hospital.website && (
                            <div className="flex items-center text-sm text-gray-600">
                              <Globe className="w-4 h-4 mr-2 flex-shrink-0" />
                              <a 
                                href={hospital.website} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                              >
                                Visit Website
                              </a>
                            </div>
                          )}

                          {/* Operating Status */}
                          {hospital.is_open !== undefined && (
                            <div className="flex items-center text-sm">
                              {hospital.is_open ? (
                                <span className="flex items-center text-green-600">
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Open Now
                                </span>
                              ) : (
                                <span className="flex items-center text-red-600">
                                  <XCircle className="w-4 h-4 mr-1" />
                                  Closed
                                </span>
                              )}
                            </div>
                          )}

                          {hospital.distance && (
                            <div className="flex items-center text-sm text-blue-600 font-medium">
                              <Navigation className="w-4 h-4 mr-1" />
                              {hospital.distance}
                            </div>
                          )}
                        </div>

                        {/* Services */}
                        {hospital.services && hospital.services.length > 0 && (
                          <div className="mt-4">
                            <p className="text-xs font-medium text-gray-700 mb-2">Services:</p>
                            <div className="flex flex-wrap gap-2">
                              {hospital.services.map((service, idx) => (
                                <span 
                                  key={idx}
                                  className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                                >
                                  {service}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="mt-4 flex items-center space-x-3">
                          {hospital.is_pinned && (
                            <button
                              onClick={() => navigate('/patient/appointments/book')}
                              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                            >
                              <Calendar className="w-4 h-4" />
                              <span>Book Appointment</span>
                            </button>
                          )}

                          {hospital.place_id && (
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(hospital.name)}&query_place_id=${hospital.place_id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center space-x-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200"
                            >
                              <MapPin className="w-4 h-4" />
                              <span>View on Maps</span>
                            </a>
                          )}

                          {hospital.phone && !hospital.phone.includes('via') && (
                            <a
                              href={`tel:${hospital.phone}`}
                              className="flex items-center space-x-2 bg-green-50 text-green-700 px-4 py-2 rounded-lg hover:bg-green-100"
                            >
                              <Phone className="w-4 h-4" />
                              <span>Call</span>
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Results */}
      {!loading && !error && filteredHospitals.length === 0 && location.latitude && (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <Building className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No hospitals found</h3>
          <p className="text-gray-600 mb-4">
            {searchQuery 
              ? 'Try adjusting your search query or increase the search radius'
              : 'No hospitals found in this area. Try increasing the search radius.'}
          </p>
        </div>
      )}

      {/* Initial State - No Location */}
      {!loading && !error && !location.latitude && (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <Navigation className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Get Started</h3>
          <p className="text-gray-600 mb-6">
            Click "Get My Location" to find hospitals near you
          </p>
          <button
            onClick={getCurrentLocation}
            disabled={gettingLocation}
            className="inline-flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
          >
            <Navigation className="w-5 h-5" />
            <span>Get My Location</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default HospitalsPage;