import { saveNativeFile } from './nativeBridge';

/**
 * File Saver Utility for Web, Android WebView / Capacitor Apps, Electron, Tauri & Desktop
 * Provides fail-proof file saving, sharing, and downloading across all platforms.
 */
export const saveOrDownloadFile = async (filename: string, content: string, mimeType: string = 'text/plain') => {
  return await saveNativeFile(filename, content, mimeType);
};

