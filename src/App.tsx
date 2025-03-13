import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import LandingPage from './components/LandingPage';
import UserForm from './components/UserForm';
import ChatInterface from './components/ChatInterface';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  const [userInfo, setUserInfo] = useState({
    name: '',
    email: '',
    company: '',
    jobRole: ''
  });

  // Check for existing user data on mount
  useEffect(() => {
    const savedUserData = localStorage.getItem('userData');
    if (savedUserData) {
      setUserInfo(JSON.parse(savedUserData));
    }
  }, []);

  const handleUserSubmit = (formData: typeof userInfo) => {
    setUserInfo(formData);
    localStorage.setItem('userData', JSON.stringify(formData));
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route 
          path="/get-started" 
          element={
            userInfo.name ? 
              <Navigate to="/chat" replace /> : 
              <UserForm onSubmit={handleUserSubmit} />
          } 
        />
        <Route 
          path="/chat" 
          element={
            <ProtectedRoute isAuthenticated={Boolean(userInfo.name)}>
              <ChatInterface userInfo={userInfo} />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </Router>
  );
}

export default App;