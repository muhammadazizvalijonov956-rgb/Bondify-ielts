const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const isDev = process.env.NODE_ENV === 'development';

let nextProcess;
let win;

function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    title: "Bondify IELTS Practice",
    icon: path.join(__dirname, '../public/favicon.ico'), // Fallback icon
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
  });

  // Always hide the menu bar for a clean app feel
  win.setMenuBarVisibility(false);

  if (isDev) {
    win.loadURL('http://localhost:3000');
    win.webContents.openDevTools();
  } else {
    // In production, we assume next start will be running
    win.loadURL('http://localhost:3000'); 
  }

  win.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    // If it fails, try again in 1 second (waiting for server to start)
    setTimeout(() => {
      win.loadURL('http://localhost:3000');
    }, 1000);
  });
}

app.whenReady().then(() => {
  // Start the Next.js server
  const command = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const args = isDev ? ['run', 'dev'] : ['run', 'start'];
  
  nextProcess = spawn(command, args, {
    cwd: path.join(__dirname, '..'),
    env: { ...process.env, NODE_ENV: isDev ? 'development' : 'production' },
    shell: true
  });

  nextProcess.stdout.on('data', (data) => console.log(`Next: ${data}`));
  nextProcess.stderr.on('data', (data) => console.error(`Next Error: ${data}`));

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('will-quit', () => {
  if (nextProcess) {
    nextProcess.kill();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Lockdown Logic
ipcMain.on('set-exam-mode', (event, enabled) => {
  if (win) {
    if (enabled) {
      win.setKiosk(true); // Locks Alt+Tab and other escapes
      win.setAlwaysOnTop(true, 'screen-saver'); 
      win.setMenuBarVisibility(false);
      win.fullScreen = true;
    } else {
      win.setKiosk(false);
      win.setAlwaysOnTop(false);
      win.fullScreen = false;
    }
  }
});
