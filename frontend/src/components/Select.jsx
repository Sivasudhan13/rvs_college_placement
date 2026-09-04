import React from 'react';
import PropTypes from 'prop-types';

const Select = ({ 
  label, 
  placeholder = 'Select an option', 
  value, 
  onChange, 
  name,
  options = [],
  icon,
  required = false,
  error,
  helperText,
  disabled = false,
  className = ''
}) => {
  return (
    <div className={`w-full mb-5 ${className}`}>
      {label && (
        <label 
          htmlFor={name} 
          className="block text-sm font-semibold text-gray-800 mb-2"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className={`relative flex items-center border rounded-md bg-white transition-all duration-200 ${
        error 
          ? 'border-red-500 focus-within:ring-2 focus-within:ring-red-100' 
          : 'border-gray-300 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10'
      }`}>
        {icon && (
          <span className="flex items-center justify-center pl-3.5 text-gray-500 pointer-events-none">
            {icon}
          </span>
        )}
        <select
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          className={`w-full py-3 pr-10 text-sm text-gray-800 border-none bg-transparent outline-none cursor-pointer appearance-none disabled:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-500 ${
            icon ? 'pl-2' : 'pl-3.5'
          }`}
          required={required}
          disabled={disabled}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={helperText ? `${name}-helper` : undefined}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500 flex items-center justify-center">
          <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </span>
      </div>
      {helperText && (
        <p 
          id={`${name}-helper`} 
          className={`mt-1.5 text-xs ${error ? 'text-red-500' : 'text-gray-600'}`}
        >
          {helperText}
        </p>
      )}
    </div>
  );
};

Select.propTypes = {
  label: PropTypes.string,
  placeholder: PropTypes.string,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  name: PropTypes.string.isRequired,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
    })
  ),
  icon: PropTypes.node,
  required: PropTypes.bool,
  error: PropTypes.bool,
  helperText: PropTypes.string,
  disabled: PropTypes.bool,
  className: PropTypes.string
};

export default Select;
