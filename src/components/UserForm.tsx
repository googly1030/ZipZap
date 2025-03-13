import React, { useState, useEffect } from "react";
import { User, Building2, Briefcase, Mail, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Header from "./LandingHeader";

interface UserData {
  name: string;
  email: string;
  company: string;
  jobRole: string;
}

interface UserFormProps {
  onSubmit: (data: UserData) => void;
}

const UserForm: React.FC<UserFormProps> = ({ onSubmit }) => {
  const navigate = useNavigate();

  // Add session check on mount
  useEffect(() => {
    const userData = localStorage.getItem('userData');
    if (userData) {
      onSubmit(JSON.parse(userData));
      navigate("/chat");
    }
  }, [navigate, onSubmit]);

  const [formData, setFormData] = useState<UserData>({
    name: "",
    email: "",
    company: "",
    jobRole: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Save to localStorage
    localStorage.setItem('userData', JSON.stringify(formData));
    onSubmit(formData);
    navigate("/chat");
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
        <div className="w-full max-w-xl backdrop-blur-lg bg-gradient-to-b from-white/10 to-white/5 rounded-2xl p-8 sm:p-10 border border-purple-900/30">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-500 to-purple-600 mb-3">
              Welcome to BudX
            </h1>
            <p className="text-gray-300">Enter your details to get started</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-5">
              <div className="relative">
                <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-purple-400 h-5 w-5 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Full Name"
                  required
                  className="w-full rounded-lg bg-white/5 border border-purple-900/30 text-white py-3 pl-12 pr-4 
                   outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500/50 transition-all"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>

              <div className="relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-purple-400 h-5 w-5 pointer-events-none" />
                <input
                  type="email"
                  placeholder="Email Address"
                  required
                  className="w-full rounded-lg bg-white/5 border border-purple-900/30 text-white py-3 pl-12 pr-4 
                   outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500/50 transition-all"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>

              <div className="relative">
                <Building2 className="absolute left-4 top-1/2 transform -translate-y-1/2 text-purple-400 h-5 w-5 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Company Name"
                  required
                  className="w-full rounded-lg bg-white/5 border border-purple-900/30 text-white py-3 pl-12 pr-4 
                   outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500/50 transition-all"
                  value={formData.company}
                  onChange={(e) =>
                    setFormData({ ...formData, company: e.target.value })
                  }
                />
              </div>

              <div className="relative">
                <Briefcase className="absolute left-4 top-1/2 transform -translate-y-1/2 text-purple-400 h-5 w-5 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Job Role"
                  required
                  className="w-full rounded-lg bg-white/5 border border-purple-900/30 text-white py-3 pl-12 pr-4 
                   outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500/50 transition-all"
                  value={formData.jobRole}
                  onChange={(e) =>
                    setFormData({ ...formData, jobRole: e.target.value })
                  }
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-4 px-8 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white 
               font-semibold hover:shadow-[0_0_30px_rgba(147,51,234,0.3)] transition-all duration-300 
               flex items-center justify-center group"
            >
              <span>Continue</span>
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default UserForm;
