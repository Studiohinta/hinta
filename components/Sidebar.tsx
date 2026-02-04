import React from 'react';
import { brandAssets } from '../lib/brandAssets';
import { Icons } from './Icons';




interface SidebarProps {
    activePage: string;
    isCollapsed: boolean;
    onToggleCollapse: () => void;
    onNavigateToProjects: () => void;
    onNavigateToSettings: () => void;
    onNavigateToMedia: () => void;
    onNavigateToDesignSystem: () => void;
    isDarkMode: boolean;
    toggleTheme: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activePage, isCollapsed, onToggleCollapse, onNavigateToProjects, onNavigateToSettings, onNavigateToMedia, onNavigateToDesignSystem, isDarkMode, toggleTheme }) => {
    const navItems = [
        { id: 'projects', label: 'Projekt', icon: Icons.Project, action: onNavigateToProjects },
        { id: 'media', label: 'Mediebibliotek', icon: Icons.Gallery, action: onNavigateToMedia },
        { id: 'templates', label: 'Mallar', icon: Icons.Layers, action: () => { } },
        { id: 'design-system', label: 'Design System', icon: Icons.Magic, action: onNavigateToDesignSystem },
        { id: 'analytics', label: 'Analys', icon: Icons.Dashboard, action: () => { } },
        { id: 'settings', label: 'Inställningar', icon: Icons.Settings, action: onNavigateToSettings },
    ];

    return (
        <aside
            className={`
                fixed inset-y-0 left-0 z-50 glass-panel flex flex-col transition-all duration-500 ease-in-out shadow-[10px_0_40px_rgba(0,0,0,0.05)] border-r border-white/20
                md:relative
                ${isCollapsed ? '-translate-x-full md:translate-x-0 md:w-20' : 'translate-x-0 w-72'}
            `}
        >
            {/* Toggle Button */}
            <button
                onClick={onToggleCollapse}
                className={`
                    absolute top-12 -right-4 glass-panel bg-white dark:bg-brand-primary text-brand-muted dark:text-slate-300 w-8 h-8 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110 hover:text-brand-primary dark:hover:text-brand-accent border border-slate-100 dark:border-slate-800 z-[60]
                `}
                title={isCollapsed ? "Visa sidofält" : "Dölj sidofält"}
            >
                {isCollapsed ? <Icons.ChevronRight className="w-4 h-4" /> : <Icons.ChevronLeft className="w-4 h-4" />}
            </button>

            <div className={`p-6 h-[100px] flex items-center ${isCollapsed ? 'justify-center' : 'pl-8'}`}>
                {isCollapsed ? (
                    <>
                        <img src={brandAssets.favicon.black} alt="HINTA" className="w-6 h-6 dark:hidden" />
                        <img src={brandAssets.favicon.white} alt="HINTA" className="w-6 h-6 hidden dark:block" />
                    </>
                ) : (
                    <div className="flex items-center gap-4">
                        <img src={brandAssets.favicon.black} alt="" className="w-6 h-6 dark:hidden flex-shrink-0" aria-hidden />
                        <img src={brandAssets.favicon.white} alt="" className="w-6 h-6 hidden dark:block flex-shrink-0" aria-hidden />
                        <div className="min-w-0">
                            <img src={brandAssets.logo.black} alt="HINTA" className="h-5 dark:hidden w-auto" />
                            <img src={brandAssets.logo.white} alt="HINTA" className="h-5 hidden dark:block w-auto" />
                        </div>
                    </div>
                )}
            </div>

            <nav className="flex-grow px-4 py-6">
                <ul className="space-y-2">
                    {navItems.map(item => {
                        const isActive = activePage === item.id || ((activePage.startsWith('project') || activePage === 'editor') && item.id === 'projects');
                        return (
                            <li key={item.id}>
                                <button
                                    onClick={item.action}
                                    className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all duration-300 ${isActive
                                        ? 'bg-black dark:bg-white text-white dark:text-brand-primary shadow-xl scale-[1.02]'
                                        : 'text-slate-500 dark:text-slate-400 hover:bg-white/60 dark:hover:bg-slate-800/40'
                                        } ${isCollapsed ? 'justify-center' : ''}`}
                                    title={isCollapsed ? item.label : undefined}
                                >
                                    <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'scale-110' : ''}`} />
                                    {!isCollapsed && <span className="whitespace-nowrap tracking-wide">{item.label}</span>}
                                </button>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            <div className="px-4 pb-4">
                <button
                    onClick={toggleTheme}
                    className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-sm font-bold text-brand-muted dark:text-slate-400 hover:bg-white/60 dark:hover:bg-slate-800/40 transition-all ${isCollapsed ? 'justify-center' : ''}`}
                >
                    {isDarkMode ? <Icons.Sun className="w-5 h-5" /> : <Icons.Moon className="w-5 h-5" />}
                    {!isCollapsed && <span className="whitespace-nowrap tracking-wide">{isDarkMode ? 'Ljust läge' : 'Mörkt läge'}</span>}
                </button>
            </div>

            <div className="p-6 border-t border-slate-100 dark:border-white/5">
                <div className={`flex items-center gap-4 ${isCollapsed ? 'justify-center' : ''}`}>
                    <img src="https://i.pravatar.cc/150?u=a042581f4e29026704d" alt="Admin" className="w-10 h-10 rounded-2xl border-2 border-white dark:border-slate-800 shadow-md flex-shrink-0" />
                    {!isCollapsed && (
                        <div className="min-w-0">
                            <p className="font-bold text-sm text-brand-primary dark:text-slate-200 truncate">Admin User</p>
                            <p className="text-[10px] text-brand-muted dark:text-slate-500 truncate uppercase font-bold tracking-widest">Super Admin</p>
                        </div>
                    )}
                </div>
            </div>
        </aside>
    );
};