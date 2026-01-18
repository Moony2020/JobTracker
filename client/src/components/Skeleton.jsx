import React from 'react';

const Skeleton = ({ width, height, borderRadius = '4px', className = '' }) => {
  return (
    <div 
      className={`skeleton-loader ${className}`}
      style={{ 
        width: width || '100%', 
        height: height || '20px', 
        borderRadius 
      }}
    />
  );
};

export default Skeleton;
