import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  setIgnoreMouseEvents: (ignore: boolean) =>
    ipcRenderer.send('island:set-ignore-mouse', ignore),
  onToggleExpand: (callback: (expanded: boolean) => void) =>
    ipcRenderer.on('island:toggle-expand', (_event, value) => callback(value)),
  onMediaAction: (callback: (command: string) => void) =>
    ipcRenderer.on('media:shortcut-action', (_event, cmd) => callback(cmd)),
  setStartup: (enable: boolean) => ipcRenderer.send('app:set-startup', enable),
  getStartup: () => ipcRenderer.invoke('app:get-startup'),
});