// master-management.component.ts
import { Component, OnInit, inject, signal, DestroyRef, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

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

interface BulkAddItem extends Partial<Master> {
  isValid?: boolean;
  errors?: { [key: string]: string };
}

@Component({
  selector: 'app-master-management',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    TableModule, 
    ButtonModule, 
    SelectModule,
    DialogModule, 
    InputTextModule, 
    ToggleSwitchModule,
    InputNumberModule, 
    ToastModule, 
    ConfirmDialogModule, 
    TagModule, 
    ToolbarModule, 
    TooltipModule
  ],
  providers: [ConfirmationService],
  templateUrl: './master-management.component.html',
  styleUrls: ['./master-management.component.scss']
})
export class MasterManagementComponent implements OnInit {
  private masterApi = inject(MasterApiService);
  private messageService = inject(AppMessageService);
  private confirmationService = inject(ConfirmationService);
  private destroyRef = inject(DestroyRef);

  // Signals for reactive state
  masterTypes = signal<{ label: string; value: string }[]>([]);
  selectedType = signal<string>('');
  masters = signal<Master[]>([]);
  loading = signal<boolean>(false);
  
  // Bulk Selection State
  selectedMasters = signal<Master[]>([]);
  
  // Dialog States
  displayDialog = signal<boolean>(false);
  isEditing = signal<boolean>(false);
  displayBulkDialog = signal<boolean>(false);
  saving = signal<boolean>(false);
  
  // Single Item Form State
  currentMaster = signal<Partial<Master>>({ 
    metadata: { sortOrder: 0, isFeatured: false }, 
    isActive: true 
  });
  
  // Bulk Items Form State
  bulkAddItems = signal<BulkAddItem[]>([]);
  
  // Computed values
  selectedTypeLabel = computed(() => {
    const type = this.masterTypes().find(t => t.value === this.selectedType());
    return type?.label || this.selectedType();
  });

  ngOnInit() {
    this.loadMasterTypes();
  }

  // ==========================================
  // DATA LOADING METHODS
  // ==========================================
  
  loadMasterTypes() {
    this.masterApi.getMasterTypes()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          if (res.data && res.data.length > 0) {
            this.masterTypes.set(res.data);
            this.selectedType.set(res.data[0].value);
            this.loadMasters();
          }
        },
        error: (err) => {
          this.messageService.handleHttpError(err);
        }
      });
  }

  onTypeChange(event: any) {
    this.selectedType.set(event.value);
    this.selectedMasters.set([]);
    this.loadMasters();
  }

  loadMasters() {
    const type = this.selectedType();
    if (!type) return;
    
    this.loading.set(true);
    this.masterApi.getAllMasters({ params: { type } })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
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

  // ==========================================
  // SINGLE OPERATIONS
  // ==========================================
  
  openNew() {
    this.isEditing.set(false);
    this.currentMaster.set({ 
      type: this.selectedType(), 
      isActive: true, 
      metadata: { 
        sortOrder: this.masters().length + 1,
        isFeatured: false
      } 
    });
    this.displayDialog.set(true);
  }

  editRecord(master: Master) {
    this.isEditing.set(true);
    this.currentMaster.set(JSON.parse(JSON.stringify(master)));
    this.displayDialog.set(true);
  }

  saveRecord() {
    const data = this.currentMaster();
    
    // Validation
    if (!data.name?.trim()) {
      this.messageService.showWarn('Display Name is required');
      return;
    }
    
    if (!data.code?.trim()) {
      this.messageService.showWarn('Unique Code is required');
      return;
    }
    
    // Code format validation
    const codePattern = /^[A-Z0-9_]+$/;
    if (!codePattern.test(data.code)) {
      this.messageService.showWarn('Code must contain only uppercase letters, numbers, and underscores');
      return;
    }
    
    this.saving.set(true);
    const request$ = (this.isEditing() && data._id) 
      ? this.masterApi.updateMaster(data._id, data) 
      : this.masterApi.createMaster(data);
    
    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.messageService.showSuccess(
          `Record successfully ${this.isEditing() ? 'updated' : 'created'}`
        );
        this.displayDialog.set(false);
        this.loadMasters();
        this.saving.set(false);
      },
      error: (err) => {
        this.messageService.handleHttpError(err);
        this.saving.set(false);
      }
    });
  }

  toggleStatus(master: any) {
    if (!master._id) return;
    
    this.confirmationService.confirm({
      message: `Are you sure you want to ${master.isActive ? 'deactivate' : 'activate'} "${master.name}"?`,
      header: 'Confirm Status Change',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-warning',
      accept: () => {
        this.masterApi.toggleActiveStatus(master._id)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => {
              this.messageService.showSuccess(`${master.name} has been ${master.isActive ? 'deactivated' : 'activated'}`);
              this.loadMasters();
            },
            error: (err) => this.messageService.handleHttpError(err)
          });
      }
    });
  }

  deleteRecord(master: Master) {
    this.confirmationService.confirm({
      message: `Delete "${master.name}"? This action cannot be undone.`,
      header: 'Confirm Deletion',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        if (master._id) {
          this.masterApi.deleteMaster(master._id)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
              next: () => {
                this.messageService.showSuccess(`${master.name} has been deleted`);
                this.loadMasters();
              },
              error: (err) => this.messageService.handleHttpError(err)
            });
        }
      }
    });
  }

  // ==========================================
  // BULK OPERATIONS
  // ==========================================
  
  openBulkAdd() {
    // Initialize with one empty row
    this.bulkAddItems.set([{ 
      type: this.selectedType(), 
      isActive: true, 
      metadata: { sortOrder: this.masters().length + 1, isFeatured: false },
      code: '',
      name: '',
      imageUrl: '',
      description: ''
    }]);
    this.displayBulkDialog.set(true);
  }

  addBulkRow() {
    const currentLength = this.masters().length + this.bulkAddItems().length + 1;
    this.bulkAddItems.update(items => [
      ...items, 
      { 
        type: this.selectedType(), 
        isActive: true, 
        metadata: { sortOrder: currentLength, isFeatured: false },
        code: '',
        name: '',
        imageUrl: '',
        description: ''
      }
    ]);
  }

  removeBulkRow(index: number) {
    if (this.bulkAddItems().length === 1) {
      this.messageService.showWarn('At least one row is required');
      return;
    }
    this.bulkAddItems.update(items => items.filter((_, i) => i !== index));
  }

  validateBulkItem(item: BulkAddItem): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!item.name?.trim()) {
      errors.push('Name is required');
    }
    
    if (!item.code?.trim()) {
      errors.push('Code is required');
    } else {
      const codePattern = /^[A-Z0-9_]+$/;
      if (!codePattern.test(item.code)) {
        errors.push('Code must be uppercase letters, numbers, and underscores only');
      }
    }
    
    if (item.imageUrl && !this.isValidUrl(item.imageUrl)) {
      errors.push('Invalid URL format');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  saveBulk() {
    const items = this.bulkAddItems();
    
    // Validate all items
    const invalidItems: { index: number; errors: string[] }[] = [];
    items.forEach((item, index) => {
      const validation = this.validateBulkItem(item);
      if (!validation.isValid) {
        invalidItems.push({ index: index + 1, errors: validation.errors });
      }
    });
    
    if (invalidItems.length > 0) {
      const errorMessages = invalidItems.map(
        item => `Row ${item.index}: ${item.errors.join(', ')}`
      );
      this.messageService.showWarn(`Please fix the following errors:\n${errorMessages.join('\n')}`);
      return;
    }
    
    this.saving.set(true);
    this.masterApi.bulkCreateMasters(items)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.messageService.showSuccess(
            `${items.length} record(s) created successfully`
          );
          this.displayBulkDialog.set(false);
          this.loadMasters();
          this.saving.set(false);
        },
        error: (err) => {
          this.messageService.handleHttpError(err);
          this.saving.set(false);
        }
      });
  }

  deleteSelected() {
    const selected = this.selectedMasters();
    if (selected.length === 0) return;
    
    this.confirmationService.confirm({
      message: `Are you sure you want to delete ${selected.length} selected record(s)? This action cannot be undone.`,
      header: 'Confirm Bulk Deletion',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        const ids = selected.map(s => s._id).filter(id => id) as string[];
        this.masterApi.bulkDeleteMasters(ids)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => {
              this.messageService.showSuccess(`${ids.length} record(s) deleted successfully`);
              this.selectedMasters.set([]);
              this.loadMasters();
            },
            error: (err) => this.messageService.handleHttpError(err)
          });
      }
    });
  }

  // ==========================================
  // UI HELPER METHODS
  // ==========================================
  
  onGlobalFilter(event: Event) {
    const input = event.target as HTMLInputElement;
    const filterValue = input.value;
    // The table's global filter will handle this
    // This method is called from the template
  }

  getSelectedTypeLabel(): string {
    const type = this.masterTypes().find(t => t.value === this.selectedType());
    return type?.label || this.selectedType();
  }

  // Helper for getting status severity
  getStatusSeverity(isActive: boolean): string {
    return isActive ? 'success' : 'danger';
  }
  
  // Helper for getting status label
  getStatusLabel(isActive: boolean): string {
    return isActive ? 'Active' : 'Inactive';
  }
  
  // Helper for getting featured icon class
  getFeaturedIconClass(isFeatured: boolean): string {
    return isFeatured ? 'pi-star-fill' : 'pi-star';
  }
  
  // Helper for getting featured label
  getFeaturedLabel(isFeatured: boolean): string {
    return isFeatured ? 'Featured' : 'Standard';
  }
  
  // Clear selection
  clearSelection() {
    this.selectedMasters.set([]);
  }
  
  // Export current data
  exportToCSV() {
    const data = this.masters();
    if (data.length === 0) {
      this.messageService.showWarn('No data to export');
      return;
    }
    
    const headers = ['Code', 'Name', 'Description', 'Status', 'Featured', 'Sort Order'];
    const csvData = data.map(item => [
      item.code,
      item.name,
      item.description || '',
      item.isActive ? 'Active' : 'Inactive',
      item.metadata?.isFeatured ? 'Yes' : 'No',
      item.metadata?.sortOrder || 0
    ]);
    
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${this.selectedType()}_export.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    this.messageService.showInfo(`'Export started', ${data.length} records exported`);
  }
  
  // Track by function for ngFor optimization
  trackByMasterId(index: number, master: Master): string {
    return master._id || index.toString();
  }
  
  trackByBulkItemIndex(index: number, item: BulkAddItem): number {
    return index;
  }
}

// import { Component, OnInit, inject, signal } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormsModule } from '@angular/forms';

// // PrimeNG 18 Imports
// import { TableModule } from 'primeng/table';
// import { ButtonModule } from 'primeng/button';
// import { SelectModule } from 'primeng/select';
// import { DialogModule } from 'primeng/dialog';
// import { InputTextModule } from 'primeng/inputtext';
// import { ToggleSwitchModule } from 'primeng/toggleswitch';
// import { InputNumberModule } from 'primeng/inputnumber';
// import { ToastModule } from 'primeng/toast';
// import { ConfirmDialogModule } from 'primeng/confirmdialog';
// import { TagModule } from 'primeng/tag';
// import { ToolbarModule } from 'primeng/toolbar';
// import { TooltipModule } from 'primeng/tooltip';

// import { ConfirmationService } from 'primeng/api';
// import { MasterApiService, Master } from '../../../../core/services/master-list.service';
// import { AppMessageService } from '../../../../core/utils/message.service';


// @Component({
//   selector: 'app-master-management',
//   standalone: true,
//   imports: [
//     CommonModule, FormsModule, TableModule, ButtonModule, SelectModule,
//     DialogModule, InputTextModule, InputTextModule, ToggleSwitchModule,
//     InputNumberModule, ToastModule, ConfirmDialogModule, TagModule, 
//     ToolbarModule, TooltipModule
//   ],
//   providers: [ConfirmationService],
//   templateUrl: './master-management.component.html',
//   styleUrls: ['./master-management.component.scss']
// })
// export class MasterManagementComponent implements OnInit {
// selectedTypeLabel() {
// throw new Error('Method not implemented.');
// }
// onGlobalFilter($event: Event) {
// throw new Error('Method not implemented.');
// }
//   private masterApi = inject(MasterApiService);
//   private messageService = inject(AppMessageService); // USING YOUR SERVICE
//   private confirmationService = inject(ConfirmationService);

//   masterTypes = signal<{label: string, value: string}[]>([]);
//   selectedType = signal<string>('');
//   masters = signal<Master[]>([]);
//   loading = signal<boolean>(false);

//   // Bulk Selection State
//   selectedMasters = signal<Master[]>([]);

//   // Dialog States
//   displayDialog = signal<boolean>(false);
//   isEditing = signal<boolean>(false);
//   displayBulkDialog = signal<boolean>(false);
  
//   // Single Item Form State
//   currentMaster = signal<Partial<Master>>({ metadata: { sortOrder: 0 }, isActive: true });
  
//   // Bulk Items Form State
//   bulkAddItems = signal<Partial<Master>[]>([]);

//   ngOnInit() {
//     this.loadMasterTypes();
//   }

//   loadMasterTypes() {
//     this.masterApi.getMasterTypes().subscribe({
//       next: (res) => {
//         if (res.data && res.data.length > 0) {
//           this.masterTypes.set(res.data);
//           this.selectedType.set(res.data[0].value);
//           this.loadMasters();
//         }
//       },
//       error: (err) => this.messageService.handleHttpError(err)
//     });
//   }

//   onTypeChange(event: any) {
//     this.selectedType.set(event.value);
//     this.selectedMasters.set([]); // Clear selection on type change
//     this.loadMasters();
//   }

//   loadMasters() {
//     const type = this.selectedType();
//     if (!type) return;
    
//     this.loading.set(true);
//     this.masterApi.getAllMasters({ params: { type } }).subscribe({
//       next: (res) => {
//         const dataArray = Array.isArray(res.data) ? res.data : (res as any).data?.docs || [];
//         this.masters.set(dataArray);
//         this.selectedMasters.set([]); 
//         this.loading.set(false);
//       },
//       error: (err) => {
//         this.messageService.handleHttpError(err);
//         this.loading.set(false);
//       }
//     });
//   }

//   // --- SINGLE OPERATIONS ---

//   openNew() {
//     this.isEditing.set(false);
//     this.currentMaster.set({ type: this.selectedType(), isActive: true, metadata: { sortOrder: this.masters().length + 1 } });
//     this.displayDialog.set(true);
//   }

//   editRecord(master: Master) {
//     this.isEditing.set(true);
//     this.currentMaster.set(JSON.parse(JSON.stringify(master)));
//     this.displayDialog.set(true);
//   }

//   saveRecord() {
//     const data = this.currentMaster();
//     if (!data.name || !data.code) {
//       this.messageService.showWarn('Name and Code are required');
//       return;
//     }

//     const request$ = (this.isEditing() && data._id) 
//       ? this.masterApi.updateMaster(data._id, data) 
//       : this.masterApi.createMaster(data);

//     request$.subscribe({
//       next: () => {
//         this.messageService.showSuccess(`Record successfully ${this.isEditing() ? 'updated' : 'created'}`);
//         this.displayDialog.set(false);
//         this.loadMasters();
//       },
//       error: (err) => this.messageService.handleHttpError(err)
//     });
//   }

//   toggleStatus(master: Master) {
//     if (!master._id) return;
//     this.masterApi.toggleActiveStatus(master._id).subscribe({
//       next: () => {
//         this.messageService.showSuccess('Status toggled successfully');
//         this.loadMasters();
//       },
//       error: (err) => this.messageService.handleHttpError(err)
//     });
//   }

//   deleteRecord(master: Master) {
//     this.confirmationService.confirm({
//       message: `Delete ${master.name}? This action cannot be undone.`,
//       header: 'Confirm Deletion',
//       icon: 'pi pi-exclamation-triangle',
//       acceptButtonStyleClass: 'p-button-danger',
//       accept: () => {
//         if (master._id) {
//           this.masterApi.deleteMaster(master._id).subscribe({
//             next: () => {
//               this.messageService.showSuccess('Record deleted');
//               this.loadMasters();
//             },
//             error: (err) => this.messageService.handleHttpError(err)
//           });
//         }
//       }
//     });
//   }

//   // --- BULK OPERATIONS ---

//   openBulkAdd() {
//     // Initialize with one empty row
//     this.bulkAddItems.set([{ type: this.selectedType(), isActive: true, metadata: { sortOrder: this.masters().length + 1 } }]);
//     this.displayBulkDialog.set(true);
//   }

//   addBulkRow() {
//     const currentLength = this.masters().length + this.bulkAddItems().length + 1;
//     this.bulkAddItems.update(items => [...items, { type: this.selectedType(), isActive: true, metadata: { sortOrder: currentLength } }]);
//   }

//   removeBulkRow(index: number) {
//     this.bulkAddItems.update(items => items.filter((_, i) => i !== index));
//   }

//   saveBulk() {
//     const items = this.bulkAddItems();
//     if (items.some(i => !i.name || !i.code)) {
//       this.messageService.showWarn('All rows must have a Name and Code');
//       return;
//     }

//     this.masterApi.bulkCreateMasters(items).subscribe({
//       next: () => {
//         this.messageService.showSuccess(`${items.length} records created successfully`);
//         this.displayBulkDialog.set(false);
//         this.loadMasters();
//       },
//       error: (err) => this.messageService.handleHttpError(err)
//     });
//   }

//   deleteSelected() {
//     const selected = this.selectedMasters();
//     if (selected.length === 0) return;

//     this.confirmationService.confirm({
//       message: `Are you sure you want to delete ${selected.length} records?`,
//       header: 'Confirm Bulk Deletion',
//       icon: 'pi pi-exclamation-triangle',
//       acceptButtonStyleClass: 'p-button-danger',
//       accept: () => {
//         const ids = selected.map(s => s._id).filter(id => id) as string[];
//         this.masterApi.bulkDeleteMasters(ids).subscribe({
//           next: () => {
//             this.messageService.showSuccess(`${ids.length} records deleted`);
//             this.loadMasters();
//           },
//           error: (err) => this.messageService.handleHttpError(err)
//         });
//       }
//     });
//   }
// }
