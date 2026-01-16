import React from 'react';

const Header: React.FC = () => {
  const today = new Date();

  const formattedDate = today.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-4xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Habit Tracker
        </h1>
        <p className="mt-1 text-sm sm:text-base text-gray-500">
          {formattedDate}
        </p>
      </div>
    </header>
  );
};

export default Header;
