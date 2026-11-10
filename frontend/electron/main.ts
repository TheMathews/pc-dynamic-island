import { app, BrowserWindow, screen, ipcMain, globalShortcut } from 'electron';
import path from 'node:path';
import { spawn, ChildProcess } from 'node:child_process';

let mainWindow: BrowserWindow | null = null;
let pyProc: ChildProcess | null = null;
let isExpanded = false;

function startPythonBackend() {
  const isDev = !app.isPackaged;

  const backendPath = isDev
    ? path.join(__dirname, '../../backend')
    : path.join(process.resourcesPath, 'backend');

  const pythonExe = path.join(backendPath, '.venv', 'Scripts', 'python.exe');

  pyProc = spawn(
    pythonExe,
    ['-m', 'uvicorn', 'app.main:app', '--host', '127.0.0.1', '--port', '8000'],
    {
      cwd: backendPath,
      env: {
        ...process.env,
        PYTHONPATH: backendPath,
      },
      windowsHide: true,
    }
  );

  pyProc.stdout?.on('data', (data) => {
    console.log(`[Python]: ${data}`);
  });

  pyProc.stderr?.on('data', (data) => {
    console.error(`[Python Log]: ${data}`);
  });
}

function killPythonBackend() {
  if (pyProc) {
    pyProc.kill();
    pyProc = null;
  }
}

function createIslandWindow() {
  startPythonBackend();

  const primaryDisplay = screen.getPrimaryDisplay();
  const { width } = primaryDisplay.workAreaSize;
  const windowWidth = 500;
  const windowHeight = 250;

  mainWindow = new BrowserWindow({
    width: windowWidth,
    height: windowHeight,
    x: Math.round((width - windowWidth) / 2),
    y: 6,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: true,
    hasShadow: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.setAlwaysOnTop(true, 'screen-saver');
  mainWindow.setIgnoreMouseEvents(true, { forward: true });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  globalShortcut.register('CommandOrControl+Shift+Space', () => {
    isExpanded = !isExpanded;
    mainWindow?.webContents.send('island:toggle-expand', isExpanded);
    mainWindow?.setIgnoreMouseEvents(!isExpanded, { forward: true });
  });

  globalShortcut.register('MediaPlayPause', () => {
    mainWindow?.webContents.send('media:shortcut-action', 'play_pause');
  });
}

ipcMain.on('island:set-ignore-mouse', (_event, ignore: boolean) => {
  if (mainWindow) {
    mainWindow.setIgnoreMouseEvents(ignore, { forward: true });
  }
});

ipcMain.on('app:set-startup', (_event, enable: boolean) => {
  app.setLoginItemSettings({
    openAtLogin: enable,
    path: process.execPath,
  });
});

ipcMain.handle('app:get-startup', () => {
  return app.getLoginItemSettings().openAtLogin;
});

app.whenReady().then(createIslandWindow);

app.on('window-all-closed', () => {
  globalShortcut.unregisterAll();
  killPythonBackend();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
  killPythonBackend();
});