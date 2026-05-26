// frontend/src/components/common/SearchableSelect.jsx

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';

const SearchableSelect = ({
    label,
    options = [],       // [{ value, label }]
    value,              // controlled value
    onChange,           // (value) => void
    error,
    required = false,
    placeholder = 'Select...',
    disabled = false,
    showSearch = true,  // New prop: toggle search bar
    maxHeight = 220,    // New prop: control dropdown height
}) => {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const containerRef = useRef(null);
    const searchRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handler = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setOpen(false);
                setSearch('');
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // Focus search input when dropdown opens
    useEffect(() => {
        if (open && searchRef.current) {
            searchRef.current.focus();
        }
    }, [open]);

    // Filter based on search
    const filtered = options.filter((opt) =>
        opt.label.toLowerCase().includes(search.toLowerCase())
    );

    const selectedOption = options.find((o) => String(o.value) === String(value));
    const selectedLabel = selectedOption?.label || '';

    const handleSelect = (opt) => {
        onChange(opt.value);
        setOpen(false);
        setSearch('');
    };

    const handleClear = (e) => {
        e.stopPropagation();
        onChange('');
    };

    return (
        <div className="relative flex flex-col gap-1.5" ref={containerRef}>
            {/* Label */}
            {label && (
                <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                    {label}
                    {required && <span className="text-red-500">*</span>}
                </label>
            )}

            {/* Trigger Button */}
            <div
                onClick={() => !disabled && setOpen((prev) => !prev)}
                className={`
                    flex items-center justify-between rounded-lg border px-3 py-2.5 text-sm transition-all duration-150
                    ${disabled ? 'cursor-not-allowed bg-gray-50' : 'cursor-pointer bg-white'}
                    ${error ? 'border-red-400 focus:ring-red-400' : 'border-gray-200 hover:border-gray-300'}
                    ${open ? 'ring-2 ring-blue-500 border-blue-500' : ''}
                    ${selectedLabel ? 'text-gray-900' : 'text-gray-400'}
                `}
            >
                <span className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
                    {selectedLabel || placeholder}
                </span>
                <div className="flex items-center gap-1">
                    {!disabled && selectedLabel && (
                        <X
                            size={14}
                            onClick={handleClear}
                            className="text-gray-400 hover:text-gray-600 cursor-pointer"
                        />
                    )}
                    <ChevronDown
                        size={16}
                        className={`text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
                    />
                </div>
            </div>

            {/* Dropdown */}
            {open && (
                <div className="absolute top-[calc(100%+4px)] left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-lg z-[1000] overflow-hidden animate-in fade-in zoom-in duration-150 origin-top">
                    {/* Search Input (Optional) */}
                    {showSearch && (
                        <div className="p-2 border-b border-gray-100 flex items-center gap-2">
                            <Search size={14} className="text-gray-400 shrink-0" />
                            <input
                                ref={searchRef}
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search..."
                                className="border-none outline-none text-xs w-full text-gray-900 bg-transparent placeholder:text-gray-400"
                            />
                        </div>
                    )}

                    {/* Options List */}
                    <ul 
                        className="overflow-y-auto py-1 m-0 list-none" 
                        style={{ maxHeight: `${maxHeight}px` }}
                    >
                        {filtered.length === 0 ? (
                            <li className="px-4 py-3 text-xs text-gray-500 text-center italic">
                                No options found
                            </li>
                        ) : (
                            filtered.map((opt) => (
                                <li
                                    key={opt.value}
                                    onClick={() => handleSelect(opt)}
                                    className={`
                                        px-4 py-2.5 text-sm cursor-pointer transition-colors
                                        ${String(opt.value) === String(value) 
                                            ? 'bg-blue-50 text-blue-600 font-semibold' 
                                            : 'text-gray-700 hover:bg-gray-50'}
                                    `}
                                >
                                    {opt.label}
                                </li>
                            ))
                        )}
                    </ul>
                </div>
            )}

            {/* Error Message */}
            {error && (
                <p className="text-xs text-red-500 mt-0.5">{error}</p>
            )}
        </div>
    );
};

export default SearchableSelect;
