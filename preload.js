// preload.js
const { contextBridge, ipcRenderer } = require('electron');

// Expose a minimizeWindow function to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  minimizeWindow: () => ipcRenderer.send('minimize-window')
});