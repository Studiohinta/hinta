
import React, { useState, useEffect } from 'react';
import { Project, ProjectAsset, MediaType } from '../types';
import { PlusIcon } from './icons/PlusIcon';
import { ImageIcon } from './icons/ImageIcon';
import { VideoCameraIcon } from './icons/VideoCameraIcon';
import { DocumentTextIcon } from './icons/DocumentTextIcon';
import { TrashIcon } from './icons/TrashIcon';
import { Modal } from './Modal';
import { LinkIcon } from './icons/LinkIcon';
import { UploadIcon } from './icons/UploadIcon';
import { CloseIcon } from './icons/CloseIcon';
import { PanoramaViewer } from './PanoramaViewer';
import { PencilIcon } from './icons/PencilIcon';

interface MediaGalleryProps {
    project: Project;
    onAddAsset: (asset: Omit<ProjectAsset, 'id' | 'projectId' | 'uploadedAt'>) => void;
    onUpdateAsset: (asset: ProjectAsset) => void;
    onDeleteAsset: (assetId: string) => void;
}

type FilterType = 'all' | MediaType;

export const MediaGallery: React.FC<MediaGalleryProps> = ({ project, onAddAsset, onUpdateAsset, onDeleteAsset }) => {
    const [filter, setFilter] = useState<FilterType>('all');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingAsset, setEditingAsset] = useState<ProjectAsset | null>(null);
    const [previewAsset, setPreviewAsset] = useState<ProjectAsset | null>(null);

    // Form State
    const [assetType, setAssetType] = useState<'upload' | 'link'>('upload');
    const [assetTitle, setAssetTitle] = useState('');
    const [mediaType, setMediaType] = useState<MediaType>('image');
    const [assetUrl, setAssetUrl] = useState('');
    const [assetFile, setAssetFile] = useState<File | null>(null);
    const [filePreview, setFilePreview] = useState<string | null>(null);

    const filteredAssets = (project.assets || []).filter(asset => filter === 'all' || asset.type === filter);

    useEffect(() => {
        if (editingAsset) {
            setAssetTitle(editingAsset.title);
            setMediaType(editingAsset.type);
            setAssetUrl(editingAsset.url);
            setAssetType(editingAsset.url.startsWith('blob:') ? 'upload' : 'link');
            setFilePreview(editingAsset.url);
        }
    }, [editingAsset]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setAssetFile(file);
            
            if (file.type.includes('image')) setMediaType('image');
            else if (file.type.includes('video')) setMediaType('video');
            else if (file.type.includes('pdf')) setMediaType('document');

            setFilePreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        const url = assetType === 'upload' && filePreview ? filePreview : assetUrl;
        
        if (url && assetTitle) {
            if (editingAsset) {
                onUpdateAsset({
                    ...editingAsset,
                    title: assetTitle,
                    type: mediaType,
                    url: url,
                    thumbnailUrl: mediaType === 'panorama' || mediaType === 'video' ? (editingAsset.thumbnailUrl || 'https://placehold.co/600x400/e2e8f0/1e293b?text=Preview') : undefined
                });
                closeEditModal();
            } else {
                onAddAsset({
                    type: mediaType,
                    title: assetTitle,
                    url: url,
                    description: '',
                    thumbnailUrl: mediaType === 'panorama' || mediaType === 'video' ? 'https://placehold.co/600x400/e2e8f0/1e293b?text=Preview' : undefined
                });
                closeAddModal();
            }
        }
    };

    const closeAddModal = () => {
        setIsAddModalOpen(false);
        resetForm();
    };

    const closeEditModal = () => {
        setIsEditModalOpen(false);
        setEditingAsset(null);
        resetForm();
    };

    const resetForm = () => {
        setAssetTitle('');
        setAssetUrl('');
        setAssetFile(null);
        setFilePreview(null);
        setAssetType('upload');
    };

    const getBadgeColor = (type: MediaType) => {
        switch (type) {
            case 'panorama': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
            case 'video': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
            case 'floorplan': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
        }
    };

    const handleDelete = (e: React.MouseEvent, assetId: string, title: string) => {
        e.stopPropagation();
        if (window.confirm(`Är du säker på att du vill radera "${title}"?`)) {
            onDeleteAsset(assetId);
        }
    };

    const handleEditClick = (e: React.MouseEvent, asset: ProjectAsset) => {
        e.stopPropagation();
        setEditingAsset(asset);
        setIsEditModalOpen(true);
    };

    return (
        <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-x-auto max-w-full">
                    {(['all', 'image', 'panorama', 'floorplan', 'video'] as const).map(t => (
                        <button
                            key={t}
                            onClick={() => setFilter(t)}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-md capitalize whitespace-nowrap transition ${filter === t ? 'bg-white dark:bg-gray-700 shadow text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                        >
                            {t === 'panorama' ? '360° Tours' : t}
                        </button>
                    ))}
                </div>
                <button 
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-[#5C7263] hover:bg-[#4a5c50] text-white rounded-lg font-medium transition shadow-sm text-sm whitespace-nowrap"
                >
                    <PlusIcon className="w-4 h-4" /> Lägg till media
                </button>
            </div>

            {filteredAssets.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
                            
                            <div className="p-3">
                                <h3 className="font-medium text-gray-900 dark:text-white truncate text-sm" title={asset.title}>{asset.title}</h3>
                                <div className="flex justify-between items-center mt-2">
                                    <span className="text-xs text-gray-500 dark:text-gray-400">{new Date(asset.uploadedAt).toLocaleDateString()}</span>
                                    <div className="flex gap-1">
                                        <button 
                                            onClick={(e) => handleEditClick(e, asset)}
                                            className="p-1.5 text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition"
                                            title="Redigera"
                                        >
                                            <PencilIcon className="w-4 h-4" />
                                        </button>
                                        <button 
                                            onClick={(e) => handleDelete(e, asset.id, asset.title)}
                                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition"
                                            title="Radera"
                                        >
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
                    <div className="bg-gray-50 dark:bg-gray-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <ImageIcon className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">Ingen media hittades</h3>
                    <p className="text-gray-500 dark:text-gray-400 mt-1 mb-6">Ladda upp bilder, videor eller länka 360-turer till detta projekt.</p>
                    <button onClick={() => setIsAddModalOpen(true)} className="text-[#5C7263] dark:text-green-400 font-semibold hover:underline">
                        Lägg till din första tillgång
                    </button>
                </div>
            )}

            {/* Add/Edit Modal */}
            {(isAddModalOpen || isEditModalOpen) && (
                <Modal onClose={isEditModalOpen ? closeEditModal : closeAddModal}>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                        {isEditModalOpen ? 'Redigera media' : 'Lägg till i mediebibliotek'}
                    </h2>
                    
                    <div className="flex gap-4 mb-6 border-b border-gray-200 dark:border-gray-700">
                        <button 
                            onClick={() => setAssetType('upload')} 
                            className={`pb-2 px-1 text-sm font-medium border-b-2 transition ${assetType === 'upload' ? 'border-[#5C7263] text-[#5C7263] dark:border-green-400 dark:text-green-400' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                        >
                            Ladda upp fil
                        </button>
                        <button 
                            onClick={() => setAssetType('link')} 
                            className={`pb-2 px-1 text-sm font-medium border-b-2 transition ${assetType === 'link' ? 'border-[#5C7263] text-[#5C7263] dark:border-green-400 dark:text-green-400' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                        >
                            Extern länk (360/Video)
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Titel</label>
                            <input 
                                type="text" 
                                required 
                                value={assetTitle} 
                                onChange={(e) => setAssetTitle(e.target.value)} 
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg" 
                                placeholder="t.ex. Kök 360, Vardagsrum render..." 
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Typ</label>
                            <select 
                                value={mediaType} 
                                onChange={(e) => setMediaType(e.target.value as MediaType)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg"
                            >
                                <option value="image">Bild</option>
                                <option value="panorama">360° Panorama</option>
                                <option value="floorplan">Planritning</option>
                                <option value="video">Video</option>
                            </select>
                        </div>

                        {assetType === 'upload' ? (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fil</label>
                                <div className="flex items-center justify-center w-full">
                                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition">
                                        {filePreview ? (
                                            <div className="relative h-full w-full p-2">
                                                {mediaType === 'video' ? (
                                                    <div className="h-full w-full flex items-center justify-center bg-black rounded">
                                                        <VideoCameraIcon className="w-8 h-8 text-white" />
                                                    </div>
                                                ) : (
                                                    <img src={filePreview} alt="Preview" className="h-full w-full object-contain" />
                                                )}
                                                <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center rounded">
                                                    <p className="text-white text-xs font-bold">Klicka för att byta</p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                <UploadIcon className="w-8 h-8 text-gray-400 mb-2" />
                                                <p className="text-sm text-gray-500 dark:text-gray-400"><span className="font-semibold">Klicka för att ladda upp</span></p>
                                            </div>
                                        )}
                                        <input type="file" className="hidden" onChange={handleFileChange} accept="image/*,video/*,application/pdf" />
                                    </label>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Extern URL</label>
                                <input 
                                    type="url" 
                                    required 
                                    value={assetUrl} 
                                    onChange={(e) => setAssetUrl(e.target.value)} 
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg" 
                                    placeholder="https://my.matterport.com/show/?m=..." 
                                />
                                <p className="text-xs text-gray-500 mt-1">Stöder Matterport, YouTube, Vimeo, etc.</p>
                            </div>
                        )}

                        <div className="flex justify-end gap-3 mt-6">
                            <button type="button" onClick={isEditModalOpen ? closeEditModal : closeAddModal} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">Avbryt</button>
                            <button type="submit" className="px-4 py-2 text-sm font-medium bg-[#5C7263] text-white rounded-lg hover:bg-opacity-90">
                                {isEditModalOpen ? 'Spara ändringar' : 'Lägg till'}
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
                            <div className="flex items-center gap-2 text-sm text-gray-400 mt-1">
                                <span className="capitalize">{previewAsset.type}</span>
                                <span>•</span>
                                <span>Uppladdad {new Date(previewAsset.uploadedAt).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
