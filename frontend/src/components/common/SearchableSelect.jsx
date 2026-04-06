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

    // Filter based on search — show ALL options, no limit
    const filtered = options.filter((opt) =>
        opt.label.toLowerCase().includes(search.toLowerCase())
    );
    const displayed = filtered;
    const hasMore = false;

    const selectedLabel =
        options.find((o) => String(o.value) === String(value))?.label || '';

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
        <div style={{ position: 'relative' }} ref={containerRef}>
            {/* Label */}
            {label && (
                <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500, color: '#374151' }}>
                    {label}
                    {required && <span style={{ color: '#ef4444', marginLeft: 3 }}>*</span>}
                </label>
            )}

            {/* Trigger Button */}
            <div
                onClick={() => !disabled && setOpen((prev) => !prev)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    border: `1px solid ${error ? '#ef4444' : '#d1d5db'}`,
                    borderRadius: 8,
                    padding: '9px 12px',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    backgroundColor: disabled ? '#f9fafb' : '#fff',
                    fontSize: 14,
                    color: selectedLabel ? '#111827' : '#9ca3af',
                    outline: open ? '2px solid #6366f1' : 'none',
                    outlineOffset: 2,
                    userSelect: 'none',
                }}
            >
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {selectedLabel || placeholder}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    {selectedLabel && (
                        <X
                            size={14}
                            onClick={handleClear}
                            style={{ color: '#9ca3af', cursor: 'pointer' }}
                        />
                    )}
                    <ChevronDown
                        size={16}
                        style={{
                            color: '#6b7280',
                            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
                            transition: 'transform 0.2s',
                        }}
                    />
                </div>
            </div>

            {/* Dropdown */}
            {open && (
                <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 4px)',
                    left: 0,
                    right: 0,
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: 10,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                    zIndex: 1000,
                    overflow: 'hidden',
                }}>
                    {/* Search Input */}
                    <div style={{ padding: '8px 10px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Search size={14} style={{ color: '#9ca3af', flexShrink: 0 }} />
                        <input
                            ref={searchRef}
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search organization..."
                            style={{
                                border: 'none',
                                outline: 'none',
                                fontSize: 13,
                                width: '100%',
                                color: '#111827',
                                backgroundColor: 'transparent',
                            }}
                        />
                    </div>

                    {/* Options List */}
                    <ul style={{ maxHeight: 220, overflowY: 'auto', margin: 0, padding: '4px 0', listStyle: 'none' }}>
                        {displayed.length === 0 ? (
                            <li style={{ padding: '10px 14px', fontSize: 13, color: '#9ca3af', textAlign: 'center' }}>
                                No organizations found
                            </li>
                        ) : (
                            displayed.map((opt) => (
                                <li
                                    key={opt.value}
                                    onClick={() => handleSelect(opt)}
                                    style={{
                                        padding: '9px 14px',
                                        fontSize: 14,
                                        cursor: 'pointer',
                                        backgroundColor: String(opt.value) === String(value) ? '#eef2ff' : 'transparent',
                                        color: String(opt.value) === String(value) ? '#4f46e5' : '#111827',
                                        fontWeight: String(opt.value) === String(value) ? 600 : 400,
                                        transition: 'background 0.15s',
                                    }}
                                    onMouseEnter={(e) => {
                                        if (String(opt.value) !== String(value))
                                            e.currentTarget.style.backgroundColor = '#f9fafb';
                                    }}
                                    onMouseLeave={(e) => {
                                        if (String(opt.value) !== String(value))
                                            e.currentTarget.style.backgroundColor = 'transparent';
                                    }}
                                >
                                    {opt.label}
                                </li>
                            ))
                        )}
                    </ul>

                    {/* "Type to search more" hint */}
                    {hasMore && (
                        <div style={{
                            padding: '7px 14px',
                            fontSize: 12,
                            color: '#9ca3af',
                            borderTop: '1px solid #f3f4f6',
                            textAlign: 'center',
                        }}>
                            Showing {VISIBLE_LIMIT} of {filtered.length}. Type to search more.
                        </div>
                    )}
                </div>
            )}

            {/* Error */}
            {error && (
                <p style={{ marginTop: 4, fontSize: 12, color: '#ef4444' }}>{error}</p>
            )}
        </div>
    );
};

export default SearchableSelect;
