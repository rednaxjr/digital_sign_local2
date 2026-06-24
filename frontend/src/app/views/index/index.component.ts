import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import SignaturePad from 'signature_pad';
import { ESignComponent } from '../../component/modal/e-sign/e-sign.component';
import { BehaviorSubject, Observable } from 'rxjs';
import { Routes, RouterModule, Router, RouterOutlet, RouterLink, RouterLinkActive, ActivatedRoute, } from '@angular/router';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ESign2Component } from '../../component/modal/e-sign2/e-sign2.component';
import { MatIconModule } from '@angular/material/icon';
import { FileService } from '../../services/file/file.service';
import { DocumentTableComponent } from '../../component/table/document-table/document-table.component';
import { BannerComponent } from '../../component/parts/banner/banner.component';

import { HttpClient, HttpEvent, HttpHeaders } from '@angular/common/http';
import { TableComponent } from '../../component/table/table/table.component';
import { FileDetailsComponent } from '../../component/modal/file-details/file-details.component';
import { ConfirmationService } from '../../services/general/confirmation.service';
@Component({
  selector: 'app-index',
  standalone: true,
  imports: [
    CommonModule, ESignComponent, MatIconModule, 
    FormsModule, RouterModule, DocumentTableComponent,
     BannerComponent, TableComponent],
  templateUrl: './index.component.html',
  styleUrl: './index.component.scss'
})

export class IndexComponent implements OnInit, OnDestroy {
  pdfSrc = 'http://localhost:3000/uploaded_files/IMG_0020.pdf';

  /** True when the device is in portrait → render the stacked app-table.
   *  False (landscape) → render the wide mat-table (app-document-table). */
  isPortrait = false;
  private orientationQuery = window.matchMedia('(orientation: portrait)');
  private orientationListener = (e: MediaQueryListEvent) => (this.isPortrait = e.matches);

  /** Column definitions for the portrait app-table (same data as the mat-table). */
  table_headers: any[] = [
    { field: 'name', text: 'Name', sort: true },
    { field: 'status', text: 'Status', sort: true },
    { field: 'action', text: 'Action' },
  ];
  documents_list: any = [
    // { name: 'Contract_Agreement_2024.pdf', status: 0, signatureCount: 0, signatures: [] },
    // { name: 'Employee_NDA_Form.pdf',       status: 1, signatureCount: 1, signatures: [] },
    // { name: 'Project_Proposal_Q1.pdf',     status: 0, signatureCount: 0, signatures: [] },
    // { name: 'Service_Terms_Document.pdf',  status: 1, signatureCount: 1, signatures: [] },
    // { name: 'Annual_Report_2023.pdf',      status: 0, signatureCount: 0, signatures: [] },
    // { name: 'Client_Authorization.pdf',   status: 1, signatureCount: 1, signatures: [] },
    //  { name: 'Contract_Agreement_2024.pdf', status: 0, signatureCount: 0, signatures: [] },
    // { name: 'Employee_NDA_Form.pdf',       status: 1, signatureCount: 1, signatures: [] },
    // { name: 'Project_Proposal_Q1.pdf',     status: 0, signatureCount: 0, signatures: [] },
    // { name: 'Service_Terms_Document.pdf',  status: 1, signatureCount: 1, signatures: [] },
    // { name: 'Annual_Report_2023.pdf',      status: 0, signatureCount: 0, signatures: [] },
    // { name: 'Client_Authorization.pdf',   status: 1, signatureCount: 1, signatures: [] },
    //  { name: 'Contract_Agreement_2024.pdf', status: 0, signatureCount: 0, signatures: [] },
    // { name: 'Employee_NDA_Form.pdf',       status: 1, signatureCount: 1, signatures: [] },
    // { name: 'Project_Proposal_Q1.pdf',     status: 0, signatureCount: 0, signatures: [] },
    // { name: 'Service_Terms_Document.pdf',  status: 1, signatureCount: 1, signatures: [] },
    // { name: 'Annual_Report_2023.pdf',      status: 0, signatureCount: 0, signatures: [] },
    // { name: 'Client_Authorization.pdf',   status: 1, signatureCount: 1, signatures: [] },
  ];

  documents_list_duplicate: any = [];
  banner: any;

  show_esign = false;
  e_sign_image!: string;
  image_downloadable: any;
  list_of_signs: any = [];
  files_data_duplicate: any = [];
  selected_format: string = 'png';
  item_to_download: any;
  constructor(
    private dialog: MatDialog,
    private file_service: FileService,
    private httpClient: HttpClient,
    private router: Router,
    private confirmation_service: ConfirmationService
  ) {

    this.banner = [
      { text: null, icon: "home", link: "/admin/dashboard", },
      { text: "Product", icon: null, link: "/admin/product", },
      { text: "Client's Information", icon: null, link: "/admin/product/details" },
    ];
  }
  ngOnInit(): void {
    this.isPortrait = this.orientationQuery.matches;
    this.orientationQuery.addEventListener('change', this.orientationListener);
    this.getAllFiles();
  }

  ngOnDestroy(): void {
    this.orientationQuery.removeEventListener('change', this.orientationListener);
  }

  async getAllFiles() {
    if (!(window as any).electronAPI) return;
    this.documents_list = await this.file_service.get_files2();
    this.documents_list_duplicate = this.documents_list;

    for (let i = 0; i < this.documents_list.length; i++) { 
      this.documents_list[i].type = 'pdf';
      this.documents_list[i].status =
        this.documents_list[i].signatureCount === 1 ? 'Signed' : 'Not Signed';
    }
  }
 
  onEdit(data: any) {
    const dialog = this.dialog.open(FileDetailsComponent, {
      data: { title: 'Edit product', type: 'edit', pdf: data },
      hasBackdrop: true,
      width: '95vw',
      height: '95vh',
      maxWidth: '95vw',
      maxHeight: '95vh',
    });
    dialog.afterClosed().subscribe((result: any) => {
      if (result?.action === 'save') {
        this.getAllFiles();
      }
    });
  }
 
  onDelete(data: any) {
    if (data.signatureCount == 0) return;
    this.confirmation_service.confirm({
      title: 'Delete Confirmation',
      message: 'Are you sure you want to delete this file?',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger',
      isCancel: true,
    }).subscribe(async (confirmed: any) => {
      if (confirmed) {
        const stem = data.name.replace(/\.pdf$/i, '');
        await this.file_service.deleteSignature(stem);
        this.confirmation_service.confirm({
          title: 'Signature Deleted',
          message: 'The signature has been removed.',
          confirmText: 'Close',
        });
        this.getAllFiles();
      }
    });
  }



  handleSignatureSaved(data: any) {
    this.getAllFiles();
  }
  deleted() {
    this.getAllFiles();
  }
  refreshPage() {
    const currentUrl = this.router.url;
    this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
      this.router.navigate([currentUrl]);
    });
  }
}

