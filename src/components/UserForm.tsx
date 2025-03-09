import React, { useState } from 'react';
import { User, Building2, Briefcase, Mail, ArrowRight } from 'lucide-react';

interface UserFormProps {
  onSubmit: (data: {
    name: string;
    email: string;
    company: string;
    jobRole: string;
  }) => void;
}

const UserForm: React.FC<UserFormProps> = ({ onSubmit }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    jobRole: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="min-h-[600px] flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-[#202124] bg-opacity-80 rounded-lg border border-[#ffffff22] p-8 sm:p-10 shadow-xl">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-[#8AB4F8] to-[#F28B82] bg-clip-text text-transparent mb-3">
            Welcome to BudX 
          </h1>
          <p className="text-[#ffffff99]">Enter your details to get started</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-5">
            <div className="relative">
              <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#ffffff99] h-5 w-5 pointer-events-none" />
              <input
                type="text"
                placeholder="Full Name"
                required
                className="w-full rounded-md bg-[#2a2a2a] border border-[#ffffff22] text-white py-3 pl-12 pr-4 outline-none focus:ring-2 focus:ring-[#8AB4F8] focus:border-transparent transition-all"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="relative">
              <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#ffffff99] h-5 w-5 pointer-events-none" />
              <input
                type="email"
                placeholder="Email Address"
                required
                className="w-full rounded-md bg-[#2a2a2a] border border-[#ffffff22] text-white py-3 pl-12 pr-4 outline-none focus:ring-2 focus:ring-[#8AB4F8] focus:border-transparent transition-all"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="relative">
              <Building2 className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#ffffff99] h-5 w-5 pointer-events-none" />
              <input
                type="text"
                placeholder="Company Name"
                required
                className="w-full rounded-md bg-[#2a2a2a] border border-[#ffffff22] text-white py-3 pl-12 pr-4 outline-none focus:ring-2 focus:ring-[#8AB4F8] focus:border-transparent transition-all"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              />
            </div>

            <div className="relative">
              <Briefcase className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#ffffff99] h-5 w-5 pointer-events-none" />
              <input
                type="text"
                placeholder="Job Role"
                required
                className="w-full rounded-md bg-[#2a2a2a] border border-[#ffffff22] text-white py-3 pl-12 pr-4 outline-none focus:ring-2 focus:ring-[#8AB4F8] focus:border-transparent transition-all"
                value={formData.jobRole}
                onChange={(e) => setFormData({ ...formData, jobRole: e.target.value })}
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full font-medium py-3 px-6 rounded-full flex items-center justify-center bg-[#303134] text-white hover:bg-[#8AB4F8] hover:text-[#202124] transition-all duration-300 border border-[#ffffff22]"
          >
            <span>Continue</span>
            <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default UserForm;