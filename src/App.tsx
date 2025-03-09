import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import UserForm from './components/UserForm';
import ChatInterface from './components/ChatInterface';
import { useState } from 'react';

function App() {
  const [userInfo, setUserInfo] = useState({
    name: '',
    email: '',
    company: '',
    jobRole: ''
  });

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route 
          path="/get-started" 
          element={
            <UserForm 
              onSubmit={(formData) => {
                setUserInfo(formData);
              }} 
            />
          } 
        />
        <Route 
          path="/chat" 
          element={
            userInfo.name ? 
              <ChatInterface userInfo={userInfo} /> : 
              <Navigate to="/get-started" />
          } 
        />
      </Routes>
    </Router>
  );
}

export default App;