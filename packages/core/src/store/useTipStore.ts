import { create } from 'zustand';
import { TipRepository } from '../db/tip-repository';
import type { Tip } from '../types/tip';

interface TipState {
  tips: Tip[];
  isLoading: boolean;
  error: string | null;
  hasFetched: boolean;

  // Actions
  fetchTips: (force?: boolean) => Promise<void>;
  addTip: (tip: Tip) => Promise<void>;
  updateTip: (tip: Tip) => Promise<void>;
  deleteTip: (id: string) => Promise<void>;
  deleteBulkTips: (ids: string[]) => Promise<void>;
}

export const useTipStore = create<TipState>((set, get) => ({
  tips: [],
  isLoading: false,
  error: null,
  hasFetched: false,

  fetchTips: async (force = false) => {
    if (!force && get().hasFetched && get().tips.length > 0) {
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const data = await TipRepository.getAll();
      set({ tips: data, isLoading: false, hasFetched: true });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to fetch tips';
      set({ error: msg, isLoading: false });
    }
  },

  addTip: async (tip: Tip) => {
    try {
      await TipRepository.save(tip);
      const newTip = { ...tip, id: tip.id || crypto.randomUUID() };
      set((state) => ({ tips: [newTip, ...state.tips] }));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to add tip';
      set({ error: msg });
      throw e;
    }
  },

  updateTip: async (tip: Tip) => {
    try {
      await TipRepository.save(tip);
      set((state) => ({
        tips: state.tips.map((t) => (t.id === tip.id ? tip : t)),
      }));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to update tip';
      set({ error: msg });
      throw e;
    }
  },

  deleteTip: async (id: string) => {
    try {
      await TipRepository.delete(id);
      set((state) => ({
        tips: state.tips.filter((t) => t.id !== id),
      }));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to delete tip';
      set({ error: msg });
      throw e;
    }
  },

  deleteBulkTips: async (ids: string[]) => {
    try {
      await TipRepository.deleteBulk(ids);
      const idSet = new Set(ids);
      set((state) => ({
        tips: state.tips.filter((t) => !idSet.has(t.id)),
      }));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to bulk delete tips';
      set({ error: msg });
      throw e;
    }
  },
}));
