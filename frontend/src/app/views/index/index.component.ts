import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { FileService } from '../../services/file/file.service';
import { ConfirmationService } from '../../services/general/confirmation.service';
import { DocumentTableComponent } from '../../component/table/document-table/document-table.component';
import { TableComponent } from '../../component/table/table/table.component';
import { FileDetailsComponent } from '../../component/modal/file-details/file-details.component';

@Component({
  selector: 'app-index',
  standalone: true,
  imports: [CommonModule, DocumentTableComponent, TableComponent],
  templateUrl: './index.component.html',
  styleUrl: './index.component.scss',
})
export class IndexComponent implements OnInit, OnDestroy {
  isPortrait = false;

  table_headers: any[] = [
    { field: 'name', text: 'Name', sort: true },
    { field: 'status', text: 'Status', sort: true },
    { field: 'action', text: 'Action' },
  ];
 
  documents_list: any[] = [
    // { name: 'Contract_Agreement_2024.pdf', signatureCount: 0, signatures: [] },
    // { name: 'Employee_NDA_Form.pdf', signatureCount: 1, signatures: [] },
    // { name: 'Project_Proposal_Q1.pdf', signatureCount: 0, signatures: [] },
    // { name: 'Service_Terms_Document.pdf', signatureCount: 1, signatures: [] },
    // { name: 'Annual_Report_2023.pdf', signatureCount: 0, signatures: [] },
    // { name: 'Client_Authorization.pdf', signatureCount: 1, signatures: [] },
    // { name: 'Project_Proposal_Q1.pdf', signatureCount: 0, signatures: [] },
    // { name: 'Service_Terms_Document.pdf', signatureCount: 1, signatures: [] },
    // { name: 'Annual_Report_2023.pdf', signatureCount: 0, signatures: [] },
    // { name: 'Client_Authorization.pdf', signatureCount: 1, signatures: [] },
    // { name: 'Project_Proposal_Q1.pdf', signatureCount: 0, signatures: [] },
    // { name: 'Service_Terms_Document.pdf', signatureCount: 1, signatures: [] },
    // { name: 'Annual_Report_2023.pdf', signatureCount: 0, signatures: [] },
    // { name: 'Client_Authorization.pdf', signatureCount: 1, signatures: [] },
  ];

  private orientation_query = window.matchMedia('(orientation: portrait)');
  private orientation_listener = (e: MediaQueryListEvent) => (this.isPortrait = e.matches);

  constructor(
    private dialog: MatDialog,
    private file_service: FileService,
    private confirmation_service: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.isPortrait = this.orientation_query.matches;
    this.orientation_query.addEventListener('change', this.orientation_listener);
    this.load_files();
  }

  ngOnDestroy(): void {
    this.orientation_query.removeEventListener('change', this.orientation_listener);
  }
 
  async load_files(): Promise<void> {
    if (!window.electronAPI) return;
    this.documents_list = await this.file_service.list_files();
    this.documents_list.forEach((doc) => {
      doc.type = 'pdf';
      doc.status = doc.signatureCount === 1 ? 'Signed' : 'Not Signed';
    });
  }
 
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
      if (result?.action === 'save') this.load_files();
    });
  }

  onDelete(data: any): void {
    if (data.signatureCount === 0) return;
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
      this.load_files();
    });
  }

  reload(): void {
    this.load_files();
  }
}
