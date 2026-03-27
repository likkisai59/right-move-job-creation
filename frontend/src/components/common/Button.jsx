import React from 'react';

const variants = {
  primary: 'bg-blue-600 hover:bg-blue-700 text-white border border-blue-600 shadow-sm',
  secondary: 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 shadow-sm',
  danger: 'bg-red-600 hover:bg-red-700 text-white border border-red-600 shadow-sm',
  ghost: 'bg-transparent hover:bg-gray-100 text-gray-600 border border-transparent',
  outline: 'bg-transparent hover:bg-blue-50 text-blue-600 border border-blue-200',
};

const sizes = {
  sm: 'px-3 py-1.5 text-xs gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
  lg: 'px-5 py-2.5 text-sm gap-2',
  xl: 'px-6 py-3 text-base gap-2',
};

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconRight: IconRight,
  loading = false,
  disabled = false,
  className = '',
  type = 'button',
  onClick,
  ...props
}) => {
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={[
        'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 cursor-pointer select-none',
        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1',
        variants[variant],
        sizes[size],
        isDisabled ? 'opacity-50 cursor-not-allowed' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {loading ? (
        <svg
          className="animate-spin h-4 w-4 text-current"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      ) : Icon ? (
        <Icon size={size === 'sm' ? 14 : 16} className="shrink-0" />
      ) : null}
      {children}
      {!loading && IconRight && (
        <IconRight size={size === 'sm' ? 14 : 16} className="shrink-0" />
      )}
    </button>
  );
};

export default Button;
