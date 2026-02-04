
import React, { useState, useMemo } from 'react';
import { Project, ProjectAsset, MediaType } from '../types';
import { PlusIcon } from './icons/PlusIcon';
import { ImageIcon } from './icons/ImageIcon';
import { VideoCameraIcon } from './icons/VideoCameraIcon';
import { DocumentTextIcon } from './icons/DocumentTextIcon';
import { TrashIcon } from './icons/TrashIcon';
import { Modal } from './Modal';
import { UploadIcon } from './icons/UploadIcon';
import { CloseIcon } from './icons/CloseIcon';
import { FilterIcon } from './icons/FilterIcon';
import { PanoramaViewer } from './PanoramaViewer';
import { uploadProjectAsset } from '../lib/supabaseStorage';

interface GlobalMediaLibraryProps {
    projects: Project[];
    onUpdateProject: (project: Project) => void;
}

type FilterType = 'all' | MediaType;

export const GlobalMediaLibrary: React.FC<GlobalMediaLibraryProps> = ({ projects, onUpdateProject }) => {
    const [filterType, setFilterType] = useState<FilterType>('all');
    const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
    
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [previewAsset, setPreviewAsset] = useState<ProjectAsset | null>(null);

    // Add Asset Form State
    const [targetProjectId, setTargetProjectId] = useState<string>('');
    const [addType, setAddType] = useState<'upload' | 'link'>('upload');
    const [newAssetTitle, setNewAssetTitle] = useState('');
    const [newAssetType, setNewAssetType] = useState<MediaType>('image');
    const [newAssetUrl, setNewAssetUrl] = useState('');
    const [newAssetFile, setNewAssetFile] = useState<File | null>(null);
    const [filePreview, setFilePreview] = useState<string | null>(null);
    const [isUploadingAsset, setIsUploadingAsset] = useState(false);

    // Aggregate all assets with project info
    const allAssets = useMemo(() => {
        return projects.flatMap(project => 
            (project.assets || []).map(asset => ({
                ...asset,
                projectName: project.name,
                projectId: project.id // ensure projectId is present
            }))
        );
    }, [projects]);

    const filteredAssets = useMemo(() => {
        return allAssets.filter(asset => {
            const typeMatch = filterType === 'all' || asset.type === filterType;
            const projectMatch = selectedProjectId === 'all' || asset.projectId === selectedProjectId;
            return typeMatch && projectMatch;
        });
    }, [allAssets, filterType, selectedProjectId]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setNewAssetFile(file);
            
            if (file.type.includes('image')) setNewAssetType('image');
            else if (file.type.includes('video')) setNewAssetType('video');
            else if (file.type.includes('pdf')) setNewAssetType('document');

            setFilePreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!targetProjectId || !newAssetTitle) return;

        const targetProject = projects.find(p => p.id === targetProjectId);
        if (!targetProject) return;

        let url: string;
        if (addType === 'upload' && newAssetFile) {
            setIsUploadingAsset(true);
            try {
                url = await uploadProjectAsset(newAssetFile, targetProjectId);
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Okänt fel';
                console.error('Error uploading asset:', error);
                alert(`Kunde inte ladda upp filen: ${errorMessage}\n\nKontrollera att bucketen "project-assets" finns i Supabase och att policies är korrekt konfigurerade.`);
                setIsUploadingAsset(false);
                return;
            }
            setIsUploadingAsset(false);
        } else {
            url = addType === 'upload' && filePreview ? filePreview : newAssetUrl;
        }

        if (url) {
            const newAsset: ProjectAsset = {
                id: `asset_${Date.now()}`,
                projectId: targetProject.id,
                type: newAssetType,
                title: newAssetTitle,
                url: url,
                description: '',
                uploadedAt: new Date().toISOString(),
                thumbnailUrl: newAssetType === 'panorama' || newAssetType === 'video' ? 'https://placehold.co/600x400/e2e8f0/1e293b?text=Preview' : undefined
            };

            const updatedProject = {
                ...targetProject,
                assets: [...(targetProject.assets || []), newAsset]
            };

            onUpdateProject(updatedProject);
            closeAddModal();
        }
    };

    const handleDeleteAsset = (asset: ProjectAsset & { projectId: string }) => {
        if (window.confirm("Are you sure you want to delete this asset?")) {
            const project = projects.find(p => p.id === asset.projectId);
            if (project) {
                const updatedProject = {
                    ...project,
                    assets: (project.assets || []).filter(a => a.id !== asset.id)
                };
                onUpdateProject(updatedProject);
            }
        }
    };

    const closeAddModal = () => {
        setIsAddModalOpen(false);
        setNewAssetTitle('');
        setNewAssetUrl('');
        setNewAssetFile(null);
        setFilePreview(null);
        setAddType('upload');
        setTargetProjectId('');
    };

    const getBadgeColor = (type: MediaType) => {
        switch (type) {
            case 'panorama': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
            case 'video': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
            case 'floorplan': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
        }
    };

    return (
        <div className="p-6 h-full overflow-y-auto">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Global Media Library</h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">Manage assets across all projects.</p>
                    </div>
                    <button 
                        onClick={() => setIsAddModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-[#5C7263] hover:bg-[#4a5c50] text-white rounded-lg font-medium transition shadow-sm"
                    >
                        <PlusIcon className="w-5 h-5" /> Add Media
                    </button>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-4 bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="flex items-center gap-2 flex-1">
                        <FilterIcon className="w-5 h-5 text-gray-400" />
                        <select 
                            value={selectedProjectId} 
                            onChange={(e) => setSelectedProjectId(e.target.value)}
                            className="w-full sm:w-64 bg-transparent border-none focus:ring-0 text-sm font-medium text-gray-700 dark:text-gray-200 cursor-pointer"
                        >
                            <option value="all">All Projects</option>
                            {projects.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 hidden sm:block"></div>
                    <div className="flex items-center gap-2 overflow-x-auto">
                        {(['all', 'image', 'panorama', 'floorplan', 'video'] as const).map(t => (
                            <button
                                key={t}
                                onClick={() => setFilterType(t)}
                                className={`px-3 py-1.5 text-xs font-semibold rounded-md capitalize whitespace-nowrap transition ${filterType === t ? 'bg-black dark:bg-white text-white dark:text-black' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                            >
                                {t === 'panorama' ? '360° Tours' : t}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Grid */}
                {filteredAssets.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredAssets.map(asset => (
                            <div key={asset.id} className="group relative bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all">
                                <div className="aspect-video bg-gray-100 dark:bg-gray-900 relative overflow-hidden cursor-pointer" onClick={() => setPreviewAsset(asset)}>
                                    {asset.type === 'image' || asset.type === 'floorplan' ? (
                                        <img src={asset.url} alt={asset.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gray-800">
                                            {asset.thumbnailUrl ? (
                                                <img src={asset.thumbnailUrl} alt={asset.title} className="w-full h-full object-cover opacity-50" />
                                            ) : (
                                                <VideoCameraIcon className="w-12 h-12 text-white/50" />
                                            )}
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                                                    <div className="w-0 h-0 border-t-4 border-t-transparent border-l-8 border-l-white border-b-4 border-b-transparent ml-1"></div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    
                                    <div className="absolute top-2 right-2">
                                        <span className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-wide ${getBadgeColor(asset.type)}`}>
                                            {asset.type === 'panorama' ? '360°' : asset.type}
                                        </span>
                                    </div>
                                </div>
                                
                                <div className="p-4">
                                    <div className="mb-2">
                                        <span className="text-xs font-semibold text-[#5C7263] dark:text-green-400 uppercase tracking-wider">{asset.projectName}</span>
                                        <h3 className="font-bold text-gray-900 dark:text-white truncate text-sm mt-0.5" title={asset.title}>{asset.title}</h3>
                                    </div>
                                    <div className="flex justify-between items-center border-t dark:border-gray-700 pt-3 mt-2">
                                        <span className="text-xs text-gray-500 dark:text-gray-400">{new Date(asset.uploadedAt).toLocaleDateString()}</span>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleDeleteAsset(asset); }}
                                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition"
                                            title="Delete Asset"
                                        >
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                        <div className="bg-white dark:bg-gray-700 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                            <ImageIcon className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">No media found</h3>
                        <p className="text-gray-500 dark:text-gray-400 mt-1 max-w-sm mx-auto">
                            {selectedProjectId === 'all' 
                                ? "There are no assets in any project yet. Add media to get started." 
                                : "No assets found for this project or filter criteria."}
                        </p>
                    </div>
                )}
            </div>

            {/* Add Media Modal */}
            {isAddModalOpen && (
                <Modal onClose={closeAddModal}>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Add Media to Project</h2>
                    
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Target Project *</label>
                            <select 
                                required
                                value={targetProjectId} 
                                onChange={(e) => setTargetProjectId(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg"
                            >
                                <option value="" disabled>Select a project...</option>
                                {projects.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex gap-4 border-b border-gray-200 dark:border-gray-700 pb-4">
                            <button 
                                type="button"
                                onClick={() => setAddType('upload')} 
                                className={`flex-1 py-2 text-sm font-medium rounded-md transition ${addType === 'upload' ? 'bg-gray-100 dark:bg-gray-600 text-black dark:text-white' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                            >
                                Upload File
                            </button>
                            <button 
                                type="button"
                                onClick={() => setAddType('link')} 
                                className={`flex-1 py-2 text-sm font-medium rounded-md transition ${addType === 'link' ? 'bg-gray-100 dark:bg-gray-600 text-black dark:text-white' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                            >
                                External Link
                            </button>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title *</label>
                            <input 
                                type="text" 
                                required 
                                value={newAssetTitle} 
                                onChange={(e) => setNewAssetTitle(e.target.value)} 
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg" 
                                placeholder="e.g. Master Bedroom 360" 
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Media Type</label>
                            <select 
                                value={newAssetType} 
                                onChange={(e) => setNewAssetType(e.target.value as MediaType)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg"
                            >
                                <option value="image">Image</option>
                                <option value="panorama">360° Panorama</option>
                                <option value="floorplan">Floorplan</option>
                                <option value="video">Video</option>
                            </select>
                        </div>

                        {addType === 'upload' ? (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">File</label>
                                <div className="flex items-center justify-center w-full">
                                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition">
                                        {filePreview ? (
                                            <img src={filePreview} alt="Preview" className="h-full object-contain" />
                                        ) : (
                                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                <UploadIcon className="w-8 h-8 text-gray-400 mb-2" />
                                                <p className="text-xs text-gray-500 dark:text-gray-400">Click to upload</p>
                                            </div>
                                        )}
                                        <input type="file" className="hidden" onChange={handleFileChange} accept="image/*,video/*,application/pdf" />
                                    </label>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">URL *</label>
                                <input 
                                    type="url" 
                                    required 
                                    value={newAssetUrl} 
                                    onChange={(e) => setNewAssetUrl(e.target.value)} 
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg" 
                                    placeholder="https://..." 
                                />
                            </div>
                        )}

                        <div className="flex justify-end gap-3 mt-6">
                            <button type="button" onClick={closeAddModal} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">Cancel</button>
                            <button type="submit" disabled={!targetProjectId || (addType === 'upload' ? !newAssetFile : !newAssetUrl) || isUploadingAsset} className="px-4 py-2 text-sm font-medium bg-[#5C7263] text-white rounded-lg hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed">
                                {isUploadingAsset ? 'Laddar upp...' : 'Add Asset'}
                            </button>
                        </div>
                    </form>
                </Modal>
            )}

            {/* Preview Modal */}
            {previewAsset && (
                <div className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-4" onClick={() => setPreviewAsset(null)}>
                    <button onClick={() => setPreviewAsset(null)} className="absolute top-4 right-4 p-2 text-white hover:bg-white/20 rounded-full z-10">
                        <CloseIcon className="w-8 h-8" />
                    </button>
                    
                    <div className="w-full h-full max-w-5xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="flex-grow relative bg-black flex items-center justify-center rounded-lg overflow-hidden">
                            {previewAsset.type === 'panorama' ? (
                                <PanoramaViewer url={previewAsset.url} title={previewAsset.title} />
                            ) : previewAsset.type === 'image' || previewAsset.type === 'floorplan' ? (
                                <img src={previewAsset.url} alt={previewAsset.title} className="max-w-full max-h-full object-contain" />
                            ) : (
                                <iframe 
                                    src={previewAsset.url} 
                                    title={previewAsset.title}
                                    className="w-full h-full border-0"
                                    allowFullScreen
                                ></iframe>
                            )}
                        </div>
                        <div className="py-4 text-white">
                            <h3 className="text-xl font-bold">{previewAsset.title}</h3>
                            <p className="text-gray-400 text-sm">{previewAsset['projectName' as keyof ProjectAsset]}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
