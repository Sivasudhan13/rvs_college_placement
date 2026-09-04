import React from 'react';
import PropTypes from 'prop-types';

const Card = ({ 
  children, 
  title,
  subtitle,
  className = '',
  padding = 'medium',
  shadow = true,
  hoverable = false,
  bordered = false
}) => {
  const paddingClasses = {
    none: 'p-0',
    small: 'p-4',
    medium: 'p-6',
    large: 'p-8'
  };

  const cardClasses = `
    bg-white rounded-lg transition-all duration-300 overflow-hidden
    ${paddingClasses[padding]}
    ${shadow ? 'shadow-sm' : ''}
    ${bordered ? 'border border-gray-200' : ''}
    ${hoverable ? 'cursor-pointer hover:shadow-xl hover:-translate-y-0.5' : ''}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  return (
    <div className={cardClasses}>
      {(title || subtitle) && (
        <div className="mb-5">
          {title && (
            <h2 className="text-2xl font-bold text-gray-800 m-0 leading-tight">
              {title}
            </h2>
          )}
          {subtitle && (
            <p className="text-sm text-gray-600 mt-2 m-0 leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>
      )}
      <div className="text-gray-700">
        {children}
      </div>
    </div>
  );
};

Card.propTypes = {
  children: PropTypes.node.isRequired,
  title: PropTypes.string,
  subtitle: PropTypes.string,
  className: PropTypes.string,
  padding: PropTypes.oneOf(['none', 'small', 'medium', 'large']),
  shadow: PropTypes.bool,
  hoverable: PropTypes.bool,
  bordered: PropTypes.bool
};

export default Card;
