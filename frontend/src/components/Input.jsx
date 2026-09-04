import React from 'react';
import PropTypes from 'prop-types';

const Input = ({ 
  label, 
  type = 'text', 
  placeholder, 
  value, 
  onChange, 
  name,
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
        <input
          id={name}
          type={type}
          name={name}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className={`w-full py-3 px-3.5 text-sm text-gray-800 border-none bg-transparent outline-none disabled:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-500 ${
            icon ? 'pl-2' : ''
          }`}
          required={required}
          disabled={disabled}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={helperText ? `${name}-helper` : undefined}
        />
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

Input.propTypes = {
  label: PropTypes.string,
  type: PropTypes.string,
  placeholder: PropTypes.string,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  name: PropTypes.string.isRequired,
  icon: PropTypes.node,
  required: PropTypes.bool,
  error: PropTypes.bool,
  helperText: PropTypes.string,
  disabled: PropTypes.bool,
  className: PropTypes.string
};

export default Input;
