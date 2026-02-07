import type { LucideIcon } from 'lucide-react';
import { Image, FileText, Map, Music, Video, File } from 'lucide-react';

// -----------------------------------------------
//  Types
// -----------------------------------------------

export type AssetType = 'image' | 'pdf' | 'map' | 'audio' | 'video' | 'other';

export interface Asset {
  id: string;
  name: string;
  type: AssetType;
  size: string;
  linkedEntities: number;
  addedAt: string;
}

export const ASSET_ICONS: Record<AssetType, LucideIcon> = {
  image: Image,
  pdf: FileText,
  map: Map,
  audio: Music,
  video: Video,
  other: File,
};

export const ASSET_LABELS: Record<AssetType, string> = {
  image: 'Image',
  pdf: 'PDF',
  map: 'Map',
  audio: 'Audio',
  video: 'Video',
  other: 'File',
};

// -----------------------------------------------
//  Mock Data
// -----------------------------------------------

const MOCK_ASSETS: Asset[] = [
  { id: 'asset-1', name: 'Brindlemark City Map', type: 'map', size: '2.4 MB', linkedEntities: 3, addedAt: '2026-01-08T10:00:00Z' },
  { id: 'asset-2', name: 'Theron Portrait', type: 'image', size: '840 KB', linkedEntities: 1, addedAt: '2026-01-06T14:30:00Z' },
  { id: 'asset-3', name: 'Northern Compact Charter', type: 'pdf', size: '1.1 MB', linkedEntities: 2, addedAt: '2025-12-20T09:00:00Z' },
  { id: 'asset-4', name: 'Thornwild Ambient Loop', type: 'audio', size: '6.8 MB', linkedEntities: 1, addedAt: '2026-01-02T18:00:00Z' },
  { id: 'asset-5', name: 'Session 12 Recap Video', type: 'video', size: '142 MB', linkedEntities: 1, addedAt: '2026-01-05T20:00:00Z' },
  { id: 'asset-6', name: 'Grandmother Oak Sketch', type: 'image', size: '1.2 MB', linkedEntities: 2, addedAt: '2026-01-10T11:00:00Z' },
  { id: 'asset-7', name: 'Ley Line Diagram', type: 'image', size: '560 KB', linkedEntities: 1, addedAt: '2025-12-28T15:20:00Z' },
  { id: 'asset-8', name: 'Faction Heraldry Sheet', type: 'pdf', size: '3.2 MB', linkedEntities: 4, addedAt: '2025-12-15T08:00:00Z' },
  { id: 'asset-9', name: 'Seraphine Character Sheet', type: 'pdf', size: '420 KB', linkedEntities: 1, addedAt: '2026-01-12T09:45:00Z' },
  { id: 'asset-10', name: 'Battle of Ashford Diorama', type: 'map', size: '4.7 MB', linkedEntities: 3, addedAt: '2025-11-30T16:00:00Z' },
];

// -----------------------------------------------
//  Helpers
// -----------------------------------------------

export function getAllAssets(): Asset[] {
  return MOCK_ASSETS;
}
