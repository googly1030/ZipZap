import React from 'react';

const LoadingDots: React.FC = () => {
  return (
    <div className="flex items-center space-x-2">
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-400 to-pink-600 animate-pulse"
          style={{
            animationDelay: `${i * 200}ms`
          }}
        />
      ))}
    </div>
  );
};

export default LoadingDots;