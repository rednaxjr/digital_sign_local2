import { Injectable } from '@angular/core';
import { ConfigService } from '../config/config.service';

declare global {
  interface Window {
    electronAPI: {
      listPdfs: (folderPath: string, signatureDir: string) => Promise<any[]>;
      readPdf: (filePath: string) => Promise<string>;
      deletePdf: (filePath: string) => Promise<void>;
      saveSignature: (signatureDir: string, stem: string, base64Data: string) => Promise<void>;
      deleteSignature: (signatureDir: string, stem: string) => Promise<void>;
      onConfigUpdated: (callback: (newConfig: any) => void) => void;
      config: any;
    };
  }
}

@Injectable({ providedIn: 'root' })
export class FileService {
  constructor(private configService: ConfigService) {}

  /** Lists PDFs in the configured upload folder (Electron bridge). */
  list_files(): Promise<any[]> {
    return window.electronAPI.listPdfs(
      this.configService.uploadDir,
      this.configService.signatureDir
    );
  }

  saveSignature(stem: string, base64Data: string): Promise<void> {
    return window.electronAPI.saveSignature(this.configService.signatureDir, stem, base64Data);
  }

  deleteSignature(stem: string): Promise<void> {
    return window.electronAPI.deleteSignature(this.configService.signatureDir, stem);
  }
}
