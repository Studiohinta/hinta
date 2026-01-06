
import React, { useState, useEffect } from 'react';
import { Editor } from './components/Editor';
import { ProjectsList } from './components/ProjectsList';
import { ProjectDetail } from './components/ProjectDetail';
import { Sidebar } from './components/Sidebar';
import { Project, View, Hotspot, Unit, UnitStatus, UnitFile, HotspotStatus, ProjectStatus, ProjectMember, User, UserRole } from './types';
import { Viewer } from './components/Viewer';
import { ToastProvider, useToast } from './components/Toast';
import { Settings } from './components/Settings';
import { GlobalMediaLibrary } from './components/GlobalMediaLibrary';

// Import Static Demo Data from the .ts file using a relative reference
import { demoData } from './data/demo-project';

type Page = 'projects' | 'projectDetail' | 'editor' | 'viewer' | 'settings' | 'media';

// Simple Menu Icon Component
const MenuIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
  </svg>
);

// Refactored Hook: Always allows seeding from static JSON if empty or specifically requested
function useDemoStorage<T>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
    const [storedValue, setStoredValue] = useState<T>(() => {
        try {
            const item = window.localStorage.getItem(key);
            // If local storage is empty, we hydrate from the static demo data
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.error(`Error reading ${key} from localStorage:`, error);
            return initialValue;
        }
    });

    const setValue = (value: T | ((val: T) => T)) => {
        try {
            const valueToStore = value instanceof Function ? value(storedValue) : value;
            setStoredValue(valueToStore);
            window.localStorage.setItem(key, JSON.stringify(valueToStore));
        } catch (error) {
            console.error(`Error saving ${key} to localStorage:`, error);
        }
    };

    return [storedValue, setValue];
}


function AppContent() {
  // Initialize state using imported demoData as the fallback seed
  const [projects, setProjects] = useDemoStorage<Project[]>('hinta_projects', demoData.projects as any);
  const [views, setViews] = useDemoStorage<View[]>('hinta_views', demoData.views as any);
  const [units, setUnits] = useDemoStorage<Unit[]>('hinta_units', demoData.units as any);
  const [hotspots, setHotspots] = useDemoStorage<Hotspot[]>('hinta_hotspots', demoData.hotspots as any);
  const [users, setUsers] = useDemoStorage<User[]>('hinta_users', demoData.users as any);
  const [currentUser, setCurrentUser] = useDemoStorage<User>('hinta_current_user', demoData.users[0] as any);
  
  const { addToast } = useToast();

  // Theme State
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
        const storedTheme = window.localStorage.getItem('hinta_theme');
        if (storedTheme) return storedTheme === 'dark';
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    if (isDarkMode) {
        document.documentElement.classList.add('dark');
        window.localStorage.setItem('hinta_theme', 'dark');
    } else {
        document.documentElement.classList.remove('dark');
        window.localStorage.setItem('hinta_theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(prev => !prev);


  // Routing
  const path = window.location.pathname;
  const viewMatch = path.match(/^\/view\/([^/]+)/);
  const publicProjectId = viewMatch ? viewMatch[1] : null;

  const [publicViewId, setPublicViewId] = useState<string | null>(null);

  useEffect(() => {
    if (publicProjectId) {
      const startView = views.find(v => v.projectId === publicProjectId && v.parentId === null);
      if (startView) {
        setPublicViewId(startView.id);
      }
    }
  }, [publicProjectId, views]);

  if (publicProjectId) {
    const project = projects.find(p => p.id === publicProjectId);
    const projectViews = views.filter(v => v.projectId === publicProjectId);
    const projectUnits = units.filter(u => u.projectId === publicProjectId);
    const currentView = projectViews.find(v => v.id === publicViewId);

    if (project && currentView) {
      const projectHotspots = hotspots.filter(h => projectViews.map(v => v.id).includes(h.viewId));
      return <Viewer
        project={project}
        currentView={currentView}
        allProjectViews={projectViews}
        allProjectUnits={projectUnits}
        hotspots={projectHotspots}
        onNavigate={(viewId) => setPublicViewId(viewId)}
      />
    }
     return (
        <div className="w-screen h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-100">
            <div className="text-center p-8">
                <h1 className="text-2xl font-bold">Project Not Found</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">The requested project could not be found or does not have a valid starting view.</p>
                <a href="/" className="mt-6 inline-block px-5 py-2.5 bg-gray-800 text-white font-semibold rounded-lg shadow-md hover:bg-gray-900 transition-colors">
                    Go to Homepage
                </a>
            </div>
        </div>
    );
  }

  // Admin App State
  const [page, setPage] = useState<Page>('projects');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedViewId, setSelectedViewId] = useState<string | null>(null);


  const handleSelectProject = (projectId: string) => {
    setSelectedProjectId(projectId);
    setPage('projectDetail');
  };

  const handleSelectView = (viewId: string) => {
    setSelectedViewId(viewId);
    setPage('editor');
  };

  const handleBackToProjects = () => {
    setSelectedProjectId(null);
    setSelectedViewId(null);
    setPage('projects');
    if (window.innerWidth < 768) {
        setIsSidebarCollapsed(true);
    }
  };

  const handleNavigateToMedia = () => {
    setPage('media');
    if (window.innerWidth < 768) {
        setIsSidebarCollapsed(true);
    }
  };

  const handleBackToProjectDetail = () => {
    setSelectedViewId(null);
    setPage('projectDetail');
  }

  const handleCreateProject = (projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'updatedBy' | 'organization' | 'ownerId' | 'members'> & { ownerName?: string; ownerEmail?: string; assignedUserIds?: string[] }) => {
      const now = new Date().toISOString();
      const newOwnerId = `user_${Date.now()}_owner`;
      
      const members: ProjectMember[] = [];
      
      if (projectData.ownerName || projectData.ownerEmail) {
          members.push({
              userId: newOwnerId,
              name: projectData.ownerName || 'Unknown Owner',
              email: projectData.ownerEmail || '',
              role: 'owner',
              avatarUrl: `https://i.pravatar.cc/150?u=${newOwnerId}`
          });
      }

      if (projectData.assignedUserIds && projectData.assignedUserIds.length > 0) {
          const assignedMembers = users
            .filter(u => projectData.assignedUserIds?.includes(u.id))
            .map(u => ({
                userId: u.id,
                name: u.name,
                email: u.email,
                role: 'editor' as ProjectMember['role'],
                avatarUrl: u.avatarUrl
            }));
          members.push(...assignedMembers);
      }

      const newProject: Project = {
          id: `proj_${new Date().getTime()}`,
          name: projectData.name,
          description: projectData.description,
          client: projectData.client,
          status: projectData.status,
          bostadsväljarenActive: projectData.bostadsväljarenActive,
          assets: projectData.assets,
          organization: projectData.client || 'Default Org',
          ownerId: projectData.ownerName ? newOwnerId : 'user_1',
          members: members,
          createdAt: now,
          updatedAt: now,
          updatedBy: { name: currentUser.name, avatarUrl: currentUser.avatarUrl },
      };
      
      if (newProject.bostadsväljarenActive) {
          const activateDate = new Date();
          const oneYearFromNow = new Date(activateDate.setFullYear(activateDate.getFullYear() + 1));
          newProject.bostadsväljarenActivatedAt = new Date().toISOString().split('T')[0];
          newProject.bostadsväljarenExpiresAt = oneYearFromNow.toISOString().split('T')[0];
      }
      setProjects(prev => [...prev, newProject]);
      addToast("Project created successfully");
  };

  const handleUpdateProject = (updatedProject: Project) => {
    const originalProject = projects.find(p => p.id === updatedProject.id);
    if (!originalProject) return;

    updatedProject.updatedAt = new Date().toISOString();
    updatedProject.updatedBy = { name: currentUser.name, avatarUrl: currentUser.avatarUrl };

    if (updatedProject.bostadsväljarenActive && !originalProject.bostadsväljarenActive) {
      const now = new Date();
      const oneYearFromNow = new Date(new Date().setFullYear(now.getFullYear() + 1));
      updatedProject.bostadsväljarenActivatedAt = now.toISOString().split('T')[0];
      updatedProject.bostadsväljarenExpiresAt = oneYearFromNow.toISOString().split('T')[0];
    }
    
    setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
  };

  const handleAddMemberToProject = (projectId: string, member: ProjectMember) => {
      setProjects(prev => prev.map(p => {
          if (p.id === projectId) {
              return { ...p, members: [...p.members, member] };
          }
          return p;
      }));
      addToast(`${member.name} invited to project`);
  };

  const handleRemoveMemberFromProject = (projectId: string, userId: string) => {
      setProjects(prev => prev.map(p => {
          if (p.id === projectId) {
              return { ...p, members: p.members.filter(m => m.userId !== userId) };
          }
          return p;
      }));
      addToast("Member removed");
  };

  const handleDuplicateProject = (projectId: string) => {
    const projectToDuplicate = projects.find(p => p.id === projectId);
    if (!projectToDuplicate) return;

    const now = new Date().toISOString();
    const newProjectId = `proj_${new Date().getTime()}`;
    const newProject: Project = {
        ...projectToDuplicate,
        id: newProjectId,
        name: `${projectToDuplicate.name} (Copy)`,
        createdAt: now,
        updatedAt: now,
        updatedBy: { name: currentUser.name, avatarUrl: currentUser.avatarUrl },
        status: ProjectStatus.Draft,
        bostadsväljarenActive: false,
        bostadsväljarenActivatedAt: undefined,
        bostadsväljarenExpiresAt: undefined,
        members: [],
        assets: projectToDuplicate.assets ? [...projectToDuplicate.assets.map(a => ({...a, id: `asset_${Date.now()}_${Math.random()}`, projectId: newProjectId}))] : []
    };
    
    const viewsToDuplicate = views.filter(v => v.projectId === projectId);
    const viewIdMap = new Map<string, string>();

    const newViewsUnmapped = viewsToDuplicate.map((view, index) => {
      const newId = `view_${new Date().getTime()}_${index}`;
      viewIdMap.set(view.id, newId);
      return { ...view, id: newId, projectId: newProjectId };
    });

    const newViews = newViewsUnmapped.map(view => {
        if (view.parentId && viewIdMap.has(view.parentId)) {
            return { ...view, parentId: viewIdMap.get(view.parentId)! };
        }
        return view;
    });

    const unitsToDuplicate = units.filter(u => u.projectId === projectId);
    const newUnits = unitsToDuplicate.map((unit, index) => ({
        ...unit,
        id: `unit_${new Date().getTime()}_${index}`,
        projectId: newProjectId,
    }));
    
    setProjects(prev => [...prev, newProject]);
    setViews(prev => [...prev, ...newViews]);
    setUnits(prev => [...prev, ...newUnits]);
    addToast("Project duplicated");
  };

  const handleDeleteProject = (projectId: string) => {
      setProjects(prev => prev.filter(p => p.id !== projectId));
      const projectViewIds = views.filter(v => v.projectId === projectId).map(v => v.id);
      setViews(prev => prev.filter(v => v.projectId !== projectId));
      setUnits(prev => prev.filter(u => u.projectId !== projectId));
      setHotspots(prev => prev.filter(h => !projectViewIds.includes(h.viewId)));
      addToast("Project deleted", 'error');
  };

  const handleAddView = (viewData: Omit<View, 'id' | 'projectId' | 'parentId' | 'unitIds'>, parentId: string | null) => {
    if (!selectedProjectId) return;
    const newView: View = {
        ...viewData,
        id: `view_${new Date().getTime()}`,
        projectId: selectedProjectId,
        parentId,
        unitIds: [],
    };
    setViews(prev => [...prev, newView]);
    addToast("View added");
  };

  const handleDeleteView = (viewId: string) => {
    const viewToDelete = views.find(v => v.id === viewId);
    if (!viewToDelete) return;

    const updatedViews = views
        .filter(v => v.id !== viewId)
        .map(v => {
            if (v.parentId === viewId) {
                return { ...v, parentId: viewToDelete.parentId };
            }
            return v;
        });
    
    setViews(updatedViews);
    setHotspots(prev => prev.filter(h => h.viewId !== viewId));
    addToast("View deleted", 'error');
  };

  const handleUpdateView = (viewId: string, updatedData: Partial<Omit<View, 'id' | 'projectId'>>) => {
    setViews(prevViews => prevViews.map(v => 
        v.id === viewId ? { ...v, ...updatedData } : v
    ));
    addToast("View updated");
  };

  const handleAddUnit = (unitData: Omit<Unit, 'id' | 'projectId'>) => {
    if (!selectedProjectId) return;
    const newUnit: Unit = {
        ...unitData,
        id: `unit_${new Date().getTime()}`,
        projectId: selectedProjectId,
    };
    setUnits(prev => [...prev, newUnit]);
    addToast("Unit created");
  };
  
  const handleAddUnitsBatch = (unitsData: Omit<Unit, 'id' | 'projectId' | 'files'>[]) => {
    if (!selectedProjectId) return;
    const newUnits: Unit[] = unitsData.map(unitData => ({
        ...unitData,
        files: [],
        id: `unit_${new Date().getTime()}_${Math.random().toString(36).substr(2, 9)}`,
        projectId: selectedProjectId,
    }));
    setUnits(prev => [...prev, ...newUnits]);
    addToast(`${newUnits.length} units imported`);
  };

  const handleAttachFilesToUnits = (files: File[]): number => {
    if (!selectedProjectId) return 0;
    let matchedCount = 0;
    const projectUnits = units.filter(u => u.projectId === selectedProjectId);

    const updatedUnits = projectUnits.map(unit => {
        const matchedFile = files.find(file => {
            const fileNameNormalized = file.name.substring(0, file.name.lastIndexOf('.')).toLowerCase().trim();
            const factSheetNameNormalized = unit.factSheetFileName?.toLowerCase().trim();
            const unitNameNormalized = unit.name.toLowerCase().trim();

            if (factSheetNameNormalized && factSheetNameNormalized === fileNameNormalized) return true;
            if (!factSheetNameNormalized && unitNameNormalized === fileNameNormalized) return true;
            return false;
        });

        if (matchedFile) {
            matchedCount++;
            const newFile: UnitFile = {
                id: `file_${new Date().getTime()}_${Math.random()}`,
                name: matchedFile.name,
                url: URL.createObjectURL(matchedFile),
                type: matchedFile.type.startsWith('image/') ? 'image' : (matchedFile.type === 'application/pdf' ? 'pdf' : 'other'),
            };
            if (!unit.files.some(f => f.name === newFile.name)) {
                return { ...unit, files: [...unit.files, newFile] };
            }
        }
        return unit;
    });

    setUnits(currentUnits => currentUnits.map(u => {
        const updated = updatedUnits.find(upd => upd.id === u.id);
        return updated || u;
    }));

    return matchedCount;
  };

  const handleUpdateUnit = (updatedUnit: Unit) => {
    setUnits(prev => prev.map(u => u.id === updatedUnit.id ? updatedUnit : u));
    addToast("Unit saved");
  };

  const handleDeleteUnit = (unitId: string) => {
    if (window.confirm("Are you sure you want to delete this unit?")) {
        setUnits(prev => prev.filter(u => u.id !== unitId));
        addToast("Unit deleted", 'error');
    }
  };

  const handleSaveHotspots = (viewId: string, updatedHotspots: Hotspot[]) => {
    const otherHotspots = hotspots.filter(h => h.viewId !== viewId);
    setHotspots([...otherHotspots, ...updatedHotspots]);
    addToast("Hotspots saved successfully");
  };

  const renderPage = () => {
    const selectedProject = projects.find(p => p.id === selectedProjectId);
    const selectedView = views.find(v => v.id === selectedViewId);

    switch (page) {
      case 'viewer':
        if (selectedProject && selectedView) {
            return <Viewer
                project={selectedProject}
                currentView={selectedView}
                allProjectViews={views.filter(v => v.projectId === selectedProjectId)}
                allProjectUnits={units.filter(u => u.projectId === selectedProjectId)}
                hotspots={hotspots.filter(h => h.viewId === selectedView.id)}
                onNavigate={(viewId) => setSelectedViewId(viewId)}
                onExit={handleBackToProjects}
            />
        }
        return <div>Error: Missing data for viewer.</div>

      case 'editor':
        if (selectedProject && selectedView) {
            return <Editor 
                project={selectedProject}
                view={selectedView}
                viewHotspots={hotspots.filter(h => h.viewId === selectedView.id)}
                allProjectHotspots={hotspots}
                onSave={handleSaveHotspots}
                onBack={handleBackToProjectDetail}
                allProjectViews={views.filter(v => v.projectId === selectedProjectId)}
                allProjectUnits={units.filter(u => u.projectId === selectedProjectId)}
            />;
        }
        return <div>Error: Missing data for editor.</div>

      case 'projectDetail':
        if (selectedProject) {
            return <ProjectDetail 
                project={selectedProject}
                views={views.filter(v => v.projectId === selectedProjectId)}
                units={units.filter(u => u.projectId === selectedProjectId)}
                onSelectView={handleSelectView}
                onAddView={handleAddView}
                onUpdateView={handleUpdateView}
                onDeleteView={handleDeleteView}
                onAddUnit={handleAddUnit}
                onAddUnitsBatch={handleAddUnitsBatch}
                onAttachFilesToUnits={handleAttachFilesToUnits}
                onUpdateProject={handleUpdateProject}
                onUpdateUnit={handleUpdateUnit}
                onDeleteUnit={handleDeleteUnit}
                onAddMember={handleAddMemberToProject}
                onRemoveMember={handleRemoveMemberFromProject}
                onBack={handleBackToProjects}
            />
        }
        return <div>Project not found.</div>;
      
      case 'settings':
        return <Settings 
            users={users} 
            currentUser={currentUser}
            onUpdateCurrentUser={setCurrentUser}
        />;

      case 'media':
        return <GlobalMediaLibrary projects={projects} onUpdateProject={handleUpdateProject} />;

      case 'projects':
      default:
        return <ProjectsList 
            projects={projects}
            views={views}
            hotspots={hotspots}
            users={users}
            onSelectProject={handleSelectProject}
            onCreateProject={handleCreateProject}
            onUpdateProject={handleUpdateProject}
            onDuplicateProject={handleDuplicateProject}
            onDeleteProject={handleDeleteProject}
        />;
    }
  }

  return (
    <div className="bg-white dark:bg-gray-900 min-h-screen text-gray-900 dark:text-gray-100 flex flex-col md:flex-row transition-colors duration-200">
      <Sidebar 
          activePage={page}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(prev => !prev)}
          onNavigateToProjects={handleBackToProjects}
          onNavigateToSettings={() => {
            setPage('settings');
            if (window.innerWidth < 768) setIsSidebarCollapsed(true);
          }}
          onNavigateToMedia={handleNavigateToMedia}
          isDarkMode={isDarkMode}
          toggleTheme={toggleTheme}
        />
        
        {isSidebarCollapsed && (
            <div className="md:hidden bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between sticky top-0 z-40">
                <button onClick={() => setIsSidebarCollapsed(false)} className="p-2 text-gray-600 dark:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">
                    <MenuIcon className="w-6 h-6" />
                </button>
                <span className="font-bold text-gray-800 dark:text-white uppercase tracking-tighter">HINTA</span>
                <div className="w-8"></div>
            </div>
        )}

      <div className="flex-1 min-w-0 bg-gray-50/50 dark:bg-gray-950 relative">
        {renderPage()}
        
        {!isSidebarCollapsed && (
            <div 
                className="fixed inset-0 bg-black/50 z-40 md:hidden"
                onClick={() => setIsSidebarCollapsed(true)}
            />
        )}
      </div>
    </div>
  );
}

function App() {
    return (
        <ToastProvider>
            <AppContent />
        </ToastProvider>
    );
}

export default App;
