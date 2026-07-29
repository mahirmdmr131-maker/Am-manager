const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('ElectronBridge', {
  getPrinters: () => ipcRenderer.invoke('get-printers'),
  printDocument: (options) => ipcRenderer.invoke('print-document', options),
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  getAppVersion: () => ipcRenderer.invoke('get-app-version')
});

contextBridge.exposeInMainWorld('electron', {
  getPrinters: () => ipcRenderer.invoke('get-printers'),
  printDocument: (options) => ipcRenderer.invoke('print-document', options)
});
