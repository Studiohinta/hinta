
import React, { useState, useEffect, useMemo } from 'react';
import { Project, View, Unit, UnitStatus, UnitFile, ProjectStatus, ProjectMember, ProjectRole, ProjectAsset } from '../types';
import { UploadIcon } from './icons/UploadIcon';
import { BackIcon } from './icons/BackIcon';
import { TrashIcon } from './icons/TrashIcon';
import { ImageIcon } from './icons/ImageIcon';
import { Modal } from './Modal';
import { HomeIcon } from './icons/HomeIcon';
import { DocumentTextIcon } from './icons/DocumentTextIcon';
import { PencilIcon } from './icons/PencilIcon';
import { PlusIcon } from './icons/PlusIcon';
import { CloseIcon } from './icons/CloseIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { EyeIcon } from './icons/EyeIcon';
import { MapIcon } from './icons/MapIcon';
import { UsersIcon } from './icons/UsersIcon';
import { UserPlusIcon } from './icons/UserPlusIcon';
import { BadgeCheckIcon } from './icons/BadgeCheckIcon';
import { MediaGallery } from './MediaGallery';


interface ProjectDetailProps {
    project: Project;
    views: View[];
    units: Unit[];
    onSelectView: (viewId: string) => void;
    onAddView: (viewData: Omit<View, 'id' | 'projectId' | 'parentId' | 'unitIds'>, parentId: string | null) => void;
    onUpdateView: (viewId: string, updatedData: Partial<Omit<View, 'id' | 'projectId'>>) => void;
    onDeleteView: (viewId: string) => void;
    onAddUnit: (unitData: Omit<Unit, 'id' | 'projectId'>) => void;
    onAddUnitsBatch: (unitsData: Omit<Unit, 'id' | 'projectId' | 'files'>[]) => void;
    onAttachFilesToUnits: (files: File[]) => number;
    onUpdateProject: (project: Project) => void;
    onUpdateUnit: (unit: Unit) => void;
    onDeleteUnit: (unitId: string) => void;
    onAddMember: (projectId: string, member: ProjectMember) => void;
    onRemoveMember: (projectId: string, userId: string) => void;
    onBack: () => void;
}

type ParsedUnit = Omit<Unit, 'id' | 'projectId' | 'files'>;

const ViewFormInitialState = { title: '', type: 'overview' as View['type'] };
const UnitFormInitialState: Omit<Unit, 'id' | 'projectId'> = { 
    name: '',
    factSheetFileName: '',
    status: UnitStatus.ForSale, 
    price: 0, 
    size: 0, 
    rooms: 0,
    ancillaryArea: 0,
    lotSize: 0,
    fee: 0,
    floorLevel: 1,
    selections: '',
    files: [] as UnitFile[],
};

// Robust CSV row parser that handles quoted fields and delimiters
function parseCsvRow(row: string, delimiter: string = ','): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < row.length; i++) {
        const char = row[i];
        
        if (char === '"') {
            const nextChar = row[i+1];
            if (inQuotes && nextChar === '"') {
                // Double quote inside a quoted string -> single quote literal
                current += '"';
                i++; // Skip next quote
            } else {
                // Toggle quote state
                inQuotes = !inQuotes;
            }
        } else if (char === delimiter && !inQuotes) {
            // Field separator
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current);
    return result;
}


// Recursive component to render the view hierarchy
const ViewHierarchyItem: React.FC<{
    view: View;
    allViews: View[];
    level: number;
    selectedViewId: string | null;
    onSelectView: (viewId: string) => void;
    onAddChild: (parentId: string) => void;
    onEdit: (view: View) => void;
    onDelete: (view: View) => void;
}> = ({ view, allViews, level, selectedViewId, onSelectView, onAddChild, onEdit, onDelete }) => {
    const children = allViews.filter(v => v.parentId === view.id).sort((a,b) => a.title.localeCompare(b.title));
    const isSelected = selectedViewId === view.id;

    return (
        <div>
            <div 
                className={`flex items-center justify-between p-2 rounded-md cursor-pointer group ${isSelected ? 'bg-gray-200 dark:bg-gray-700' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                style={{ paddingLeft: `${level * 1.5 + 0.5}rem` }}
                onClick={() => onSelectView(view.id)}
            >
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">{view.title}</span>
                <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <button title="Add Child View" onClick={(e) => { e.stopPropagation(); onAddChild(view.id); }} className="p-1.5 text-gray-500 hover:bg-gray-300 dark:text-gray-400 dark:hover:bg-gray-600 rounded"><PlusIcon className="w-4 h-4" /></button>
                    <button title="Edit View" onClick={(e) => { e.stopPropagation(); onEdit(view); }} className="p-1.5 text-gray-500 hover:bg-gray-300 dark:text-gray-400 dark:hover:bg-gray-600 rounded"><PencilIcon className="w-4 h-4" /></button>
                    <button title="Delete View" onClick={(e) => { e.stopPropagation(); onDelete(view); }} className="p-1.5 text-gray-500 hover:bg-gray-300 hover:text-red-600 dark:text-gray-400 dark:hover:bg-gray-600 dark:hover:text-red-400 rounded"><TrashIcon className="w-4 h-4" /></button>
                </div>
            </div>
            {children.length > 0 && (
                <div>
                    {children.map(child => (
                        <ViewHierarchyItem 
                            key={child.id}
                            view={child}
                            // Corrected: used 'allViews' prop instead of the non-existent 'views'
                            allViews={allViews}
                            level={level + 1}
                            selectedViewId={selectedViewId}
                            onSelectView={onSelectView}
                            onAddChild={onAddChild}
                            onEdit={onEdit}
                            onDelete={onDelete}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};


export const ProjectDetail: React.FC<ProjectDetailProps> = ({ 
    project, 
    views, 
    units,
    onSelectView: onSelectViewToMap, 
    onAddView, 
    onUpdateView,
    onDeleteView, 
    onAddUnit,
    onAddUnitsBatch,
    onAttachFilesToUnits,
    onUpdateProject,
    onUpdateUnit,
    onDeleteUnit,
    onAddMember,
    onRemoveMember,
    onBack 
}) => {
    const [activeTab, setActiveTab] = useState<'views' | 'units' | 'team' | 'media'>('views');

    const [selectedViewId, setSelectedViewId] = useState<string | null>(null);
    const selectedView = useMemo(() => views.find(v => v.id === selectedViewId), [views, selectedViewId]);

    // Set initial selected view
    useEffect(() => {
        if(views.length > 0 && !selectedViewId) {
            const topLevelView = views.find(v => v.parentId === null) || views[0];
            setSelectedViewId(topLevelView.id);
        }
    }, [views, selectedViewId]);

    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [editingView, setEditingView] = useState<View | null>(null);
    const [viewToDelete, setViewToDelete] = useState<View | null>(null);
    const [viewForm, setViewForm] = useState(ViewFormInitialState);
    const [newViewParentId, setNewViewParentId] = useState<string | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
    const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
    const [unitForm, setUnitForm] = useState(UnitFormInitialState);

    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [parsedUnits, setParsedUnits] = useState<ParsedUnit[]>([]);
    const [importError, setImportError] = useState<string | null>(null);
    
    const [isFileUploadModalOpen, setIsFileUploadModalOpen] = useState(false);
    const [uploadFeedback, setUploadFeedback] = useState<string | null>(null);

    // Team Management State
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState<ProjectRole>('viewer');

     const openViewModal = (viewToEdit: View | null, parentId: string | null) => {
        setEditingView(viewToEdit);
        setNewViewParentId(parentId);
        if (viewToEdit) {
            setViewForm({ title: viewToEdit.title, type: viewToEdit.type });
            setImagePreview(viewToEdit.imageURL);
        } else {
            setViewForm(ViewFormInitialState);
            setImagePreview(null);
        }
        setImageFile(null);
        setIsViewModalOpen(true);
    };

    const closeViewModal = () => setIsViewModalOpen(false);

    useEffect(() => {
        if (isUnitModalOpen) {
            if (editingUnit) {
                 setUnitForm({
                    name: editingUnit.name,
                    factSheetFileName: editingUnit.factSheetFileName || '',
                    status: editingUnit.status,
                    price: editingUnit.price,
                    size: editingUnit.size,
                    rooms: editingUnit.rooms,
                    ancillaryArea: editingUnit.ancillaryArea,
                    lotSize: editingUnit.lotSize,
                    fee: editingUnit.fee,
                    floorLevel: editingUnit.floorLevel,
                    selections: editingUnit.selections,
                    files: editingUnit.files,
                });
            } else {
                setUnitForm(UnitFormInitialState);
            }
        }
    }, [isUnitModalOpen, editingUnit]);
    
    // CSV Import Logic
    const openImportModal = () => {
        setParsedUnits([]);
        setImportError(null);
        setIsImportModalOpen(true);
    };

    const handleCsvFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        setParsedUnits([]);
        setImportError(null);

        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const text = event.target?.result as string;
                // Handle both CRLF and LF line endings
                const rows = text.split(/\r\n|\n|\r/).map(r => r.trim()).filter(r => r);
                if (rows.length < 2) {
                    throw new Error("CSV file must contain a header row and at least one data row.");
                }
                
                // Detect delimiter: Check first row for comma vs semicolon count
                const firstRow = rows[0];
                const commaCount = (firstRow.match(/,/g) || []).length;
                const semicolonCount = (firstRow.match(/;/g) || []).length;
                const delimiter = semicolonCount > commaCount ? ';' : ',';

                const header = parseCsvRow(rows[0], delimiter).map(h => h.toLowerCase().trim());
                // We support standard keys + originalPrice which is not in initial state but valid
                const supportedKeys = [...Object.keys(UnitFormInitialState).filter(k => k !== 'files'), 'originalPrice'];
                
                const unitsToAdd: ParsedUnit[] = rows.slice(1).map((rowStr, rowIndex) => {
                    const values = parseCsvRow(rowStr, delimiter);
                    const unit: any = {};
                    
                    // Iterate over supported keys and try to find them in the CSV header
                    supportedKeys.forEach(key => {
                        const colIndex = header.indexOf(key.toLowerCase());
                        if (colIndex !== -1 && values[colIndex] !== undefined) {
                            let value: any = values[colIndex];
                            
                            if (['price', 'size', 'ancillaryArea', 'lotSize', 'rooms', 'fee', 'floorLevel', 'originalPrice'].includes(key)) {
                                // Remove spaces and handle decimal comma if present (common in CSVs with ; delimiter)
                                if (typeof value === 'string') {
                                    value = value.replace(/\s/g, '').replace(',', '.');
                                }
                                unit[key] = parseFloat(value) || 0;
                            } else if (key === 'status') {
                                const validStatuses = Object.values(UnitStatus);
                                const statusVal = value.toLowerCase().trim();
                                unit[key] = validStatuses.includes(statusVal as UnitStatus) ? statusVal : UnitStatus.ForSale;
                            } else {
                                unit[key] = value;
                            }
                        }
                    });

                    if (!unit.name) {
                       throw new Error(`Row ${rowIndex + 2} is missing a 'name'. Each unit must have a name.`);
                    }
                    return unit as ParsedUnit;
                });
                setParsedUnits(unitsToAdd);
            } catch (error) {
                setImportError(error instanceof Error ? error.message : "An unknown error occurred during parsing.");
            }
        };
        reader.onerror = () => setImportError("Failed to read the file.");
        reader.readAsText(file);
        e.target.value = ''; // Reset file input
    };

    const handleConfirmImport = () => {
        if (parsedUnits.length > 0) {
            onAddUnitsBatch(parsedUnits);
            setIsImportModalOpen(false);
        }
    };
    
    const downloadCsvTemplate = () => {
        const headers = "name,factSheetFileName,status,price,size,rooms,ancillaryArea,lotSize,fee,floorLevel,selections";
        const exampleData = `House A1,Bofaktablad-hus1,reserved,4195000,125,5,,,5998,,
House A2,Bofaktablad-hus2,for-sale,3895000,125,5,,,5998,,
House A3,Bofaktablad-hus3,for-sale,4195000,125,5,,,5998,,`;
        const csvContent = `${headers}\n${exampleData}`;
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', 'units_template.csv');
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    // Bulk File Upload Logic
    const openFileUploadModal = () => {
        setUploadFeedback(null);
        setIsFileUploadModalOpen(true);
    };

    const handleFactSheetUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        
        const matchedCount = onAttachFilesToUnits(Array.from(files));
        
        setUploadFeedback(`${files.length} file(s) processed. ${matchedCount} file(s) were successfully matched to units.`);

        setTimeout(() => {
            setIsFileUploadModalOpen(false);
        }, 3000);
    };
    
    const handleViewFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleNavMapUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const imageUrl = URL.createObjectURL(file);
            onUpdateProject({ ...project, navigationMapImageUrl: imageUrl });
        }
    };
    
    const handleViewInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setViewForm(prev => ({ ...prev, [name]: value }));
    };

    const handleViewSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (editingView) { // Handle update
            const updatedData: Partial<Omit<View, 'id' | 'projectId'>> = {
                ...viewForm,
            };
            if (imagePreview && imagePreview !== editingView.imageURL) {
                updatedData.imageURL = imagePreview;
            }
            onUpdateView(editingView.id, updatedData);
        } else { // Handle create
            if (imageFile && imagePreview) {
                const typeSuffix = viewForm.type === 'overview' ? 'birdeye' : viewForm.type;
                const baseTitle = `${project.name}_${typeSuffix}`;
                let finalTitle = baseTitle;
                let counter = 2;
                // Ensure unique title
                while (views.some(v => v.title.toLowerCase() === finalTitle.toLowerCase())) {
                    finalTitle = `${baseTitle}_${counter}`;
                    counter++;
                }

                onAddView({ title: finalTitle, type: viewForm.type, imageURL: imagePreview }, newViewParentId);
            }
        }
        closeViewModal();
    };
    
    const confirmDeleteView = () => {
        if (viewToDelete) {
            onDeleteView(viewToDelete.id);
            setViewToDelete(null);
        }
    };

    // Unit Modal Handlers
    const openUnitModal = (unit: Unit | null = null) => {
        setEditingUnit(unit);
        setIsUnitModalOpen(true);
    };

    const closeUnitModal = () => {
        setIsUnitModalOpen(false);
        setEditingUnit(null);
        setUnitForm(UnitFormInitialState);
    };
    
    const handleUnitInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        const isNumeric = ['price', 'size', 'rooms', 'ancillaryArea', 'lotSize', 'fee', 'floorLevel'].includes(name);
        setUnitForm(prev => ({ ...prev, [name]: isNumeric ? parseFloat(value) || 0 : value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles: UnitFile[] = Array.from(e.target.files).map((file: File) => {
                const fileType = file.type.startsWith('image/') ? 'image' : (file.type === 'application/pdf' ? 'pdf' : 'other');
                return {
                    id: `file_${new Date().getTime()}_${Math.random()}`,
                    name: file.name,
                    url: URL.createObjectURL(file),
                    type: fileType,
                };
            });
            setUnitForm(prev => ({ ...prev, files: [...prev.files, ...newFiles] }));
        }
    };

    const handleRemoveFile = (fileId: string) => {
        setUnitForm(prev => ({ ...prev, files: prev.files.filter(f => f.id !== fileId) }));
    };
    
    const handleUnitSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (unitForm.name.trim()) {
            if (editingUnit) {
                onUpdateUnit({ ...editingUnit, ...unitForm });
            } else {
                onAddUnit(unitForm);
            }
            closeUnitModal();
        }
    };
    
    const handleUnitAssociationChange = (unitId: string, isChecked: boolean) => {
        if (!selectedView) return;
        const currentUnitIds = selectedView.unitIds || [];
        const newUnitIds = isChecked
            ? [...currentUnitIds, unitId]
            : currentUnitIds.filter(id => id !== unitId);
        onUpdateView(selectedView.id, { unitIds: newUnitIds });
    };

    const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newStatus = e.target.value as ProjectStatus;
        onUpdateProject({ ...project, status: newStatus });
    };
    
    const statusStyles: { [key in ProjectStatus]: string } = {
        [ProjectStatus.Active]: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800',
        [ProjectStatus.Draft]: 'bg-gray-200 text-gray-800 border-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600',
        [ProjectStatus.Archived]: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800',
    };

    // Invite Logic
    const handleInviteSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const newMember: ProjectMember = {
            userId: `user_${Date.now()}`, // Simulated ID
            name: inviteEmail.split('@')[0] || 'New User',
            email: inviteEmail,
            role: inviteRole,
            avatarUrl: `https://i.pravatar.cc/150?u=${inviteEmail}`,
        };
        onAddMember(project.id, newMember);
        setIsInviteModalOpen(false);
        setInviteEmail('');
    };

    // Media Gallery Handlers
    const handleAddAsset = (asset: Omit<ProjectAsset, 'id' | 'projectId' | 'uploadedAt'>) => {
        const newAsset: ProjectAsset = {
            ...asset,
            id: `asset_${Date.now()}`,
            projectId: project.id,
            uploadedAt: new Date().toISOString(),
        };
        const updatedProject = {
            ...project,
            assets: [...(project.assets || []), newAsset],
        };
        onUpdateProject(updatedProject);
    };

    const handleUpdateAsset = (updatedAsset: ProjectAsset) => {
        const updatedProject = {
            ...project,
            assets: (project.assets || []).map(a => a.id === updatedAsset.id ? updatedAsset : a),
        };
        onUpdateProject(updatedProject);
    };

    const handleDeleteAsset = (assetId: string) => {
        const updatedProject = {
            ...project,
            assets: (project.assets || []).filter(a => a.id !== assetId),
        };
        onUpdateProject(updatedProject);
    };

    return (
        <div className="p-4 sm:p-8 h-full flex flex-col">
            <div className="max-w-7xl mx-auto w-full">
                <header className="mb-6 sm:mb-8">
                    <button onClick={onBack} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-[#2E2E2E] dark:hover:text-white mb-4">
                        <BackIcon className="w-4 h-4" />
                        Tillbaka till projekt
                    </button>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                             <div className="flex items-center gap-4 flex-wrap">
                                <h1 className="text-2xl sm:text-3xl font-bold text-[#2E2E2E] dark:text-white">{project.name}</h1>
                                <div className="relative">
                                     <select
                                        value={project.status}
                                        onChange={handleStatusChange}
                                        className={`text-sm font-semibold capitalize appearance-none cursor-pointer rounded-md py-1 pl-3 pr-8 border transition-all ${statusStyles[project.status]}`}
                                    >
                                        {Object.values(ProjectStatus).map(status => (
                                            <option key={status} value={status}>{status}</option>
                                        ))}
                                    </select>
                                    <svg className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                                    </svg>
                                </div>
                            </div>
                            <p className="text-gray-500 dark:text-gray-400 mt-1">{project.organization} • {project.client}</p>
                        </div>
                    </div>
                </header>

                <div className="border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
                    <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                        <button onClick={() => setActiveTab('views')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'views' ? 'border-[#5C7263] text-[#5C7263] dark:text-green-400 dark:border-green-400' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-600'}`}>
                            Vyer ({views.length})
                        </button>
                        <button onClick={() => setActiveTab('units')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'units' ? 'border-[#5C7263] text-[#5C7263] dark:text-green-400 dark:border-green-400' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-600'}`}>
                            Bostäder ({units.length})
                        </button>
                        <button onClick={() => setActiveTab('media')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'media' ? 'border-[#5C7263] text-[#5C7263] dark:text-green-400 dark:border-green-400' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-600'}`}>
                            Mediebibliotek
                        </button>
                        <button onClick={() => setActiveTab('team')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'team' ? 'border-[#5C7263] text-[#5C7263] dark:text-green-400 dark:border-green-400' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-600'}`}>
                            Team & åtkomst
                        </button>
                    </nav>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto pt-8">
                <div className="max-w-7xl mx-auto">
                    {activeTab === 'views' && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <aside className="lg:col-span-1 order-2 lg:order-1">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-semibold text-gray-800 dark:text-white">Vyhierarki</h3>
                                    <button onClick={() => openViewModal(null, null)} className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-white bg-[#5C7263] dark:bg-green-700 rounded-md transition hover:bg-opacity-90">
                                        <PlusIcon className="w-4 h-4" /> Lägg till vy
                                    </button>
                                </div>
                                <div className="space-y-1 bg-white dark:bg-gray-800 p-2 rounded-lg border dark:border-gray-700 lg:border-none lg:bg-transparent">
                                    {views.filter(v => v.parentId === null).sort((a,b) => a.title.localeCompare(b.title)).map(rootView => (
                                        <ViewHierarchyItem
                                            key={rootView.id}
                                            view={rootView}
                                            allViews={views}
                                            level={0}
                                            selectedViewId={selectedViewId}
                                            onSelectView={setSelectedViewId}
                                            onAddChild={(parentId) => openViewModal(null, parentId)}
                                            onEdit={(view) => openViewModal(view, view.parentId)}
                                            onDelete={setViewToDelete}
                                        />
                                    ))}
                                </div>
                            </aside>
                            <main className="lg:col-span-2 space-y-8 order-1 lg:order-2">
                                <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg p-6">
                                    <h3 className="font-semibold text-lg mb-3 text-gray-800 dark:text-white">Anpassad navigationskarta</h3>
                                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                                        <div className="w-32 h-32 bg-gray-100 dark:bg-gray-700 rounded-md flex items-center justify-center flex-shrink-0 border dark:border-gray-600">
                                            {project.navigationMapImageUrl ? (
                                                <img src={project.navigationMapImageUrl} alt="Nav map preview" className="w-full h-full object-contain rounded-md" />
                                            ) : (
                                                <MapIcon className="w-12 h-12 text-gray-400" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Ladda upp en SVG eller PNG av byggnadernas konturer. Detta ersätter standardöversiktsbilden i väljarens minikarta.</p>
                                            <label htmlFor="nav-map-upload" className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md transition hover:bg-gray-50 dark:hover:bg-gray-600">
                                                <UploadIcon className="w-5 h-5" />
                                                <span>{project.navigationMapImageUrl ? 'Byt karta' : 'Ladda upp karta'}</span>
                                            </label>
                                            <input id="nav-map-upload" type="file" className="sr-only" onChange={handleNavMapUpload} accept="image/svg+xml,image/png" />
                                        </div>
                                    </div>
                                </div>
                                {selectedView ? (
                                    <div className="space-y-6">
                                        <div>
                                            <h2 className="text-xl font-bold text-[#2E2E2E] dark:text-white">{selectedView.title}</h2>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{selectedView.type}</p>
                                        </div>
                                        <div className="relative group">
                                            <img src={selectedView.imageURL} alt={selectedView.title} className="w-full aspect-video object-cover rounded-lg shadow-md" />
                                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                                                <button onClick={() => onSelectViewToMap(selectedView.id)} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-black bg-white/80 rounded-md hover:bg-white">
                                                    <EyeIcon className="w-5 h-5" /> Mappa områden
                                                </button>
                                            </div>
                                        </div>
                                        <div>
                                            <h3 className="font-semibold mb-3 text-gray-800 dark:text-white">Associerade bostäder</h3>
                                            <div className="max-h-60 overflow-y-auto space-y-2 p-4 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
                                                {units.length > 0 ? units.map(unit => (
                                                    <label key={unit.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedView.unitIds.includes(unit.id)}
                                                            onChange={(e) => handleUnitAssociationChange(unit.id, e.target.checked)}
                                                            className="h-4 w-4 rounded border-gray-300 text-[#5C7263] focus:ring-[#5C7263]"
                                                        />
                                                        <span className="text-sm text-gray-800 dark:text-gray-200">{unit.name}</span>
                                                    </label>
                                                )) : (
                                                    <p className="text-sm text-gray-500 text-center py-4">Inga bostäder i detta projekt ännu.</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                     <div className="text-center p-12 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg bg-white/50 dark:bg-gray-800/50 h-full flex flex-col justify-center">
                                        <ImageIcon className="w-12 h-12 mx-auto text-gray-400" />
                                        <h3 className="text-lg font-semibold text-[#2E2E2E] dark:text-white mt-4">Inga vyer tillgängliga</h3>
                                        <p className="text-sm text-gray-500 mt-1">Börja med att lägga till din första projektvy.</p>
                                    </div>
                                )}
                            </main>
                        </div>
                    )}
                    
                    {activeTab === 'media' && (
                        <MediaGallery 
                            project={project} 
                            onAddAsset={handleAddAsset} 
                            onUpdateAsset={handleUpdateAsset}
                            onDeleteAsset={handleDeleteAsset} 
                        />
                    )}

                    {activeTab === 'units' && (
                        <div>
                            <div className="flex flex-col sm:flex-row justify-end gap-3 mb-6">
                                <button 
                                    type="button"
                                    onClick={openFileUploadModal} 
                                    className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md transition hover:bg-gray-50 dark:hover:bg-gray-600"
                                >
                                    <UploadIcon className="w-5 h-5" /> Ladda upp bofaktablad
                                </button>
                                <button 
                                    type="button"
                                    onClick={openImportModal} 
                                    className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md transition hover:bg-gray-50 dark:hover:bg-gray-600"
                                >
                                    <DocumentTextIcon className="w-5 h-5" /> Importera från CSV
                                </button>
                                <button onClick={() => openUnitModal()} className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#5C7263] dark:bg-green-700 rounded-md transition hover:bg-opacity-90">
                                    <PlusIcon className="w-5 h-5" /> Lägg till bostad
                                </button>
                            </div>
                             {units.length > 0 ? (
                                <>
                                    {/* Mobile Card View */}
                                    <div className="block sm:hidden space-y-4">
                                        {units.map(unit => (
                                            <div key={unit.id} className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg p-4 shadow-sm">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <h4 className="font-bold text-gray-900 dark:text-white">{unit.name}</h4>
                                                        <p className="text-sm text-gray-500 dark:text-gray-400">{unit.price.toLocaleString()} SEK • {unit.size} m²</p>
                                                    </div>
                                                     <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${unit.status === 'for-sale' ? 'bg-green-100 text-green-800' : (unit.status === 'sold' ? 'bg-red-100 text-red-800' : (unit.status === 'reserved' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'))}`}>{unit.status.replace('-', ' ')}</span>
                                                </div>
                                                <div className="flex items-center justify-between mt-4">
                                                     {unit.files.length > 0 ? (
                                                        <a href={unit.files[0].url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sm text-blue-600 hover:underline">
                                                            <DocumentTextIcon className="w-4 h-4" /> {unit.files.length} filer
                                                        </a>
                                                    ) : (
                                                        <span className="text-sm text-gray-400">Inga filer</span>
                                                    )}
                                                    <div className="flex gap-2">
                                                        <button onClick={() => openUnitModal(unit)} className="p-2 text-gray-500 rounded bg-gray-50 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"><PencilIcon className="w-4 h-4"/></button>
                                                        <button onClick={() => onDeleteUnit(unit.id)} className="p-2 text-gray-500 rounded bg-gray-50 dark:bg-gray-700 hover:bg-red-100 hover:text-red-600"><TrashIcon className="w-4 h-4"/></button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Desktop Table View */}
                                    <div className="hidden sm:block bg-white/80 dark:bg-gray-800/80 rounded-2xl shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700">
                                        <div className="overflow-x-auto min-w-full">
                                            <table className="w-full text-sm text-left text-gray-600 dark:text-gray-300 min-w-[600px]">
                                                <thead className="text-xs text-gray-700 dark:text-gray-200 uppercase bg-gray-50 dark:bg-gray-900/50">
                                                    <tr>
                                                        <th scope="col" className="px-6 py-3 whitespace-nowrap">Namn</th>
                                                        <th scope="col" className="px-6 py-3 whitespace-nowrap">Status</th>
                                                        <th scope="col" className="px-6 py-3 whitespace-nowrap">Pris</th>
                                                        <th scope="col" className="px-6 py-3 whitespace-nowrap">Filer</th>
                                                        <th scope="col" className="px-6 py-3 whitespace-nowrap"><span className="sr-only">Åtgärder</span></th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {units.map(unit => (
                                                        <tr key={unit.id} className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                                                            <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white whitespace-nowrap">{unit.name}</td>
                                                            <td className="px-6 py-4 whitespace-nowrap"><span className={`text-xs px-2 py-0.5 rounded-full capitalize ${unit.status === 'for-sale' ? 'bg-green-100 text-green-800' : (unit.status === 'sold' ? 'bg-red-100 text-red-800' : (unit.status === 'reserved' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'))}`}>{unit.status.replace('-', ' ')}</span></td>
                                                            <td className="px-6 py-4 whitespace-nowrap">{unit.price.toLocaleString()} SEK</td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                {unit.files.length > 0 ? (
                                                                    <a href={unit.files[0].url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-600 hover:underline">
                                                                        <DocumentTextIcon className="w-4 h-4" /> {unit.files.length}
                                                                    </a>
                                                                ) : (
                                                                    <span className="text-gray-400">N/A</span>
                                                                )}
                                                            </td>
                                                            <td className="px-6 py-4 text-right whitespace-nowrap">
                                                                <button onClick={() => openUnitModal(unit)} className="p-2 text-gray-500 rounded hover:bg-gray-200 dark:hover:bg-gray-600"><PencilIcon className="w-4 h-4"/></button>
                                                                <button onClick={() => onDeleteUnit(unit.id)} className="p-2 text-gray-500 rounded hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30"><TrashIcon className="w-4 h-4"/></button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </>
                             ) : (
                                <div className="text-center p-12 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg bg-white/50 dark:bg-gray-800/50">
                                    <HomeIcon className="w-12 h-12 mx-auto text-gray-400" />
                                    <h3 className="text-lg font-semibold text-[#2E2E2E] dark:text-white mt-4">Inga bostäder skapade ännu</h3>
                                    <p className="text-sm text-gray-500 mt-1">Lägg till ditt första hus eller lägenhet i detta projekt.</p>
                                    <button onClick={() => openUnitModal()} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#5C7263] dark:bg-green-700 rounded-md transition hover:bg-opacity-90 mt-6 mx-auto">
                                        <PlusIcon className="w-5 h-5" /> Lägg till första bostaden
                                    </button>
                                </div>
                             )}
                        </div>
                    )}
                    {activeTab === 'team' && (
                        <div className="max-w-4xl mx-auto space-y-8">
                            <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl p-6 shadow-sm">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                                        <BadgeCheckIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Projektägare</h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Den primära ägaren från {project.organization} ansvarig för detta projekt.</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg border border-gray-100 dark:border-gray-700">
                                    <img src={`https://i.pravatar.cc/150?u=${project.ownerId}`} alt="Owner" className="w-12 h-12 rounded-full border-2 border-purple-200" />
                                    <div>
                                        <p className="font-bold text-gray-900 dark:text-white">Projektägare</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">{project.organization}</p>
                                    </div>
                                    <div className="ml-auto">
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300">
                                            <BadgeCheckIcon className="w-3.5 h-3.5" />
                                            Ägare
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                        <UsersIcon className="w-5 h-5 text-gray-500" />
                                        Projektmedlemmar
                                    </h3>
                                    <button 
                                        onClick={() => setIsInviteModalOpen(true)}
                                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#5C7263] dark:bg-green-700 rounded-md transition hover:bg-opacity-90"
                                    >
                                        <UserPlusIcon className="w-5 h-5" />
                                        Bjud in medlem
                                    </button>
                                </div>

                                <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl overflow-hidden shadow-sm">
                                    {project.members && project.members.length > 0 ? (
                                        <table className="w-full text-left text-sm">
                                            <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400">
                                                <tr>
                                                    <th className="px-6 py-3 font-medium">Användare</th>
                                                    <th className="px-6 py-3 font-medium">E-post</th>
                                                    <th className="px-6 py-3 font-medium">Åtkomstnivå</th>
                                                    <th className="px-6 py-3 text-right">Åtgärder</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                                {project.members.map((member) => (
                                                    <tr key={member.userId} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition">
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <img src={member.avatarUrl} alt={member.name} className="w-8 h-8 rounded-full bg-gray-200" />
                                                                <span className="font-medium text-gray-900 dark:text-white">{member.name}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{member.email}</td>
                                                        <td className="px-6 py-4">
                                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize 
                                                                ${member.role === 'editor' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' : 
                                                                'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'}`}>
                                                                {member.role === 'editor' ? 'Redaktör' : 'Visare'}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <button 
                                                                onClick={() => onRemoveMember(project.id, member.userId)}
                                                                className="text-gray-400 hover:text-red-600 transition p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                                                                title="Ta bort användare"
                                                            >
                                                                <TrashIcon className="w-4 h-4" />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    ) : (
                                        <div className="p-12 text-center text-gray-500 dark:text-gray-400">
                                            <UsersIcon className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                                            <p className="font-medium">Inga medlemmar tillagda ännu</p>
                                            <p className="text-sm mt-1">Bjud in kollegor för att samarbeta på detta specifika projekt.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {isViewModalOpen && (
                <Modal onClose={closeViewModal}>
                    <form onSubmit={handleViewSubmit}>
                        <h2 className="text-2xl font-semibold text-[#2E2E2E] dark:text-white">{editingView ? 'Redigera vy' : 'Lägg till vy'}</h2>
                        <p className="text-gray-500 dark:text-gray-400 mt-1 mb-6">{editingView ? 'Uppdatera detaljerna för din vy' : 'Lägg till en ny vy till ditt projekt'}</p>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bildfil *</label>
                                <label htmlFor="file-upload" className="relative mt-1 flex flex-col justify-center items-center w-full p-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-md cursor-pointer group hover:border-[#5C7263] dark:hover:border-green-500 transition-colors">
                                    {imagePreview ? (
                                        <>
                                            <img src={imagePreview} alt="Förhandsvisning" className="max-h-40 rounded-lg object-contain" />
                                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <p className="text-white font-semibold">Byt bild</p>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="text-center">
                                            <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                                            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Klicka för att välja bild</p>
                                            <p className="mt-1 text-xs text-gray-500">PNG, JPG, GIF upp till 10MB</p>
                                        </div>
                                    )}
                                    <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleViewFileChange} accept="image/*" required={!editingView} />
                                </label>
                            </div>
                            {editingView && (
                                <div>
                                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Vynamn *</label>
                                    <input type="text" name="title" id="title" required value={viewForm.title} onChange={handleViewInputChange} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md shadow-sm focus:ring-[#5C7263] focus:border-[#5C7263]" placeholder="t.ex. Översikt norr"/>
                                </div>
                            )}
                            <div>
                                <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Typ</label>
                                <select name="type" id="type" value={viewForm.type} onChange={handleViewInputChange} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md shadow-sm focus:ring-[#5C7263] focus:border-[#5C7263]">
                                    <option value="overview">Översikt</option>
                                    <option value="facade">Fasad</option>
                                    <option value="floorplan">Planlösning</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-8">
                            <button type="button" onClick={closeViewModal} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600">Avbryt</button>
                            <button type="submit" disabled={editingView ? !viewForm.title.trim() : !imageFile} className="px-4 py-2 text-sm font-medium text-white bg-[#5C7263] dark:bg-green-700 rounded-md hover:bg-opacity-90 disabled:bg-gray-300"> {editingView ? 'Spara ändringar' : 'Lägg till vy'}</button>
                        </div>
                    </form>
                </Modal>
            )}

            {viewToDelete && (
                <Modal onClose={() => setViewToDelete(null)}>
                     <h2 className="text-2xl font-semibold text-[#2E2E2E] dark:text-white">Bekräfta radering</h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">Är du säker på att du vill radera vyn <strong className="font-semibold">{viewToDelete.title}</strong> permanent? Alla områden i denna vy kommer också att raderas. Denna åtgärd kan inte ångras.</p>
                    <div className="flex justify-end gap-3 mt-8">
                        <button type="button" onClick={() => setViewToDelete(null)} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600">Avbryt</button>
                        <button onClick={confirmDeleteView} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700">Radera</button>
                    </div>
                </Modal>
            )}

             {isUnitModalOpen && (
                <Modal onClose={closeUnitModal}>
                    <form onSubmit={handleUnitSubmit}>
                        <h2 className="text-2xl font-semibold text-[#2E2E2E] dark:text-white">{editingUnit ? 'Redigera bostad' : 'Lägg till bostad'}</h2>
                        <p className="text-gray-500 dark:text-gray-400 mt-1 mb-6">{editingUnit ? 'Uppdatera detaljer för bostaden' : 'Lägg till en ny bostad i projektet'}</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bostadsnamn / Nummer *</label>
                                <input type="text" name="name" required value={unitForm.name} onChange={handleUnitInputChange} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md shadow-sm" placeholder="t.ex. A101" />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                                <select name="status" value={unitForm.status} onChange={handleUnitInputChange} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md shadow-sm">
                                    {Object.values(UnitStatus).map(s => (
                                        <option key={s} value={s}>{s === 'for-sale' ? 'Till salu' : s === 'sold' ? 'Såld' : s === 'reserved' ? 'Reserverad' : 'Kommande'}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Pris (SEK)</label>
                                <input type="number" name="price" value={unitForm.price} onChange={handleUnitInputChange} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md shadow-sm" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Boarea (m²)</label>
                                <input type="number" name="size" value={unitForm.size} onChange={handleUnitInputChange} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md shadow-sm" />
                            </div>

                             <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Antal rum</label>
                                <input type="number" name="rooms" value={unitForm.rooms} onChange={handleUnitInputChange} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md shadow-sm" />
                            </div>
                             
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Månadsavgift (SEK)</label>
                                <input type="number" name="fee" value={unitForm.fee} onChange={handleUnitInputChange} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md shadow-sm" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Våning</label>
                                <input type="number" name="floorLevel" value={unitForm.floorLevel} onChange={handleUnitInputChange} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md shadow-sm" />
                            </div>

                             <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Biarea (m²)</label>
                                <input type="number" name="ancillaryArea" value={unitForm.ancillaryArea} onChange={handleUnitInputChange} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md shadow-sm" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tomtyta (m²)</label>
                                <input type="number" name="lotSize" value={unitForm.lotSize} onChange={handleUnitInputChange} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md shadow-sm" />
                            </div>

                             <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Filnamn bofaktablad</label>
                                <input type="text" name="factSheetFileName" value={unitForm.factSheetFileName || ''} onChange={handleUnitInputChange} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md shadow-sm" placeholder="Filnamn utan ändelse (t.ex. hus-a1)" />
                                <p className="text-xs text-gray-500 mt-1">Används för att automatiskt matcha uppladdade PDF-filer.</p>
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tillval / Beskrivning</label>
                                <textarea name="selections" rows={2} value={unitForm.selections} onChange={handleUnitInputChange} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md shadow-sm" placeholder="Köksval, alternativ..."></textarea>
                            </div>
                            
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Filer</label>
                                <div className="space-y-2">
                                    {unitForm.files.map(file => (
                                        <div key={file.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-md border dark:border-gray-600">
                                            <span className="text-sm truncate text-gray-700 dark:text-gray-200">{file.name}</span>
                                            <button type="button" onClick={() => handleRemoveFile(file.id)} className="text-red-500 hover:text-red-700"><CloseIcon className="w-4 h-4" /></button>
                                        </div>
                                    ))}
                                    <input type="file" multiple onChange={handleFileChange} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-[#5C7263] file:text-white hover:file:bg-opacity-90" />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-8">
                            <button type="button" onClick={closeUnitModal} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600">Avbryt</button>
                            <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-[#5C7263] dark:bg-green-700 rounded-md hover:bg-opacity-90">{editingUnit ? 'Spara ändringar' : 'Lägg till bostad'}</button>
                        </div>
                    </form>
                </Modal>
            )}

            {isImportModalOpen && (
                <Modal onClose={() => setIsImportModalOpen(false)}>
                    <h2 className="text-2xl font-semibold text-[#2E2E2E] dark:text-white">Importera bostäder från CSV</h2>
                    <p className="text-gray-500 dark:text-gray-400 mt-1 mb-6">Ladda upp en CSV-fil för att massskapa bostäder. Se till att rubrikraden matchar bostadens egenskaper.</p>
                    
                    <div className="space-y-4">
                        <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg border border-gray-200 dark:border-gray-600">
                            <div className="text-sm text-gray-600 dark:text-gray-300">
                                <span className="font-semibold">Behöver du en mall?</span> Ladda ner en exempel-CSV.
                            </div>
                            <button type="button" onClick={downloadCsvTemplate} className="text-sm font-medium text-[#5C7263] dark:text-green-400 hover:underline">Ladda ner mall</button>
                        </div>

                        <div>
                             <label htmlFor="csv-upload" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Välj CSV-fil</label>
                             <input type="file" id="csv-upload" accept=".csv" onChange={handleCsvFileSelected} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-gray-800 file:text-white dark:file:bg-gray-600 hover:file:bg-gray-700" />
                        </div>

                        {importError && (
                            <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 rounded-md text-sm border border-red-200 dark:border-red-800">
                                {importError}
                            </div>
                        )}

                        {parsedUnits.length > 0 && (
                            <div className="p-3 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-md text-sm border border-green-200 dark:border-green-800">
                                Redo att importera <strong>{parsedUnits.length}</strong> bostäder.
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end gap-3 mt-8">
                         <button type="button" onClick={() => setIsImportModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600">Avbryt</button>
                        <button type="button" onClick={handleConfirmImport} disabled={parsedUnits.length === 0} className="px-4 py-2 text-sm font-medium text-white bg-[#5C7263] dark:bg-green-700 rounded-md hover:bg-opacity-90 disabled:bg-gray-300 dark:disabled:bg-gray-600">Importera bostäder</button>
                    </div>
                </Modal>
            )}

            {isFileUploadModalOpen && (
                <Modal onClose={() => setIsFileUploadModalOpen(false)}>
                    <h2 className="text-2xl font-semibold text-[#2E2E2E] dark:text-white">Ladda upp bofaktablad</h2>
                    <p className="text-gray-500 dark:text-gray-400 mt-1 mb-6">Massuppladda PDF-bofaktablad. Systemet försöker matcha filnamn till bostäder (t.ex. "hus-1.pdf" till bostad "Hus 1").</p>
                    
                     <div className="space-y-4">
                        <label className="flex flex-col justify-center items-center w-full h-32 px-4 transition bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-md appearance-none cursor-pointer hover:border-gray-400 dark:hover:border-gray-500 focus:outline-none">
                            <span className="flex items-center space-x-2">
                                <UploadIcon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                                <span className="font-medium text-gray-600 dark:text-gray-300">Dra och släpp filer för att bifoga, eller <span className="text-blue-600 dark:text-blue-400 underline">bläddra</span></span>
                            </span>
                            <input type="file" name="file_upload" className="hidden" multiple accept=".pdf" onChange={handleFactSheetUpload} />
                        </label>
                        
                         {uploadFeedback && (
                            <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-md text-sm border border-blue-200 dark:border-blue-800">
                                {uploadFeedback}
                            </div>
                        )}
                     </div>
                     
                     <div className="flex justify-end mt-6">
                        <button type="button" onClick={() => setIsFileUploadModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600">Stäng</button>
                     </div>
                </Modal>
            )}

            {isInviteModalOpen && (
                <Modal onClose={() => setIsInviteModalOpen(false)}>
                    <form onSubmit={handleInviteSubmit}>
                        <h2 className="text-2xl font-semibold text-[#2E2E2E] dark:text-white">Bjud in projektmedlem</h2>
                        <p className="text-gray-500 dark:text-gray-400 mt-1 mb-6">Lägg till en teammedlem för att samarbeta i detta projekt.</p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">E-postadress</label>
                                <input type="email" required value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md shadow-sm" placeholder="kollega@exempel.se" />
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Projektroll</label>
                                <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value as ProjectRole)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md shadow-sm">
                                    <option value="editor">Redaktör (Kan redigera vyer & bostäder)</option>
                                    <option value="viewer">Visare (Läsbehörighet)</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-8">
                            <button type="button" onClick={() => setIsInviteModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600">Avbryt</button>
                            <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-[#5C7263] dark:bg-green-700 rounded-md hover:bg-opacity-90">Bjud in</button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
};
