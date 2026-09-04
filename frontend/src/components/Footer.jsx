import React from 'react';
import PropTypes from 'prop-types';

const Footer = ({ 
  collegeName = 'College Name',
  year = new Date().getFullYear(),
  accreditation,
  links = [],
  logos = []
}) => {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 py-8 px-4 mt-auto">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center md:items-start gap-8 md:gap-4 mb-6">
          <div className="flex-1 text-center md:text-left">
            <h3 className="text-base font-semibold text-primary mb-1">
              {collegeName}
            </h3>
            {accreditation && (
              <p className="text-xs text-gray-600 m-0 leading-relaxed">
                {accreditation}
              </p>
            )}
          </div>
          
          {links.length > 0 && (
            <nav 
              className="flex flex-wrap gap-6 md:gap-4 items-center justify-center md:justify-end" 
              aria-label="Footer navigation"
            >
              {links.map((link, index) => (
                <a 
                  key={index}
                  href={link.href}
                  className="text-sm text-gray-700 no-underline transition-colors duration-200 hover:text-primary hover:underline whitespace-nowrap"
                  target={link.external ? '_blank' : undefined}
                  rel={link.external ? 'noopener noreferrer' : undefined}
                >
                  {link.label}
                </a>
              ))}
            </nav>
          )}
        </div>

        {logos.length > 0 && (
          <div className="flex flex-wrap gap-6 items-center justify-start pt-6 border-t border-gray-200">
            {logos.map((logo, index) => (
              <div key={index} className="flex items-center justify-center">
                <img 
                  src={logo.src} 
                  alt={logo.alt || `Logo ${index + 1}`}
                  className="h-10 w-auto max-w-[100px] object-contain opacity-80 transition-opacity duration-200 hover:opacity-100"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </footer>
  );
};

Footer.propTypes = {
  collegeName: PropTypes.string,
  year: PropTypes.number,
  accreditation: PropTypes.string,
  links: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      href: PropTypes.string.isRequired,
      external: PropTypes.bool
    })
  ),
  logos: PropTypes.arrayOf(
    PropTypes.shape({
      src: PropTypes.string.isRequired,
      alt: PropTypes.string
    })
  )
};

export default Footer;
