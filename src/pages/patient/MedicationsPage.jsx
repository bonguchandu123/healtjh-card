import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  Pill, 
  Clock, 
  Plus, 
  Check,
  X,
  Calendar,
  TrendingUp,
  Edit2,
  Trash2,
  CheckCircle,
  Bell,
  Activity
} from 'lucide-react';

const MedicationsPage = () => {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState('today');
  const [loading, setLoading] = useState(false);
  const [reminders, setReminders] = useState([]);
  const [todaySchedule, setTodaySchedule] = useState(null);
  const [adherenceStats, setAdherenceStats] = useState(null);
  const [medicationLogs, setMedicationLogs] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingReminder, setEditingReminder] = useState(null);

  const [formData, setFormData] = useState({
    medication_name: '',
    dosage: '',
    frequency: '',
    times: ['08:00'],
    start_date: new Date().toISOString().split('T')[0],
    duration_days: 30,
    instructions: ''
  });

  useEffect(() => {
    fetchReminders();
    fetchTodaySchedule();
    fetchAdherenceStats();
    fetchMedicationLogs();
  }, []);

  const fetchReminders = async () => {
    try {
      const response = await fetch(
        'http://localhost:8000/api/v1/medications/reminders?active_only=true',
        { headers: { 'Authorization': `Bearer ${token}` }}
      );
      if (response.ok) {
        const data = await response.json();
        setReminders(data);
      }
    } catch (error) {
      console.error('Error fetching reminders:', error);
    }
  };

  const fetchTodaySchedule = async () => {
    try {
      const response = await fetch(
        'http://localhost:8000/api/v1/medications/today',
        { headers: { 'Authorization': `Bearer ${token}` }}
      );
      if (response.ok) {
        const data = await response.json();
        setTodaySchedule(data);
      }
    } catch (error) {
      console.error('Error fetching today schedule:', error);
    }
  };

  const fetchAdherenceStats = async () => {
    try {
      const response = await fetch(
        'http://localhost:8000/api/v1/medications/adherence?days=30',
        { headers: { 'Authorization': `Bearer ${token}` }}
      );
      if (response.ok) {
        const data = await response.json();
        setAdherenceStats(data);
      }
    } catch (error) {
      console.error('Error fetching adherence stats:', error);
    }
  };

  const fetchMedicationLogs = async () => {
    try {
      const response = await fetch(
        'http://localhost:8000/api/v1/medications/logs?days=7',
        { headers: { 'Authorization': `Bearer ${token}` }}
      );
      if (response.ok) {
        const data = await response.json();
        setMedicationLogs(data);
      }
    } catch (error) {
      console.error('Error fetching medication logs:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = editingReminder
        ? `http://localhost:8000/api/v1/medications/reminders/${editingReminder.id}`
        : 'http://localhost:8000/api/v1/medications/reminders';
      
      const method = editingReminder ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          duration_days: parseInt(formData.duration_days)
        })
      });

      if (response.ok) {
        alert(`✅ Medication reminder ${editingReminder ? 'updated' : 'created'} successfully!`);
        setFormData({
          medication_name: '',
          dosage: '',
          frequency: '',
          times: ['08:00'],
          start_date: new Date().toISOString().split('T')[0],
          duration_days: 30,
          instructions: ''
        });
        setShowAddForm(false);
        setEditingReminder(null);
        fetchReminders();
        fetchTodaySchedule();
        fetchAdherenceStats();
      } else {
        const error = await response.json();
        alert(`❌ Error: ${error.detail}`);
      }
    } catch (error) {
      alert('❌ Failed to save reminder. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkTaken = async (reminderId) => {
    try {
      const response = await fetch(
        `http://localhost:8000/api/v1/medications/reminders/${reminderId}/taken`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        fetchTodaySchedule();
        fetchAdherenceStats();
        fetchMedicationLogs();
      }
    } catch (error) {
      console.error('Error marking medication taken:', error);
    }
  };

  const handleDeleteReminder = async (reminderId) => {
    if (!confirm('Are you sure you want to deactivate this medication reminder?')) return;

    try {
      const response = await fetch(
        `http://localhost:8000/api/v1/medications/reminders/${reminderId}`,
        {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      if (response.ok) {
        alert('✅ Medication reminder deactivated successfully!');
        fetchReminders();
        fetchTodaySchedule();
        fetchAdherenceStats();
      }
    } catch (error) {
      alert('❌ Failed to deactivate reminder. Please try again.');
    }
  };

  const handleEditReminder = (reminder) => {
    setEditingReminder(reminder);
    setFormData({
      medication_name: reminder.medication_name,
      dosage: reminder.dosage,
      frequency: reminder.frequency,
      times: reminder.times || ['08:00'],
      start_date: reminder.start_date,
      duration_days: reminder.duration_days,
      instructions: reminder.instructions || ''
    });
    setShowAddForm(true);
  };

  const getAdherenceColor = (rate) => {
    if (rate >= 90) return 'text-green-600';
    if (rate >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getAdherenceBgColor = (rate) => {
    if (rate >= 90) return 'bg-green-50';
    if (rate >= 70) return 'bg-yellow-50';
    return 'bg-red-50';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">💊 Medications</h1>
          <p className="text-gray-600">Manage your medication reminders and track adherence</p>
        </div>

        {adherenceStats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className={`${getAdherenceBgColor(adherenceStats.adherence_rate)} rounded-xl p-6 border border-gray-200`}>
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className={getAdherenceColor(adherenceStats.adherence_rate)} size={24} />
                <span className={`text-3xl font-bold ${getAdherenceColor(adherenceStats.adherence_rate)}`}>
                  {adherenceStats.adherence_rate}%
                </span>
              </div>
              <p className="text-sm text-gray-600">Adherence Rate</p>
              <p className="text-xs text-gray-500 mt-1">Last 30 days</p>
            </div>

            <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
              <div className="flex items-center justify-between mb-2">
                <CheckCircle className="text-blue-600" size={24} />
                <span className="text-3xl font-bold text-blue-600">
                  {adherenceStats.total_taken}
                </span>
              </div>
              <p className="text-sm text-gray-600">Doses Taken</p>
              <p className="text-xs text-gray-500 mt-1">Out of {adherenceStats.total_expected}</p>
            </div>

            <div className="bg-red-50 rounded-xl p-6 border border-red-100">
              <div className="flex items-center justify-between mb-2">
                <X className="text-red-600" size={24} />
                <span className="text-3xl font-bold text-red-600">
                  {adherenceStats.missed}
                </span>
              </div>
              <p className="text-sm text-gray-600">Missed Doses</p>
              <p className="text-xs text-gray-500 mt-1">Last 30 days</p>
            </div>

            <div className="bg-purple-50 rounded-xl p-6 border border-purple-100">
              <div className="flex items-center justify-between mb-2">
                <Pill className="text-purple-600" size={24} />
                <span className="text-3xl font-bold text-purple-600">
                  {adherenceStats.active_medications}
                </span>
              </div>
              <p className="text-sm text-gray-600">Active Medications</p>
              <p className="text-xs text-gray-500 mt-1">Currently tracking</p>
            </div>
          </div>
        )}

        <div className="flex space-x-4 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('today')}
            className={`pb-3 px-4 font-medium transition-colors ${
              activeTab === 'today'
                ? 'text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Today's Schedule
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`pb-3 px-4 font-medium transition-colors ${
              activeTab === 'all'
                ? 'text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            All Medications
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`pb-3 px-4 font-medium transition-colors ${
              activeTab === 'history'
                ? 'text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            History
          </button>
        </div>

        {activeTab === 'today' && todaySchedule && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Today's Schedule</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {new Date(todaySchedule.date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Progress</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {todaySchedule.taken}/{todaySchedule.total_medications}
                  </p>
                </div>
              </div>

              {todaySchedule.schedule.length === 0 ? (
                <div className="text-center py-12">
                  <Bell className="mx-auto text-gray-400 mb-4" size={48} />
                  <p className="text-xl text-gray-600">No medications scheduled for today</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {todaySchedule.schedule.map((med, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        med.taken
                          ? 'bg-green-50 border-green-200'
                          : 'bg-white border-gray-200 hover:border-purple-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                            med.taken ? 'bg-green-500' : 'bg-purple-500'
                          }`}>
                            {med.taken ? (
                              <Check className="text-white" size={24} />
                            ) : (
                              <Pill className="text-white" size={24} />
                            )}
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-800">{med.medication_name}</h3>
                            <p className="text-sm text-gray-600">{med.dosage}</p>
                            {med.instructions && (
                              <p className="text-xs text-gray-500 mt-1">{med.instructions}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-right mr-4">
                            <div className="flex items-center space-x-2 text-gray-600">
                              <Clock size={16} />
                              <span className="font-medium">{med.time}</span>
                            </div>
                          </div>
                          {!med.taken ? (
                            <button
                              onClick={() => handleMarkTaken(med.reminder_id)}
                              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
                            >
                              Mark Taken
                            </button>
                          ) : (
                            <span className="px-4 py-2 bg-green-100 text-green-700 rounded-lg font-medium">
                              ✓ Taken
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'all' && (
          <div className="space-y-6">
            <button
              onClick={() => {
                setShowAddForm(!showAddForm);
                setEditingReminder(null);
              }}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-600 text-white py-4 rounded-xl font-semibold hover:from-purple-600 hover:to-pink-700 transition-all shadow-lg flex items-center justify-center space-x-2"
            >
              <Plus size={20} />
              <span>{showAddForm ? 'Hide Form' : 'Add New Medication'}</span>
            </button>

            {showAddForm && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-6">
                  {editingReminder ? 'Edit Medication' : 'Add New Medication'}
                </h3>

                <div className="space-y-4">
                  <input
                    type="text"
                    required
                    value={formData.medication_name}
                    onChange={(e) => setFormData({ ...formData, medication_name: e.target.value })}
                    placeholder="Medication Name"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                  <input
                    type="text"
                    required
                    value={formData.dosage}
                    onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                    placeholder="Dosage (e.g., 500mg)"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                  <input
                    type="text"
                    required
                    value={formData.frequency}
                    onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                    placeholder="Frequency (e.g., Three times daily)"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                  <input
                    type="date"
                    required
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                  <input
                    type="number"
                    required
                    value={formData.duration_days}
                    onChange={(e) => setFormData({ ...formData, duration_days: e.target.value })}
                    placeholder="Duration (days)"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                  <textarea
                    value={formData.instructions}
                    onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                    placeholder="Instructions (optional)"
                    rows="3"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />

                  <div className="flex space-x-4">
                    <button
                      onClick={handleSubmit}
                      disabled={loading}
                      className="flex-1 bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors disabled:bg-gray-400"
                    >
                      {loading ? 'Saving...' : 'Save Medication'}
                    </button>
                    <button
                      onClick={() => setShowAddForm(false)}
                      className="px-6 py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {reminders.length === 0 ? (
              <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                <Pill className="mx-auto text-gray-400 mb-4" size={48} />
                <p className="text-xl text-gray-600">No active medications</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {reminders.map((reminder) => (
                  <div key={reminder.id} className="bg-white rounded-xl shadow-lg p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start space-x-3">
                        <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                          <Pill className="text-purple-600" size={24} />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-800 text-lg">{reminder.medication_name}</h3>
                          <p className="text-sm text-gray-600">{reminder.dosage}</p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditReminder(reminder)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteReminder(reminder.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Activity size={16} />
                        <span>{reminder.frequency}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Calendar size={16} />
                        <span>Started: {new Date(reminder.start_date).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Recent Activity</h2>
            {medicationLogs.length === 0 ? (
              <div className="text-center py-12">
                <Activity className="mx-auto text-gray-400 mb-4" size={48} />
                <p className="text-xl text-gray-600">No medication logs yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {medicationLogs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="text-green-600" size={20} />
                      <div>
                        <p className="font-semibold text-gray-800">{log.medication_name}</p>
                        <p className="text-sm text-gray-600">{log.dosage}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-800">
                        {new Date(log.taken_at).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(log.taken_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MedicationsPage;