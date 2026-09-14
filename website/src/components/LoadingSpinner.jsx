import React from 'react';

export default function LoadingSpinner({ size = 'md', message = 'Loading...' }) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-3">
      <div
        className={`${sizeClasses[size]} border-gray-200 border-t-[#0B1528] rounded-full animate-spin`}
      />
      {message && <p className="text-xs font-semibold text-gray-500">{message}</p>}
    </div>
  );
}
