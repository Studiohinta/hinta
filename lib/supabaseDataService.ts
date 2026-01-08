import { supabase } from './supabaseClient';
import { Project, View, Hotspot, Unit, ProjectAsset, ProjectMember, UnitFile } from '../types';

// ==================== PROJECTS ====================

export async function fetchProjects(): Promise<Project[]> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching projects:', error);
    throw error;
  }

  // Fetch related data
  const projectsWithRelations = await Promise.all(
    (data || []).map(async (project) => {
      const [assets, members] = await Promise.all([
        fetchProjectAssets(project.id),
        fetchProjectMembers(project.id),
      ]);

      return {
        id: project.id,
        name: project.name,
        description: project.description,
        client: project.client,
        organization: project.organization,
        ownerId: project.owner_id,
        createdAt: project.created_at,
        updatedAt: project.updated_at,
        updatedBy: {
          name: project.updated_by_name,
          avatarUrl: project.updated_by_avatar_url,
        },
        status: project.status as any,
        navigationMapImageUrl: project.navigation_map_image_url || undefined,
        bostadsväljarenActive: project.bostadsvaljaren_active,
        bostadsväljarenActivatedAt: project.bostadsvaljaren_activated_at || undefined,
        bostadsväljarenExpiresAt: project.bostadsvaljaren_expires_at || undefined,
        assets,
        members,
      } as Project;
    })
  );

  return projectsWithRelations;
}

export async function fetchProject(projectId: string): Promise<Project | null> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single();

  if (error) {
    console.error('Error fetching project:', error);
    return null;
  }

  if (!data) return null;

  const [assets, members] = await Promise.all([
    fetchProjectAssets(projectId),
    fetchProjectMembers(projectId),
  ]);

  return {
    id: data.id,
    name: data.name,
    description: data.description,
    client: data.client,
    organization: data.organization,
    ownerId: data.owner_id,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    updatedBy: {
      name: data.updated_by_name,
      avatarUrl: data.updated_by_avatar_url,
    },
    status: data.status as any,
    navigationMapImageUrl: data.navigation_map_image_url || undefined,
    bostadsväljarenActive: data.bostadsvaljaren_active,
    bostadsväljarenActivatedAt: data.bostadsvaljaren_activated_at || undefined,
    bostadsväljarenExpiresAt: data.bostadsvaljaren_expires_at || undefined,
    assets,
    members,
  } as Project;
}

export async function createProject(project: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'assets' | 'members'> & { assets?: ProjectAsset[]; members?: ProjectMember[] }): Promise<Project> {
  const { data, error } = await supabase
    .from('projects')
    .insert({
      name: project.name,
      description: project.description,
      client: project.client,
      organization: project.organization,
      owner_id: project.ownerId,
      updated_by_name: project.updatedBy.name,
      updated_by_avatar_url: project.updatedBy.avatarUrl,
      status: project.status,
      navigation_map_image_url: project.navigationMapImageUrl || null,
      bostadsvaljaren_active: project.bostadsväljarenActive || false,
      bostadsvaljaren_activated_at: project.bostadsväljarenActivatedAt || null,
      bostadsvaljaren_expires_at: project.bostadsväljarenExpiresAt || null,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating project:', error);
    throw error;
  }

  // Create assets and members if provided
  if (project.assets && project.assets.length > 0) {
    await Promise.all(project.assets.map(asset => createProjectAsset({ ...asset, projectId: data.id })));
  }

  if (project.members && project.members.length > 0) {
    await Promise.all(project.members.map(member => createProjectMember({ ...member, projectId: data.id })));
  }

  return await fetchProject(data.id) as Project;
}

export async function updateProject(project: Project): Promise<Project> {
  const { error } = await supabase
    .from('projects')
    .update({
      name: project.name,
      description: project.description,
      client: project.client,
      organization: project.organization,
      owner_id: project.ownerId,
      updated_by_name: project.updatedBy.name,
      updated_by_avatar_url: project.updatedBy.avatarUrl,
      status: project.status,
      navigation_map_image_url: project.navigationMapImageUrl || null,
      bostadsvaljaren_active: project.bostadsväljarenActive || false,
      bostadsvaljaren_activated_at: project.bostadsväljarenActivatedAt || null,
      bostadsvaljaren_expires_at: project.bostadsväljarenExpiresAt || null,
    })
    .eq('id', project.id);

  if (error) {
    console.error('Error updating project:', error);
    throw error;
  }

  return await fetchProject(project.id) as Project;
}

export async function deleteProject(projectId: string): Promise<void> {
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId);

  if (error) {
    console.error('Error deleting project:', error);
    throw error;
  }
}

// ==================== VIEWS ====================

export async function fetchViews(projectId: string): Promise<View[]> {
  const { data, error } = await supabase
    .from('views')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching views:', error);
    throw error;
  }

  return (data || []).map(v => ({
    id: v.id,
    projectId: v.project_id,
    type: v.type as any,
    title: v.title,
    imageURL: v.image_url,
    parentId: v.parent_id,
    unitIds: v.unit_ids || [],
  } as View));
}

export async function createView(view: Omit<View, 'id'>): Promise<View> {
  const { data, error } = await supabase
    .from('views')
    .insert({
      project_id: view.projectId,
      type: view.type,
      title: view.title,
      image_url: view.imageURL,
      parent_id: view.parentId,
      unit_ids: view.unitIds,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating view:', error);
    throw error;
  }

  return {
    id: data.id,
    projectId: data.project_id,
    type: data.type as any,
    title: data.title,
    imageURL: data.image_url,
    parentId: data.parent_id,
    unitIds: data.unit_ids || [],
  } as View;
}

export async function updateView(viewId: string, updates: Partial<Omit<View, 'id' | 'projectId'>>): Promise<View> {
  const updateData: any = {};
  if (updates.type !== undefined) updateData.type = updates.type;
  if (updates.title !== undefined) updateData.title = updates.title;
  if (updates.imageURL !== undefined) updateData.image_url = updates.imageURL;
  if (updates.parentId !== undefined) updateData.parent_id = updates.parentId;
  if (updates.unitIds !== undefined) updateData.unit_ids = updates.unitIds;

  const { data, error } = await supabase
    .from('views')
    .update(updateData)
    .eq('id', viewId)
    .select()
    .single();

  if (error) {
    console.error('Error updating view:', error);
    throw error;
  }

  return {
    id: data.id,
    projectId: data.project_id,
    type: data.type as any,
    title: data.title,
    imageURL: data.image_url,
    parentId: data.parent_id,
    unitIds: data.unit_ids || [],
  } as View;
}

export async function deleteView(viewId: string): Promise<void> {
  const { error } = await supabase
    .from('views')
    .delete()
    .eq('id', viewId);

  if (error) {
    console.error('Error deleting view:', error);
    throw error;
  }
}

// ==================== HOTSPOTS ====================

export async function fetchHotspots(viewId: string): Promise<Hotspot[]> {
  const { data, error } = await supabase
    .from('hotspots')
    .select('*')
    .eq('view_id', viewId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching hotspots:', error);
    throw error;
  }

  return (data || []).map(h => ({
    id: h.id,
    viewId: h.view_id,
    label: h.label,
    type: h.type as any,
    coordinates: h.coordinates as any,
    linkedViewId: h.linked_view_id || undefined,
    linkedUnitId: h.linked_unit_id || undefined,
    linkedAssetId: h.linked_asset_id || undefined,
    linkedHotspotIds: h.linked_hotspot_ids || undefined,
    status: h.status as any,
    color: h.color,
    opacity: h.opacity,
  } as Hotspot));
}

export async function fetchHotspotsByProject(projectId: string): Promise<Hotspot[]> {
  // First get all views for the project
  const views = await fetchViews(projectId);
  const viewIds = views.map(v => v.id);

  if (viewIds.length === 0) return [];

  const { data, error } = await supabase
    .from('hotspots')
    .select('*')
    .in('view_id', viewIds)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching hotspots:', error);
    throw error;
  }

  return (data || []).map(h => ({
    id: h.id,
    viewId: h.view_id,
    label: h.label,
    type: h.type as any,
    coordinates: h.coordinates as any,
    linkedViewId: h.linked_view_id || undefined,
    linkedUnitId: h.linked_unit_id || undefined,
    linkedAssetId: h.linked_asset_id || undefined,
    linkedHotspotIds: h.linked_hotspot_ids || undefined,
    status: h.status as any,
    color: h.color,
    opacity: h.opacity,
  } as Hotspot));
}

export async function saveHotspots(viewId: string, hotspots: Hotspot[]): Promise<Hotspot[]> {
  // Delete existing hotspots for this view
  await supabase
    .from('hotspots')
    .delete()
    .eq('view_id', viewId);

  // Insert new hotspots
  if (hotspots.length === 0) return [];

  const { data, error } = await supabase
    .from('hotspots')
    .insert(
      hotspots.map(h => ({
        id: h.id,
        view_id: viewId,
        label: h.label,
        type: h.type,
        coordinates: h.coordinates,
        linked_view_id: h.linkedViewId || null,
        linked_unit_id: h.linkedUnitId || null,
        linked_asset_id: h.linkedAssetId || null,
        linked_hotspot_ids: h.linkedHotspotIds || null,
        status: h.status,
        color: h.color,
        opacity: h.opacity,
      }))
    )
    .select();

  if (error) {
    console.error('Error saving hotspots:', error);
    throw error;
  }

  return (data || []).map(h => ({
    id: h.id,
    viewId: h.view_id,
    label: h.label,
    type: h.type as any,
    coordinates: h.coordinates as any,
    linkedViewId: h.linked_view_id || undefined,
    linkedUnitId: h.linked_unit_id || undefined,
    linkedAssetId: h.linked_asset_id || undefined,
    linkedHotspotIds: h.linked_hotspot_ids || undefined,
    status: h.status as any,
    color: h.color,
    opacity: h.opacity,
  } as Hotspot));
}

// ==================== UNITS ====================

export async function fetchUnits(projectId: string): Promise<Unit[]> {
  const { data, error } = await supabase
    .from('units')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching units:', error);
    throw error;
  }

  // Fetch files for each unit
  const unitsWithFiles = await Promise.all(
    (data || []).map(async (unit) => {
      const files = await fetchUnitFiles(unit.id);
      return {
        id: unit.id,
        projectId: unit.project_id,
        name: unit.name,
        factSheetFileName: unit.fact_sheet_file_name || undefined,
        status: unit.status as any,
        price: unit.price,
        originalPrice: unit.original_price || undefined,
        size: unit.size,
        ancillaryArea: unit.ancillary_area,
        lotSize: unit.lot_size,
        rooms: unit.rooms,
        fee: unit.fee,
        floorLevel: unit.floor_level,
        selections: unit.selections,
        files,
      } as Unit;
    })
  );

  return unitsWithFiles;
}

export async function createUnit(unit: Omit<Unit, 'id' | 'files'> & { files?: UnitFile[] }): Promise<Unit> {
  const { data, error } = await supabase
    .from('units')
    .insert({
      project_id: unit.projectId,
      name: unit.name,
      fact_sheet_file_name: unit.factSheetFileName || null,
      status: unit.status,
      price: unit.price,
      original_price: unit.originalPrice || null,
      size: unit.size,
      ancillary_area: unit.ancillary_area,
      lot_size: unit.lot_size,
      rooms: unit.rooms,
      fee: unit.fee,
      floor_level: unit.floor_level,
      selections: unit.selections,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating unit:', error);
    throw error;
  }

  // Create files if provided
  if (unit.files && unit.files.length > 0) {
    await Promise.all(unit.files.map(file => createUnitFile({ ...file, unitId: data.id })));
  }

  const files = await fetchUnitFiles(data.id);

  return {
    id: data.id,
    projectId: data.project_id,
    name: data.name,
    factSheetFileName: data.fact_sheet_file_name || undefined,
    status: data.status as any,
    price: data.price,
    originalPrice: data.original_price || undefined,
    size: data.size,
    ancillaryArea: data.ancillary_area,
    lotSize: data.lot_size,
    rooms: data.rooms,
    fee: data.fee,
    floorLevel: data.floor_level,
    selections: data.selections,
    files,
  } as Unit;
}

export async function updateUnit(unit: Unit): Promise<Unit> {
  const { error } = await supabase
    .from('units')
    .update({
      name: unit.name,
      fact_sheet_file_name: unit.factSheetFileName || null,
      status: unit.status,
      price: unit.price,
      original_price: unit.originalPrice || null,
      size: unit.size,
      ancillary_area: unit.ancillary_area,
      lot_size: unit.lot_size,
      rooms: unit.rooms,
      fee: unit.fee,
      floor_level: unit.floor_level,
      selections: unit.selections,
    })
    .eq('id', unit.id);

  if (error) {
    console.error('Error updating unit:', error);
    throw error;
  }

  const files = await fetchUnitFiles(unit.id);

  return {
    ...unit,
    files,
  };
}

export async function deleteUnit(unitId: string): Promise<void> {
  const { error } = await supabase
    .from('units')
    .delete()
    .eq('id', unitId);

  if (error) {
    console.error('Error deleting unit:', error);
    throw error;
  }
}

// ==================== PROJECT ASSETS ====================

export async function fetchProjectAssets(projectId: string): Promise<ProjectAsset[]> {
  const { data, error } = await supabase
    .from('project_assets')
    .select('*')
    .eq('project_id', projectId)
    .order('uploaded_at', { ascending: false });

  if (error) {
    console.error('Error fetching project assets:', error);
    throw error;
  }

  return (data || []).map(a => ({
    id: a.id,
    projectId: a.project_id,
    type: a.type as any,
    title: a.title,
    url: a.url,
    thumbnailUrl: a.thumbnail_url || undefined,
    description: a.description || undefined,
    uploadedAt: a.uploaded_at,
  } as ProjectAsset));
}

export async function createProjectAsset(asset: Omit<ProjectAsset, 'id' | 'uploadedAt'>): Promise<ProjectAsset> {
  const { data, error } = await supabase
    .from('project_assets')
    .insert({
      project_id: asset.projectId,
      type: asset.type,
      title: asset.title,
      url: asset.url,
      thumbnail_url: asset.thumbnailUrl || null,
      description: asset.description || null,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating project asset:', error);
    throw error;
  }

  return {
    id: data.id,
    projectId: data.project_id,
    type: data.type as any,
    title: data.title,
    url: data.url,
    thumbnailUrl: data.thumbnail_url || undefined,
    description: data.description || undefined,
    uploadedAt: data.uploaded_at,
  } as ProjectAsset;
}

export async function deleteProjectAsset(assetId: string): Promise<void> {
  const { error } = await supabase
    .from('project_assets')
    .delete()
    .eq('id', assetId);

  if (error) {
    console.error('Error deleting project asset:', error);
    throw error;
  }
}

// ==================== PROJECT MEMBERS ====================

export async function fetchProjectMembers(projectId: string): Promise<ProjectMember[]> {
  const { data, error } = await supabase
    .from('project_members')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching project members:', error);
    throw error;
  }

  return (data || []).map(m => ({
    userId: m.user_id,
    name: m.name,
    email: m.email,
    role: m.role as any,
    avatarUrl: m.avatar_url || undefined,
  } as ProjectMember));
}

export async function createProjectMember(member: Omit<ProjectMember, 'userId'> & { projectId: string; userId: string }): Promise<ProjectMember> {
  const { data, error } = await supabase
    .from('project_members')
    .insert({
      project_id: member.projectId,
      user_id: member.userId,
      name: member.name,
      email: member.email,
      role: member.role,
      avatar_url: member.avatarUrl || null,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating project member:', error);
    throw error;
  }

  return {
    userId: data.user_id,
    name: data.name,
    email: data.email,
    role: data.role as any,
    avatarUrl: data.avatar_url || undefined,
  } as ProjectMember;
}

export async function deleteProjectMember(projectId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('project_members')
    .delete()
    .eq('project_id', projectId)
    .eq('user_id', userId);

  if (error) {
    console.error('Error deleting project member:', error);
    throw error;
  }
}

// ==================== UNIT FILES ====================

export async function fetchUnitFiles(unitId: string): Promise<UnitFile[]> {
  const { data, error } = await supabase
    .from('unit_files')
    .select('*')
    .eq('unit_id', unitId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching unit files:', error);
    throw error;
  }

  return (data || []).map(f => ({
    id: f.id,
    name: f.name,
    url: f.url,
    type: f.type as any,
  } as UnitFile));
}

export async function createUnitFile(file: Omit<UnitFile, 'id'> & { unitId: string }): Promise<UnitFile> {
  const { data, error } = await supabase
    .from('unit_files')
    .insert({
      unit_id: file.unitId,
      name: file.name,
      url: file.url,
      type: file.type,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating unit file:', error);
    throw error;
  }

  return {
    id: data.id,
    name: data.name,
    url: data.url,
    type: data.type as any,
  } as UnitFile;
}

