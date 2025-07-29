import React, { useState } from 'react';

const CollapsibleCategory = ({ title, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="mb-8 p-6 bg-gray-50 rounded-xl shadow-inner">
      <button
        className="w-full flex justify-between items-center text-left text-3xl font-bold text-gray-800 mb-4 border-b-2 border-blue-500 pb-2 focus:outline-none hover:text-blue-600 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{title}</span>
        <svg
          className={`w-8 h-8 transform transition-transform duration-300 ${
            isOpen ? 'rotate-180' : 'rotate-0'
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth="2" 
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      
      {isOpen && (
        <div className="mt-4 animate-fadeIn">
          {children}
        </div>
      )}
    </div>
  );
};

export default CollapsibleCategory;