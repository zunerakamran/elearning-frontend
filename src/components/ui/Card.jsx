import React from 'react';

const Card = ({ 
  children, 
  className = '', 
  hover = false,
  padding = 'md',
  ...props 
}) => {
  const baseStyles = 'bg-white rounded-xl border border-gray-200';
  
  const hoverStyles = hover 
    ? 'hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer' 
    : 'shadow-sm';
  
  const paddings = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };
  
  return (
    <div 
      className={`${baseStyles} ${hoverStyles} ${paddings[padding]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
