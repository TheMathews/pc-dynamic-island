/// <reference types="vite/client" />

export interface ElectronAPI {
  setIgnoreMouseEvents: (ignore: boolean) => void;
  onToggleExpand: (callback: (expanded: boolean) => void) => void;
  onMediaAction: (callback: (command: string) => void) => void;
  setStartup: (enable: boolean) => void;
  getStartup: () => Promise<boolean>;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}