import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Project, View, Hotspot, Unit, ProjectAsset, ProjectMember, UnitFile } from '../types';
import * as dataService from '../lib/supabaseDataService';
import { useToast } from '../components/Toast';

interface DataContextType {
  // State
  projects: Project[];
  views: View[];
  hotspots: Hotspot[];
  units: Unit[];
  isLoading: boolean;
  error: string | null;

  // Project operations
  fetchProjects: () => Promise<void>;
  fetchProject: (id: string) => Promise<Project | null>;
  createProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'assets' | 'members'> & { assets?: ProjectAsset[]; members?: ProjectMember[] }) => Promise<Project>;
  updateProject: (project: Project) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;

  // View operations
  fetchViews: (projectId: string) => Promise<View[]>;
  createView: (view: Omit<View, 'id'>) => Promise<View>;
  updateView: (viewId: string, updates: Partial<Omit<View, 'id' | 'projectId'>>) => Promise<void>;
  deleteView: (viewId: string) => Promise<void>;

  // Hotspot operations
  fetchHotspots: (viewId: string) => Promise<Hotspot[]>;
  fetchHotspotsByProject: (projectId: string) => Promise<Hotspot[]>;
  saveHotspots: (viewId: string, hotspots: Hotspot[]) => Promise<void>;

  // Unit operations
  fetchUnits: (projectId: string) => Promise<Unit[]>;
  createUnit: (unit: Omit<Unit, 'id' | 'files'> & { files?: UnitFile[] }) => Promise<Unit>;
  updateUnit: (unit: Unit) => Promise<void>;
  deleteUnit: (unitId: string) => Promise<void>;

  // Asset operations
  createProjectAsset: (asset: Omit<ProjectAsset, 'id' | 'uploadedAt'>) => Promise<ProjectAsset>;
  deleteProjectAsset: (assetId: string) => Promise<void>;

  // Member operations
  createProjectMember: (member: Omit<ProjectMember, 'userId'> & { projectId: string; userId: string }) => Promise<ProjectMember>;
  deleteProjectMember: (projectId: string, userId: string) => Promise<void>;

  // Unit file operations
  createUnitFile: (file: Omit<UnitFile, 'id'> & { unitId: string }) => Promise<UnitFile>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [views, setViews] = useState<View[]>([]);
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { addToast } = useToast();

  // Fetch all projects
  const fetchProjects = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await dataService.fetchProjects();
      setProjects(data);
    } catch (err: any) {
      setError(err.message);
      addToast('Error loading projects', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  // Fetch single project
  const fetchProject = useCallback(async (id: string): Promise<Project | null> => {
    try {
      const project = await dataService.fetchProject(id);
      if (project) {
        setProjects(prev => {
          const index = prev.findIndex(p => p.id === id);
          if (index >= 0) {
            return [...prev.slice(0, index), project, ...prev.slice(index + 1)];
          }
          return [...prev, project];
        });
      }
      return project;
    } catch (err: any) {
      setError(err.message);
      addToast('Error loading project', 'error');
      return null;
    }
  }, [addToast]);

  // Create project
  const createProject = useCallback(async (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'assets' | 'members'> & { assets?: ProjectAsset[]; members?: ProjectMember[] }): Promise<Project> => {
    try {
      const newProject = await dataService.createProject(project);
      setProjects(prev => [...prev, newProject]);
      addToast('Project created successfully');
      return newProject;
    } catch (err: any) {
      setError(err.message);
      addToast('Error creating project', 'error');
      throw err;
    }
  }, [addToast]);

  // Update project
  const updateProject = useCallback(async (project: Project): Promise<void> => {
    try {
      const updated = await dataService.updateProject(project);
      setProjects(prev => prev.map(p => p.id === project.id ? updated : p));
      addToast('Project updated successfully');
    } catch (err: any) {
      setError(err.message);
      addToast('Error updating project', 'error');
      throw err;
    }
  }, [addToast]);

  // Delete project
  const deleteProject = useCallback(async (id: string): Promise<void> => {
    try {
      await dataService.deleteProject(id);
      setProjects(prev => prev.filter(p => p.id !== id));
      setViews(prev => prev.filter(v => {
        const project = projects.find(p => p.id === id);
        return project ? v.projectId !== id : true;
      }));
      addToast('Project deleted', 'error');
    } catch (err: any) {
      setError(err.message);
      addToast('Error deleting project', 'error');
      throw err;
    }
  }, [addToast, projects]);

  // Fetch views for a project
  const fetchViews = useCallback(async (projectId: string): Promise<View[]> => {
    try {
      const data = await dataService.fetchViews(projectId);
      setViews(prev => {
        const filtered = prev.filter(v => v.projectId !== projectId);
        return [...filtered, ...data];
      });
      return data;
    } catch (err: any) {
      setError(err.message);
      addToast('Error loading views', 'error');
      return [];
    }
  }, [addToast]);

  // Create view
  const createView = useCallback(async (view: Omit<View, 'id'>): Promise<View> => {
    try {
      const newView = await dataService.createView(view);
      setViews(prev => [...prev, newView]);
      addToast('View created successfully');
      return newView;
    } catch (err: any) {
      setError(err.message);
      addToast('Error creating view', 'error');
      throw err;
    }
  }, [addToast]);

  // Update view
  const updateView = useCallback(async (viewId: string, updates: Partial<Omit<View, 'id' | 'projectId'>>): Promise<void> => {
    try {
      const updated = await dataService.updateView(viewId, updates);
      setViews(prev => prev.map(v => v.id === viewId ? updated : v));
      addToast('View updated successfully');
    } catch (err: any) {
      setError(err.message);
      addToast('Error updating view', 'error');
      throw err;
    }
  }, [addToast]);

  // Delete view
  const deleteView = useCallback(async (viewId: string): Promise<void> => {
    try {
      await dataService.deleteView(viewId);
      setViews(prev => prev.filter(v => v.id !== viewId));
      setHotspots(prev => prev.filter(h => h.viewId !== viewId));
      addToast('View deleted', 'error');
    } catch (err: any) {
      setError(err.message);
      addToast('Error deleting view', 'error');
      throw err;
    }
  }, [addToast]);

  // Fetch hotspots for a view
  const fetchHotspots = useCallback(async (viewId: string): Promise<Hotspot[]> => {
    try {
      const data = await dataService.fetchHotspots(viewId);
      setHotspots(prev => {
        const filtered = prev.filter(h => h.viewId !== viewId);
        return [...filtered, ...data];
      });
      return data;
    } catch (err: any) {
      setError(err.message);
      return [];
    }
  }, []);

  // Fetch hotspots for a project
  const fetchHotspotsByProject = useCallback(async (projectId: string): Promise<Hotspot[]> => {
    try {
      const data = await dataService.fetchHotspotsByProject(projectId);
      setHotspots(prev => {
        // Filter out hotspots for views in this project, then add new ones
        const projectViewIds = views.filter(v => v.projectId === projectId).map(v => v.id);
        const filtered = prev.filter(h => !projectViewIds.includes(h.viewId));
        return [...filtered, ...data];
      });
      return data;
    } catch (err: any) {
      setError(err.message);
      return [];
    }
  }, [views]);

  // Save hotspots (replace all for a view)
  const saveHotspots = useCallback(async (viewId: string, hotspotsToSave: Hotspot[]): Promise<void> => {
    try {
      const saved = await dataService.saveHotspots(viewId, hotspotsToSave);
      setHotspots(prev => {
        const filtered = prev.filter(h => h.viewId !== viewId);
        return [...filtered, ...saved];
      });
      addToast('Hotspots saved successfully');
    } catch (err: any) {
      setError(err.message);
      addToast('Error saving hotspots', 'error');
      throw err;
    }
  }, [addToast]);

  // Fetch units for a project
  const fetchUnits = useCallback(async (projectId: string): Promise<Unit[]> => {
    try {
      const data = await dataService.fetchUnits(projectId);
      setUnits(prev => {
        const filtered = prev.filter(u => u.projectId !== projectId);
        return [...filtered, ...data];
      });
      return data;
    } catch (err: any) {
      setError(err.message);
      addToast('Error loading units', 'error');
      return [];
    }
  }, [addToast]);

  // Create unit
  const createUnit = useCallback(async (unit: Omit<Unit, 'id' | 'files'> & { files?: UnitFile[] }): Promise<Unit> => {
    try {
      const newUnit = await dataService.createUnit(unit);
      setUnits(prev => [...prev, newUnit]);
      addToast('Unit created successfully');
      return newUnit;
    } catch (err: any) {
      setError(err.message);
      addToast('Error creating unit', 'error');
      throw err;
    }
  }, [addToast]);

  // Update unit
  const updateUnit = useCallback(async (unit: Unit): Promise<void> => {
    try {
      const updated = await dataService.updateUnit(unit);
      setUnits(prev => prev.map(u => u.id === unit.id ? updated : u));
      addToast('Unit updated successfully');
    } catch (err: any) {
      setError(err.message);
      addToast('Error updating unit', 'error');
      throw err;
    }
  }, [addToast]);

  // Delete unit
  const deleteUnit = useCallback(async (unitId: string): Promise<void> => {
    try {
      await dataService.deleteUnit(unitId);
      setUnits(prev => prev.filter(u => u.id !== unitId));
      addToast('Unit deleted', 'error');
    } catch (err: any) {
      setError(err.message);
      addToast('Error deleting unit', 'error');
      throw err;
    }
  }, [addToast]);

  // Create project asset
  const createProjectAsset = useCallback(async (asset: Omit<ProjectAsset, 'id' | 'uploadedAt'>): Promise<ProjectAsset> => {
    try {
      const newAsset = await dataService.createProjectAsset(asset);
      setProjects(prev => prev.map(p => {
        if (p.id === asset.projectId) {
          return { ...p, assets: [...(p.assets || []), newAsset] };
        }
        return p;
      }));
      addToast('Asset added successfully');
      return newAsset;
    } catch (err: any) {
      setError(err.message);
      addToast('Error adding asset', 'error');
      throw err;
    }
  }, [addToast]);

  // Delete project asset
  const deleteProjectAsset = useCallback(async (assetId: string): Promise<void> => {
    try {
      await dataService.deleteProjectAsset(assetId);
      setProjects(prev => prev.map(p => ({
        ...p,
        assets: (p.assets || []).filter(a => a.id !== assetId),
      })));
      addToast('Asset deleted', 'error');
    } catch (err: any) {
      setError(err.message);
      addToast('Error deleting asset', 'error');
      throw err;
    }
  }, [addToast]);

  // Create project member
  const createProjectMember = useCallback(async (member: Omit<ProjectMember, 'userId'> & { projectId: string; userId: string }): Promise<ProjectMember> => {
    try {
      const newMember = await dataService.createProjectMember(member);
      setProjects(prev => prev.map(p => {
        if (p.id === member.projectId) {
          return { ...p, members: [...(p.members || []), newMember] };
        }
        return p;
      }));
      addToast('Member added successfully');
      return newMember;
    } catch (err: any) {
      setError(err.message);
      addToast('Error adding member', 'error');
      throw err;
    }
  }, [addToast]);

  // Delete project member
  const deleteProjectMember = useCallback(async (projectId: string, userId: string): Promise<void> => {
    try {
      await dataService.deleteProjectMember(projectId, userId);
      setProjects(prev => prev.map(p => {
        if (p.id === projectId) {
          return { ...p, members: (p.members || []).filter(m => m.userId !== userId) };
        }
        return p;
      }));
      addToast('Member removed', 'error');
    } catch (err: any) {
      setError(err.message);
      addToast('Error removing member', 'error');
      throw err;
    }
  }, [addToast]);

  // Create unit file
  const createUnitFile = useCallback(async (file: Omit<UnitFile, 'id'> & { unitId: string }): Promise<UnitFile> => {
    try {
      const newFile = await dataService.createUnitFile(file);
      setUnits(prev => prev.map(u => {
        if (u.id === file.unitId) {
          return { ...u, files: [...(u.files || []), newFile] };
        }
        return u;
      }));
      return newFile;
    } catch (err: any) {
      setError(err.message);
      addToast('Error adding file', 'error');
      throw err;
    }
  }, [addToast]);

  const value: DataContextType = {
    projects,
    views,
    hotspots,
    units,
    isLoading,
    error,
    fetchProjects,
    fetchProject,
    createProject,
    updateProject,
    deleteProject,
    fetchViews,
    createView,
    updateView,
    deleteView,
    fetchHotspots,
    fetchHotspotsByProject,
    saveHotspots,
    fetchUnits,
    createUnit,
    updateUnit,
    deleteUnit,
    createProjectAsset,
    deleteProjectAsset,
    createProjectMember,
    deleteProjectMember,
    createUnitFile,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}

