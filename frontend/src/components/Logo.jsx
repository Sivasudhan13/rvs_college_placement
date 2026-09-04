import React from 'react';
import PropTypes from 'prop-types';

const Logo = ({ 
  src, 
  alt = 'College Logo',
  collegeName,
  tagline,
  size = 'medium',
  centered = false,
  className = ''
}) => {
  const sizeClasses = {
    small: 'max-w-[60px] max-h-[60px]',
    medium: 'max-w-[100px] max-h-[100px]',
    large: 'max-w-[140px] max-h-[140px]'
  };

  const titleSizeClasses = {
    small: 'text-base',
    medium: 'text-xl',
    large: 'text-2xl'
  };

  const taglineSizeClasses = {
    small: 'text-xs',
    medium: 'text-sm',
    large: 'text-base'
  };

  const containerClasses = `
    flex flex-col gap-3
    ${centered ? 'items-center text-center' : 'items-start'}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  return (
    <div className={containerClasses}>
      <div className="flex items-center justify-center">
        <img 
          src={src} 
          alt={alt} 
          className={`w-full h-auto object-contain block ${sizeClasses[size]}`}
          loading="lazy"
        />
      </div>
      {collegeName && (
        <h1 className={`${titleSizeClasses[size]} font-bold text-primary m-0 leading-snug`}>
          {collegeName}
        </h1>
      )}
      {tagline && (
        <p className={`${taglineSizeClasses[size]} text-gray-700 m-0 leading-relaxed italic`}>
          {tagline}
        </p>
      )}
    </div>
  );
};

Logo.propTypes = {
  src: PropTypes.string.isRequired,
  alt: PropTypes.string,
  collegeName: PropTypes.string,
  tagline: PropTypes.string,
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  centered: PropTypes.bool,
  className: PropTypes.string
};

export default Logo;
