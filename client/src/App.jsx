import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import Landing from './pages/Landing';
import MapPage from './pages/MapPage';
import Forecast from './pages/Forecast';
import Register from './pages/Register';
import Login from './pages/Login';
import BookWater from './pages/BookWater';
import RequestWater from './pages/RequestWater';
import MyOrders from './pages/MyOrders';
import Feedback from './pages/Feedback';
import AdminDashboard from './pages/admin/Dashboard';
import AdminOrders from './pages/admin/Orders';
import AdminMap from './pages/admin/AdminMap';
import AdminUsers from './pages/admin/Users';

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

function AdminRoute({ children }) {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return children;
}

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#132A3A' }}>
      <div className="text-center">
        <div className="text-5xl mb-4 animate-pulse">💧</div>
        <div className="skeleton h-4 w-32 mx-auto"></div>
      </div>
    </div>
  );
}

function App() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#132A3A' }}>
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/forecast" element={<Forecast />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/request-water" element={
            <ProtectedRoute><RequestWater /></ProtectedRoute>
          } />
          <Route path="/book-water" element={
            <ProtectedRoute><BookWater /></ProtectedRoute>
          } />
          <Route path="/my-orders" element={
            <ProtectedRoute><MyOrders /></ProtectedRoute>
          } />
          <Route path="/feedback/:bookingId" element={
            <ProtectedRoute><Feedback /></ProtectedRoute>
          } />
          <Route path="/admin" element={
            <AdminRoute><AdminDashboard /></AdminRoute>
          } />
          <Route path="/admin/orders" element={
            <AdminRoute><AdminOrders /></AdminRoute>
          } />
          <Route path="/admin/map" element={
            <AdminRoute><AdminMap /></AdminRoute>
          } />
          <Route path="/admin/users" element={
            <AdminRoute><AdminUsers /></AdminRoute>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;