import React from 'react';
import { ProjectIcon } from './icons/ProjectIcon';
import { SettingsIcon } from './icons/SettingsIcon';
import { ProfileIcon } from './icons/ProfileIcon';
import { ImageIcon } from './icons/ImageIcon';
import { LayersIcon } from './icons/LayersIcon';
import { AnalyticsIcon } from './icons/AnalyticsIcon';
import { SunIcon } from './icons/SunIcon';
import { MoonIcon } from './icons/MoonIcon';

const ChevronDoubleLeftIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m18.75 4.5-7.5 7.5 7.5 7.5m-6-15L5.25 12l7.5 7.5" />
  </svg>
);

const ChevronDoubleRightIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m5.25 4.5 7.5 7.5-7.5 7.5m6-15 7.5 7.5-7.5 7.5" />
  </svg>
);


interface SidebarProps {
    activePage: string;
    isCollapsed: boolean;
    onToggleCollapse: () => void;
    onNavigateToProjects: () => void;
    onNavigateToSettings: () => void;
    onNavigateToMedia: () => void;
    isDarkMode: boolean;
    toggleTheme: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activePage, isCollapsed, onToggleCollapse, onNavigateToProjects, onNavigateToSettings, onNavigateToMedia, isDarkMode, toggleTheme }) => {
    const navItems = [
        { id: 'projects', label: 'Projekt', icon: ProjectIcon, action: onNavigateToProjects },
        { id: 'media', label: 'Mediebibliotek', icon: ImageIcon, action: onNavigateToMedia },
        { id: 'templates', label: 'Mallar', icon: LayersIcon, action: () => {} },
        { id: 'analytics', label: 'Analys', icon: AnalyticsIcon, action: () => {} },
        { id: 'settings', label: 'Inställningar', icon: SettingsIcon, action: onNavigateToSettings },
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
                    absolute top-12 -right-4 glass-panel bg-white dark:bg-brand-primary text-slate-400 dark:text-slate-300 w-8 h-8 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110 hover:text-slate-900 dark:hover:text-brand-accent border border-slate-100 dark:border-slate-800 z-[60]
                `}
                title={isCollapsed ? "Visa sidofält" : "Dölj sidofält"}
            >
                {isCollapsed ? <ChevronDoubleRightIcon className="w-4 h-4" /> : <ChevronDoubleLeftIcon className="w-4 h-4" />}
            </button>

            <div className={`p-6 h-[100px] flex items-center ${isCollapsed ? 'justify-center' : 'pl-8'}`}>
                {isCollapsed ? (
                    <div className="bg-brand-primary dark:bg-brand-accent p-2.5 rounded-xl shadow-lg">
                        <ProjectIcon className="w-6 h-6 text-white dark:text-brand-primary" />
                    </div>
                ) : (
                    <div className="flex items-center gap-4">
                         <div className="bg-brand-primary dark:bg-brand-accent p-2.5 rounded-xl shadow-lg">
                            <ProjectIcon className="w-6 h-6 text-white dark:text-brand-primary" />
                         </div>
                         <div>
                            <h1 className="text-xl font-bold text-brand-primary dark:text-white tracking-tight whitespace-nowrap uppercase">
                                HINTA
                            </h1>
                            <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500 dark:text-brand-accent whitespace-nowrap font-bold">Studio</p>
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
                                    className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all duration-300 ${
                                        isActive
                                        ? 'bg-brand-primary dark:bg-white text-white dark:text-brand-primary shadow-xl scale-[1.02]' 
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
                    className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-sm font-bold text-slate-500 dark:text-slate-400 hover:bg-white/60 dark:hover:bg-slate-800/40 transition-all ${isCollapsed ? 'justify-center' : ''}`}
                >
                    {isDarkMode ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
                    {!isCollapsed && <span className="whitespace-nowrap tracking-wide">{isDarkMode ? 'Ljust läge' : 'Mörkt läge'}</span>}
                </button>
            </div>

            <div className="p-6 border-t border-slate-100 dark:border-white/5">
                <div className={`flex items-center gap-4 ${isCollapsed ? 'justify-center' : ''}`}>
                    <img src="https://i.pravatar.cc/150?u=a042581f4e29026704d" alt="Admin" className="w-10 h-10 rounded-2xl border-2 border-white dark:border-slate-800 shadow-md flex-shrink-0" />
                    {!isCollapsed && (
                        <div className="min-w-0">
                            <p className="font-bold text-sm text-slate-800 dark:text-slate-200 truncate">Admin User</p>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate uppercase font-bold tracking-widest">Super Admin</p>
                        </div>
                    )}
                </div>
            </div>
        </aside>
    );
};