import React from 'react';
import PropTypes from 'prop-types';

const Link = ({ 
  children, 
  href = '#',
  onClick,
  variant = 'default',
  underline = 'hover',
  external = false,
  disabled = false,
  className = ''
}) => {
  const variantClasses = {
    default: 'text-gray-700 hover:text-primary',
    primary: 'text-primary hover:text-primary-dark',
    secondary: 'text-gray-600 hover:text-gray-800',
    danger: 'text-red-500 hover:text-red-600'
  };

  const underlineClasses = {
    none: 'no-underline',
    hover: 'no-underline hover:underline',
    always: 'underline'
  };

  const linkClasses = `
    inline-flex items-center gap-1 cursor-pointer transition-all duration-200
    font-medium relative focus:outline-none focus:ring-2 focus:ring-primary
    focus:ring-offset-1 rounded-sm
    ${variantClasses[variant]}
    ${underlineClasses[underline]}
    ${disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  const handleClick = (e) => {
    if (disabled) {
      e.preventDefault();
      return;
    }
    if (onClick) {
      onClick(e);
    }
  };

  return (
    <a
      href={disabled ? undefined : href}
      onClick={handleClick}
      className={linkClasses}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      aria-disabled={disabled}
    >
      {children}
      {external && (
        <svg 
          className="shrink-0 ml-0.5" 
          width="12" 
          height="12" 
          viewBox="0 0 12 12" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path 
            d="M10 6.5V10.5H1.5V2H5.5M7 1.5H10.5V5M10.5 1.5L5 7" 
            stroke="currentColor" 
            strokeWidth="1.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
        </svg>
      )}
    </a>
  );
};

Link.propTypes = {
  children: PropTypes.node.isRequired,
  href: PropTypes.string,
  onClick: PropTypes.func,
  variant: PropTypes.oneOf(['default', 'primary', 'secondary', 'danger']),
  underline: PropTypes.oneOf(['none', 'hover', 'always']),
  external: PropTypes.bool,
  disabled: PropTypes.bool,
  className: PropTypes.string
};

export default Link;
