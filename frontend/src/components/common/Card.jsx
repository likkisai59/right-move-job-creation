import React from 'react';

const Card = ({
  children,
  className = '',
  padding = true,
  hover = false,
  ...props
}) => {
  return (
    <div
      className={[
        'bg-white rounded-xl border border-gray-100 shadow-sm',
        padding ? 'p-6' : '',
        hover ? 'hover:shadow-md transition-shadow duration-200 cursor-pointer' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({ title, subtitle, actions, className = '' }) => (
  <div className={`flex items-start justify-between mb-5 ${className}`}>
    <div>
      <h3 className="text-base font-semibold text-gray-900">{title}</h3>
      {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
    </div>
    {actions && <div className="flex items-center gap-2">{actions}</div>}
  </div>
);

export const CardDivider = () => (
  <div className="border-t border-gray-100 -mx-6 my-5" />
);

export default Card;
