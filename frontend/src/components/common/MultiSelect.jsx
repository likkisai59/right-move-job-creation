import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, X } from 'lucide-react';

const MultiSelect = ({
    label,
    options = [],       // [{ value, label }]
    value = [],         // array of selected values
    onChange,           // (valuesArray) => void
    error,
    required = false,
    placeholder = 'Select options...',
    disabled = false
}) => {
    const [open, setOpen] = useState(false);
    const containerRef = useRef(null);

    useEffect(() => {
        const handler = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const toggleOption = (optValue) => {
        let newValues;
        if (value.includes(optValue)) {
            newValues = value.filter(v => v !== optValue);
        } else {
            newValues = [...value, optValue];
        }
        onChange(newValues);
    };

    const handleClear = (e) => {
        e.stopPropagation();
        onChange([]);
    };

    const selectedLabels = options
        .filter(opt => value.includes(opt.value))
        .map(opt => opt.label)
        .join(', ');

    return (
        <div className="flex flex-col gap-1.5 w-full relative" ref={containerRef}>
            {label && (
                <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                    {label}
                    {required && <span className="text-red-500">*</span>}
                </label>
            )}

            <div
                onClick={() => !disabled && setOpen(!open)}
                className={`
                    flex items-center justify-between
                    w-full rounded-lg border bg-white text-sm cursor-pointer
                    pl-3 pr-3 py-2.5 transition-all min-h-[42px]
                    ${disabled ? 'bg-gray-50 cursor-not-allowed opacity-70' : 'hover:border-gray-300'}
                    ${error ? 'border-red-400' : 'border-gray-200'}
                    ${open ? 'ring-2 ring-blue-500 border-blue-500' : ''}
                `}
            >
                <div className="flex-1 truncate pr-2 text-gray-700">
                    {value.length > 0 ? (
                        <span className="font-medium truncate block">{selectedLabels}</span>
                    ) : (
                        <span className="text-gray-400">{placeholder}</span>
                    )}
                </div>
                
                <div className="flex items-center gap-1">
                    {value.length > 0 && !disabled && (
                        <div 
                            onClick={handleClear}
                            className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <X size={14} />
                        </div>
                    )}
                    <ChevronDown size={16} className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
                </div>
            </div>

            {open && !disabled && (
                <div className="absolute top-[100%] left-0 w-full mt-1 bg-white border border-gray-100 rounded-xl shadow-lg z-50 overflow-hidden max-h-60 flex flex-col">
                    <div className="overflow-y-auto p-2 space-y-1">
                        {options.length === 0 ? (
                            <div className="p-3 text-center text-sm text-gray-400">
                                No options available
                            </div>
                        ) : (
                            options.map(opt => {
                                const isSelected = value.includes(opt.value);
                                return (
                                    <div
                                        key={opt.value}
                                        onClick={() => toggleOption(opt.value)}
                                        className={`
                                            flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer text-sm transition-colors
                                            ${isSelected ? 'bg-blue-50 text-blue-700 font-semibold' : 'hover:bg-gray-50 text-gray-700'}
                                        `}
                                    >
                                        <span>{opt.label}</span>
                                        {isSelected && <Check size={16} className="text-blue-600" />}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}

            {error && (
                <p className="text-xs text-red-500">{error}</p>
            )}
        </div>
    );
};

export default MultiSelect;
