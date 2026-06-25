import {
  Component,
  Input,
  Output,
  EventEmitter,
  ViewChild,
  OnInit,
  AfterViewInit,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmationService } from '../../../services/general/confirmation.service';
import { FileDetailsComponent } from '../../modal/file-details/file-details.component';
import { FileService } from '../../../services/file/file.service';

@Component({
  selector: 'app-document-table',
  standalone: true,
  imports: [MatTableModule, MatPaginatorModule, CommonModule],
  templateUrl: './document-table.component.html',
  styleUrl: './document-table.component.scss',
})
export class DocumentTableComponent implements OnInit, AfterViewInit, OnChanges {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @Input() data: any[] = [];
  @Output() signatureSaved = new EventEmitter<any>();
  @Output() deleteConfirmed = new EventEmitter<void>();

  labels = ['name', 'status', 'action'];
  dataSource = new MatTableDataSource<any>([]);

  constructor(
    private dialog: MatDialog,
    private file_service: FileService,
    private confirmation_service: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.dataSource.data = this.data;
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data']) this.dataSource.data = this.data;
  }

  /** Open the sign / view dialog; notify the parent when a signature is saved. */
  onEdit(data: any): void {
    const dialog = this.dialog.open(FileDetailsComponent, {
      data: { title: 'Edit product', type: 'edit', pdf: data },
      hasBackdrop: true,
      width: '95vw',
      height: '95vh',
      maxWidth: '95vw',
      maxHeight: '95vh',
    });
    dialog.afterClosed().subscribe((result: any) => {
      if (result?.action === 'save') this.signatureSaved.emit(result.payload);
    });
  }

  /** Delete a signature with confirmation; notify the parent when done. */
  onDelete(data: any): void {
    this.confirmation_service.confirm({
      title: 'Delete Confirmation',
      message: 'Are you sure you want to delete this file?',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger',
      isCancel: true,
    }).subscribe(async (confirmed: any) => {
      if (!confirmed) return;
      const stem = data.name.replace(/\.pdf$/i, '');
      await this.file_service.deleteSignature(stem);
      this.confirmation_service.confirm({
        title: 'Signature Deleted',
        message: 'The signature has been removed.',
        confirmText: 'Close',
      });
      this.deleteConfirmed.emit();
    });
  }
}
