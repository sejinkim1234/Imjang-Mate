export type ItemType = 'star-text' | 'text-only';
export type ItemCategory = '단지 외부 (입지)' | '단지 내부 (환경)' | '부동산 (정보)';

export interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  placeholder: string;
  type: ItemType;
  category: ItemCategory;
  score: number;
  note: string;
  isCustom: boolean;
  photos?: string[]; // Base64 encoded compressed images
}

export interface PropertyRecord {
  id: string;
  isFavorite: boolean;
  status: 'unvisited' | 'recorded';
  location: { lat: number; lng: number };
  
  // 기본 정보 (Basic Info)
  name: string;
  address: string;
  builtYear: number;
  totalHouseholds: number;
  parkingSpots?: number; // 주차수
  visitDate?: string; // 임장 날짜 (YYYY-MM-DD)
  type: string; // 평형
  
  // 체크리스트 데이터 (Phase 3 & 4 통합)
  checklist?: ChecklistItem[];
}
