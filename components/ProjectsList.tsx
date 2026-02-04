import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Icons } from './Icons';
import { Project, View, ProjectStatus, Hotspot, User } from '../types';
import { Modal } from './Modal';

interface ProjectFormData extends Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'updatedBy' | 'organization' | 'ownerId' | 'members' | 'assets'> {
    ownerName?: string;
    ownerEmail?: string;
    assignedUserIds?: string[];
    assets: any[];
}

interface ProjectsListProps {
    projects: Project[];
    views: View[];
    hotspots: Hotspot[];
    users: User[];
    onSelectProject: (projectId: string) => void;
    onCreateProject: (project: ProjectFormData) => void;
    onUpdateProject: (project: Project) => void;
    onDeleteProject: (projectId: string) => void;
    onDuplicateProject: (projectId: string) => void;
}

const ProjectFormInitialState: ProjectFormData = {
    name: '',
    client: '',
    description: '',
    status: ProjectStatus.Draft,
    bostadsväljarenActive: false,
    ownerName: '',
    ownerEmail: '',
    assignedUserIds: [],
    assets: [],
};

type FilterStatus = 'all' | ProjectStatus;

const timeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (seconds < 60) return `Uppdaterad nu`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m sedan`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}t sedan`;
    return `${Math.floor(hours / 24)}d sedan`;
};


export const ProjectsList: React.FC<ProjectsListProps> = ({ projects, views, hotspots, users, onSelectProject, onCreateProject, onUpdateProject, onDuplicateProject, onDeleteProject }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProject, setEditingProject] = useState<Project | null>(null);
    const [projectForm, setProjectForm] = useState<ProjectFormData>(ProjectFormInitialState);

    const [searchTerm, setSearchTerm] = useState('');
    const [sortOrder, setSortOrder] = useState('updatedAt');
    const [filter, setFilter] = useState<FilterStatus>('all');

    const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [sharingProject, setSharingProject] = useState<Project | null>(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setActiveMenuId(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    useEffect(() => {
        if (editingProject) {
            setProjectForm({
                name: editingProject.name,
                client: editingProject.client,
                description: editingProject.description,
                status: editingProject.status || ProjectStatus.Draft,
                bostadsväljarenActive: !!editingProject.bostadsväljarenActive,
                assets: editingProject.assets || [],
                assignedUserIds: editingProject.members.map(m => m.userId),
            });
        } else {
            setProjectForm(ProjectFormInitialState);
        }
    }, [editingProject]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
            setProjectForm(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
        } else {
            setProjectForm(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleUserAssignmentChange = (userId: string) => {
        setProjectForm(prev => {
            const current = prev.assignedUserIds || [];
            const newIds = current.includes(userId)
                ? current.filter(id => id !== userId)
                : [...current, userId];
            return { ...prev, assignedUserIds: newIds };
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (projectForm.name.trim()) {
            if (editingProject) {
                const { ownerName, ownerEmail, assignedUserIds, ...updateData } = projectForm;
                onUpdateProject({ ...editingProject, ...updateData });
            } else {
                onCreateProject(projectForm);
            }
            closeModal();
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingProject(null);
        setProjectForm(ProjectFormInitialState);
    };

    const handleCopyLink = (projectId: string) => {
        const link = `${window.location.origin}/view/${projectId}`;
        navigator.clipboard.writeText(link);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const filteredAndSortedProjects = useMemo(() => {
        return projects
            .filter(p => {
                const searchMatch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    p.client.toLowerCase().includes(searchTerm.toLowerCase());
                const filterMatch = filter === 'all' || p.status === filter;
                return searchMatch && filterMatch;
            })
            .sort((a, b) => {
                switch (sortOrder) {
                    case 'name':
                        return a.name.localeCompare(b.name);
                    case 'createdAt':
                        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                    case 'updatedAt':
                    default:
                        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
                }
            });
    }, [projects, searchTerm, sortOrder, filter]);

    const activeProjectsCount = useMemo(() => projects.filter(p => p.status === ProjectStatus.Active).length, [projects]);

    const stats = [
        { name: 'Aktiva Projekt', value: activeProjectsCount, icon: Icons.Folder, change: "+12%" },
        { name: 'Totala Vyer', value: views.length, icon: Icons.Gallery, change: "+8%" },
        { name: 'Aktiva Ytor', value: hotspots.length, icon: Icons.FitToScreen, change: "+24%" },
    ];

    const filterTabs: { id: FilterStatus; label: string }[] = [
        { id: 'all', label: 'Alla' },
        { id: ProjectStatus.Active, label: 'Aktiva' },
        { id: ProjectStatus.Draft, label: 'Utkast' },
        { id: ProjectStatus.Archived, label: 'Arkiverade' },
    ];

    return (
        <div className="p-6 md:p-10 h-full overflow-y-auto">
            <header className="flex flex-wrap justify-between items-end gap-6 mb-10">
                <div className="space-y-1">
                    <h1 className="text-4xl font-bold text-brand-primary dark:text-white tracking-tighter uppercase">Projekthubb</h1>
                    <p className="text-brand-primary/60 dark:text-slate-400 font-medium">Studio HINTA — {activeProjectsCount} aktiva projekt i dag.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Sök projekt..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-12 pr-4 py-3 glass-panel text-brand-primary dark:text-white rounded-2xl shadow-sm focus:ring-2 focus:ring-brand-muted outline-none transition w-64 text-sm font-medium"
                        />
                    </div>
                    <button
                        onClick={() => { setEditingProject(null); setIsModalOpen(true); }}
                        className="flex items-center gap-2 px-6 py-3 text-sm font-bold text-white bg-black dark:bg-brand-accent dark:text-brand-primary rounded-2xl shadow-xl hover:scale-105 active:scale-95 transition-all"
                    >
                        <Icons.Plus className="w-5 h-5 stroke-[3]" />
                        Skapa nytt
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                {stats.map(stat => (
                    <div key={stat.name} className="glass-panel p-6 rounded-3xl flex items-center justify-between group cursor-default">
                        <div>
                            <p className="text-xs font-bold text-brand-muted dark:text-brand-accent uppercase tracking-widest mb-1">{stat.name}</p>
                            <p className="text-3xl font-bold text-brand-primary dark:text-white">{stat.value}</p>
                        </div>
                        <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl group-hover:scale-110 transition-transform shadow-inner">
                            <stat.icon className="w-7 h-7 text-brand-muted dark:text-brand-accent" />
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-1 p-1.5 glass-panel rounded-2xl">
                    {filterTabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setFilter(tab.id)}
                            className={`px-5 py-2 text-xs font-bold rounded-xl transition-all ${filter === tab.id ? 'bg-brand-primary dark:bg-white shadow-lg text-white dark:text-brand-primary' : 'text-slate-500 dark:text-slate-400 hover:bg-white/40 dark:hover:bg-slate-700/40'}`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
                <div className="flex items-center gap-3">
                    <select
                        value={sortOrder}
                        onChange={(e) => setSortOrder(e.target.value)}
                        className="px-4 py-2 glass-panel text-brand-primary dark:text-white rounded-xl shadow-sm outline-none text-xs font-bold uppercase tracking-wider"
                    >
                        <option value="updatedAt">Senast först</option>
                        <option value="name">Alfabetisk</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredAndSortedProjects.map(project => {
                    const projectViews = views.filter(v => v.projectId === project.id);
                    const projectHotspots = hotspots.filter(h => projectViews.map(v => v.id).includes(h.viewId));
                    const thumbnailUrl = projectViews.find(v => v.parentId === null)?.imageURL;
                    return (
                        <div key={project.id} className="glass-card rounded-[2.5rem] flex flex-col group overflow-hidden border border-white/20 dark:border-white/5">
                            <div
                                className="relative h-56 overflow-hidden cursor-pointer"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    onSelectProject(project.id);
                                }}
                            >
                                {thumbnailUrl ? (
                                    <img src={thumbnailUrl} alt={project.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-slate-800">
                                        <Icons.Gallery className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                                    <span className="text-white font-bold text-sm uppercase tracking-widest">Öppna Studio &rarr;</span>
                                </div>
                                <div className={`absolute top-4 left-4 text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full glass-panel shadow-lg ${project.status === 'active' ? 'text-green-600 dark:text-brand-accent' : 'text-slate-500'}`}>
                                    {project.status === 'active' ? 'Aktiv' : project.status === 'draft' ? 'Utkast' : 'Arkiverad'}
                                </div>
                            </div>
                            <div className="p-7 flex-grow flex flex-col">
                                <div
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        onSelectProject(project.id);
                                    }}
                                    className="cursor-pointer mb-4"
                                >
                                    <h2 className="text-xl font-bold text-brand-primary dark:text-white truncate group-hover:text-brand-primary/70 dark:group-hover:text-slate-300 transition-colors uppercase tracking-tight">{project.name}</h2>
                                    <p className="text-sm font-medium text-brand-primary/60 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">{project.description}</p>
                                </div>

                                <div className="flex items-center gap-6 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-brand-accent mb-6">
                                    <div className="flex items-center gap-2">
                                        <Icons.FitToScreen className="w-4 h-4" />
                                        <span>{projectViews.length} Vyer</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Icons.Folder className="w-4 h-4" />
                                        <span>{projectHotspots.length} Områden</span>
                                    </div>
                                </div>

                                <div className="mt-auto flex justify-between items-center pt-5 border-t border-slate-100 dark:border-white/5">
                                    <div className="flex items-center gap-2">
                                        <img src={project.updatedBy.avatarUrl} alt="" className="w-8 h-8 rounded-full border-2 border-white shadow-sm" />
                                        <span className="text-[10px] font-bold text-slate-400 uppercase">{timeAgo(project.updatedAt)}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => setActiveMenuId(activeMenuId === project.id ? null : project.id)}
                                            className="p-2 text-slate-400 hover:text-brand-primary dark:hover:text-white rounded-xl transition-colors"
                                        >
                                            <Icons.DotsVertical className="w-5 h-5" />
                                        </button>
                                        {activeMenuId === project.id && (
                                            <div ref={menuRef} className="absolute right-6 bottom-12 w-48 glass-panel rounded-2xl shadow-2xl z-20 py-2 border border-white/20 animate-fadeIn">
                                                <button onClick={() => { setEditingProject(project); setIsModalOpen(true); setActiveMenuId(null); }} className="w-full text-left flex items-center gap-3 px-4 py-3 text-xs font-bold text-brand-primary dark:text-slate-200 hover:bg-white/60 dark:hover:bg-slate-700/60 transition-colors">
                                                    <Icons.Gallery className="w-4 h-4" /> REDIGERA PROJEKT
                                                </button>
                                                <button onClick={() => { setSharingProject(project); setIsShareModalOpen(true); setActiveMenuId(null); }} className="w-full text-left flex items-center gap-3 px-4 py-3 text-xs font-bold text-brand-primary dark:text-slate-200 hover:bg-white/60 dark:hover:bg-slate-700/60 transition-colors">
                                                    <Icons.Share className="w-4 h-4" /> PUBLIK LÄNK
                                                </button>
                                                <div className="my-1 h-px bg-slate-100 dark:bg-white/5" />
                                                <button onClick={() => { if (window.confirm(`Radera "${project.name}"?`)) onDeleteProject(project.id); setActiveMenuId(null); }} className="w-full text-left flex items-center gap-3 px-4 py-3 text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                                                    <Icons.Trash className="w-4 h-4" /> RADERA
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>

            {isModalOpen && (
                <Modal onClose={closeModal}>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <h2 className="text-2xl font-bold text-brand-primary dark:text-white uppercase tracking-tight">{editingProject ? 'Redigera projekt' : 'Skapa nytt projekt'}</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">Projektnamn</label>
                                <input type="text" name="name" required value={projectForm.name} onChange={handleInputChange} className="w-full px-5 py-3 rounded-2xl glass-panel border-white/20 focus:ring-2 focus:ring-brand-muted outline-none text-brand-primary dark:text-white font-medium" placeholder="t.ex. Brf Ängslyckan" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">Kund</label>
                                <input type="text" name="client" required value={projectForm.client} onChange={handleInputChange} className="w-full px-5 py-3 rounded-2xl glass-panel border-white/20 focus:ring-2 focus:ring-brand-muted outline-none text-brand-primary dark:text-white font-medium" placeholder="t.ex. HSB Stockholm" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-brand-muted dark:text-slate-400 uppercase tracking-widest mb-1.5">Beskrivning</label>
                                <textarea name="description" rows={3} value={projectForm.description} onChange={handleInputChange} className="w-full px-5 py-3 rounded-2xl glass-panel border-white/20 focus:ring-2 focus:ring-brand-muted outline-none text-brand-primary dark:text-white font-medium" placeholder="Kort projektöversikt..."></textarea>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">Status</label>
                                    <select name="status" value={projectForm.status} onChange={handleInputChange} className="w-full px-5 py-3 rounded-2xl glass-panel border-white/20 focus:ring-2 focus:ring-brand-muted outline-none text-brand-primary dark:text-white font-medium">
                                        <option value={ProjectStatus.Draft}>Utkast</option>
                                        <option value={ProjectStatus.Active}>Aktiv</option>
                                        <option value={ProjectStatus.Archived}>Arkiverad</option>
                                    </select>
                                </div>
                                <div className="flex flex-col justify-end">
                                    <label className="flex items-center gap-3 cursor-pointer p-3 rounded-2xl hover:bg-white/20 transition-colors">
                                        <input type="checkbox" name="bostadsväljarenActive" checked={projectForm.bostadsväljarenActive} onChange={handleInputChange} className="w-5 h-5 rounded-lg border-white/20 bg-slate-100 dark:bg-slate-800 text-brand-primary" />
                                        <span className="text-sm font-bold text-brand-primary dark:text-slate-200">Publik väljare</span>
                                    </label>
                                </div>
                            </div>

                            {!editingProject && (
                                <div className="pt-4 border-t border-slate-100 dark:border-white/5">
                                    <label className="block text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3">Projekt-team</label>
                                    <div className="max-h-40 overflow-y-auto space-y-1.5 pr-2">
                                        {users.map(user => (
                                            <label key={user.id} className="flex items-center gap-3 p-3 rounded-2xl hover:bg-white/40 dark:hover:bg-slate-700/40 cursor-pointer transition-colors border border-transparent hover:border-white/20">
                                                <input type="checkbox" checked={projectForm.assignedUserIds?.includes(user.id)} onChange={() => handleUserAssignmentChange(user.id)} className="w-5 h-5 rounded-lg border-white/20" />
                                                <img src={user.avatarUrl} alt="" className="w-8 h-8 rounded-full" />
                                                <div>
                                                    <p className="text-sm font-bold text-brand-primary dark:text-slate-200">{user.name}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase">{user.role.replace('_', ' ')}</p>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-slate-100 dark:border-white/5">
                            <button type="button" onClick={closeModal} className="px-6 py-3 text-sm font-bold text-slate-500 hover:text-brand-primary dark:hover:text-white transition-colors uppercase tracking-widest">Avbryt</button>
                            <button type="submit" className="px-8 py-3 bg-brand-primary dark:bg-white text-white dark:text-brand-primary rounded-2xl font-bold shadow-xl hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-widest">
                                {editingProject ? 'Spara ändringar' : 'Skapa projekt'}
                            </button>
                        </div>
                    </form>
                </Modal>
            )}

            {isShareModalOpen && sharingProject && (
                <Modal onClose={() => setIsShareModalOpen(false)}>
                    <div className="text-center space-y-6">
                        <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-3xl flex items-center justify-center mx-auto mb-6">
                            <Icons.Share className="w-10 h-10 text-brand-muted dark:text-brand-accent" />
                        </div>
                        <h2 className="text-2xl font-bold text-brand-primary dark:text-white uppercase tracking-tight">Publik länk</h2>
                        <p className="text-slate-500 dark:text-slate-400">Alla med denna länk kan se den interaktiva projektvisualiseringen.</p>

                        <div className="flex items-center gap-3 p-4 glass-panel rounded-[2rem] border-white/20">
                            <input
                                readOnly
                                value={`${window.location.origin}/view/${sharingProject.id}`}
                                className="flex-1 bg-transparent text-sm font-medium text-brand-primary dark:text-slate-300 outline-none truncate pl-2"
                            />
                            <button
                                onClick={() => handleCopyLink(sharingProject.id)}
                                className={`px-5 py-2.5 rounded-[1.5rem] font-bold text-xs uppercase tracking-widest transition-all ${copied ? 'bg-green-500 text-white' : 'bg-brand-primary dark:bg-white text-white dark:text-brand-primary'}`}
                            >
                                {copied ? 'Kopierad!' : 'Kopiera'}
                            </button>
                        </div>

                        <div className="pt-4 flex justify-center">
                            <button onClick={() => setIsShareModalOpen(false)} className="text-xs font-bold text-slate-400 hover:text-brand-primary dark:hover:text-white uppercase tracking-widest">Stäng</button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};