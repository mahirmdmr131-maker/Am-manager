/**
 * Unified Native & Cross-Platform Bridge Utility
 * Seamlessly supports Electron, Tauri, Capacitor, Android WebViews, and Web Browsers.
 */

export type PlatformType = 'electron' | 'tauri' | 'capacitor' | 'android' | 'web';

/**
 * Detect current execution environment
 */
export const getPlatform = (): PlatformType => {
  const win = window as any;
  if (win.ElectronBridge || win.electron || win.ipcRenderer || navigator.userAgent.toLowerCase().includes('electron')) {
    return 'electron';
  }
  if (win.__TAURI__ || win.__TAURI_IPC__ || win.TauriBridge || navigator.userAgent.toLowerCase().includes('tauri')) {
    return 'tauri';
  }
  if (win.Capacitor?.isNativePlatform?.() || win.Capacitor) {
    return 'capacitor';
  }
  if (win.AndroidBridge) {
    return 'android';
  }
  return 'web';
};

export const isElectron = () => getPlatform() === 'electron';
export const isTauri = () => getPlatform() === 'tauri';
export const isCapacitor = () => getPlatform() === 'capacitor';
export const isAndroidBridge = () => getPlatform() === 'android';
export const isNativeApp = () => getPlatform() !== 'web';

/**
 * Fetch System Printers (Electron / Tauri / Native)
 */
export const getSystemPrinters = async (): Promise<any[]> => {
  const win = window as any;
  try {
    if (win.ElectronBridge?.getPrinters) {
      return await win.ElectronBridge.getPrinters();
    }
    if (win.electron?.getPrinters) {
      return await win.electron.getPrinters();
    }
    if (win.TauriBridge?.getPrinters) {
      return await win.TauriBridge.getPrinters();
    }
    if (win.__TAURI__?.printers?.getPrinters) {
      return await win.__TAURI__.printers.getPrinters();
    }
  } catch (err) {
    console.warn('Native getPrinters failed:', err);
  }
  return [];
};

/**
 * Native Direct Printing
 */
export const printNativeDocument = async (options: {
  deviceName?: string;
  silent?: boolean;
  htmlContent?: string;
  title?: string;
}): Promise<{ success: boolean; message: string }> => {
  const win = window as any;
  const platform = getPlatform();

  try {
    // 1. Electron Direct Print
    if (platform === 'electron') {
      const bridge = win.ElectronBridge || win.electron;
      if (bridge?.printDocument) {
        const result = await bridge.printDocument(options);
        return result || { success: true, message: 'Sent to Electron Printer' };
      }
    }

    // 2. Tauri Direct Print
    if (platform === 'tauri') {
      const bridge = win.TauriBridge || win.__TAURI__;
      if (bridge?.printDocument) {
        const result = await bridge.printDocument(options);
        return result || { success: true, message: 'Sent to Tauri Printer' };
      }
    }

    // 3. Android Native Bridge
    if (platform === 'android' && win.AndroidBridge?.printDocument) {
      win.AndroidBridge.printDocument(options.title || 'Print Invoice');
      return { success: true, message: 'Sent to Android Print Spooler' };
    }

    // 4. Capacitor Print Plugin Fallback
    if (platform === 'capacitor' && win.Capacitor?.Plugins?.Printer) {
      await win.Capacitor.Plugins.Printer.print({ content: options.htmlContent });
      return { success: true, message: 'Sent via Capacitor Printer' };
    }
  } catch (err: any) {
    console.error('Native printing failed, falling back to browser print:', err);
  }

  return { success: false, message: 'Native print driver unavailable or failed' };
};

/**
 * Native Cross-Platform File Saver
 */
export const saveNativeFile = async (filename: string, content: string, mimeType: string = 'text/plain') => {
  const win = window as any;
  const platform = getPlatform();

  // 1. Android Native Bridge Share
  if (platform === 'android' && win.AndroidBridge?.shareText) {
    win.AndroidBridge.shareText(`Save ${filename}`, content);
    return;
  }

  // 2. Capacitor Share / Filesystem
  if (platform === 'capacitor' && win.Capacitor?.Plugins) {
    try {
      if (win.Capacitor.Plugins.Filesystem) {
        await win.Capacitor.Plugins.Filesystem.writeFile({
          path: filename,
          data: content,
          directory: 'DOCUMENTS',
          encoding: 'utf8'
        });
        if (win.Capacitor.Plugins.Toast) {
          win.Capacitor.Plugins.Toast.show({ text: `Saved to Documents/${filename}` });
        }
        return;
      }
    } catch (capErr) {
      console.warn('Capacitor Filesystem save failed, using Web Share:', capErr);
    }
  }

  // 3. Web Share API
  if (navigator.share) {
    try {
      const file = new File([content], filename, { type: mimeType });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: filename,
          text: `A M Food Processing Manager - ${filename}`
        });
        return;
      }
    } catch (e) {
      console.log('Navigator share skipped');
    }
  }

  // 4. Standard Browser / Electron / Tauri Data URI Download
  try {
    const encodedContent = encodeURIComponent(content);
    const dataUri = `data:${mimeType};charset=utf-8,${encodedContent}`;
    
    const link = document.createElement('a');
    link.href = dataUri;
    link.setAttribute('download', filename);
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    
    setTimeout(() => {
      if (document.body.contains(link)) {
        document.body.removeChild(link);
      }
    }, 1000);
  } catch (err) {
    // Blob Fallback
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      if (document.body.contains(a)) {
        document.body.removeChild(a);
      }
      URL.revokeObjectURL(url);
    }, 1000);
  }
};
