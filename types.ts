export enum HotspotStatus {
  ForSale = 'for-sale',
  Reserved = 'reserved',
  Sold = 'sold',
  Forthcoming = 'forthcoming',
}

export enum UnitStatus {
  ForSale = 'for-sale',
  Reserved = 'reserved',
  Sold = 'sold',
  Forthcoming = 'forthcoming',
}

export enum ProjectStatus {
  Active = 'active',
  Draft = 'draft',
  Archived = 'archived',
}

export type Coordinate = [number, number];

export interface UnitFile {
  id: string;
  name: string;
  url: string;
  type: 'pdf' | 'image' | 'other';
}

export type HotspotType = 'polygon' | 'info' | 'camera';

export interface Hotspot {
  id: string;
  viewId: string;
  label: string;
  type: HotspotType;
  coordinates: Coordinate[];
  linkedViewId?: string;
  linkedUnitId?: string;
  linkedAssetId?: string; // Link to a media asset
  linkedHotspotIds?: string[];
  status: HotspotStatus;
  color: string;
  opacity: number;
}

export interface View {
  id:string;
  projectId: string;
  type: 'overview' | 'facade' | 'floorplan';
  title: string;
  imageURL: string;
  parentId: string | null;
  unitIds: string[];
}

// Project Permission Types (Specific to a single project)
export type ProjectRole = 'owner' | 'editor' | 'viewer';

export interface ProjectMember {
  userId: string;
  name: string;
  email: string;
  role: ProjectRole;
  avatarUrl?: string;
}

export type MediaType = 'image' | 'panorama' | 'floorplan' | 'video' | 'document';

export interface ProjectAsset {
  id: string;
  projectId: string;
  type: MediaType;
  title: string;
  url: string; // Can be blob URL or external URL (Matterport etc)
  thumbnailUrl?: string;
  description?: string;
  uploadedAt: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  client: string; // Display name for client
  organization: string; // Technical Organization Name (e.g. "HSB Stockholm")
  ownerId: string; // The ID of the User who owns this project (Client Side Owner)
  createdAt: string;
  updatedAt: string;
  updatedBy: {
    name: string;
    avatarUrl: string;
  };
  status: ProjectStatus;
  navigationMapImageUrl?: string;
  bostadsväljarenActive?: boolean;
  bostadsväljarenActivatedAt?: string;
  bostadsväljarenExpiresAt?: string;
  members: ProjectMember[]; // List of invited collaborators
  assets: ProjectAsset[]; // Media Gallery Assets
}

export interface Unit {
  id: string;
  projectId: string;
  name: string; // Unit number/identifier
  factSheetFileName?: string; // Optional filename for matching
  status: UnitStatus;
  price: number;
  originalPrice?: number;
  size: number; // Size (sq m)
  ancillaryArea: number;
  lotSize: number;
  rooms: number;
  fee: number;
  floorLevel: number;
  selections: string;
  files: UnitFile[];
}

// Organization / System Level Roles
export enum UserRole {
  SuperAdmin = 'super_admin', // Studio HINTA Staff (God mode)
  OrgOwner = 'org_owner',     // External: The Organization Owner (Billing access)
  OrgAdmin = 'org_admin',     // External: Manager (Can invite users, create projects)
  OrgMember = 'org_member',   // External: Standard user (Can only see assigned projects)
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl: string;
  lastActive: string;
  organization?: string; // Links user to an org
}