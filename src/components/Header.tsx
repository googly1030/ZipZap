import React from 'react';
import { MessageSquare, Users } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="bg-[#202124] border-b border-[#ffffff1a] py-3 px-4 md:px-6">
      <div className="max-w-[2000px] mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-white">BudX AI</h1>
            <span className="px-2 py-1 rounded-full text-xs bg-[#8AB4F8]/10 text-[#8AB4F8] border border-[#8AB4F8]/20">
              Beta
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <button className="text-[#ffffff99] hover:text-white transition-colors p-2 rounded-lg hover:bg-[#ffffff1a]">
            <MessageSquare className="h-5 w-5" />
          </button>
          <button className="text-[#ffffff99] hover:text-white transition-colors p-2 rounded-lg hover:bg-[#ffffff1a]">
            <Users className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;