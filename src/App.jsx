import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import Sidebar from "./components/SideBar";
import { AuthProvider, useAuth } from "./context/AuthContext";
import AdminProfilePage from "./pages/admin/AdminProfilePage";
import AdminAnalyticsPage from "./pages/admin/AnalyticsPage";
import AAppointmentDetailPage from "./pages/admin/AppointmentDetailPage";
import AdminAppointmentsPage from "./pages/admin/AppointmentsPage";
import CreateHospitalPage from "./pages/admin/CreateHospitalPage";
import AdminDashboardPage from "./pages/admin/DashboardPage";
import AdminDoctorsPage from "./pages/admin/DoctorsPage";
import AdminHospitalsPage from "./pages/admin/HospitalsPage";
import LoginPage from "./pages/auth/Login";
import SignupPage from "./pages/auth/Signup";
import AppointmentDetailPage from "./pages/doctor/AppointmentDetailPage";
import DAppointmentsPage from "./pages/doctor/AppointmentsPage";
import DChatPage from "./pages/doctor/ChatPage";
import DDashboardPage from "./pages/doctor/DashboardPage";
import PatientDetailPage from "./pages/doctor/PatientDetailPage";
import PatientsPage from "./pages/doctor/PatientsPage";
import ProfilePage from "./pages/doctor/ProfilePage";
import ScanQRPage from "./pages/doctor/ScanQRPage";
import AppointmentsPage from "./pages/patient/AppointmentsPage";
import BookAppointmentPage from "./pages/patient/BookAppointmentPage";
import ChatPage from "./pages/patient/ChatPage";
import DashboardPage from "./pages/patient/Dashboard";
import HealthVitalsPage from "./pages/patient/HealthVitalsPage";
import HospitalsPage from "./pages/patient/HospitalsPage";
import MedicationsPage from "./pages/patient/MedicationsPage";
import PrescriptionDetailPage from "./pages/patient/PrescriptionDetailPage";
import PrescriptionsPage from "./pages/patient/PrescriptionsPage";
import PatientProfilePage from "./pages/patient/Profile";
import QRCodePage from "./pages/patient/QRCodePage";
import UploadPrescriptionPage from "./pages/patient/UploadPrescriptionPage";
import PublicScanPage from "./pages/patient/ScanQr";

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-semibold">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={`/${user.role}/dashboard`} replace />;
  }

  return children;
};

// Public Route Component (redirect if already logged in)
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-semibold">Loading...</p>
        </div>
      </div>
    );
  }

  if (user) {
    return <Navigate to={`/${user.role}/dashboard`} replace />;
  }

  return children;
};

// Layout Component with Sidebar
const DashboardLayout = ({ children }) => {
  const { user } = useAuth();

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar/>
      <main className={`flex-1 transition-all duration-300 ${user ? 'lg:ml-64' : ''}`}>
        <div className="p-4 lg:p-8 pt-20 lg:pt-8">
          {children}
        </div>
      </main>
    </div>
  );
};

// Main App Component
function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <LoginPage/>
              </PublicRoute>
            }
          />
          <Route
            path="/signup"
            element={
              <PublicRoute>
                <SignupPage/>
              </PublicRoute>
            }
          />

          {/* Patient Routes */}
          <Route
            path="/patient/dashboard"
            element={
              <ProtectedRoute allowedRoles={['patient']}>
                <DashboardLayout>
                  <DashboardPage/>
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/patient/profile"
            element={
              <ProtectedRoute allowedRoles={['patient']}>
                <DashboardLayout>
                  <PatientProfilePage/>
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/patient/prescriptions"
            element={
              <ProtectedRoute allowedRoles={['patient']}>
                <DashboardLayout>
                  <PrescriptionsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/patient/prescriptions/:id"
            element={
              <ProtectedRoute allowedRoles={['patient']}>
                <DashboardLayout>
                  <PrescriptionDetailPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/patient/upload-prescription"
            element={
              <ProtectedRoute allowedRoles={['patient']}>
                <DashboardLayout>
                  <UploadPrescriptionPage/>
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/patient/appointments"
            element={
              <ProtectedRoute allowedRoles={['patient']}>
                <DashboardLayout>
                  <AppointmentsPage/>
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/patient/book-appointment"
            element={
              <ProtectedRoute allowedRoles={['patient']}>
                <DashboardLayout>
                  <BookAppointmentPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/patient/hospitals"
            element={
              <ProtectedRoute allowedRoles={['patient']}>
                <DashboardLayout>
                  <HospitalsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/patient/health-vitals"
            element={
              <ProtectedRoute allowedRoles={['patient']}>
                <DashboardLayout>
                  <HealthVitalsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/patient/medications"
            element={
              <ProtectedRoute allowedRoles={['patient']}>
                <DashboardLayout>
                  <MedicationsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/patient/chat"
            element={
              <ProtectedRoute allowedRoles={['patient']}>
                <DashboardLayout>
                  <ChatPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/patient/qr-code"
            element={
              <ProtectedRoute allowedRoles={['patient']}>
                <DashboardLayout>
                  <QRCodePage/>
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* Doctor Routes */}
          <Route
            path="/doctor/dashboard"
            element={
              <ProtectedRoute allowedRoles={['doctor']}>
                <DashboardLayout>
                  <DDashboardPage/>
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor/profile"
            element={
              <ProtectedRoute allowedRoles={['doctor']}>
                <DashboardLayout>
                  <ProfilePage/>
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor/appointments"
            element={
              <ProtectedRoute allowedRoles={['doctor']}>
                <DashboardLayout>
                  <DAppointmentsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor/appointments/:id"
            element={
              <ProtectedRoute allowedRoles={['doctor']}>
                <DashboardLayout>
                  <AppointmentDetailPage/>
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor/patients"
            element={
              <ProtectedRoute allowedRoles={['doctor']}>
                <DashboardLayout>
                  <PatientsPage/>
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor/patients/:id"
            element={
              <ProtectedRoute allowedRoles={['doctor']}>
                <DashboardLayout>
                  <PatientDetailPage/>
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor/scan-qr"
            element={
              <ProtectedRoute allowedRoles={['doctor']}>
                <DashboardLayout>
                  <ScanQRPage/>
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor/chat"
            element={
              <ProtectedRoute allowedRoles={['doctor']}>
                <DashboardLayout>
                  <DChatPage/>
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <DashboardLayout>
                  <AdminDashboardPage/>
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/profile"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <DashboardLayout>
                  <AdminProfilePage/>
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/hospitals"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <DashboardLayout>
                  <AdminHospitalsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/create-hospital"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <DashboardLayout>
                  <CreateHospitalPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/appointments"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <DashboardLayout>
                  <AdminAppointmentsPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/appointments/:id"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <DashboardLayout>
                  <AAppointmentDetailPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/doctors"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <DashboardLayout>
                  <AdminDoctorsPage/>
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/analytics"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <DashboardLayout>
                  <AdminAnalyticsPage/>
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
  path="/scan/:patientId"
  element={<PublicScanPage/>}
/>

     
          {/* Default Redirects */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;