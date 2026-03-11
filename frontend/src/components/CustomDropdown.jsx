import React, { useState, useEffect, useRef } from 'react';

const CustomDropdown = ({ value, onChange, options, label }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="space-y-2 min-w-[120px]" ref={dropdownRef}>
            {label && <label className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">{label}</label>}
            <div className="relative">
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className="premium-select-trigger"
                >
                    <span className="truncate">{value}</span>
                    <svg
                        className={`w-3.5 h-3.5 transition-transform duration-300 ${isOpen ? 'rotate-180 text-blue-400' : 'text-slate-500'}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>

                {isOpen && (
                    <div className="premium-select-menu animate-in fade-in zoom-in-95 duration-200">
                        {options.map((option) => (
                            <div
                                key={option}
                                onClick={() => {
                                    onChange(option);
                                    setIsOpen(false);
                                }}
                                className={`premium-select-item ${value === option ? 'active' : ''}`}
                            >
                                {option}
                                {value === option && (
                                    <svg className="w-3.5 h-3.5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CustomDropdown;
