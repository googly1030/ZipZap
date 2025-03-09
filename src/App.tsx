import { useState } from 'react';
import UserForm from './components/UserForm';
import ChatInterface from './components/ChatInterface';

function App() {
  const [step, setStep] = useState<'form' | 'chat'>('form');
  const [userInfo, setUserInfo] = useState({
    name: '',
    email: '',
    company: '',
    jobRole: ''
  });

  const handleFormSubmit = (formData: typeof userInfo) => {
    setUserInfo(formData);
    setStep('chat');
  };

  return (
    <div className="min-h-screen w-full bg-[#202124]">
      {step === 'form' ? (
        <div className="p-4 sm:p-8 flex items-center justify-center">
          <div className="w-full max-w-[500px]">
            <UserForm onSubmit={handleFormSubmit} />
          </div>
        </div>
      ) : (
        <div className="w-full h-screen">
          <ChatInterface userInfo={userInfo} />
        </div>
      )}
    </div>
  );
}

export default App;