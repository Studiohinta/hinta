
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Editor } from './components/Editor';
import { ProjectsList } from './components/ProjectsList';
import { ProjectDetail } from './components/ProjectDetail';
import { Sidebar } from './components/Sidebar';
import { Login } from './components/Login';
import { Project, View, Hotspot, Unit, UnitStatus, UnitFile, HotspotStatus, ProjectStatus, ProjectMember, User, UserRole } from './types';
import { Viewer } from './components/Viewer';
import { useToast } from './components/Toast';
import { Settings } from './components/Settings';
import { GlobalMediaLibrary } from './components/GlobalMediaLibrary';
import { useData } from './contexts/DataContext';
import { brandAssets } from './lib/brandAssets';

type Page = 'projects' | 'projectDetail' | 'editor' | 'viewer' | 'settings' | 'media';

// Simple Menu Icon Component
const MenuIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
  </svg>
);

// Authentication helper functions
function isAuthenticated(): boolean {
  try {
    const auth = localStorage.getItem('hinta_auth');
    if (!auth) return false;
    const parsed = JSON.parse(auth);
    // Optional: Add expiration check (e.g., 24 hours)
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    if (Date.now() - parsed.timestamp > maxAge) {
      localStorage.removeItem('hinta_auth');
      return false;
    }
    return parsed.authenticated === true;
  } catch {
    return false;
  }
}

function logout() {
  localStorage.removeItem('hinta_auth');
  window.location.href = '/';
}

// Note: useDemoStorage removed - now using Supabase via DataContext

// Public Viewer Component (no admin UI) - Fetches from Supabase
function PublicViewer({ projectId }: { projectId: string }) {
  const { fetchProject, fetchViews, fetchUnits, fetchHotspotsByProject } = useData();
  const [project, setProject] = useState<Project | null>(null);
  const [views, setViews] = useState<View[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [publicViewId, setPublicViewId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [proj, projectViews, projectUnits, projectHotspots] = await Promise.all([
          fetchProject(projectId),
          fetchViews(projectId),
          fetchUnits(projectId),
          fetchHotspotsByProject(projectId),
        ]);
        
        if (proj) {
          setProject(proj);
          setViews(projectViews);
          setUnits(projectUnits);
          setHotspots(projectHotspots);
          
          // Find starting view
          const startView = projectViews.find(v => v.parentId === null);
          if (startView) {
            setPublicViewId(startView.id);
          }
        }
      } catch (error) {
        console.error('Error loading project data:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]); // Only depend on projectId - functions from DataContext are stable

  if (isLoading) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading project...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-100">
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold">Project Not Found</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">The requested project could not be found or does not have a valid starting view.</p>
        </div>
      </div>
    );
  }

  const projectViews = views.filter(v => v.projectId === projectId);
  const projectUnits = units.filter(u => u.projectId === projectId);
  const currentView = projectViews.find(v => v.id === publicViewId);
  const projectHotspots = hotspots.filter(h => projectViews.map(v => v.id).includes(h.viewId));

  if (!currentView) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-100">
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold">No Starting View</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">This project does not have a valid starting view.</p>
        </div>
      </div>
    );
  }

  return (
    <Viewer
      project={project}
      currentView={currentView}
      allProjectViews={projectViews}
      allProjectUnits={projectUnits}
      hotspots={projectHotspots}
      onNavigate={(viewId) => setPublicViewId(viewId)}
    />
  );
}

// Admin Dashboard Component
function AdminDashboard() {
  let dataContext;
  try {
    dataContext = useData();
  } catch (error: any) {
    console.error('Error getting data context:', error);
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">Error Loading Data</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error?.message || 'Unknown error'}</p>
          <p className="text-sm text-gray-500 dark:text-gray-500">Check browser console (F12) for details</p>
        </div>
      </div>
    );
  }

  const {
    projects,
    views,
    hotspots,
    units,
    fetchProjects,
    fetchViews,
    fetchUnits,
    fetchHotspots,
    fetchHotspotsByProject,
    createProject,
    updateProject,
    deleteProject,
    createView,
    updateView,
    deleteView,
    saveHotspots,
    createUnit,
    updateUnit,
    deleteUnit,
    createProjectAsset,
    deleteProjectAsset,
    createProjectMember,
    deleteProjectMember,
    createUnitFile,
  } = dataContext;
  
  let toastContext;
  try {
    toastContext = useToast();
  } catch (error: any) {
    console.error('Error getting toast context:', error);
    // Fallback toast function
    toastContext = { addToast: (msg: string) => console.log('[Toast]:', msg) };
  }
  
  const { addToast } = toastContext;
  
  // Keep users in localStorage for now (not migrated to Supabase yet)
  const [users, setUsers] = useState<User[]>(() => {
    try {
      const stored = localStorage.getItem('hinta_users');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [currentUser, setCurrentUser] = useState<User>(() => {
    try {
      const stored = localStorage.getItem('hinta_current_user');
      return stored ? JSON.parse(stored) : (users[0] || { id: 'user_1', name: 'Admin', email: 'admin@hinta.co', role: UserRole.SuperAdmin, avatarUrl: '', lastActive: new Date().toISOString() });
    } catch {
      return users[0] || { id: 'user_1', name: 'Admin', email: 'admin@hinta.co', role: UserRole.SuperAdmin, avatarUrl: '', lastActive: new Date().toISOString() };
    }
  });

  // Load projects on mount
  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

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

  // Track current path for routing
  const [currentPath, setCurrentPath] = useState(() => window.location.pathname);

  // Listen for browser back/forward navigation
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Admin routing based on current path
  const path = currentPath;
  const adminMatch = path.match(/^\/admin(?:\/(.*))?$/);
  const adminSubPath = adminMatch ? adminMatch[1] : null;

  // Parse admin route
  let page: Page = 'projects';
  let selectedProjectId: string | null = null;
  let selectedViewId: string | null = null;

  if (adminSubPath) {
    const parts = adminSubPath.split('/');
    if (parts[0] === 'projects' && parts[1]) {
      selectedProjectId = parts[1];
      if (parts[2] === 'views' && parts[3]) {
        selectedViewId = parts[3];
        page = 'editor';
      } else {
        page = 'projectDetail';
      }
    } else if (parts[0] === 'settings') {
      page = 'settings';
    } else if (parts[0] === 'media') {
      page = 'media';
    }
  }

  const handleSelectProject = useCallback((projectId: string) => {
    const newPath = `/admin/projects/${projectId}`;
    window.history.pushState({}, '', newPath);
    setCurrentPath(newPath);
  }, []);

  const handleSelectView = useCallback((viewId: string) => {
    if (selectedProjectId) {
      const newPath = `/admin/projects/${selectedProjectId}/views/${viewId}`;
      window.history.pushState({}, '', newPath);
      setCurrentPath(newPath);
    }
  }, [selectedProjectId]);

  const handleBackToProjects = useCallback(() => {
    const newPath = '/admin';
    window.history.pushState({}, '', newPath);
    setCurrentPath(newPath);
  }, []);

  const handleNavigateToMedia = () => {
    const newPath = '/admin/media';
    window.history.pushState({}, '', newPath);
    setCurrentPath(newPath);
  };

  const handleBackToProjectDetail = useCallback(() => {
    if (selectedProjectId) {
      const newPath = `/admin/projects/${selectedProjectId}`;
      window.history.pushState({}, '', newPath);
      setCurrentPath(newPath);
    }
  }, [selectedProjectId]);

  const handleCreateProject = async (projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'updatedBy' | 'organization' | 'ownerId' | 'members'> & { ownerName?: string; ownerEmail?: string; assignedUserIds?: string[] }) => {
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

      const projectToCreate: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'assets' | 'members'> & { assets?: ProjectAsset[]; members?: ProjectMember[] } = {
          name: projectData.name,
          description: projectData.description,
          client: projectData.client,
          status: projectData.status,
          bostadsväljarenActive: projectData.bostadsväljarenActive,
          assets: projectData.assets,
          organization: projectData.client || 'Default Org',
          ownerId: projectData.ownerName ? newOwnerId : 'user_1',
          members: members,
          updatedBy: { name: currentUser.name, avatarUrl: currentUser.avatarUrl },
      };
      
      if (projectToCreate.bostadsväljarenActive) {
          const activateDate = new Date();
          const oneYearFromNow = new Date(activateDate.setFullYear(activateDate.getFullYear() + 1));
          projectToCreate.bostadsväljarenActivatedAt = new Date().toISOString().split('T')[0];
          projectToCreate.bostadsväljarenExpiresAt = oneYearFromNow.toISOString().split('T')[0];
      }
      
      await createProject(projectToCreate);
  };

  const handleUpdateProject = async (updatedProject: Project) => {
    const originalProject = projects.find(p => p.id === updatedProject.id);
    if (!originalProject) return;

    updatedProject.updatedBy = { name: currentUser.name, avatarUrl: currentUser.avatarUrl };

    if (updatedProject.bostadsväljarenActive && !originalProject.bostadsväljarenActive) {
      const now = new Date();
      const oneYearFromNow = new Date(new Date().setFullYear(now.getFullYear() + 1));
      updatedProject.bostadsväljarenActivatedAt = now.toISOString().split('T')[0];
      updatedProject.bostadsväljarenExpiresAt = oneYearFromNow.toISOString().split('T')[0];
    }
    
    await updateProject(updatedProject);
  };

  const handleAddMemberToProject = async (projectId: string, member: ProjectMember) => {
      await createProjectMember({ ...member, projectId, userId: member.userId });
  };

  const handleRemoveMemberFromProject = async (projectId: string, userId: string) => {
      await deleteProjectMember(projectId, userId);
  };

  const handleDuplicateProject = async (projectId: string) => {
    const projectToDuplicate = projects.find(p => p.id === projectId);
    if (!projectToDuplicate) return;

    // Create new project
    const newProject = await createProject({
      name: `${projectToDuplicate.name} (Copy)`,
      description: projectToDuplicate.description,
      client: projectToDuplicate.client,
      organization: projectToDuplicate.organization,
      ownerId: projectToDuplicate.ownerId,
      status: ProjectStatus.Draft,
      bostadsväljarenActive: false,
      updatedBy: { name: currentUser.name, avatarUrl: currentUser.avatarUrl },
      assets: projectToDuplicate.assets ? projectToDuplicate.assets.map(a => ({...a, projectId: ''})) : [],
      members: [],
    });

    // Duplicate views
    const viewsToDuplicate = views.filter(v => v.projectId === projectId);
    const viewIdMap = new Map<string, string>();

    for (const view of viewsToDuplicate) {
      const newView = await createView({
        ...view,
        projectId: newProject.id,
        parentId: view.parentId && viewIdMap.has(view.parentId) ? viewIdMap.get(view.parentId)! : null,
      });
      viewIdMap.set(view.id, newView.id);
    }

    // Duplicate units
    const unitsToDuplicate = units.filter(u => u.projectId === projectId);
    for (const unit of unitsToDuplicate) {
      await createUnit({
        ...unit,
        projectId: newProject.id,
      });
    }

    // Duplicate hotspots
    const hotspotsToDuplicate = hotspots.filter(h => {
      const view = viewsToDuplicate.find(v => v.id === h.viewId);
      return view !== undefined;
    });
    
    for (const hotspot of hotspotsToDuplicate) {
      const newViewId = viewIdMap.get(hotspot.viewId);
      if (newViewId) {
        await saveHotspots(newViewId, [{
          ...hotspot,
          viewId: newViewId,
          linkedViewId: hotspot.linkedViewId && viewIdMap.has(hotspot.linkedViewId) ? viewIdMap.get(hotspot.linkedViewId)! : undefined,
        }]);
      }
    }

    await fetchProjects();
    addToast("Project duplicated");
  };

  const handleDeleteProject = async (projectId: string) => {
      await deleteProject(projectId);
  };

  const handleAddView = async (viewData: Omit<View, 'id' | 'projectId' | 'parentId' | 'unitIds'>, parentId: string | null) => {
    if (!selectedProjectId) return;
    const newView: Omit<View, 'id'> = {
        ...viewData,
        projectId: selectedProjectId,
        parentId,
        unitIds: [],
    };
    await createView(newView);
    await fetchViews(selectedProjectId);
  };

  const handleDeleteView = async (viewId: string) => {
    const viewToDelete = views.find(v => v.id === viewId);
    if (!viewToDelete) return;

    // Update child views to point to the deleted view's parent
    const childViews = views.filter(v => v.parentId === viewId);
    for (const childView of childViews) {
      await updateView(childView.id, { parentId: viewToDelete.parentId });
    }
    
    await deleteView(viewId);
    if (selectedProjectId) {
      await fetchViews(selectedProjectId);
    }
  };

  const handleUpdateView = async (viewId: string, updatedData: Partial<Omit<View, 'id' | 'projectId'>>) => {
    await updateView(viewId, updatedData);
    if (selectedProjectId) {
      await fetchViews(selectedProjectId);
    }
  };

  const handleAddUnit = async (unitData: Omit<Unit, 'id' | 'projectId'>) => {
    if (!selectedProjectId) return;
    const newUnit: Omit<Unit, 'id' | 'files'> = {
        ...unitData,
        projectId: selectedProjectId,
    };
    await createUnit(newUnit);
    await fetchUnits(selectedProjectId);
  };
  
  const handleAddUnitsBatch = async (unitsData: Omit<Unit, 'id' | 'projectId' | 'files'>[]) => {
    if (!selectedProjectId) return;
    for (const unitData of unitsData) {
      await createUnit({ ...unitData, projectId: selectedProjectId });
    }
    await fetchUnits(selectedProjectId);
    addToast(`${unitsData.length} units imported`);
  };

  const handleAttachFilesToUnits = async (files: File[]): Promise<number> => {
    if (!selectedProjectId) return 0;
    let matchedCount = 0;
    const projectUnits = units.filter(u => u.projectId === selectedProjectId);

    // Note: For file uploads, you'll need to upload to Supabase Storage first
    // For now, we'll use blob URLs (temporary solution)
    // In production, upload files to Supabase Storage and use those URLs
    
    for (const unit of projectUnits) {
      const matchedFile = files.find(file => {
        const fileNameNormalized = file.name.substring(0, file.name.lastIndexOf('.')).toLowerCase().trim();
        const factSheetNameNormalized = unit.factSheetFileName?.toLowerCase().trim();
        const unitNameNormalized = unit.name.toLowerCase().trim();

        if (factSheetNameNormalized && factSheetNameNormalized === fileNameNormalized) return true;
        if (!factSheetNameNormalized && unitNameNormalized === fileNameNormalized) return true;
        return false;
      });

      if (matchedFile && !unit.files.some(f => f.name === matchedFile.name)) {
        matchedCount++;
        // Create blob URL (temporary - should upload to Supabase Storage)
        const blobUrl = URL.createObjectURL(matchedFile);
        const fileType = matchedFile.type.startsWith('image/') ? 'image' : (matchedFile.type === 'application/pdf' ? 'pdf' : 'other');
        
        // TODO: Upload file to Supabase Storage and use that URL instead
        // For now, using blob URL (will be lost on page refresh)
        await createUnitFile({
          name: matchedFile.name,
          url: blobUrl,
          type: fileType,
          unitId: unit.id,
        });
      }
    }

    await fetchUnits(selectedProjectId);
    return matchedCount;
  };

  const handleUpdateUnit = async (updatedUnit: Unit) => {
    await updateUnit(updatedUnit);
    if (selectedProjectId) {
      await fetchUnits(selectedProjectId);
    }
  };

  const handleDeleteUnit = async (unitId: string) => {
    if (window.confirm("Are you sure you want to delete this unit?")) {
        await deleteUnit(unitId);
        if (selectedProjectId) {
          await fetchUnits(selectedProjectId);
        }
    }
  };

  const handleSaveHotspots = async (viewId: string, updatedHotspots: Hotspot[]) => {
    await saveHotspots(viewId, updatedHotspots);
    if (selectedProjectId) {
      await fetchHotspots(viewId);
    }
  };

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);

  // Note: URL changes are handled by currentPath state and window.location.pathname

  // Memoize filtered views and units for the selected project
  const projectViews = useMemo(() => {
    if (!selectedProjectId) return [];
    return views.filter(v => v.projectId === selectedProjectId);
  }, [views, selectedProjectId]);

  const projectUnits = useMemo(() => {
    if (!selectedProjectId) return [];
    return units.filter(u => u.projectId === selectedProjectId);
  }, [units, selectedProjectId]);

  const projectHotspots = useMemo(() => {
    if (!selectedProjectId) return [];
    const projectViewIds = projectViews.map(v => v.id);
    return hotspots.filter(h => projectViewIds.includes(h.viewId));
  }, [hotspots, projectViews, selectedProjectId]);

  // Load data when project is selected
  useEffect(() => {
    if (selectedProjectId) {
      fetchViews(selectedProjectId);
      fetchUnits(selectedProjectId);
      fetchHotspotsByProject(selectedProjectId);
    }
  }, [selectedProjectId, fetchViews, fetchUnits, fetchHotspotsByProject]);

  // Load hotspots when view is selected
  useEffect(() => {
    if (selectedViewId) {
      fetchHotspots(selectedViewId);
    }
  }, [selectedViewId, fetchHotspots]);

  const renderPage = () => {
    const selectedProject = projects.find(p => p.id === selectedProjectId);
    const selectedView = views.find(v => v.id === selectedViewId);
    const viewHotspots = hotspots.filter(h => h.viewId === selectedViewId);

    switch (page) {
      case 'editor':
        if (selectedProject && selectedView && selectedViewId) {
            return <Editor 
                project={selectedProject}
                view={selectedView}
                viewId={selectedViewId}
                viewHotspots={viewHotspots}
                allProjectHotspots={projectHotspots}
                onSave={handleSaveHotspots}
                onBack={handleBackToProjectDetail}
                allProjectViews={projectViews}
                allProjectUnits={projectUnits}
            />;
        }
        return <div>Error: Missing data for editor.</div>

      case 'projectDetail':
        if (selectedProject) {
            return <ProjectDetail 
                project={selectedProject}
                views={projectViews}
                units={projectUnits}
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
            const newPath = '/admin/settings';
            window.history.pushState({}, '', newPath);
            setCurrentPath(newPath);
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
                <img src={brandAssets.logo.black} alt="HINTA" className="h-6 dark:hidden" />
                <img src={brandAssets.logo.white} alt="HINTA" className="h-6 hidden dark:block" />
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

function AppContent() {
  const [authenticated, setAuthenticated] = useState(isAuthenticated);

  // Check authentication on mount and route changes
  useEffect(() => {
    const checkAuth = () => {
      const path = window.location.pathname;
      const isAuth = isAuthenticated();
      setAuthenticated(isAuth);

      // If trying to access /admin without auth, redirect to /
      if (path.startsWith('/admin') && !isAuth) {
        window.location.href = '/';
        return;
      }

      // If authenticated and on root, redirect to /admin
      if (path === '/' && isAuth) {
        window.location.href = '/admin';
        return;
      }
    };

    checkAuth();
    window.addEventListener('popstate', checkAuth);
    return () => window.removeEventListener('popstate', checkAuth);
  }, []);

  // Handle login
  const handleLogin = () => {
    setAuthenticated(true);
    window.location.href = '/admin';
  };

  // Routing logic
  const path = window.location.pathname;
  
  // Public viewer route - NO admin UI
  const viewMatch = path.match(/^\/view\/([^/]+)/);
  if (viewMatch) {
    const projectId = viewMatch[1];
    return <PublicViewer projectId={projectId} />;
  }

  // Admin route - requires authentication
  if (path.startsWith('/admin')) {
    if (!authenticated) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-400">Redirecting to login...</p>
          </div>
        </div>
      ); // Will redirect in useEffect
    }
    try {
      return <AdminDashboard />;
    } catch (error: any) {
      console.error('Error rendering AdminDashboard:', error);
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
          <div className="text-center p-8">
            <h1 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">Error Loading Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{error?.message || 'Unknown error'}</p>
            <p className="text-sm text-gray-500 dark:text-gray-500">Check browser console (F12) for details</p>
          </div>
        </div>
      );
    }
  }

  // Root route - show login
  if (path === '/') {
    if (authenticated) {
      return null; // Will redirect in useEffect
    }
    return <Login onLogin={handleLogin} />;
  }

  // 404 for unknown routes
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">404 - Page Not Found</h1>
        <a href="/" className="mt-4 inline-block text-brand-primary dark:text-brand-accent">Go to Homepage</a>
      </div>
    </div>
  );
}

function App() {
    return <AppContent />;
}

export default App;
