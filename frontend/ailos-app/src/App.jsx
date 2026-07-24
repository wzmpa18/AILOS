import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Learn from './pages/Learn';
import Chat from './pages/Chat';
import Profile from './pages/Profile';
import Review from './pages/Review';
import Sidebar from './components/Sidebar';
import Toast from './components/Toast';
import { useState, useCallback } from 'react';

export default function App() {
  const { user, loading } = useAuth();
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  if (loading) {
    return <div className="loading-page"><div className="spinner" /><p>加载中...</p></div>;
  }

  if (!user) {
    return (
      <>
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        <Routes>
          <Route path="/login" element={<Login showToast={showToast} />} />
          <Route path="/register" element={<Register showToast={showToast} />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </>
    );
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        <Routes>
          <Route path="/" element={<Dashboard showToast={showToast} />} />
          <Route path="/learn" element={<Learn showToast={showToast} />} />
          <Route path="/chat" element={<Chat showToast={showToast} />} />
          <Route path="/review" element={<Review showToast={showToast} />} />
          <Route path="/profile" element={<Profile showToast={showToast} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
}