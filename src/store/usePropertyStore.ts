import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PropertyRecord } from '../types/property';

interface PropertyState {
  familyCode: string | null;
  setFamilyCode: (code: string) => void;
  currentEditingId: string | null;
  setCurrentEditingId: (id: string | null) => void;
  properties: PropertyRecord[];
  addProperty: (property: PropertyRecord) => void;
  updateProperty: (id: string, updates: Partial<PropertyRecord>) => void;
  removeProperty: (id: string) => void;
  moveProperty: (id: string, direction: 'up' | 'down') => void;
  toggleFavorite: (id: string) => void;
}

const mockData: PropertyRecord[] = [
  {
    id: 'mock-1',
    isFavorite: true,
    status: 'recorded',
    location: { lat: 37.5665, lng: 126.9780 },
    name: '센트럴자이',
    address: '서울특별시 중구',
    builtYear: 2020,
    totalHouseholds: 1500,
    type: '84㎡',
    checklist: []
  }
];

export const usePropertyStore = create<PropertyState>()(
  persist(
    (set) => ({
      familyCode: null,
      setFamilyCode: (code) => set({ familyCode: code }),
      currentEditingId: null,
      setCurrentEditingId: (id) => set({ currentEditingId: id }),
      properties: mockData,
      addProperty: (property) => set((state) => ({ properties: [...state.properties, property] })),
      updateProperty: (id, updates) => set((state) => ({
        properties: state.properties.map((p) => p.id === id ? { ...p, ...updates } : p)
      })),
      removeProperty: (id) => set((state) => ({
        properties: state.properties.filter((p) => p.id !== id)
      })),
      moveProperty: (id, direction) => set((state) => {
        const index = state.properties.findIndex(p => p.id === id);
        if (index < 0) return state;
        if (direction === 'up' && index > 0) {
          const newProps = [...state.properties];
          [newProps[index - 1], newProps[index]] = [newProps[index], newProps[index - 1]];
          return { properties: newProps };
        }
        if (direction === 'down' && index < state.properties.length - 1) {
          const newProps = [...state.properties];
          [newProps[index], newProps[index + 1]] = [newProps[index + 1], newProps[index]];
          return { properties: newProps };
        }
        return state;
      }),
      toggleFavorite: (id) => set((state) => ({
        properties: state.properties.map((p) => p.id === id ? { ...p, isFavorite: !p.isFavorite } : p)
      })),
    }),
    {
      name: 'antigravity-storage',
    }
  )
);
