import React from 'react';

const PageContainer = ({ title, subtitle, actions, children, className = '' }) => {
  return (
    <div className={`flex-1 overflow-y-auto bg-gray-50 ${className}`}>
      <div className="max-w-screen-xl mx-auto px-6 py-6">
        {/* Page header */}
        {(title || actions) && (
          <div className="flex items-start justify-between mb-6">
            <div>
              {title && (
                <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
              )}
              {subtitle && (
                <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
              )}
            </div>
            {actions && (
              <div className="flex items-center gap-2 flex-wrap justify-end">
                {actions}
              </div>
            )}
          </div>
        )}

        {/* Page content */}
        {children}
      </div>
    </div>
  );
};

export default PageContainer;
