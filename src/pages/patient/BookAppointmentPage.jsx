import { useState, useEffect } from 'react';
import { 
  ArrowLeft,
  Calendar,
  Clock,
  FileText,
  AlertCircle,
  User,
  Phone,
  Mail,
  Building,
  CheckCircle,
  Pill,
  Heart,
  Shield,
  Loader,
  MapPin,
  Star
} from 'lucide-react';

const BookAppointmentPage = () => {
  // Mock navigation - replace with your actual router
  const navigate = (path) => {
    console.log('Navigate to:', path);
    window.location.href = path;
  };
  
  const [hospitals, setHospitals] = useState([]);
  const [loadingHospitals, setLoadingHospitals] = useState(true);
  const [selectedHospital, setSelectedHospital] = useState(null);
  
  // Updated form data - removed hospital_id, set default appointment_type
  const [formData, setFormData] = useState({
    symptoms: '',
    preferred_date: '',
    preferred_time: '',
    appointment_type: 'general', // Default value
    reason_for_visit: '',
    medical_history: '',
    current_medications: '',
    allergies: '',
    insurance_info: ''
  });

  const [currentStep, setCurrentStep] = useState(0);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Updated appointment types to match backend validation
  const appointmentTypes = [
    { value: 'general', label: 'General Consultation' },
    { value: 'emergency', label: 'Emergency Care' },
    { value: 'follow-up', label: 'Follow-up Visit' },
    { value: 'consultation', label: 'Consultation' },
    { value: 'specialist', label: 'Specialist Consultation' }
  ];

  const timeSlots = [
    '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
    '12:00 PM', '12:30 PM', '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM',
    '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM'
  ];

  useEffect(() => {
    fetchHospitals();
  }, []);

  const fetchHospitals = async () => {
    try {
      setLoadingHospitals(true);
      setError('');
      
      console.log('Fetching hospitals from: http://localhost:8000/api/v1/public/hospitals');
      
      const response = await fetch('http://localhost:8000/api/v1/public/hospitals', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch hospitals: ${response.status}`);
      }

      const data = await response.json();
      console.log('Fetched hospitals:', data);
      
      // Filter to show only pinned hospital (CarePlus) since backend only supports it
      // ✅ NEW CODE - Shows ALL hospitals, pinned ones first
const sortedHospitals = data.sort((a, b) => {
  if (a.is_pinned && !b.is_pinned) return -1;
  if (!a.is_pinned && b.is_pinned) return 1;
  return 0;
});
setHospitals(sortedHospitals);
     
      
    } catch (err) {
      console.error('Fetch hospitals error:', err);
      setError(`Unable to load hospitals: ${err.message}`);
    } finally {
      setLoadingHospitals(false);
    }
  };

  const validateStep = (step) => {
    const newErrors = {};

    if (step === 0) {
      if (!selectedHospital) newErrors.hospital = 'Please select a hospital';
    }

    if (step === 1) {
      if (!formData.symptoms) newErrors.symptoms = 'Symptoms are required';
      if (!formData.reason_for_visit) newErrors.reason_for_visit = 'Reason for visit is required';
      if (!formData.appointment_type) newErrors.appointment_type = 'Please select appointment type';
    }

    if (step === 2) {
      if (!formData.preferred_date) newErrors.preferred_date = 'Preferred date is required';
      if (!formData.preferred_time) newErrors.preferred_time = 'Preferred time is required';
      
      if (formData.preferred_date) {
        const selectedDate = new Date(formData.preferred_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (selectedDate < today) {
          newErrors.preferred_date = 'Cannot book appointments in the past';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSelectHospital = (hospital) => {
    setSelectedHospital(hospital);
    // Note: Backend automatically uses CarePlus Hospital
    setErrors({ ...errors, hospital: '' });
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
      window.scrollTo(0, 0);
    }
  };

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
    window.scrollTo(0, 0);
  };
const handleSubmit = async () => {
  if (!validateStep(3)) return;

  setSubmitting(true);
  setError('');

  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('Please log in to book an appointment');
    }
    
    // ✅ CRITICAL FIX: Include hospital_id from selectedHospital
    const appointmentData = {
      hospital_id: selectedHospital.id,  // THIS IS THE MISSING LINE!
      symptoms: formData.symptoms,
      preferred_date: formData.preferred_date,
      preferred_time: formData.preferred_time,
      appointment_type: formData.appointment_type,
      reason_for_visit: formData.reason_for_visit,
      medical_history: formData.medical_history,
      current_medications: formData.current_medications,
      allergies: formData.allergies,
      insurance_info: formData.insurance_info
    };
    
    console.log('✅ Submitting appointment with hospital_id:', appointmentData);
    
    const response = await fetch('http://localhost:8000/api/v1/patient/appointments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(appointmentData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Submission error:', errorData);
      
      // Handle validation errors
      if (errorData.detail && Array.isArray(errorData.detail)) {
        const validationErrors = errorData.detail.map(err => 
          `${err.loc.join('.')}: ${err.msg}`
        ).join(', ');
        throw new Error(`Validation failed: ${validationErrors}`);
      }
      
      throw new Error(errorData.detail || 'Failed to book appointment');
    }

    const data = await response.json();
    console.log('✅ Appointment booked successfully:', data);
    setSuccess(true);
    
    setTimeout(() => {
      navigate('/patient/appointments');
    }, 2000);

  } catch (err) {
    console.error('Submit error:', err);
    setError(err.message);
  } finally {
    setSubmitting(false);
  }
};
  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  if (success) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Appointment Request Sent!</h2>
          <p className="text-gray-600 mb-2">
            Your appointment request has been submitted to {selectedHospital?.name || 'CarePlus Hospital'}.
          </p>
          <p className="text-sm text-gray-500 mb-4">
            The hospital admin will review and assign a doctor. You'll receive a notification once confirmed.
          </p>
          <p className="text-sm text-gray-400">Redirecting to appointments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/patient/appointments')}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Appointments</span>
        </button>

        <div className="flex items-center space-x-3 mb-4">
          <div className="bg-blue-100 p-3 rounded-lg">
            <Calendar className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Book Appointment</h1>
            <p className="text-gray-600">Schedule your medical consultation</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="flex items-center space-x-2 mb-4">
          {[0, 1, 2, 3].map((step) => (
            <div key={step} className="flex items-center flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep >= step ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                {step + 1}
              </div>
              {step < 3 && (
                <div className={`flex-1 h-1 ${currentStep > step ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
              )}
            </div>
          ))}
        </div>

        <div className="flex justify-between text-xs md:text-sm text-gray-600">
          <span className={currentStep === 0 ? 'font-semibold text-blue-600' : ''}>Hospital</span>
          <span className={currentStep === 1 ? 'font-semibold text-blue-600' : ''}>Basic Info</span>
          <span className={currentStep === 2 ? 'font-semibold text-blue-600' : ''}>Schedule</span>
          <span className={currentStep === 3 ? 'font-semibold text-blue-600' : ''}>Medical</span>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-start space-x-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">Error</p>
            <p className="text-sm">{error}</p>
            {error.includes('hospitals') && (
              <button
                onClick={fetchHospitals}
                className="mt-2 text-sm underline hover:text-red-800"
              >
                Retry Loading Hospitals
              </button>
            )}
          </div>
        </div>
      )}

      {/* Step 0: Select Hospital */}
      {currentStep === 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Choose Hospital</h2>

          {loadingHospitals ? (
            <div className="text-center py-12">
              <Loader className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">Loading hospitals...</p>
            </div>
          ) : hospitals.length === 0 ? (
            <div className="text-center py-12">
              <Building className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">No hospitals available</p>
              <p className="text-sm text-gray-500 mb-4">
                Please make sure CarePlus Hospital admin has logged in at least once.
              </p>
              <button
                onClick={fetchHospitals}
                className="text-blue-600 hover:text-blue-700 underline"
              >
                Refresh
              </button>
            </div>
          ) : (
            <>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-800">
                  ℹ️ Currently, appointments can only be booked at CarePlus Hospital.
                </p>
              </div>
              
              <div className="space-y-4">
                {hospitals.map((hospital) => (
                  <div
                    key={hospital.id}
                    onClick={() => handleSelectHospital(hospital)}
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                      selectedHospital?.id === hospital.id
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start space-x-4">
                      <div className={`p-3 rounded-lg ${
                        selectedHospital?.id === hospital.id ? 'bg-blue-100' : 'bg-gray-100'
                      }`}>
                        <Building className={`w-6 h-6 ${
                          selectedHospital?.id === hospital.id ? 'text-blue-600' : 'text-gray-600'
                        }`} />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                              {hospital.name}
                              {hospital.is_pinned && (
                                <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                                  ⭐ Featured
                                </span>
                              )}
                            </h3>
                            {hospital.rating && (
                              <div className="flex items-center mt-1">
                                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                <span className="ml-1 text-sm text-gray-600">
                                  {hospital.rating} ({hospital.total_ratings} reviews)
                                </span>
                              </div>
                            )}
                          </div>
                          {selectedHospital?.id === hospital.id && (
                            <CheckCircle className="w-6 h-6 text-blue-600" />
                          )}
                        </div>
                        
                        <div className="mt-2 space-y-1 text-sm text-gray-600">
                          <p className="flex items-center">
                            <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
                            {hospital.address}
                          </p>
                          {hospital.phone && (
                            <p className="flex items-center">
                              <Phone className="w-4 h-4 mr-2 flex-shrink-0" />
                              {hospital.phone}
                            </p>
                          )}
                        </div>

                        {hospital.services && hospital.services.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {hospital.services.slice(0, 3).map((service, idx) => (
                              <span key={idx} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                                {service}
                              </span>
                            ))}
                            {hospital.services.length > 3 && (
                              <span className="text-xs text-gray-500">
                                +{hospital.services.length - 3} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {errors.hospital && (
            <p className="mt-3 text-sm text-red-600">{errors.hospital}</p>
          )}

          <div className="flex justify-end space-x-4 pt-6">
            <button
              onClick={() => navigate('/patient/appointments')}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleNext}
              disabled={!selectedHospital}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Selected Hospital Summary (shown in steps 1-3) */}
      {currentStep > 0 && selectedHospital && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow-md p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Building className="w-6 h-6 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Selected Hospital</p>
                <p className="font-semibold text-gray-900">{selectedHospital.name}</p>
              </div>
            </div>
            <button
              onClick={() => setCurrentStep(0)}
              className="text-sm text-blue-600 hover:text-blue-700 underline"
            >
              Change
            </button>
          </div>
        </div>
      )}

      {/* Step 1: Basic Information */}
      {currentStep === 1 && (
        <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Basic Information</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FileText className="w-4 h-4 inline mr-2" />
              Appointment Type *
            </label>
            <select
              value={formData.appointment_type}
              onChange={(e) => handleChange('appointment_type', e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                errors.appointment_type ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Select appointment type</option>
              {appointmentTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
            {errors.appointment_type && (
              <p className="mt-1 text-sm text-red-600">{errors.appointment_type}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <AlertCircle className="w-4 h-4 inline mr-2" />
              Current Symptoms *
            </label>
            <textarea
              value={formData.symptoms}
              onChange={(e) => handleChange('symptoms', e.target.value)}
              placeholder="Describe your current symptoms..."
              rows="4"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                errors.symptoms ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.symptoms && (
              <p className="mt-1 text-sm text-red-600">{errors.symptoms}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FileText className="w-4 h-4 inline mr-2" />
              Reason for Visit *
            </label>
            <textarea
              value={formData.reason_for_visit}
              onChange={(e) => handleChange('reason_for_visit', e.target.value)}
              placeholder="Why are you visiting the doctor today?"
              rows="3"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                errors.reason_for_visit ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.reason_for_visit && (
              <p className="mt-1 text-sm text-red-600">{errors.reason_for_visit}</p>
            )}
          </div>

          <div className="flex justify-between space-x-4 pt-4">
            <button
              onClick={handleBack}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Back
            </button>
            <button
              onClick={handleNext}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Schedule */}
      {currentStep === 2 && (
        <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Choose Date & Time</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-2" />
              Preferred Date *
            </label>
            <input
              type="date"
              value={formData.preferred_date}
              onChange={(e) => handleChange('preferred_date', e.target.value)}
              min={getMinDate()}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                errors.preferred_date ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.preferred_date && (
              <p className="mt-1 text-sm text-red-600">{errors.preferred_date}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Clock className="w-4 h-4 inline mr-2" />
              Preferred Time *
            </label>
            <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
              {timeSlots.map(time => (
                <button
                  key={time}
                  onClick={() => handleChange('preferred_time', time)}
                  className={`px-4 py-2 border rounded-lg text-sm font-medium transition-colors ${
                    formData.preferred_time === time
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'border-gray-300 text-gray-700 hover:border-blue-500'
                  }`}
                >
                  {time}
                </button>
              ))}
            </div>
            {errors.preferred_time && (
              <p className="mt-2 text-sm text-red-600">{errors.preferred_time}</p>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Your preferred date and time are requests. The hospital will confirm 
              the final appointment time based on doctor availability.
            </p>
          </div>

          <div className="flex justify-between space-x-4 pt-4">
            <button
              onClick={handleBack}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Back
            </button>
            <button
              onClick={handleNext}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Medical Details */}
      {currentStep === 3 && (
        <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Medical Details (Optional)</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Heart className="w-4 h-4 inline mr-2" />
              Medical History
            </label>
            <textarea
              value={formData.medical_history}
              onChange={(e) => handleChange('medical_history', e.target.value)}
              placeholder="Any previous medical conditions, surgeries, or chronic illnesses..."
              rows="3"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Pill className="w-4 h-4 inline mr-2" />
              Current Medications
            </label>
            <textarea
              value={formData.current_medications}
              onChange={(e) => handleChange('current_medications', e.target.value)}
              placeholder="List any medications you're currently taking..."
              rows="3"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <AlertCircle className="w-4 h-4 inline mr-2" />
              Allergies
            </label>
            <textarea
              value={formData.allergies}
              onChange={(e) => handleChange('allergies', e.target.value)}
              placeholder="List any known allergies (medications, food, etc.)..."
              rows="3"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Shield className="w-4 h-4 inline mr-2" />
              Insurance Information
            </label>
            <textarea
              value={formData.insurance_info}
              onChange={(e) => handleChange('insurance_info', e.target.value)}
              placeholder="Insurance provider and policy number..."
              rows="2"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-800">
              <CheckCircle className="w-4 h-4 inline mr-2" />
              This information helps doctors provide better care. You can skip these fields if not applicable.
            </p>
          </div>

          <div className="flex justify-between space-x-4 pt-4">
            <button
              onClick={handleBack}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              disabled={submitting}
            >
              Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
            >
              {submitting ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  <span>Book Appointment</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookAppointmentPage;