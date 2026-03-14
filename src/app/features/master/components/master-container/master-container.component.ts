import { Component, OnInit, computed, effect, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { catchError, finalize, of, tap } from 'rxjs';

// PrimeNG Services
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { CardModule } from 'primeng/card';
import { ToolbarModule } from 'primeng/toolbar';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ToggleSwitch } from 'primeng/toggleswitch';
import { MasterApiService, Master, MasterValue } from '../../../../core/services/master-list.service';
import { MasterValueDialogComponent } from '../master-value-dialog/master-value-dialog.component';
import { MasterValueGridComponent } from '../master-value-grid/master-value-grid.component';


// Services & Interfaces




@Component({
  selector: 'app-master-container',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ConfirmDialogModule,
    ToastModule,
    CardModule,
    ToolbarModule,
    ButtonModule,
    DialogModule, FormsModule,
    InputTextModule,
    SelectModule,
    ToggleSwitch,
    MasterValueGridComponent,
    MasterValueDialogComponent
  ],
  providers: [MessageService, ConfirmationService, DatePipe],
  templateUrl: './master-container.component.html'
})
export class MasterContainerComponent implements OnInit {
  // Services
  private masterApi = inject(MasterApiService);
  private fb = inject(FormBuilder);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  // --- State Management (Signals) ---
  allMasters = signal<Master[]>([]);
  loading = signal<boolean>(false);
  selectedMasterId = signal<string>('');
  selectedMasterCategory = signal<string>('');

  // Dialog Visibility
  showMasterDialog = signal<boolean>(false);
  showValueDialog = signal<boolean>(false);

  // Editing State
  editingMaster = signal<Master | null>(null);
  editingValue = signal<MasterValue | null>(null);

  // Filters
  valueFilterStatus = signal<string>('');
  valueSearchText = signal<string>('');

  masterCategories = [
    { label: 'System', value: 'SYSTEM' },
    { label: 'Content', value: 'CONTENT' },
    { label: 'Education', value: 'EDUCATION' },
    { label: 'User', value: 'USER' },
    { label: 'Business', value: 'BUSINESS' },
    { label: 'Settings', value: 'SETTINGS' }
  ];

  // --- Computed Values ---
  selectedMasterDetails = computed(() => {
    return this.allMasters().find(m => m._id === this.selectedMasterId()) || null;
  });

  filteredMasters = computed(() => {
    const category = this.selectedMasterCategory();
    if (!category) return this.allMasters();
    return this.allMasters().filter(m => m.category === category);
  });

  filteredValues = computed(() => {
    const master = this.selectedMasterDetails();
    if (!master || !master.values) return [];

    let values = [...master.values];

    // Status Filter
    if (this.valueFilterStatus()) {
      values = values.filter(v => {
        if (this.valueFilterStatus() === 'published') return v.isPublished;
        if (this.valueFilterStatus() === 'draft') return !v.isPublished;
        if (this.valueFilterStatus() === 'system') return v.isSystem;
        return true;
      });
    }

    // Search Filter
    if (this.valueSearchText()) {
      const search = this.valueSearchText().toLowerCase();
      values = values.filter(v =>
        v.value?.toLowerCase().includes(search) ||
        v.label?.toLowerCase().includes(search) ||
        v.description?.toLowerCase().includes(search)
      );
    }

    return values;
  });

  // --- Forms ---
  // Master Form remains here because this component manages Master-level CRUD
  masterForm: FormGroup = this.fb.group({
    masterName: ['', [Validators.required, Validators.pattern('^[A-Z_]+$')]],
    displayName: ['', Validators.required],
    description: [''],
    category: ['BUSINESS'],
    isHierarchical: [false],
    allowMultiple: [true],
    hasMetadata: [true],
    isTranslatable: [false]
  });

  constructor() {
    // Reset filters when changing masters
    effect(() => {
      const master = this.selectedMasterDetails();
      if (master) {
        this.valueSearchText.set('');
        this.valueFilterStatus.set('');
      }
    }, { allowSignalWrites: true });
  }

  ngOnInit(): void {
    this.loadMasters();
  }

  // ==================== DATA API ====================

  loadMasters(): void {
    this.loading.set(true);
    this.masterApi.getAllMasters().pipe(
      tap((res: any) => {
        const masters = res.data;
        this.allMasters.set(masters);

        // Restore selection if exists but ensure it's still in the list
        if (this.selectedMasterId()) {
          const exists = masters.some((m: Master) => m._id === this.selectedMasterId());
          if (!exists) this.selectedMasterId.set('');
        }
      }),
      catchError(err => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load masters', life: 3000 });
        return of(null);
      }),
      finalize(() => this.loading.set(false))
    ).subscribe();
  }

  selectMaster(master: Master): void {
    if (master._id) {
      this.selectedMasterId.set(master._id);
    }
  }

  // ==================== MASTER CRUD ====================

  openNewMasterDialog(): void {
    this.editingMaster.set(null);
    this.masterForm.reset({
      category: this.selectedMasterCategory() || 'BUSINESS',
      isHierarchical: false,
      allowMultiple: true,
      hasMetadata: true,
      isTranslatable: false
    });
    this.showMasterDialog.set(true);
  }

  editMaster(master: Master): void {
    this.editingMaster.set(master);
    this.masterForm.patchValue({
      masterName: master.masterName,
      displayName: master.displayName,
      description: master.description,
      category: master.category,
      isHierarchical: master.config?.isHierarchical || false,
      allowMultiple: master.config?.allowMultiple || true,
      hasMetadata: master.config?.hasMetadata || true,
      isTranslatable: master.config?.isTranslatable || false
    });
    this.showMasterDialog.set(true);
  }

  saveMaster(): void {
    if (this.masterForm.invalid) return;

    const formData = this.masterForm.value;
    const masterData: Partial<Master> = {
      masterName: formData.masterName,
      displayName: formData.displayName,
      description: formData.description,
      category: formData.category,
      config: {
        isHierarchical: formData.isHierarchical,
        allowMultiple: formData.allowMultiple,
        hasMetadata: formData.hasMetadata,
        isTranslatable: formData.isTranslatable
      }
    };

    const currentEdit = this.editingMaster();
    const request$ = currentEdit && currentEdit._id
      ? this.masterApi.updateMaster(currentEdit._id, masterData)
      : this.masterApi.createMaster(masterData);

    request$.pipe(
      tap(() => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: `Master ${currentEdit ? 'updated' : 'created'} successfully`
        });
        this.showMasterDialog.set(false);
        this.loadMasters();
      }),
      catchError((err) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Failed to save master' });
        return of(null);
      })
    ).subscribe();
  }

  deleteMaster(master: Master): void {
    if (master.isSystem) {
      this.messageService.add({ severity: 'warn', summary: 'Cannot Delete', detail: 'System masters cannot be deleted' });
      return;
    }

    this.confirmationService.confirm({
      message: `Are you sure you want to delete "${master.displayName}"?`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.masterApi.deleteMaster(master._id!).pipe(
          tap(() => {
            this.messageService.add({ severity: 'success', summary: 'Deleted', detail: 'Master deleted successfully' });
            if (this.selectedMasterId() === master._id) this.selectedMasterId.set('');
            this.loadMasters();
          })
        ).subscribe();
      }
    });
  }

  // ==================== VALUE EVENT HANDLERS ====================

  openNewValueDialog(): void {
    this.editingValue.set(null);
    this.showValueDialog.set(true);
  }

  handleEditValue(value: MasterValue): void {
    this.editingValue.set(value);
    this.showValueDialog.set(true);
  }

  handleSaveValue(valueData: Partial<MasterValue>): void {
    const masterId = this.selectedMasterId();
    if (!masterId) return;

    const currentEdit = this.editingValue();
    const request$ = currentEdit && currentEdit._id
      ? this.masterApi.updateValue(masterId, currentEdit._id, valueData)
      : this.masterApi.addValue(masterId, valueData);

    request$.pipe(
      tap(() => {
        this.messageService.add({ severity: 'success', summary: 'Success', detail: `Value ${currentEdit ? 'updated' : 'added'} successfully` });
        this.showValueDialog.set(false);
        this.loadMasters();
      }),
      catchError((err) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Failed to save value' });
        return of(null);
      })
    ).subscribe();
  }

  handleDeleteValue(value: MasterValue): void {
    const masterId = this.selectedMasterId();
    if (!masterId || !value._id) return;

    if (value.isSystem) {
      this.messageService.add({ severity: 'warn', summary: 'Cannot Delete', detail: 'System values cannot be deleted' });
      return;
    }

    this.confirmationService.confirm({
      message: `Are you sure you want to delete value "${value.label}"?`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.masterApi.deleteValue(masterId, value._id!).pipe(
          tap(() => {
            this.messageService.add({ severity: 'success', summary: 'Deleted', detail: 'Value deleted successfully' });
            this.loadMasters();
          })
        ).subscribe();
      }
    });
  }
}