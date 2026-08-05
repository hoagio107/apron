
import { useState, useEffect } from 'react';

// Search/Filter Service
type SearchListener = (isOpen: boolean) => void;
let searchOpen = false;
const searchListeners = new Set<SearchListener>();

export const searchService = {
  isOpen: () => searchOpen,
  open: () => { searchOpen = true; searchListeners.forEach(l => l(searchOpen)); },
  close: () => { searchOpen = false; searchListeners.forEach(l => l(searchOpen)); },
  toggle: () => { searchOpen = !searchOpen; searchListeners.forEach(l => l(searchOpen)); },
  subscribe: (l: SearchListener) => {
    searchListeners.add(l);
    return () => searchListeners.delete(l);
  }
};

export function useSearchService() {
  const [open, setOpen] = useState(searchOpen);
  useEffect(() => {
    return searchService.subscribe(setOpen);
  }, []);
  return { isFilterOpen: open, toggleFilter: searchService.toggle, openFilter: searchService.open, closeFilter: searchService.close };
}

// Selection Service
type SelectionListener = (isMode: boolean) => void;
let selectionMode = false;
const selectionListeners = new Set<SelectionListener>();

export const selectionService = {
  isSelectionMode: () => selectionMode,
  setSelectionMode: (mode: boolean) => { selectionMode = mode; selectionListeners.forEach(l => l(selectionMode)); },
  toggle: () => { selectionMode = !selectionMode; selectionListeners.forEach(l => l(selectionMode)); },
  subscribe: (l: SelectionListener) => {
    selectionListeners.add(l);
    return () => selectionListeners.delete(l);
  }
};

export function useSelectionService() {
  const [mode, setMode] = useState(selectionMode);
  useEffect(() => {
    return selectionService.subscribe(setMode);
  }, []);
  return { isSelectionMode: mode, toggleSelection: selectionService.toggle, setSelectionMode: selectionService.setSelectionMode };
}

// Backup Service
type BackupListener = (isOpen: boolean) => void;
let backupOpen = false;
const backupListeners = new Set<BackupListener>();

export const backupService = {
  isOpen: () => backupOpen,
  open: () => { backupOpen = true; backupListeners.forEach(l => l(backupOpen)); },
  close: () => { backupOpen = false; backupListeners.forEach(l => l(backupOpen)); },
  subscribe: (l: BackupListener) => {
    backupListeners.add(l);
    return () => backupListeners.delete(l);
  }
};

export function useBackupService() {
  const [open, setOpen] = useState(backupOpen);
  useEffect(() => {
    return backupService.subscribe(setOpen);
  }, []);
  return { isBackupOpen: open, openBackup: backupService.open, closeBackup: backupService.close };
}

// Mobile Menu Service
type MobileMenuListener = (isOpen: boolean) => void;
let mobileMenuOpen = false;
const mobileMenuListeners = new Set<MobileMenuListener>();

export const mobileMenuService = {
  isOpen: () => mobileMenuOpen,
  open: () => { mobileMenuOpen = true; mobileMenuListeners.forEach(l => l(mobileMenuOpen)); },
  close: () => { mobileMenuOpen = false; mobileMenuListeners.forEach(l => l(mobileMenuOpen)); },
  toggle: () => { mobileMenuOpen = !mobileMenuOpen; mobileMenuListeners.forEach(l => l(mobileMenuOpen)); },
  subscribe: (l: MobileMenuListener) => {
    mobileMenuListeners.add(l);
    return () => mobileMenuListeners.delete(l);
  }
};

export function useMobileMenuService() {
  const [open, setOpen] = useState(mobileMenuOpen);
  useEffect(() => {
    return mobileMenuService.subscribe(setOpen);
  }, []);
  return { isMenuOpen: open, toggleMenu: mobileMenuService.toggle, openMenu: mobileMenuService.open, closeMenu: mobileMenuService.close };
}

// Image Viewer Service
type ImageViewerListener = (url: string | null) => void;
let currentImageUrl: string | null = null;
const imageViewerListeners = new Set<ImageViewerListener>();

export const imageViewerService = {
  open: (url: string) => {
    currentImageUrl = url;
    imageViewerListeners.forEach(l => l(currentImageUrl));
  },
  close: () => {
    currentImageUrl = null;
    imageViewerListeners.forEach(l => l(currentImageUrl));
  },
  subscribe: (l: ImageViewerListener) => {
    imageViewerListeners.add(l);
    return () => imageViewerListeners.delete(l);
  }
};

export function useImageViewer() {
  const [url, setUrl] = useState<string | null>(currentImageUrl);
  useEffect(() => {
    return imageViewerService.subscribe(setUrl);
  }, []);
  return { 
    isOpen: !!url, 
    url, 
    open: imageViewerService.open, 
    close: imageViewerService.close 
  };
}
