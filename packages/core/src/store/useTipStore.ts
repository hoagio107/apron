import { create } from 'zustand';
import { TipRepository } from '../db/tip-repository';
import type { Tip } from '../types/tip';

interface TipState {
  tips: Tip[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchTips: () => Promise<void>;
  addTip: (tip: Tip) => Promise<void>;
  updateTip: (tip: Tip) => Promise<void>;
  deleteTip: (id: string) => Promise<void>;
  deleteBulkTips: (ids: string[]) => Promise<void>;
}

export const useTipStore = create<TipState>((set, _get) => ({
  tips: [],
  isLoading: false,
  error: null,

  fetchTips: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await TipRepository.getAll();
      set({ tips: data, isLoading: false });
    } catch (e: any) {
      set({ error: e.message || 'Failed to fetch tips', isLoading: false });
    }
  },

  addTip: async (tip: Tip) => {
    try {
      await TipRepository.save(tip);
      const newTip = { ...tip, id: tip.id || crypto.randomUUID() };
      set((state) => ({ tips: [newTip, ...state.tips] }));
    } catch (e: any) {
      set({ error: e.message || 'Failed to add tip' });
      throw e;
    }
  },

  updateTip: async (tip: Tip) => {
    try {
      await TipRepository.save(tip);
      set((state) => ({
        tips: state.tips.map(t => t.id === tip.id ? tip : t)
      }));
    } catch (e: any) {
      set({ error: e.message || 'Failed to update tip' });
      throw e;
    }
  },

  deleteTip: async (id: string) => {
    try {
      await TipRepository.delete(id);
      set((state) => ({
        tips: state.tips.filter(t => t.id !== id)
      }));
    } catch (e: any) {
      set({ error: e.message || 'Failed to delete tip' });
      throw e;
    }
  },

  deleteBulkTips: async (ids: string[]) => {
    try {
      await TipRepository.deleteBulk(ids);
      set((state) => ({
        tips: state.tips.filter(t => !ids.includes(t.id))
      }));
    } catch (e: any) {
      set({ error: e.message || 'Failed to bulk delete tips' });
      throw e;
    }
  }
}));
