import { Brain, Search, Menu, Sun, LogOut } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

interface HeaderProps {
  isFormCompleted?: boolean;
}

export default function Header({ isFormCompleted = false }: HeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const isChatPage = location.pathname === "/chat";
  const isLandingPage = location.pathname === "/";
  const isGetStartedPage = location.pathname === "/get-started";

  const handleLogoClick = () => {
    if (!isFormCompleted && isChatPage) {
      navigate("/");
    } else if (!isChatPage) {
      navigate("/");
    }
  };

  const handleAuthAction = () => {
    if (isLandingPage) {
      navigate("/get-started");
    } else {
      // Clear user data from localStorage
      localStorage.removeItem('userData');
      // Clear any session storage if needed
      sessionStorage.clear();
      // Navigate to landing page
      navigate("/");
    }
  };

  return (
    <header className="fixed w-full z-50 header-gradient border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo with click handler */}
          <div
            className="flex items-center space-x-2 cursor-pointer"
            onClick={handleLogoClick}
          >
            <Brain className="w-8 h-8 text-purple-400" />
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-500">
              BudX
            </span>
          </div>

          {/* Navigation - Only shown on landing page */}
          {isLandingPage && (
            <nav className="hidden md:flex items-center space-x-8">
              <a
                href="#features"
                className="text-gray-300 hover:text-white transition-colors duration-200 text-sm font-medium"
              >
                Features
              </a>
              <a
                href="#about"
                className="text-gray-300 hover:text-white transition-colors duration-200 text-sm font-medium"
              >
                About
              </a>
              <a
                href="#pricing"
                className="text-gray-300 hover:text-white transition-colors duration-200 text-sm font-medium"
              >
                Pricing
              </a>
              <a
                href="#contact"
                className="text-gray-300 hover:text-white transition-colors duration-200 text-sm font-medium"
              >
                Contact
              </a>
            </nav>
          )}

          {/* Right side buttons */}
          <div className="flex items-center space-x-4">
            <button className="p-2 text-gray-300 hover:text-white transition-colors">
              <Search className="w-5 h-5" />
            </button>
            <button className="p-2 text-gray-300 hover:text-white transition-colors">
              <Sun className="w-5 h-5" />
            </button>
            <button className="md:hidden p-2 text-gray-300 hover:text-white transition-colors">
              <Menu className="w-5 h-5" />
            </button>
            {!isGetStartedPage && (
              <button
                onClick={handleAuthAction}
                className={`hidden md:flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-semibold 
                  transition-all duration-300 group ${
                    isLandingPage
                      ? "bg-gradient-to-r from-purple-600 to-pink-600 hover:shadow-[0_0_20px_rgba(147,51,234,0.3)]"
                      : "border border-purple-500 hover:bg-purple-500/10"
                  }`}
              >
              {isLandingPage ? (
                "Get Started"
              ) : (
                <>
                  <LogOut className="w-4 h-4 text-white" />
                  <span className="text-white group-hover:hidden">Sign Off</span>
                  <span className="text-white hidden group-hover:inline">GTF Off</span>
                </>
              )}
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
