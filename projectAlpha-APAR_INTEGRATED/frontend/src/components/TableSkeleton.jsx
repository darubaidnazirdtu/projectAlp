import React from 'react';

const TableSkeleton = ({ rows = 5, columns = 6 }) => {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 animate-pulse">
      <div className="overflow-x-auto relative">
        <table className="min-w-full text-sm text-center text-gray-600">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {Array.from({ length: columns }).map((_, i) => (
                <th key={i} className="px-4 py-3">
                  <div className="h-4 bg-gray-200 rounded w-24 mx-auto"></div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {Array.from({ length: rows }).map((_, rowIndex) => (
              <tr key={rowIndex}>
                {Array.from({ length: columns }).map((_, colIndex) => (
                  <td key={colIndex} className="px-4 py-4 whitespace-nowrap">
                    <div className="h-4 bg-gray-100 rounded w-20 mx-auto"></div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TableSkeleton;
