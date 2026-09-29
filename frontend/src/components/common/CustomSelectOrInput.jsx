import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import Input from './Input';
import Select from './Select';

const CustomSelectOrInput = ({
  name,
  otherName,
  options = [],
  label,
  selectPlaceholder = 'Select',
  inputPlaceholder = '',
  register,
  watch,
  setValue,
  error,
  required = false,
  containerClassName = '',
}) => {
  const isOther = watch(name) === 'Other';
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOther && inputRef.current) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOther]);

  if (isOther) {
    const otherRegistration = register(otherName, {
      required: required ? `Please specify ${label.toLowerCase()}` : false,
    });

    return (
      <div className={`relative ${containerClassName}`}>
        <Input
          label={`Specify Other ${label}`}
          placeholder={inputPlaceholder || `Enter ${label.toLowerCase()}`}
          required={required}
          error={error}
          autoFocus
          {...otherRegistration}
          ref={(e) => {
            otherRegistration.ref(e);
            inputRef.current = e;
          }}
        />
        <button
          type="button"
          onClick={() => {
            setValue(name, '', { shouldValidate: true });
            setValue(otherName, '', { shouldValidate: true });
          }}
          className="absolute right-3 top-[34px] text-gray-400 hover:text-gray-700 p-1 transition-colors"
          title="Back to options"
          aria-label="Back to dropdown options"
        >
          <X size={16} />
        </button>
      </div>
    );
  }

  return (
    <Select
      label={label}
      placeholder={selectPlaceholder}
      options={options}
      required={required}
      error={error}
      containerClassName={containerClassName}
      {...register(name, {
        required: required ? `${label} is required` : false,
      })}
    />
  );
};

export default CustomSelectOrInput;
