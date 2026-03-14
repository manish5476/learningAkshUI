import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// PrimeNG 18 Imports
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { InputNumberModule } from 'primeng/inputnumber';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TagModule } from 'primeng/tag';
import { ToolbarModule } from 'primeng/toolbar';
import { TooltipModule } from 'primeng/tooltip';

import { ConfirmationService } from 'primeng/api';
import { MasterApiService, Master } from '../../../../core/services/master-list.service';
import { AppMessageService } from '../../../../core/utils/message.service';


@Component({
  selector: 'app-master-management',
  standalone: true,
  imports: [
    CommonModule, FormsModule, TableModule, ButtonModule, SelectModule,
    DialogModule, InputTextModule, InputTextModule, ToggleSwitchModule,
    InputNumberModule, ToastModule, ConfirmDialogModule, TagModule, 
    ToolbarModule, TooltipModule
  ],
  providers: [ConfirmationService],
  templateUrl: './master-management.component.html',
  styleUrls: ['./master-management.component.scss']
})
export class MasterManagementComponent implements OnInit {
  private masterApi = inject(MasterApiService);
  private messageService = inject(AppMessageService); // USING YOUR SERVICE
  private confirmationService = inject(ConfirmationService);

  masterTypes = signal<{label: string, value: string}[]>([]);
  selectedType = signal<string>('');
  masters = signal<Master[]>([]);
  loading = signal<boolean>(false);

  // Bulk Selection State
  selectedMasters = signal<Master[]>([]);

  // Dialog States
  displayDialog = signal<boolean>(false);
  isEditing = signal<boolean>(false);
  displayBulkDialog = signal<boolean>(false);
  
  // Single Item Form State
  currentMaster = signal<Partial<Master>>({ metadata: { sortOrder: 0 }, isActive: true });
  
  // Bulk Items Form State
  bulkAddItems = signal<Partial<Master>[]>([]);

  ngOnInit() {
    this.loadMasterTypes();
  }

  loadMasterTypes() {
    this.masterApi.getMasterTypes().subscribe({
      next: (res) => {
        if (res.data && res.data.length > 0) {
          this.masterTypes.set(res.data);
          this.selectedType.set(res.data[0].value);
          this.loadMasters();
        }
      },
      error: (err) => this.messageService.handleHttpError(err)
    });
  }

  onTypeChange(event: any) {
    this.selectedType.set(event.value);
    this.selectedMasters.set([]); // Clear selection on type change
    this.loadMasters();
  }

  loadMasters() {
    const type = this.selectedType();
    if (!type) return;
    
    this.loading.set(true);
    this.masterApi.getAllMasters({ params: { type } }).subscribe({
      next: (res) => {
        const dataArray = Array.isArray(res.data) ? res.data : (res as any).data?.docs || [];
        this.masters.set(dataArray);
        this.selectedMasters.set([]); 
        this.loading.set(false);
      },
      error: (err) => {
        this.messageService.handleHttpError(err);
        this.loading.set(false);
      }
    });
  }

  // --- SINGLE OPERATIONS ---

  openNew() {
    this.isEditing.set(false);
    this.currentMaster.set({ type: this.selectedType(), isActive: true, metadata: { sortOrder: this.masters().length + 1 } });
    this.displayDialog.set(true);
  }

  editRecord(master: Master) {
    this.isEditing.set(true);
    this.currentMaster.set(JSON.parse(JSON.stringify(master)));
    this.displayDialog.set(true);
  }

  saveRecord() {
    const data = this.currentMaster();
    if (!data.name || !data.code) {
      this.messageService.showWarn('Name and Code are required');
      return;
    }

    const request$ = (this.isEditing() && data._id) 
      ? this.masterApi.updateMaster(data._id, data) 
      : this.masterApi.createMaster(data);

    request$.subscribe({
      next: () => {
        this.messageService.showSuccess(`Record successfully ${this.isEditing() ? 'updated' : 'created'}`);
        this.displayDialog.set(false);
        this.loadMasters();
      },
      error: (err) => this.messageService.handleHttpError(err)
    });
  }

  toggleStatus(master: Master) {
    if (!master._id) return;
    this.masterApi.toggleActiveStatus(master._id).subscribe({
      next: () => {
        this.messageService.showSuccess('Status toggled successfully');
        this.loadMasters();
      },
      error: (err) => this.messageService.handleHttpError(err)
    });
  }

  deleteRecord(master: Master) {
    this.confirmationService.confirm({
      message: `Delete ${master.name}? This action cannot be undone.`,
      header: 'Confirm Deletion',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        if (master._id) {
          this.masterApi.deleteMaster(master._id).subscribe({
            next: () => {
              this.messageService.showSuccess('Record deleted');
              this.loadMasters();
            },
            error: (err) => this.messageService.handleHttpError(err)
          });
        }
      }
    });
  }

  // --- BULK OPERATIONS ---

  openBulkAdd() {
    // Initialize with one empty row
    this.bulkAddItems.set([{ type: this.selectedType(), isActive: true, metadata: { sortOrder: this.masters().length + 1 } }]);
    this.displayBulkDialog.set(true);
  }

  addBulkRow() {
    const currentLength = this.masters().length + this.bulkAddItems().length + 1;
    this.bulkAddItems.update(items => [...items, { type: this.selectedType(), isActive: true, metadata: { sortOrder: currentLength } }]);
  }

  removeBulkRow(index: number) {
    this.bulkAddItems.update(items => items.filter((_, i) => i !== index));
  }

  saveBulk() {
    const items = this.bulkAddItems();
    if (items.some(i => !i.name || !i.code)) {
      this.messageService.showWarn('All rows must have a Name and Code');
      return;
    }

    this.masterApi.bulkCreateMasters(items).subscribe({
      next: () => {
        this.messageService.showSuccess(`${items.length} records created successfully`);
        this.displayBulkDialog.set(false);
        this.loadMasters();
      },
      error: (err) => this.messageService.handleHttpError(err)
    });
  }

  deleteSelected() {
    const selected = this.selectedMasters();
    if (selected.length === 0) return;

    this.confirmationService.confirm({
      message: `Are you sure you want to delete ${selected.length} records?`,
      header: 'Confirm Bulk Deletion',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        const ids = selected.map(s => s._id).filter(id => id) as string[];
        this.masterApi.bulkDeleteMasters(ids).subscribe({
          next: () => {
            this.messageService.showSuccess(`${ids.length} records deleted`);
            this.loadMasters();
          },
          error: (err) => this.messageService.handleHttpError(err)
        });
      }
    });
  }
}
