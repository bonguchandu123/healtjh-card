import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  Heart, 
  Activity, 
  Footprints, 
  Moon, 
  Weight, 
  TrendingUp,
  Plus,
  Calendar,
  AlertCircle,
  ChevronDown,
  Trash2,
  LineChart
} from 'lucide-react';

const HealthVitalsPage = () => {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState('record');
  const [loading, setLoading] = useState(false);
  const [vitals, setVitals] = useState([]);
  const [latestVital, setLatestVital] = useState(null);
  const [trends, setTrends] = useState(null);
  const [showForm, setShowForm] = useState(false);
  
  const [formData, setFormData] = useState({
    heart_rate: '',
    blood_pressure_systolic: '',
    blood_pressure_diastolic: '',
    temperature: '',
    weight: '',
    height: '',
    steps: '',
    sleep_hours: '',
    notes: ''
  });

  const [filters, setFilters] = useState({
    days: 30
  });

  useEffect(() => {
    fetchLatestVital();
    fetchVitalsHistory();
    fetchHealthTrends();
  }, [filters.days]);

  const fetchLatestVital = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/v1/vitals/latest', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setLatestVital(data);
      }
    } catch (error) {
      console.error('Error fetching latest vital:', error);
    }
  };

  const fetchVitalsHistory = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `http://localhost:8000/api/v1/vitals?days=${filters.days}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        setVitals(data);
      }
    } catch (error) {
      console.error('Error fetching vitals:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchHealthTrends = async () => {
    try {
      const response = await fetch(
        `http://localhost:8000/api/v1/analytics/patient-health-trends?days=${filters.days}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        setTrends(data);
      }
    } catch (error) {
      console.error('Error fetching trends:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const vitalData = {};
    Object.keys(formData).forEach(key => {
      if (formData[key] !== '') {
        vitalData[key] = key === 'notes' ? formData[key] : parseFloat(formData[key]);
      }
    });

    try {
      const response = await fetch('http://localhost:8000/api/v1/vitals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(vitalData)
      });

      if (response.ok) {
        alert('✅ Health vitals recorded successfully!');
        setFormData({
          heart_rate: '',
          blood_pressure_systolic: '',
          blood_pressure_diastolic: '',
          temperature: '',
          weight: '',
          height: '',
          steps: '',
          sleep_hours: '',
          notes: ''
        });
        setShowForm(false);
        fetchLatestVital();
        fetchVitalsHistory();
        fetchHealthTrends();
      } else {
        const error = await response.json();
        alert(`❌ Error: ${error.detail}`);
      }
    } catch (error) {
      alert('❌ Failed to record vitals. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const calculateBMI = () => {
    if (latestVital?.weight && latestVital?.height) {
      const heightInMeters = latestVital.height / 100;
      const bmi = (latestVital.weight / (heightInMeters * heightInMeters)).toFixed(1);
      return bmi;
    }
    return null;
  };

  const getBMICategory = (bmi) => {
    if (!bmi) return { text: 'N/A', color: 'text-gray-400' };
    if (bmi < 18.5) return { text: 'Underweight', color: 'text-blue-600' };
    if (bmi < 25) return { text: 'Normal', color: 'text-green-600' };
    if (bmi < 30) return { text: 'Overweight', color: 'text-yellow-600' };
    return { text: 'Obese', color: 'text-red-600' };
  };

  const getBloodPressureCategory = (systolic, diastolic) => {
    if (!systolic || !diastolic) return { text: 'N/A', color: 'text-gray-400' };
    if (systolic < 120 && diastolic < 80) return { text: 'Normal', color: 'text-green-600' };
    if (systolic < 130 && diastolic < 80) return { text: 'Elevated', color: 'text-yellow-600' };
    if (systolic < 140 || diastolic < 90) return { text: 'High BP Stage 1', color: 'text-orange-600' };
    return { text: 'High BP Stage 2', color: 'text-red-600' };
  };

  const getHeartRateCategory = (hr) => {
    if (!hr) return { text: 'N/A', color: 'text-gray-400' };
    if (hr < 60) return { text: 'Low', color: 'text-blue-600' };
    if (hr <= 100) return { text: 'Normal', color: 'text-green-600' };
    return { text: 'High', color: 'text-red-600' };
  };

  const bmi = calculateBMI();
  const bmiCategory = getBMICategory(bmi);
  const bpCategory = getBloodPressureCategory(
    latestVital?.blood_pressure_systolic,
    latestVital?.blood_pressure_diastolic
  );
  const hrCategory = getHeartRateCategory(latestVital?.heart_rate);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Health Vitals</h1>
          <p className="text-gray-600">Track and monitor your health metrics</p>
        </div>

        {/* Tabs */}
        <div className="flex space-x-4 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('record')}
            className={`pb-3 px-4 font-medium transition-colors ${
              activeTab === 'record'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Record Vitals
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`pb-3 px-4 font-medium transition-colors ${
              activeTab === 'history'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            History
          </button>
          <button
            onClick={() => setActiveTab('trends')}
            className={`pb-3 px-4 font-medium transition-colors ${
              activeTab === 'trends'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Trends
          </button>
        </div>

        {/* Record Tab */}
        {activeTab === 'record' && (
          <div className="space-y-6">
            {/* Latest Vitals Dashboard */}
            {latestVital && (
              <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">Latest Readings</h2>
                  <span className="text-sm text-gray-500">
                    {new Date(latestVital.recorded_at).toLocaleDateString()}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Heart Rate */}
                  {latestVital.heart_rate && (
                    <div className="bg-red-50 rounded-lg p-4 border border-red-100">
                      <div className="flex items-center justify-between mb-2">
                        <Heart className="text-red-500" size={24} />
                        <span className={`text-sm font-medium ${hrCategory.color}`}>
                          {hrCategory.text}
                        </span>
                      </div>
                      <p className="text-3xl font-bold text-gray-800">{latestVital.heart_rate}</p>
                      <p className="text-sm text-gray-600">bpm</p>
                    </div>
                  )}

                  {/* Blood Pressure */}
                  {(latestVital.blood_pressure_systolic || latestVital.blood_pressure_diastolic) && (
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                      <div className="flex items-center justify-between mb-2">
                        <Activity className="text-blue-500" size={24} />
                        <span className={`text-sm font-medium ${bpCategory.color}`}>
                          {bpCategory.text}
                        </span>
                      </div>
                      <p className="text-3xl font-bold text-gray-800">
                        {latestVital.blood_pressure_systolic}/{latestVital.blood_pressure_diastolic}
                      </p>
                      <p className="text-sm text-gray-600">mmHg</p>
                    </div>
                  )}

                  {/* Weight & BMI */}
                  {latestVital.weight && (
                    <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                      <div className="flex items-center justify-between mb-2">
                        <Weight className="text-green-500" size={24} />
                        {bmi && (
                          <span className={`text-sm font-medium ${bmiCategory.color}`}>
                            BMI: {bmi}
                          </span>
                        )}
                      </div>
                      <p className="text-3xl font-bold text-gray-800">{latestVital.weight}</p>
                      <p className="text-sm text-gray-600">kg</p>
                    </div>
                  )}

                  {/* Steps */}
                  {latestVital.steps && (
                    <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
                      <div className="flex items-center justify-between mb-2">
                        <Footprints className="text-purple-500" size={24} />
                      </div>
                      <p className="text-3xl font-bold text-gray-800">
                        {latestVital.steps.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-600">steps</p>
                    </div>
                  )}

                  {/* Sleep */}
                  {latestVital.sleep_hours && (
                    <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-100">
                      <div className="flex items-center justify-between mb-2">
                        <Moon className="text-indigo-500" size={24} />
                      </div>
                      <p className="text-3xl font-bold text-gray-800">{latestVital.sleep_hours}</p>
                      <p className="text-sm text-gray-600">hours</p>
                    </div>
                  )}

                  {/* Temperature */}
                  {latestVital.temperature && (
                    <div className="bg-orange-50 rounded-lg p-4 border border-orange-100">
                      <div className="flex items-center justify-between mb-2">
                        <Activity className="text-orange-500" size={24} />
                      </div>
                      <p className="text-3xl font-bold text-gray-800">{latestVital.temperature}</p>
                      <p className="text-sm text-gray-600">°F</p>
                    </div>
                  )}
                </div>

                {latestVital.notes && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">
                      <strong>Notes:</strong> {latestVital.notes}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Add New Vitals Button */}
            <button
              onClick={() => setShowForm(!showForm)}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-4 rounded-xl font-semibold hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg flex items-center justify-center space-x-2"
            >
              <Plus size={20} />
              <span>{showForm ? 'Hide Form' : 'Record New Vitals'}</span>
            </button>

            {/* Record Form */}
            {showForm && (
              <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-6">Record Health Vitals</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Heart Rate */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Heart Rate (bpm)
                    </label>
                    <input
                      type="number"
                      name="heart_rate"
                      value={formData.heart_rate}
                      onChange={handleChange}
                      placeholder="e.g., 72"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Blood Pressure */}
                  <div className="md:col-span-2 grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Systolic BP (mmHg)
                      </label>
                      <input
                        type="number"
                        name="blood_pressure_systolic"
                        value={formData.blood_pressure_systolic}
                        onChange={handleChange}
                        placeholder="e.g., 120"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Diastolic BP (mmHg)
                      </label>
                      <input
                        type="number"
                        name="blood_pressure_diastolic"
                        value={formData.blood_pressure_diastolic}
                        onChange={handleChange}
                        placeholder="e.g., 80"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Temperature */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Temperature (°F)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      name="temperature"
                      value={formData.temperature}
                      onChange={handleChange}
                      placeholder="e.g., 98.6"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Weight */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Weight (kg)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      name="weight"
                      value={formData.weight}
                      onChange={handleChange}
                      placeholder="e.g., 70.5"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Height */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Height (cm)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      name="height"
                      value={formData.height}
                      onChange={handleChange}
                      placeholder="e.g., 175"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Steps */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Steps
                    </label>
                    <input
                      type="number"
                      name="steps"
                      value={formData.steps}
                      onChange={handleChange}
                      placeholder="e.g., 10000"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Sleep Hours */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sleep Hours
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      name="sleep_hours"
                      value={formData.sleep_hours}
                      onChange={handleChange}
                      placeholder="e.g., 7.5"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Notes */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notes (Optional)
                    </label>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleChange}
                      placeholder="Any additional notes..."
                      rows="3"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="flex space-x-4 mt-6">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-400"
                  >
                    {loading ? 'Recording...' : 'Record Vitals'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-6 py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="space-y-6">
            {/* Filter */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Time Period
              </label>
              <select
                value={filters.days}
                onChange={(e) => setFilters({ ...filters, days: parseInt(e.target.value) })}
                className="w-full md:w-64 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={7}>Last 7 days</option>
                <option value={30}>Last 30 days</option>
                <option value={90}>Last 3 months</option>
                <option value={180}>Last 6 months</option>
                <option value={365}>Last year</option>
              </select>
            </div>

            {/* Vitals List */}
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading vitals...</p>
              </div>
            ) : vitals.length === 0 ? (
              <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                <Activity className="mx-auto text-gray-400 mb-4" size={48} />
                <p className="text-xl text-gray-600">No vitals recorded yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {vitals.map((vital) => (
                  <div key={vital.id} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <Calendar className="text-blue-500" size={20} />
                        <span className="font-semibold text-gray-800">
                          {new Date(vital.recorded_at).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                      <span className="text-sm text-gray-500">
                        {new Date(vital.recorded_at).toLocaleTimeString()}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {vital.heart_rate && (
                        <div className="flex items-center space-x-2">
                          <Heart className="text-red-500" size={20} />
                          <div>
                            <p className="text-sm text-gray-600">Heart Rate</p>
                            <p className="font-semibold">{vital.heart_rate} bpm</p>
                          </div>
                        </div>
                      )}

                      {vital.blood_pressure_systolic && (
                        <div className="flex items-center space-x-2">
                          <Activity className="text-blue-500" size={20} />
                          <div>
                            <p className="text-sm text-gray-600">Blood Pressure</p>
                            <p className="font-semibold">
                              {vital.blood_pressure_systolic}/{vital.blood_pressure_diastolic}
                            </p>
                          </div>
                        </div>
                      )}

                      {vital.weight && (
                        <div className="flex items-center space-x-2">
                          <Weight className="text-green-500" size={20} />
                          <div>
                            <p className="text-sm text-gray-600">Weight</p>
                            <p className="font-semibold">{vital.weight} kg</p>
                          </div>
                        </div>
                      )}

                      {vital.steps && (
                        <div className="flex items-center space-x-2">
                          <Footprints className="text-purple-500" size={20} />
                          <div>
                            <p className="text-sm text-gray-600">Steps</p>
                            <p className="font-semibold">{vital.steps.toLocaleString()}</p>
                          </div>
                        </div>
                      )}

                      {vital.sleep_hours && (
                        <div className="flex items-center space-x-2">
                          <Moon className="text-indigo-500" size={20} />
                          <div>
                            <p className="text-sm text-gray-600">Sleep</p>
                            <p className="font-semibold">{vital.sleep_hours} hrs</p>
                          </div>
                        </div>
                      )}

                      {vital.temperature && (
                        <div className="flex items-center space-x-2">
                          <Activity className="text-orange-500" size={20} />
                          <div>
                            <p className="text-sm text-gray-600">Temperature</p>
                            <p className="font-semibold">{vital.temperature}°F</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {vital.notes && (
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-700">{vital.notes}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Trends Tab */}
        {activeTab === 'trends' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center space-x-3 mb-6">
                <TrendingUp className="text-blue-600" size={24} />
                <h2 className="text-2xl font-bold text-gray-800">Health Trends</h2>
              </div>

              {trends && (
                <div className="space-y-6">
                  {trends.heart_rate && trends.heart_rate.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-gray-700 mb-2">Heart Rate Trend</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        {trends.heart_rate.length} readings in last {filters.days} days
                      </p>
                      <div className="bg-red-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600">
                          Average: {(trends.steps.reduce((sum, r) => sum + r.value, 0) / trends.steps.length).toFixed(0).toLocaleString()} steps/day
                        </p>
                      </div>
                    </div>
                  )}

                  {trends.sleep_hours && trends.sleep_hours.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-gray-700 mb-2">Sleep Trend</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        {trends.sleep_hours.length} readings in last {filters.days} days
                      </p>
                      <div className="bg-indigo-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600">
                          Average: {(trends.sleep_hours.reduce((sum, r) => sum + r.value, 0) / trends.sleep_hours.length).toFixed(1)} hours/night
                        </p>
                      </div>
                    </div>
                  )}

                  {(!trends.heart_rate || trends.heart_rate.length === 0) &&
                   (!trends.blood_pressure_systolic || trends.blood_pressure_systolic.length === 0) &&
                   (!trends.steps || trends.steps.length === 0) &&
                   (!trends.sleep_hours || trends.sleep_hours.length === 0) && (
                    <div className="text-center py-12">
                      <LineChart className="mx-auto text-gray-400 mb-4" size={48} />
                      <p className="text-xl text-gray-600">No trend data available</p>
                      <p className="text-sm text-gray-500 mt-2">
                        Record vitals regularly to see trends
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Health Insights */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
              <h3 className="text-xl font-bold mb-4">💡 Health Insights</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start space-x-2">
                  <span>•</span>
                  <span>Aim for 7-9 hours of sleep per night for optimal health</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span>•</span>
                  <span>Target 10,000 steps daily for cardiovascular health</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span>•</span>
                  <span>Normal resting heart rate is 60-100 bpm</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span>•</span>
                  <span>Ideal blood pressure is below 120/80 mmHg</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span>•</span>
                  <span>Maintain a healthy BMI between 18.5-24.9</span>
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HealthVitalsPage;