import  { useState } from 'react';
import UserForm from './components/UserForm';
import ChatInterface from './components/ChatInterface';;

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
    <div className="min-h-screen w-full bg-[#202124] p-4 sm:p-8 flex items-center justify-center">
      <div className="max-w-6xl mx-auto">
        {step === 'form' ? (
          <UserForm onSubmit={handleFormSubmit} />
        ) : (
          <ChatInterface userInfo={userInfo} />
        )}
      </div>
    </div>
  );
}

export default App;