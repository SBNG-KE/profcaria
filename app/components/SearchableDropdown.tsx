"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check, Plus, X } from 'lucide-react';

interface Option {
    value: string;
    label: string;
}

interface SearchableDropdownProps {
    options: Option[];
    selectedValues: string[];
    onSelect: (value: string) => void;
    onRemove: (value: string) => void;
    placeholder?: string;
    searchPlaceholder?: string;
    allowAdd?: boolean;
    onAdd?: (newValue: string) => void;
    isMulti?: boolean;
    isDark: boolean;
    className?: string;
}

export function SearchableDropdown({
    options,
    selectedValues,
    onSelect,
    onRemove,
    placeholder = "Select...",
    searchPlaceholder = "Search...",
    allowAdd = false,
    onAdd,
    isMulti = true,
    isDark,
    className = ""
}: SearchableDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Close on outside click
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Focus input on open
    useEffect(() => {
        if (isOpen && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [isOpen]);

    const filteredOptions = options.filter(opt =>
        opt.label.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSelect = (value: string) => {
        if (isMulti) {
            if (selectedValues.includes(value)) {
                onRemove(value);
            } else {
                onSelect(value);
                setSearchTerm('');
            }
        } else {
            onSelect(value);
            setIsOpen(false);
            setSearchTerm('');
        }
    };

    const handleAddNew = () => {
        if (onAdd && searchTerm.trim()) {
            onAdd(searchTerm.trim());
            setSearchTerm('');
            if (!isMulti) setIsOpen(false);
        }
    };

    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            {/* Trigger Button */}
            <div
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border cursor-pointer transition-all ${isDark
                        ? `bg-neutral-800 border-neutral-700 hover:border-neutral-600 ${isOpen ? 'border-neutral-500 ring-1 ring-neutral-500' : ''}`
                        : `bg-white border-neutral-200 hover:border-neutral-300 ${isOpen ? 'border-neutral-400 ring-1 ring-neutral-400' : ''}`
                    }`}
            >
                <div className="flex flex-wrap gap-1 mr-2">
                    {selectedValues.length === 0 ? (
                        <span className={isDark ? 'text-neutral-500' : 'text-neutral-400'}>{placeholder}</span>
                    ) : (
                        isMulti ? (
                            <span className={isDark ? 'text-neutral-300' : 'text-neutral-700'}>
                                {selectedValues.length} selected
                            </span>
                        ) : (
                            <span className={`font-medium ${isDark ? 'text-white' : 'text-black'}`}>
                                {options.find(o => o.value === selectedValues[0])?.label || selectedValues[0]}
                            </span>
                        )
                    )}
                </div>
                <ChevronDown size={16} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''} ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`} />
            </div>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className={`absolute top-full left-0 right-0 mt-2 z-50 rounded-xl border shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 ${isDark ? 'bg-neutral-900 border-neutral-700' : 'bg-white border-neutral-200'
                    }`}>
                    {/* Search Input */}
                    <div className={`p-2 border-b ${isDark ? 'border-neutral-800' : 'border-neutral-100'}`}>
                        <div className="relative">
                            <Search size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`} />
                            <input
                                ref={searchInputRef}
                                type="text"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                placeholder={searchPlaceholder}
                                className={`w-full pl-9 pr-4 py-2 rounded-lg text-sm font-medium focus:outline-none ${isDark
                                        ? 'bg-neutral-800 text-white placeholder-neutral-600'
                                        : 'bg-neutral-100 text-black placeholder-neutral-400'
                                    }`}
                                onClick={e => e.stopPropagation()}
                            />
                        </div>
                    </div>

                    {/* Options List */}
                    <div className="max-h-60 overflow-y-auto p-1 custom-scrollbar">
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map(opt => {
                                const isSelected = selectedValues.includes(opt.value);
                                return (
                                    <button
                                        key={opt.value}
                                        onClick={() => handleSelect(opt.value)}
                                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isSelected
                                                ? (isDark ? 'bg-blue-600/20 text-blue-400' : 'bg-blue-50 text-blue-600')
                                                : (isDark ? 'text-neutral-300 hover:bg-neutral-800' : 'text-neutral-600 hover:bg-neutral-50')
                                            }`}
                                    >
                                        <span>{opt.label}</span>
                                        {isSelected && <Check size={14} />}
                                    </button>
                                );
                            })
                        ) : (
                            !allowAdd && (
                                <div className={`p-4 text-center text-xs ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
                                    No results found.
                                </div>
                            )
                        )}

                        {/* Add New Option */}
                        {allowAdd && searchTerm && !filteredOptions.find(o => o.label.toLowerCase() === searchTerm.toLowerCase()) && (
                            <button
                                onClick={handleAddNew}
                                className={`w-full flex items-center gap-2 px-3 py-3 mt-1 rounded-lg text-sm font-bold border-t transition-colors ${isDark
                                        ? 'border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-800'
                                        : 'border-neutral-100 text-neutral-500 hover:text-black hover:bg-neutral-50'
                                    }`}
                            >
                                <Plus size={14} />
                                <span>Add "{searchTerm}"</span>
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
