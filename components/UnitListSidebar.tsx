import React, { useState, useMemo, useEffect } from 'react';
import { Unit } from '../types';
import { Icons } from './Icons';
import { FilterBar, FilterState } from './FilterBar';

interface UnitListSidebarProps {
    units: Unit[];
    selectedUnitId: string | null;
    hoveredUnitId: string | null;
    onUnitSelect: (id: string) => void;
    onUnitHover: (id: string | null) => void;
    projectName: string;
    isDarkMode: boolean;
    isOpen: boolean;
    onClose: () => void;
    isMobile: boolean;
    onNavigateHome: () => void;
    onShowNavigation: () => void;
    onShowGallery: () => void;
    activeTab: string;
}

export const UnitListSidebar: React.FC<UnitListSidebarProps> = ({
    units,
    selectedUnitId,
    hoveredUnitId,
    onUnitSelect,
    onUnitHover,
    projectName,
    isDarkMode,
    isOpen,
    isMobile,
    onNavigateHome,
    onShowNavigation,
    onShowGallery,
    activeTab,
}) => {
    // Favorites State
    const [favorites, setFavorites] = useState<string[]>(() => {
        try {
            const stored = localStorage.getItem('hinta_favorites');
            return stored ? JSON.parse(stored) : [];
        } catch {
            return [];
        }
    });

    // Update Favorites Persistence
    useEffect(() => {
        localStorage.setItem('hinta_favorites', JSON.stringify(favorites));
    }, [favorites]);

    const toggleFavorite = (e: React.MouseEvent, unitId: string) => {
        e.stopPropagation();
        setFavorites(prev =>
            prev.includes(unitId)
                ? prev.filter(id => id !== unitId)
                : [...prev, unitId]
        );
    };

    // Filter State
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState<FilterState>({
        priceRange: [null, null],
        sizeRange: [null, null],
        rooms: [],
        onlyFavorites: false,
        status: 'all'
    });

    const filteredUnits = useMemo(() => {
        return units.filter(unit => {
            // Status
            if (filters.status !== 'all' && unit.status !== filters.status) return false;

            // Favorites
            if (filters.onlyFavorites && !favorites.includes(unit.id)) return false;

            // Price Range
            if (filters.priceRange[0] !== null && unit.price < filters.priceRange[0]) return false;
            if (filters.priceRange[1] !== null && unit.price > filters.priceRange[1]) return false;

            // Size Range
            if (filters.sizeRange[0] !== null && unit.size < filters.sizeRange[0]) return false;
            if (filters.sizeRange[1] !== null && unit.size > filters.sizeRange[1]) return false;

            // Rooms
            if (filters.rooms.length > 0 && !filters.rooms.includes(unit.rooms)) return false;

            return true;
        });
    }, [units, filters, favorites]);

    const activeFilterCount = useMemo(() => {
        let count = 0;
        if (filters.status !== 'all') count++;
        if (filters.onlyFavorites) count++;
        if (filters.priceRange[0] !== null || filters.priceRange[1] !== null) count++;
        if (filters.sizeRange[0] !== null || filters.sizeRange[1] !== null) count++;
        if (filters.rooms.length > 0) count++;
        return count;
    }, [filters]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'for-sale':
                return 'bg-green-500';
            case 'reserved':
                return 'bg-yellow-500';
            case 'sold':
                return 'bg-red-500';
            case 'forthcoming':
                return 'bg-gray-400';
            default: // forthcoming or others
                return 'bg-gray-400';
        }
    };

    // Unified Sidebar Content (used for both mobile and desktop)
    const sidebarContent = (
        <div className="flex flex-col h-full">
            {/* Top Menu and Filters */}
            <div className="p-4 border-b border-gray-200/50 dark:border-gray-700/50 flex-shrink-0">
                <div
                    className="flex items-center justify-around p-1 rounded-2xl bg-gray-50/50 dark:bg-white/5"
                >
                    <button
                        onClick={onNavigateHome}
                        className={`flex flex-col items-center justify-center gap-1 px-2 py-2 rounded-xl transition-all duration-200 relative group flex-1 hover:scale-[1.02] active:scale-95 ${activeTab === 'home' ? 'bg-white/10 dark:bg-white/10 shadow-sm' : ''
                            }`}
                    >
                        <Icons.Home className={`w-4 h-4 mb-0.5 ${activeTab === 'home' ? 'text-black dark:text-white' : 'text-gray-400 group-hover:text-black dark:group-hover:text-white'}`} />
                        <span className={`text-[10px] font-black uppercase tracking-wider transition-colors ${activeTab === 'home' ? 'text-black dark:text-white' : 'text-gray-400 group-hover:text-black dark:group-hover:text-white'
                            }`}>Start</span>
                    </button>
                    <button
                        onClick={onShowNavigation}
                        className={`flex flex-col items-center justify-center gap-1 px-2 py-2 rounded-xl transition-all duration-200 relative group flex-1 hover:scale-[1.02] active:scale-95 ${activeTab === 'navigation' ? 'bg-white/10 dark:bg-white/10 shadow-sm' : ''
                            }`}
                    >
                        <Icons.Map className={`w-4 h-4 mb-0.5 ${activeTab === 'navigation' ? 'text-black dark:text-white' : 'text-gray-400 group-hover:text-black dark:group-hover:text-white'}`} />
                        <span className={`text-[10px] font-black uppercase tracking-wider transition-colors ${activeTab === 'navigation' ? 'text-black dark:text-white' : 'text-gray-400 group-hover:text-black dark:group-hover:text-white'
                            }`}>Nav</span>
                    </button>
                    <button
                        onClick={onShowGallery}
                        className={`flex flex-col items-center justify-center gap-1 px-2 py-2 rounded-xl transition-all duration-200 relative group flex-1 hover:scale-[1.02] active:scale-95 ${activeTab === 'gallery' ? 'bg-white/10 dark:bg-white/10 shadow-sm' : ''
                            }`}
                    >
                        <Icons.Gallery className={`w-4 h-4 mb-0.5 ${activeTab === 'gallery' ? 'text-black dark:text-white' : 'text-gray-400 group-hover:text-black dark:group-hover:text-white'}`} />
                        <span className={`text-[10px] font-black uppercase tracking-wider transition-colors ${activeTab === 'gallery' ? 'text-black dark:text-white' : 'text-gray-400 group-hover:text-black dark:group-hover:text-white'
                            }`}>Galleri</span>
                    </button>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`flex flex-col items-center justify-center gap-1 px-2 py-2 rounded-xl transition-all duration-200 relative group flex-1 hover:scale-[1.02] active:scale-95 ${showFilters ? 'bg-white/10 dark:bg-white/10 shadow-sm' : ''}`}
                    >
                        <div className="relative">
                            <Icons.Filter className={`w-4 h-4 ${showFilters || activeFilterCount > 0 ? 'text-black dark:text-white' : 'text-gray-400 group-hover:text-black dark:group-hover:text-white'}`} />
                            {activeFilterCount > 0 && (
                                <span className="absolute -top-1 -right-1 w-2 h-2 bg-brand-primary rounded-full border border-white dark:border-gray-900" />
                            )}
                        </div>
                        <span className={`text-[10px] font-black uppercase tracking-wider transition-colors ${showFilters || activeFilterCount > 0 ? 'text-black dark:text-white' : 'text-gray-400 group-hover:text-black dark:group-hover:text-white'}`}>Filter</span>
                    </button>
                </div>

                {/* Collapsible Filter Panel */}
                <div
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${showFilters ? 'max-h-[500px] opacity-100 mt-4' : 'max-h-0 opacity-0'
                        }`}
                >
                    <FilterBar
                        units={units}
                        onFilterChange={setFilters}
                        isDarkMode={isDarkMode}
                        initialFilters={filters}
                    />
                </div>
            </div>



            {/* Unit List */}
            <div className="flex-1 overflow-y-auto px-4 py-3 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700">
                {filteredUnits.length > 0 ? (
                    <div className="space-y-2 pb-20 md:pb-0"> {/* Padding bottom for mobile nav safety */}
                        {filteredUnits.map(unit => {
                            const isFavorite = favorites.includes(unit.id);
                            return (
                                <button
                                    key={unit.id}
                                    onClick={() => onUnitSelect(unit.id)}
                                    onMouseEnter={() => onUnitHover(unit.id)}
                                    onMouseLeave={() => onUnitHover(null)}
                                    className={`w-full text-left p-2 rounded-2xl transition-all border group relative ${selectedUnitId === unit.id
                                        ? 'bg-brand-primary/10 dark:bg-white/10 border-brand-primary dark:border-white'
                                        : hoveredUnitId === unit.id
                                            ? 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                                            : 'bg-gray-50/50 dark:bg-gray-800/30 border-transparent hover:border-gray-200 dark:hover:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800'
                                        }`}
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex items-start gap-3 min-w-0">
                                            {/* Favorite Button (Left) */}
                                            <button
                                                onClick={(e) => toggleFavorite(e, unit.id)}
                                                className={`p-1 rounded-full transition-all flex-shrink-0 ${isFavorite
                                                    ? 'text-rose-500 bg-rose-50 dark:bg-rose-900/30'
                                                    : 'text-gray-300 hover:text-rose-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                                                    }`}
                                            >
                                                <Icons.Heart
                                                    className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`}
                                                />
                                            </button>

                                            {/* Status Dot */}
                                            <div className={`w-2 h-2 mt-2 rounded-full flex-shrink-0 ${getStatusColor(unit.status)}`} />

                                            <div className="min-w-0">
                                                <p className="font-black text-gray-900 dark:text-white truncate text-sm">{unit.name}</p>
                                                <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 font-medium mt-0.5">
                                                    <span className="flex items-center gap-1">
                                                        <Icons.Area className="w-3 h-3" />
                                                        {unit.size} m²
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Icons.Rooms className="w-3 h-3" />
                                                        {unit.rooms} rok
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right flex-shrink-0 flex flex-col items-end">
                                            <p className="font-black text-gray-950 dark:text-white whitespace-nowrap text-sm flex items-center justify-end gap-1">
                                                {unit.price.toLocaleString('sv-SE')} kr
                                            </p>
                                            {unit.fee > 0 && (
                                                <p className="text-xs text-gray-400 font-medium mt-0.5">
                                                    {unit.fee.toLocaleString('sv-SE')} kr/mån
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-12 text-gray-500 dark:text-gray-400 animate-fadeIn">
                        <Icons.Filter className="w-12 h-12 mx-auto mb-4 opacity-30" />
                        <p className="font-bold mb-2">Inga bostäder matchar filtret</p>
                        <button
                            onClick={() => {
                                setFilters({
                                    priceRange: [null, null],
                                    sizeRange: [null, null],
                                    rooms: [],
                                    onlyFavorites: false,
                                    status: 'all'
                                });
                            }}
                            className="text-xs font-bold text-brand-primary dark:text-white underline opacity-70 hover:opacity-100"
                        >
                            Rensa alla filter
                        </button>
                    </div>
                )}
            </div>
        </div >
    );

    // Mobile Layout: Sequential (under image)
    if (isMobile) {
        return (
            <div
                className="w-full border-t flex-1 overflow-hidden flex flex-col"
                style={{
                    background: isDarkMode ? 'rgba(17, 17, 17, 1)' : 'rgba(255, 255, 255, 1)',
                    borderColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                }}
            >
                {sidebarContent}
            </div>
        );
    }

    // Desktop: Fixed/Flexible Sidebar
    return (
        <aside
            className="flex flex-col h-full border-l overflow-hidden"
            style={{
                width: '100%',
                background: isDarkMode
                    ? 'rgba(17, 17, 17, 0.8)'
                    : 'rgba(255, 255, 255, 0.85)',
                backdropFilter: 'blur(24px) saturate(180%)',
                WebkitBackdropFilter: 'blur(24px) saturate(180%)',
                borderColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
            }}
        >
            {sidebarContent}
        </aside>
    );
};
