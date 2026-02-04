import React, { useState, useEffect } from 'react';
import { Icons } from './Icons';
import { RangeSlider } from './RangeSlider';
import { Unit } from '../types';

interface FilterBarProps {
    units: Unit[];
    onFilterChange: (filters: FilterState) => void;
    isDarkMode: boolean;
    initialFilters?: FilterState;
}

export interface FilterState {
    priceRange: [number | null, number | null];
    sizeRange: [number | null, number | null];
    rooms: number[];
    onlyFavorites: boolean;
    status: 'all' | 'for-sale' | 'reserved' | 'sold';
}

export const FilterBar: React.FC<FilterBarProps> = ({
    units,
    onFilterChange,
    isDarkMode,
    initialFilters
}) => {
    // Initialize state with default values or provided initial filters
    const [filters, setFilters] = useState<FilterState>(initialFilters || {
        priceRange: [null, null],
        sizeRange: [null, null],
        rooms: [],
        onlyFavorites: false,
        status: 'all'
    });

    // Compute min/max for placeholders
    const stats = React.useMemo(() => {
        if (units.length === 0) return { minPrice: 0, maxPrice: 0, minSize: 0, maxSize: 0, distinctRooms: [] };

        const prices = units.map(u => u.price).filter(p => p > 0);
        const sizes = units.map(u => u.size).filter(s => s > 0);
        const rooms = Array.from(new Set(units.map(u => u.rooms))).sort((a, b) => a - b);

        return {
            minPrice: Math.min(...prices),
            maxPrice: Math.max(...prices),
            minSize: Math.min(...sizes),
            maxSize: Math.max(...sizes),
            distinctRooms: rooms
        };
    }, [units]);

    // Update parent when local state changes
    useEffect(() => {
        onFilterChange(filters);
    }, [filters, onFilterChange]);

    const handleRoomToggle = (room: number) => {
        setFilters(prev => {
            const newRooms = prev.rooms.includes(room)
                ? prev.rooms.filter(r => r !== room)
                : [...prev.rooms, room];
            return { ...prev, rooms: newRooms };
        });
    };

    const handleRangeChange = (
        type: 'priceRange' | 'sizeRange',
        index: 0 | 1,
        value: string
    ) => {
        const numVal = value === '' ? null : Number(value);
        setFilters(prev => {
            const newRange = [...prev[type]] as [number | null, number | null];
            newRange[index] = numVal;
            return { ...prev, [type]: newRange };
        });
    };

    const inputClasses = `
        w-full px-3 py-2 text-sm font-bold bg-transparent 
        border-b-2 border-gray-200 dark:border-gray-700 
        focus:border-black dark:focus:border-white focus:outline-none 
        placeholder-gray-400 transition-colors
    `;

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* Status Filter (Existing logic moved here) */}
            <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Status</label>
                <div className="flex flex-wrap gap-2">
                    {(['all', 'for-sale', 'reserved', 'sold'] as const).map(status => (
                        <button
                            key={status}
                            onClick={() => setFilters(prev => ({ ...prev, status }))}
                            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${filters.status === status
                                ? isDarkMode
                                    ? 'bg-white text-gray-900'
                                    : 'bg-gray-900 text-white'
                                : isDarkMode
                                    ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            {status === 'all' ? 'Alla' :
                                status === 'for-sale' ? 'Till salu' :
                                    status === 'reserved' ? 'Reserverad' : 'Såld'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Price Range */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Pris</label>
                </div>
                <RangeSlider
                    min={stats.minPrice}
                    max={stats.maxPrice}
                    step={100000}
                    value={[
                        filters.priceRange[0] ?? stats.minPrice,
                        filters.priceRange[1] ?? stats.maxPrice
                    ]}
                    onChange={(val) => setFilters(prev => ({ ...prev, priceRange: val }))}
                    formatLabel={(val) => `${(val / 1000000).toFixed(1)} M`}
                />
            </div>

            {/* Size Range */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Boarea</label>
                </div>
                <RangeSlider
                    min={stats.minSize}
                    max={stats.maxSize}
                    step={1}
                    value={[
                        filters.sizeRange[0] ?? stats.minSize,
                        filters.sizeRange[1] ?? stats.maxSize
                    ]}
                    onChange={(val) => setFilters(prev => ({ ...prev, sizeRange: val }))}
                    formatLabel={(val) => `${val} m²`}
                />
            </div>

            {/* Rooms */}
            <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Antal Rum</label>
                <div className="flex flex-wrap gap-2">
                    {stats.distinctRooms.map(room => (
                        <button
                            key={room}
                            onClick={() => handleRoomToggle(room)}
                            className={`w-10 h-10 rounded-xl font-bold text-sm transition-all flex items-center justify-center border ${filters.rooms.includes(room)
                                ? isDarkMode
                                    ? 'bg-white text-gray-900 border-white'
                                    : 'bg-gray-900 text-white border-gray-900'
                                : isDarkMode
                                    ? 'bg-transparent text-gray-400 border-gray-700 hover:border-gray-500 hover:text-white'
                                    : 'bg-transparent text-gray-400 border-gray-200 hover:border-gray-400 hover:text-gray-900'
                                }`}
                        >
                            {room}
                        </button>
                    ))}
                </div>
            </div>

            {/* Favorites Toggle */}
            <div className="pt-2 border-t border-gray-200 dark:border-gray-800">
                <button
                    onClick={() => setFilters(prev => ({ ...prev, onlyFavorites: !prev.onlyFavorites }))}
                    className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${filters.onlyFavorites
                        ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-300'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'
                        }`}
                >
                    <div className="flex items-center gap-3">
                        <Icons.Heart
                            className={`w-5 h-5 ${filters.onlyFavorites ? 'fill-current' : ''}`}
                        />
                        <span className="font-bold text-sm">Visa endast favoriter</span>
                    </div>
                </button>
            </div>
        </div>
    );
};
