import React from 'react';

const LoadingSkeleton = ({ 
  className = '',
  variant = 'default',
  count = 1,
}) => {
  const variants = {
    default: 'h-4 w-full',
    text: 'h-4 w-3/4',
    title: 'h-6 w-1/2',
    avatar: 'h-10 w-10 rounded-full',
    card: 'h-32 w-full',
    thumbnail: 'h-40 w-full',
    button: 'h-9 w-24',
  };
  
  const skeletons = Array.from({ length: count }, (_, i) => (
    <div
      key={i}
      className={`animate-pulse bg-gray-200 rounded ${variants[variant]} ${className}`}
    />
  ));
  
  return count === 1 ? skeletons[0] : <div className="space-y-2">{skeletons}</div>;
};

const CardSkeleton = () => (
  <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
    <LoadingSkeleton variant="thumbnail" className="mb-4" />
    <LoadingSkeleton variant="title" className="mb-2" />
    <LoadingSkeleton variant="text" className="mb-2" />
    <LoadingSkeleton variant="text" />
  </div>
);

const TableSkeleton = ({ rows = 5, columns = 4 }) => (
  <div className="space-y-3">
    {Array.from({ length: rows }, (_, i) => (
      <div key={i} className="flex gap-4 items-center">
        {Array.from({ length: columns }, (_, j) => (
          <LoadingSkeleton key={j} variant="text" className="flex-1" />
        ))}
      </div>
    ))}
  </div>
);

export { LoadingSkeleton, CardSkeleton, TableSkeleton };
