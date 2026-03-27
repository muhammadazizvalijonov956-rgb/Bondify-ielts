const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  setExamMode: (enabled) => ipcRenderer.send('set-exam-mode', enabled),
});
