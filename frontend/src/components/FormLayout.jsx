import React from 'react';
import PropTypes from 'prop-types';

const FormLayout = ({ 
  children,
  leftPanel,
  rightPanel,
  onSubmit,
  className = ''
}) => {
  return (
    <div className={`min-h-screen flex items-center justify-center bg-gray-50 p-8 md:p-4 ${className}`}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 w-full max-w-7xl bg-white rounded-xl shadow-md overflow-hidden min-h-[500px]">
        {leftPanel && (
          <div className="bg-gray-50 p-12 lg:p-10 md:p-8 sm:p-6 flex flex-col items-center justify-center border-b lg:border-b-0 lg:border-r border-gray-200">
            {leftPanel}
          </div>
        )}
        <div className="p-12 lg:p-10 md:p-8 sm:p-6 flex flex-col justify-center">
          <form onSubmit={onSubmit} className="w-full max-w-lg mx-auto">
            {rightPanel || children}
          </form>
        </div>
      </div>
    </div>
  );
};

FormLayout.propTypes = {
  children: PropTypes.node,
  leftPanel: PropTypes.node,
  rightPanel: PropTypes.node,
  onSubmit: PropTypes.func,
  className: PropTypes.string
};

export default FormLayout;
