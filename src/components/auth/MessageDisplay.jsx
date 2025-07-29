import React from 'react';

const MessageDisplay = ({ message, type, onClose }) => {
  if (!message) return null;

  const bgColor = type === 'error' ? 'bg-red-500' : 'bg-green-500';
  const borderColor = type === 'error' ? 'border-red-700' : 'border-green-700';
  const icon = type === 'error' ? '❌' : '✅';

  return (
    <div className={`fixed top-4 left-1/2 -translate-x-1/2 p-4 rounded-lg shadow-lg text-white font-semibold flex items-center ${bgColor} border-b-4 ${borderColor} z-50 max-w-md mx-4`}>
      <span className="mr-3">{icon}</span>
      <span className="flex-1">{message}</span>
      <button 
        onClick={onClose} 
        className="ml-4 text-white hover:text-gray-200 font-bold text-xl leading-none"
      >
        &times;
      </button>
    </div>
  );
};

export default MessageDisplay;