import { Component, ViewChild, ElementRef, AfterViewInit, OnDestroy, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import SignaturePad from 'signature_pad';
import { PdfViewerModule } from 'ng2-pdf-viewer';
import { FileService } from '../../../services/file/file.service';

@Component({
  selector: 'app-file-details',
  standalone: true,
  imports: [CommonModule, PdfViewerModule],
  templateUrl: './file-details.component.html',
  styleUrl: './file-details.component.scss',
})
export class FileDetailsComponent implements AfterViewInit, OnDestroy {
  @ViewChild('canvas') canvas_ref!: ElementRef<HTMLCanvasElement>;
  @ViewChild('canvasContainer') container_ref!: ElementRef<HTMLDivElement>;

  isEmpty = true;
  isPdfExpanded = false;
  /** Portrait-only: whether the signature bottom-sheet is slid up. Starts open when already signed. */
  isSigPanelOpen = false;

  private signature_pad!: SignaturePad;
  private resize_observer!: ResizeObserver;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialog: MatDialogRef<FileDetailsComponent>,
    private file_service: FileService
  ) {
    this.isSigPanelOpen = this.data?.pdf?.signatureCount === 1;
  }

  ngAfterViewInit(): void {
    this.signature_pad = new SignaturePad(this.canvas_ref.nativeElement, {
      minWidth: 1,
      maxWidth: 3,
      penColor: '#1a1a2e',
    });
    this.signature_pad.addEventListener('beginStroke', () => (this.isEmpty = false));

    this.resize_observer = new ResizeObserver(() => this.resize_canvas());
    this.resize_observer.observe(this.container_ref.nativeElement);
    this.resize_canvas();
  }

  ngOnDestroy(): void {
    this.resize_observer?.disconnect();
    this.signature_pad?.off();
  }

  /** Resizes the canvas to its container while preserving the current strokes. */
  private resize_canvas(): void {
    const canvas = this.canvas_ref.nativeElement;
    const container = this.container_ref.nativeElement;
    const strokes = this.signature_pad.isEmpty() ? null : this.signature_pad.toData();

    const ratio = window.devicePixelRatio || 1;
    canvas.width = container.offsetWidth * ratio;
    canvas.height = container.offsetHeight * ratio;
    canvas.getContext('2d')!.scale(ratio, ratio);

    this.signature_pad.clear();
    if (strokes) this.signature_pad.fromData(strokes);
  }

  clear(): void {
    this.signature_pad.clear();
    this.isEmpty = true;
  }

  async save(): Promise<void> {
    if (this.signature_pad.isEmpty()) return;
    const base64 = this.signature_pad.toDataURL('image/png').split(',')[1];
    const stem = this.data.pdf.name.replace(/\.pdf$/i, '');
    await this.file_service.saveSignature(stem, base64);
    this.dialog.close({ action: 'save' });
  }

  togglePdf(): void {
    this.isPdfExpanded = !this.isPdfExpanded;
  }

  /** Portrait-only: slide the signature panel up/down over the full-size PDF. */
  toggleSigPanel(): void {
    this.isSigPanelOpen = !this.isSigPanelOpen;
  }

  close(): void {
    this.dialog.close({ action: 'close' });
  }
}
