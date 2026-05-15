import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center">
      <h1 className="text-9xl font-bold text-indigo-600">404</h1>
      <h2 className="text-4xl font-semibold text-gray-800 mt-4">Page Not Found</h2>
      <p className="text-lg text-gray-600 mt-2">
        Sorry, the page you are looking for does not exist.
      </p>
      <Link
        to="/"
        className="mt-8 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
      >
        Go to Dashboard
      </Link>
    </div>
  );
}