// components/master-data-grid.component.ts
import { Component, OnInit, inject, signal, computed, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { tap, catchError, of, finalize } from 'rxjs';

// PrimeNG Imports
import { TableModule, Table } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { MultiSelectModule } from 'primeng/multiselect';
import { TagModule } from 'primeng/tag';
import { ChipModule } from 'primeng/chip';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { DialogModule } from 'primeng/dialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { SplitButtonModule } from 'primeng/splitbutton';
import { MenuModule } from 'primeng/menu';
import { FileUploadModule } from 'primeng/fileupload';
import { ProgressBarModule } from 'primeng/progressbar';
import { SkeletonModule } from 'primeng/skeleton';
import { BadgeModule } from 'primeng/badge';
import { ColorPickerModule } from 'primeng/colorpicker';
import { MessageService, ConfirmationService } from 'primeng/api';
import { AccordionModule } from 'primeng/accordion';
import { OverlayModule } from 'primeng/overlay';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { CheckboxModule } from 'primeng/checkbox';
import { TooltipModule } from 'primeng/tooltip';
import { Master, MasterApiService, MasterValue } from '../../../core/services/master-list.service';


export interface MasterValueExtended extends MasterValue {
  description?: string;
  parentValue?: string;
  metadata?: { icon?: string; color?: string; sortOrder?: number };
  isPublished?: boolean;
  isDefault?: boolean;
  isSystem?: boolean;
  isActive?: boolean;
}

@Component({
  selector: 'app-master-data-grid',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    SelectModule,
    MultiSelectModule,
    TagModule,
    ChipModule,
    IconFieldModule,
    InputIconModule,
    DialogModule,
    ConfirmDialogModule,
    ToastModule,
    ToolbarModule,
    SplitButtonModule,
    MenuModule,
    FileUploadModule,
    ProgressBarModule,
    SkeletonModule,
    BadgeModule,
    OverlayModule,
    ColorPickerModule,
    ToggleSwitchModule,
    AccordionModule,
    CheckboxModule,
    TooltipModule
  ],
  providers: [MessageService, ConfirmationService, DatePipe],
  template: `
    <div class="card">
      <p-toolbar styleClass="mb-4">
        <ng-template pTemplate="start">
          <div class="flex flex-wrap gap-2">
            <p-button 
              label="New Master" 
              icon="pi pi-plus" 
              severity="success" 
              (onClick)="openNewMasterDialog()"
              [disabled]="!selectedMasterCategory()"
            />
            <p-button 
              label="Import" 
              icon="pi pi-upload" 
              severity="help" 
              (onClick)="importFileUpload.click()"
              [disabled]="!selectedMaster()"
            />
            <p-button 
              label="Export" 
              icon="pi pi-download" 
              severity="info" 
              (onClick)="exportData()"
              [disabled]="!selectedMaster()"
            />
          </div>
        </ng-template>
        
        <ng-template pTemplate="end">
          <div class="flex gap-2">
            <p-select
              [(ngModel)]="selectedMasterCategory"
              [options]="masterCategories"
              optionLabel="label"
              optionValue="value"
              placeholder="Filter by Category"
              class="w-48"
              (onChange)="filterByCategory()"
            />
            <p-select
              [(ngModel)]="selectedMaster"
              [options]="filteredMasters()"
              optionLabel="displayName"
              optionValue="_id"
              placeholder="Select Master"
              class="w-64"
              (onChange)="onMasterSelect()"
            />
          </div>
        </ng-template>
      </p-toolbar>

      <div class="grid">
        <div class="col-12 md:col-4">
          <div class="card">
            <h3>Master Types</h3>
            
            <p-iconfield iconPosition="left" class="mb-3 block w-full">
              <p-inputicon styleClass="pi pi-search"></p-inputicon>
              <input 
                pInputText 
                type="text" 
                [(ngModel)]="masterSearchValue" 
                placeholder="Search masters..." 
                class="w-full"
              />
            </p-iconfield>

            <p-accordion [multiple]="true" [value]="expandedMasters()">
              <p-accordion-panel *ngFor="let master of displayedMasters(); let i = index" [value]="i">
                <p-accordion-header>
                  <div class="flex justify-between items-center w-full">
                    <span class="font-bold">{{ master.displayName || master.masterName }}</span>
                    <div class="flex gap-2 ml-auto items-center pr-3">
                      <p-tag 
                        [value]="master.isPublished ? 'Published' : 'Draft'" 
                        [severity]="master.isPublished ? 'success' : 'info'"
                        size="small"
                      />
                    </div>
                  </div>
                </p-accordion-header>
                
                <p-accordion-content>
                  <div class="flex gap-2 mb-3">
                    <p-button 
                      icon="pi pi-pencil" 
                      severity="info" 
                      size="small" 
                      (onClick)="editMaster(master)"
                      pTooltip="Edit Master"
                      tooltipPosition="top"
                    />
                    <p-button 
                      *ngIf="!master.isPublished"
                      icon="pi pi-check-circle" 
                      severity="success" 
                      size="small" 
                      (onClick)="publishMaster(master)"
                      pTooltip="Publish"
                      tooltipPosition="top"
                    />
                    <p-button 
                      *ngIf="master.isPublished"
                      icon="pi pi-ban" 
                      severity="warn" 
                      size="small" 
                      (onClick)="unpublishMaster(master)"
                      pTooltip="Unpublish"
                      tooltipPosition="top"
                    />
                    <p-button 
                      icon="pi pi-trash" 
                      severity="danger" 
                      size="small" 
                      (onClick)="deleteMaster(master)"
                      pTooltip="Delete"
                      tooltipPosition="top"
                    />
                  </div>

                  <p-table 
                    [value]="master.values || []" 
                    [rows]="5"
                    [paginator]="true"
                    [globalFilterFields]="['value', 'label', 'description']"
                    #valuesTable
                  >
                    <ng-template pTemplate="caption">
                      <div class="flex justify-between items-center">
                        <span class="font-semibold">Values</span>
                        <p-iconfield iconPosition="left">
                          <p-inputicon styleClass="pi pi-search"></p-inputicon>
                          <input 
                            pInputText 
                            type="text" 
                            (input)="valuesTable.filterGlobal($any($event.target).value, 'contains')" 
                            placeholder="Search values..." 
                            size="30"
                          />
                        </p-iconfield>
                      </div>
                    </ng-template>
                    
                    <ng-template pTemplate="header">
                      <tr>
                        <th>Value</th>
                        <th>Label</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </ng-template>
                    
                    <ng-template pTemplate="body" let-value>
                      <tr>
                        <td><span class="font-mono">{{ value.value }}</span></td>
                        <td>
                          <div class="flex items-center gap-2">
                            <span *ngIf="value.metadata?.icon" class="text-xl">{{ value.metadata.icon }}</span>
                            <span [style.color]="value.metadata?.color">{{ value.label }}</span>
                          </div>
                        </td>
                        <td>
                          <div class="flex flex-wrap gap-1">
                            <p-tag *ngIf="value.isPublished" value="Published" severity="success" size="small"/>
                            <p-tag *ngIf="!value.isPublished" value="Draft" severity="info" size="small"/>
                            <p-tag *ngIf="value.isSystem" value="System" severity="secondary" size="small"/>
                          </div>
                        </td>
                        <td>
                          <div class="flex gap-2">
                            <p-button 
                              icon="pi pi-pencil" 
                              size="small" 
                              severity="info" 
                              (onClick)="editValue(master, value)"
                              pTooltip="Edit"
                            />
                            <p-button 
                              *ngIf="!value.isSystem"
                              icon="pi pi-trash" 
                              size="small" 
                              severity="danger" 
                              (onClick)="deleteValue(master._id!, value._id!)"
                              pTooltip="Delete"
                            />
                          </div>
                        </td>
                      </tr>
                    </ng-template>
                    <ng-template pTemplate="emptymessage">
                      <tr><td colspan="4" class="text-center p-4">No values found</td></tr>
                    </ng-template>
                  </p-table>

                  <div class="mt-3">
                    <p-button label="Add Value" icon="pi pi-plus" size="small" (onClick)="openNewValueDialog(master)"/>
                  </div>
                </p-accordion-content>
              </p-accordion-panel>
            </p-accordion>
          </div>
        </div>

        <div class="col-12 md:col-8" *ngIf="selectedMasterDetails() as master">
          <div class="card">
            <div class="flex justify-between items-center mb-4">
              <h3>{{ master.displayName || master.masterName }} - Details</h3>
              <div class="flex gap-2">
                <p-button label="Edit Master" icon="pi pi-pencil" size="small" (onClick)="editMaster(master)"/>
                <p-button label="Add Value" icon="pi pi-plus" size="small" (onClick)="openNewValueDialog(master)"/>
              </div>
            </div>

            <div class="grid mb-4">
              <div class="col-6">
                <div class="field">
                  <label class="font-bold">Master Name</label>
                  <p>{{ master.masterName }}</p>
                </div>
              </div>
              <div class="col-6">
                <div class="field">
                  <label class="font-bold">Display Name</label>
                  <p>{{ master.displayName || '-' }}</p>
                </div>
              </div>
              <div class="col-12">
                <div class="field">
                  <label class="font-bold">Description</label>
                  <p>{{ master.description || '-' }}</p>
                </div>
              </div>
              <div class="col-6">
                <div class="field">
                  <label class="font-bold">Category</label>
                  <p-tag [value]="master.category || 'None'" severity="info" />
                </div>
              </div>
              <div class="col-6">
                <div class="field">
                  <label class="font-bold">Status</label>
                  <div class="flex gap-2">
                    <p-tag [value]="master.isPublished ? 'Published' : 'Draft'" [severity]="master.isPublished ? 'success' : 'info'"/>
                    <p-tag *ngIf="master.isSystem" value="System" severity="secondary"/>
                    <p-tag *ngIf="master.isLocked" value="Locked" severity="warn"/>
                  </div>
                </div>
              </div>
            </div>

            <p-table 
              [value]="master.values || []" 
              [rows]="10"
              [paginator]="true"
              [globalFilterFields]="['value', 'label', 'description']"
              #detailsTable
            >
              <ng-template pTemplate="caption">
                <div class="flex justify-between items-center">
                  <span class="font-semibold text-lg">Master Values</span>
                  <p-iconfield iconPosition="left">
                    <p-inputicon styleClass="pi pi-search"></p-inputicon>
                    <input pInputText type="text" (input)="detailsTable.filterGlobal($any($event.target).value, 'contains')" placeholder="Search values..." size="30"/>
                  </p-iconfield>
                </div>
              </ng-template>
              
              <ng-template pTemplate="header">
                <tr>
                  <th>Value</th>
                  <th>Label</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </ng-template>
              
              <ng-template pTemplate="body" let-value>
                <tr>
                  <td><span class="font-mono">{{ value.value }}</span></td>
                  <td>
                    <div class="flex items-center gap-2">
                      <span *ngIf="value.metadata?.icon" class="text-xl">{{ value.metadata.icon }}</span>
                      <span [style.color]="value.metadata?.color">{{ value.label }}</span>
                    </div>
                  </td>
                  <td>{{ value.description || '-' }}</td>
                  <td>
                    <div class="flex flex-wrap gap-1">
                      <p-tag *ngIf="value.isPublished" value="Published" severity="success" size="small"/>
                      <p-tag *ngIf="!value.isPublished" value="Draft" severity="info" size="small"/>
                      <p-tag *ngIf="value.isSystem" value="System" severity="secondary" size="small"/>
                    </div>
                  </td>
                  <td>
                    <div class="flex gap-2">
                      <p-button icon="pi pi-pencil" size="small" severity="info" (onClick)="editValue(master, value)" pTooltip="Edit"/>
                      <p-button *ngIf="!value.isPublished" icon="pi pi-check-circle" size="small" severity="success" (onClick)="publishValue(master._id!, value._id!)" pTooltip="Publish"/>
                      <p-button *ngIf="value.isPublished && !value.isSystem" icon="pi pi-ban" size="small" severity="warn" (onClick)="unpublishValue(master._id!, value._id!)" pTooltip="Unpublish"/>
                      <p-button *ngIf="!value.isSystem" icon="pi pi-trash" size="small" severity="danger" (onClick)="deleteValue(master._id!, value._id!)" pTooltip="Delete"/>
                    </div>
                  </td>
                </tr>
              </ng-template>
              <ng-template pTemplate="emptymessage">
                <tr><td colspan="5" class="text-center p-4">No values found</td></tr>
              </ng-template>
            </p-table>
          </div>
        </div>
      </div>
    </div>

    <p-dialog 
      [(visible)]="showMasterDialog" 
      [style]="{ width: '500px' }"
      [header]="masterDialogTitle()"
      [modal]="true"
    >
      <form [formGroup]="masterForm">
        <div class="field mb-3">
          <label for="masterName" class="block mb-1">Master Name (Uppercase)*</label>
          <input 
            pInputText 
            id="masterName" 
            formControlName="masterName" 
            class="w-full uppercase"
            [class.ng-invalid]="masterForm.get('masterName')?.invalid && masterForm.get('masterName')?.touched"
          />
        </div>

        <div class="field mb-3">
          <label for="displayName" class="block mb-1">Display Name *</label>
          <input pInputText id="displayName" formControlName="displayName" class="w-full"/>
        </div>

        <div class="field mb-3">
          <label for="description" class="block mb-1">Description</label>
          <textarea pInputTextarea id="description" formControlName="description" rows="3" class="w-full"></textarea>
        </div>

        <div class="field mb-3">
          <label for="category" class="block mb-1">Category</label>
          <p-select id="category" formControlName="category" [options]="masterCategories" optionLabel="label" optionValue="value" placeholder="Select Category" class="w-full"/>
        </div>

        <div class="field-checkbox mb-3 flex items-center">
          <p-checkbox inputId="isHierarchical" formControlName="isHierarchical" [binary]="true"/>
          <label for="isHierarchical" class="ml-2">Allow Hierarchical Values</label>
        </div>
      </form>

      <ng-template pTemplate="footer">
        <p-button label="Cancel" icon="pi pi-times" (onClick)="hideMasterDialog()" text />
        <p-button label="Save" icon="pi pi-check" (onClick)="saveMaster()" [disabled]="masterForm.invalid"/>
      </ng-template>
    </p-dialog>

    <p-dialog 
      [(visible)]="showValueDialog" 
      [style]="{ width: '500px' }"
      [header]="valueDialogTitle()"
      [modal]="true"
    >
      <form [formGroup]="valueForm" *ngIf="selectedMasterForValue()">
        <div class="field mb-3">
          <label for="value" class="block mb-1">Value (Unique Code)*</label>
          <input pInputText id="value" formControlName="value" class="w-full" />
        </div>

        <div class="field mb-3">
          <label for="label" class="block mb-1">Display Label *</label>
          <input pInputText id="label" formControlName="label" class="w-full" />
        </div>

        <div class="field mb-3">
          <label for="description" class="block mb-1">Description</label>
          <textarea pInputTextarea id="description" formControlName="description" rows="2" class="w-full"></textarea>
        </div>

        <p-accordion value="metadata" class="mb-3 block">
          <p-accordion-panel value="metadata">
            <p-accordion-header>Appearance & Metadata</p-accordion-header>
            <p-accordion-content>
              <div class="field mb-3">
                <label for="icon" class="block mb-1">Icon Class</label>
                <input pInputText id="icon" formControlName="icon" class="w-full" placeholder="e.g., pi pi-star"/>
              </div>

              <div class="field mb-3">
                <label for="color" class="block mb-1">Color Code</label>
                <p-colorPicker id="color" formControlName="color" [inline]="false"/>
              </div>

              <div class="field mb-3">
                <label for="sortOrder" class="block mb-1">Sort Order</label>
                <p-inputNumber inputId="sortOrder" formControlName="sortOrder" class="w-full"/>
              </div>
            </p-accordion-content>
          </p-accordion-panel>
        </p-accordion>

        <div class="flex gap-4">
          <div class="field-checkbox mb-3 flex items-center">
            <p-checkbox inputId="isPublished" formControlName="isPublished" [binary]="true"/>
            <label for="isPublished" class="ml-2">Published</label>
          </div>
        </div>
      </form>

      <ng-template pTemplate="footer">
        <p-button label="Cancel" icon="pi pi-times" (onClick)="hideValueDialog()" text />
        <p-button label="Save" icon="pi pi-check" (onClick)="saveValue()" [disabled]="valueForm.invalid"/>
      </ng-template>
    </p-dialog>

    <input #importFileUpload type="file" accept=".json,.csv" style="display: none" (change)="onFileSelected($event)"/>
    <p-confirmDialog />
    <p-toast />
  `,
  styles: [`
    :host ::ng-deep {
      .p-accordion .p-accordion-header .p-accordion-header-link {
        padding: 1rem;
      }
      
      .p-accordion .p-accordion-content {
        padding: 1.5rem;
      }
    }
  `]
})
export class MasterDataGridComponent implements OnInit {
  private masterApi = inject(MasterApiService);
  private fb = inject(FormBuilder);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  allMasters = signal<any[]>([]);
  filteredMasters = signal<any[]>([]);
  loading = signal<boolean>(false);
  masterSearchValue = signal<string>('');

  selectedMasterCategory = signal<string>('');
  selectedMaster = signal<string>('');
  
  selectedMasterDetails = computed(() => {
    return this.allMasters().find(m => m._id === this.selectedMaster());
  });

  expandedMasters = signal<number[]>([]);
  showMasterDialog = signal<boolean>(false);
  showValueDialog = signal<boolean>(false);
  
  editingMaster = signal<any | null>(null);
  editingValue = signal<{ master: any; value: MasterValueExtended } | null>(null);
  selectedMasterForValue = signal<any | null>(null);

  masterCategories = [
    { label: 'System', value: 'SYSTEM' },
    { label: 'Business', value: 'BUSINESS' },
    { label: 'Education', value: 'EDUCATION' },
    { label: 'User', value: 'USER' },
    { label: 'Settings', value: 'SETTINGS' }
  ];

  masterForm: FormGroup = this.fb.group({
    masterName: ['', [Validators.required]], // Let user type, backend converts to UPPERCASE
    displayName: ['', Validators.required],
    description: [''],
    category: ['BUSINESS'],
    isHierarchical: [false]
  });

  valueForm: FormGroup = this.fb.group({
    value: ['', Validators.required],
    label: ['', Validators.required],
    description: [''],
    icon: [''],
    color: [''],
    sortOrder: [0],
    isPublished: [true]
  });

  masterDialogTitle = computed(() => this.editingMaster() ? 'Edit Master' : 'Create New Master');
  valueDialogTitle = computed(() => this.editingValue() ? 'Edit Value' : 'Add New Value');

  displayedMasters = computed(() => {
    const search = this.masterSearchValue().toLowerCase();
    if (!search) return this.filteredMasters();
    
    return this.filteredMasters().filter(m => 
      m.displayName?.toLowerCase().includes(search) ||
      m.masterName?.toLowerCase().includes(search)
    );
  });

  ngOnInit(): void {
    this.loadMasters();
  }

  // ==================== MASTER CRUD ====================
loadMasters(): void {
    this.loading.set(true);
    this.masterApi.getAllMasters().pipe(
      tap((res: any) => {
        // Grab the 'data' array out of your JSON response wrapper
        const masters = res.data || []; 
        
        this.allMasters.set(masters);
        // If there's an active category filter, re-apply it
        this.filterByCategory(); 
      }),
      catchError(err => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load masters' });
        return of(null);
      }),
      finalize(() => this.loading.set(false))
    ).subscribe();
  }
  
  filterByCategory(): void {
    const category = this.selectedMasterCategory();
    if (category) {
      this.filteredMasters.set(this.allMasters().filter(m => m.category === category));
    } else {
      this.filteredMasters.set(this.allMasters());
    }
  }

  onMasterSelect(): void {
    const masterId = this.selectedMaster();
    const index = this.allMasters().findIndex(m => m._id === masterId);
    if (index >= 0) this.expandedMasters.set([index]);
  }

  openNewMasterDialog(): void {
    this.editingMaster.set(null);
    this.masterForm.reset({ category: this.selectedMasterCategory() || 'BUSINESS', isHierarchical: false });
    this.showMasterDialog.set(true);
  }

  editMaster(master: any): void {
    this.editingMaster.set(master);
    this.masterForm.patchValue({
      masterName: master.masterName,
      displayName: master.displayName,
      description: master.description,
      category: master.category,
      isHierarchical: master.config?.isHierarchical || false
    });
    this.showMasterDialog.set(true);
  }

  hideMasterDialog(): void {
    this.showMasterDialog.set(false);
  }

  saveMaster(): void {
    if (this.masterForm.invalid) return;

    const formData = this.masterForm.value;
    const masterData: Partial<any> = {
      masterName: formData.masterName,
      displayName: formData.displayName,
      description: formData.description,
      category: formData.category,
      config: { isHierarchical: formData.isHierarchical, allowMultiple: true, hasMetadata: true }
    };

    const request$ = this.editingMaster()
      ? this.masterApi.updateMaster(this.editingMaster()!._id!, masterData)
      : this.masterApi.createMaster(masterData);

    request$.pipe(
      tap(() => {
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Master saved successfully' });
        this.hideMasterDialog();
        this.loadMasters(); // Refresh data from backend
      }),
      catchError((err) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Failed to save master' });
        return of(null);
      })
    ).subscribe();
  }

  publishMaster(master: any): void {
    this.masterApi.publishMaster(master._id!).pipe(
      tap(() => {
        this.messageService.add({ severity: 'success', summary: 'Published', detail: 'Master published' });
        this.loadMasters();
      })
    ).subscribe();
  }

  unpublishMaster(master: any): void {
    this.masterApi.unpublishMaster(master._id!).pipe(
      tap(() => {
        this.messageService.add({ severity: 'success', summary: 'Unpublished', detail: 'Master unpublished' });
        this.loadMasters();
      })
    ).subscribe();
  }

  deleteMaster(master: any): void {
    this.confirmationService.confirm({
      message: `Delete "${master.displayName || master.masterName}"?`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.masterApi.deleteMaster(master._id!).pipe(
          tap(() => {
            this.messageService.add({ severity: 'success', summary: 'Deleted', detail: 'Master deleted' });
            this.loadMasters();
          })
        ).subscribe();
      }
    });
  }

  // ==================== MASTER VALUES CRUD ====================

  openNewValueDialog(master: any): void {
    this.selectedMasterForValue.set(master);
    this.editingValue.set(null);
    this.valueForm.reset({ sortOrder: 0, isPublished: true });
    this.showValueDialog.set(true);
  }

  editValue(master: any, value: MasterValueExtended): void {
    this.selectedMasterForValue.set(master);
    this.editingValue.set({ master, value });
    this.valueForm.patchValue({
      value: value.value,
      label: value.label,
      description: value.description,
      icon: value.metadata?.icon || '',
      color: value.metadata?.color || '',
      sortOrder: value.metadata?.sortOrder || 0,
      isPublished: value.isPublished !== false // Default to true if undefined
    });
    this.showValueDialog.set(true);
  }

  hideValueDialog(): void {
    this.showValueDialog.set(false);
  }

  saveValue(): void {
    if (this.valueForm.invalid || !this.selectedMasterForValue()) return;

    const formData = this.valueForm.value;
    const masterId = this.selectedMasterForValue()!._id!;
    
    // Construct the payload based on your backend model
    const valueData: any = {
      value: formData.value,
      label: formData.label,
      description: formData.description,
      isPublished: formData.isPublished,
      metadata: {
        icon: formData.icon,
        color: formData.color,
        sortOrder: formData.sortOrder
      }
    };

    // Use updateValue if editing (requires both master ID and value ID), else addValue
    const request$ = this.editingValue()
      ? this.masterApi.updateValue(masterId, this.editingValue()!.value._id!, valueData)
      : this.masterApi.addValue(masterId, valueData);

    request$.pipe(
      tap(() => {
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Value saved successfully' });
        this.hideValueDialog();
        this.loadMasters(); // Refresh grid to show new value
      }),
      catchError((err) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Failed to save value' });
        return of(null);
      })
    ).subscribe();
  }

  publishValue(masterId: string, valueId: string): void {
    this.masterApi.publishValue(masterId, valueId).pipe(
      tap(() => {
        this.messageService.add({ severity: 'success', summary: 'Published', detail: 'Value published' });
        this.loadMasters();
      })
    ).subscribe();
  }

  unpublishValue(masterId: string, valueId: string): void {
    this.masterApi.unpublishValue(masterId, valueId).pipe(
      tap(() => {
        this.messageService.add({ severity: 'success', summary: 'Unpublished', detail: 'Value unpublished' });
        this.loadMasters();
      })
    ).subscribe();
  }

  deleteValue(masterId: string, valueId: string): void {
    this.confirmationService.confirm({
      message: 'Are you sure you want to delete this value?',
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.masterApi.deleteValue(masterId, valueId).pipe(
          tap(() => {
            this.messageService.add({ severity: 'success', summary: 'Deleted', detail: 'Value deleted' });
            this.loadMasters();
          })
        ).subscribe();
      }
    });
  }

  // ==================== IMPORT / EXPORT ====================

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (!file || !this.selectedMaster()) return;

    const formData = new FormData();
    formData.append('file', file);

    this.masterApi.importValues(this.selectedMaster(), formData).pipe(
      tap(() => {
        this.messageService.add({ severity: 'success', summary: 'Imported', detail: 'Values imported successfully' });
        this.loadMasters();
      }),
      catchError(() => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to import values' });
        return of(null);
      })
    ).subscribe();
    
    // Reset input
    event.target.value = null;
  }

  exportData(): void {
    if (!this.selectedMaster()) return;

    this.masterApi.exportValues(this.selectedMaster(), { params: { format: 'json' } }).pipe(
      tap(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `master-${this.selectedMaster()}-export.json`;
        a.click();
        window.URL.revokeObjectURL(url);
      })
    ).subscribe();
  }
}




// // components/master-data-grid.component.ts
// import { Component, OnInit, inject, signal, computed, ViewChild, AfterViewInit } from '@angular/core';
// import { CommonModule, DatePipe } from '@angular/common';
// import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
// import { tap, catchError, of, finalize } from 'rxjs';

// // PrimeNG Imports
// import { TableModule, Table } from 'primeng/table';
// import { ButtonModule } from 'primeng/button';
// import { InputTextModule } from 'primeng/inputtext';
// import { InputNumberModule } from 'primeng/inputnumber';
// import { SelectModule } from 'primeng/select';
// import { MultiSelectModule } from 'primeng/multiselect';
// import { TagModule } from 'primeng/tag';
// import { ChipModule } from 'primeng/chip';
// import { IconFieldModule } from 'primeng/iconfield';
// import { InputIconModule } from 'primeng/inputicon';
// import { DialogModule } from 'primeng/dialog';
// import { ConfirmDialogModule } from 'primeng/confirmdialog';
// import { ToastModule } from 'primeng/toast';
// import { ToolbarModule } from 'primeng/toolbar';
// import { SplitButtonModule } from 'primeng/splitbutton';
// import { MenuModule } from 'primeng/menu';
// import { FileUploadModule } from 'primeng/fileupload';
// import { ProgressBarModule } from 'primeng/progressbar';
// import { SkeletonModule } from 'primeng/skeleton';
// import { BadgeModule } from 'primeng/badge';
// import { ColorPickerModule } from 'primeng/colorpicker';
// import { MessageService, ConfirmationService } from 'primeng/api';
// import { AccordionModule } from 'primeng/accordion';
// import { OverlayModule } from 'primeng/overlay';
// import { ToggleSwitchModule } from 'primeng/toggleswitch';
// import { CheckboxModule } from 'primeng/checkbox';
// import { TooltipModule } from 'primeng/tooltip';

// // --- MOCK INTERFACES & SERVICES (Replace with your actual imports) ---
// export interface MasterValue {
//   _id?: string;
//   value: string;
//   label: string;
//   description?: string;
//   parentValue?: string;
//   metadata?: { icon?: string; color?: string; sortOrder?: number };
//   isPublished?: boolean;
//   isDefault?: boolean;
//   isSystem?: boolean;
//   isActive?: boolean;
// }

// export interface Master {
//   _id?: string;
//   masterName: string;
//   displayName: string;
//   description?: string;
//   category: string;
//   isPublished?: boolean;
//   isSystem?: boolean;
//   isLocked?: boolean;
//   stats?: { totalValues: number; publishedValues: number; activeValues: number };
//   config?: { isHierarchical: boolean; allowMultiple: boolean; hasMetadata: boolean };
//   values?: MasterValue[];
// }

// export interface any extends Master {
//   _expanded?: boolean;
// }

// export class MasterApiService {
//   getAllMasters() { return of({ data: [] }); }
//   createMaster(data: any) { return of({}); }
//   updateMaster(id: string, data: any) { return of({}); }
//   publishMaster(id: string) { return of({}); }
//   unpublishMaster(id: string) { return of({}); }
//   deleteMaster(id: string) { return of({}); }
//   addValue(masterId: string, data: any) { return of({}); }
//   updateValue(masterId: string, valueId: string, data: any) { return of({}); }
//   publishValue(masterId: string, valueId: string) { return of({}); }
//   unpublishValue(masterId: string, valueId: string) { return of({}); }
//   deleteValue(masterId: string, valueId: string) { return of({}); }
//   importValues(masterId: string, formData: FormData) { return of({}); }
//   exportValues(masterId: string, options: any) { return of(new Blob()); }
// }
// // ---------------------------------------------------------------------

// @Component({
//   selector: 'app-master-data-grid',
//   standalone: true,
//   imports: [
//     CommonModule,
//     FormsModule,
//     ReactiveFormsModule,
//     TableModule,
//     ButtonModule,
//     InputTextModule,
//     InputNumberModule,
//     SelectModule,
//     MultiSelectModule,
//     TagModule,
//     ChipModule,
//     IconFieldModule,
//     InputIconModule,
//     DialogModule,
//     ConfirmDialogModule,
//     ToastModule,
//     ToolbarModule,
//     SplitButtonModule,
//     MenuModule,
//     FileUploadModule,
//     ProgressBarModule,
//     SkeletonModule,
//     BadgeModule,
//     OverlayModule,
//     ColorPickerModule,
//     ToggleSwitchModule,
//     AccordionModule,
//     CheckboxModule,
//     TooltipModule
//   ],
//   providers: [MessageService, ConfirmationService, DatePipe, MasterApiService],
//   template: `
//     <div class="card">
//       <p-toolbar styleClass="mb-4">
//         <ng-template pTemplate="start">
//           <div class="flex flex-wrap gap-2">
//             <p-button 
//               label="New Master" 
//               icon="pi pi-plus" 
//               severity="success" 
//               (onClick)="openNewMasterDialog()"
//               [disabled]="!selectedMasterCategory()"
//             />
//             <p-button 
//               label="Import" 
//               icon="pi pi-upload" 
//               severity="help" 
//               (onClick)="importFileUpload.click()"
//               [disabled]="!selectedMaster()"
//             />
//             <p-button 
//               label="Export" 
//               icon="pi pi-download" 
//               severity="info" 
//               (onClick)="exportData()"
//               [disabled]="!selectedMaster()"
//             />
//           </div>
//         </ng-template>
        
//         <ng-template pTemplate="end">
//           <div class="flex gap-2">
//             <p-select
//               [(ngModel)]="selectedMasterCategory"
//               [options]="masterCategories"
//               optionLabel="label"
//               optionValue="value"
//               placeholder="Filter by Category"
//               class="w-48"
//               (onChange)="filterByCategory()"
//             />
//             <p-select
//               [(ngModel)]="selectedMaster"
//               [options]="filteredMasters()"
//               optionLabel="displayName"
//               optionValue="_id"
//               placeholder="Select Master"
//               class="w-64"
//               (onChange)="onMasterSelect()"
//             />
//           </div>
//         </ng-template>
//       </p-toolbar>

//       <div class="grid">
//         <div class="col-12 md:col-4">
//           <div class="card">
//             <h3>Master Types</h3>
            
//             <p-iconfield iconPosition="left" class="mb-3 block w-full">
//               <p-inputicon styleClass="pi pi-search"></p-inputicon>
//               <input 
//                 pInputText 
//                 type="text" 
//                 [(ngModel)]="masterSearchValue" 
//                 (input)="filterMasters()"
//                 placeholder="Search masters..." 
//                 class="w-full"
//               />
//             </p-iconfield>

//             <p-accordion [multiple]="true" [value]="expandedMasters()">
//               <p-accordion-panel *ngFor="let master of displayedMasters(); let i = index" [value]="i">
//                 <p-accordion-header>
//                   <div class="flex justify-between items-center w-full">
//                     <span class="font-bold">{{ master.displayName }}</span>
//                     <div class="flex gap-2 ml-auto items-center pr-3">
//                       <p-tag 
//                         [value]="master.isPublished ? 'Published' : 'Draft'" 
//                         [severity]="master.isPublished ? 'success' : 'info'"
//                         size="small"
//                       />
//                       <span class="text-sm text-gray-500">{{ master.stats?.totalValues || 0 }} values</span>
//                     </div>
//                   </div>
//                 </p-accordion-header>
                
//                 <p-accordion-content>
//                   <div class="flex gap-2 mb-3">
//                     <p-button 
//                       icon="pi pi-pencil" 
//                       severity="info" 
//                       size="small" 
//                       (onClick)="editMaster(master)"
//                       pTooltip="Edit Master"
//                       tooltipPosition="top"
//                     />
//                     <p-button 
//                       *ngIf="!master.isPublished"
//                       icon="pi pi-check-circle" 
//                       severity="success" 
//                       size="small" 
//                       (onClick)="publishMaster(master)"
//                       pTooltip="Publish"
//                       tooltipPosition="top"
//                     />
//                     <p-button 
//                       *ngIf="master.isPublished"
//                       icon="pi pi-ban" 
//                       severity="warn" 
//                       size="small" 
//                       (onClick)="unpublishMaster(master)"
//                       pTooltip="Unpublish"
//                       tooltipPosition="top"
//                     />
//                     <p-button 
//                       icon="pi pi-trash" 
//                       severity="danger" 
//                       size="small" 
//                       (onClick)="deleteMaster(master)"
//                       pTooltip="Delete"
//                       tooltipPosition="top"
//                     />
//                   </div>

//                   <p-table 
//                     [value]="master.values || []" 
//                     [rows]="5"
//                     [paginator]="true"
//                     [globalFilterFields]="['value', 'label', 'description']"
//                     #valuesTable
//                   >
//                     <ng-template pTemplate="caption">
//                       <div class="flex justify-between items-center">
//                         <span class="font-semibold">Values</span>
//                         <p-iconfield iconPosition="left">
//                           <p-inputicon styleClass="pi pi-search"></p-inputicon>
//                           <input 
//                             pInputText 
//                             type="text" 
//                             (input)="valuesTable.filterGlobal($any($event.target).value, 'contains')" 
//                             placeholder="Search values..." 
//                             size="30"
//                           />
//                         </p-iconfield>
//                       </div>
//                     </ng-template>
                    
//                     <ng-template pTemplate="header">
//                       <tr>
//                         <th>Value</th>
//                         <th>Label</th>
//                         <th>Description</th>
//                         <th>Status</th>
//                         <th>Actions</th>
//                       </tr>
//                     </ng-template>
                    
//                     <ng-template pTemplate="body" let-value>
//                       <tr>
//                         <td>
//                           <span class="font-mono">{{ value.value }}</span>
//                         </td>
//                         <td>
//                           <div class="flex items-center gap-2">
//                             <span *ngIf="value.metadata?.icon" class="text-xl">{{ value.metadata.icon }}</span>
//                             <span [style.color]="value.metadata?.color">{{ value.label }}</span>
//                           </div>
//                         </td>
//                         <td>{{ value.description || '-' }}</td>
//                         <td>
//                           <div class="flex gap-1">
//                             <p-tag 
//                               *ngIf="value.isPublished" 
//                               value="Published" 
//                               severity="success" 
//                               size="small"
//                             />
//                             <p-tag 
//                               *ngIf="!value.isPublished" 
//                               value="Draft" 
//                               severity="info" 
//                               size="small"
//                             />
//                             <p-tag 
//                               *ngIf="value.isDefault" 
//                               value="Default" 
//                               severity="warn" 
//                               size="small"
//                             />
//                             <p-tag 
//                               *ngIf="value.isSystem" 
//                               value="System" 
//                               severity="secondary" 
//                               size="small"
//                             />
//                           </div>
//                         </td>
//                         <td>
//                           <div class="flex gap-2">
//                             <p-button 
//                               icon="pi pi-pencil" 
//                               size="small" 
//                               severity="info" 
//                               (onClick)="editValue(master, value)"
//                               pTooltip="Edit Value"
//                             />
//                             <p-button 
//                               *ngIf="!value.isPublished"
//                               icon="pi pi-check-circle" 
//                               size="small" 
//                               severity="success" 
//                               (onClick)="publishValue(master._id!, value._id!)"
//                               pTooltip="Publish"
//                             />
//                             <p-button 
//                               *ngIf="value.isPublished && !value.isSystem"
//                               icon="pi pi-ban" 
//                               size="small" 
//                               severity="warn" 
//                               (onClick)="unpublishValue(master._id!, value._id!)"
//                               pTooltip="Unpublish"
//                             />
//                             <p-button 
//                               *ngIf="!value.isSystem"
//                               icon="pi pi-trash" 
//                               size="small" 
//                               severity="danger" 
//                               (onClick)="deleteValue(master._id!, value._id!)"
//                               pTooltip="Delete"
//                             />
//                           </div>
//                         </td>
//                       </tr>
//                     </ng-template>
                    
//                     <ng-template pTemplate="emptymessage">
//                       <tr>
//                         <td colspan="5" class="text-center p-4">No values found</td>
//                       </tr>
//                     </ng-template>
//                   </p-table>

//                   <div class="mt-3">
//                     <p-button 
//                       label="Add Value" 
//                       icon="pi pi-plus" 
//                       size="small" 
//                       (onClick)="openNewValueDialog(master)"
//                     />
//                   </div>
//                 </p-accordion-content>
//               </p-accordion-panel>
//             </p-accordion>
//           </div>
//         </div>

//         <div class="col-12 md:col-8" *ngIf="selectedMasterDetails() as master">
//           <div class="card">
//             <div class="flex justify-between items-center mb-4">
//               <h3>{{ master.displayName }} - Details</h3>
//               <div class="flex gap-2">
//                 <p-button 
//                   label="Edit" 
//                   icon="pi pi-pencil" 
//                   size="small" 
//                   (onClick)="editMaster(master)"
//                 />
//                 <p-button 
//                   label="Add Value" 
//                   icon="pi pi-plus" 
//                   size="small" 
//                   (onClick)="openNewValueDialog(master)"
//                 />
//               </div>
//             </div>

//             <div class="grid mb-4">
//               <div class="col-6">
//                 <div class="field">
//                   <label class="font-bold">Master Name</label>
//                   <p>{{ master.masterName }}</p>
//                 </div>
//               </div>
//               <div class="col-6">
//                 <div class="field">
//                   <label class="font-bold">Display Name</label>
//                   <p>{{ master.displayName }}</p>
//                 </div>
//               </div>
//               <div class="col-12">
//                 <div class="field">
//                   <label class="font-bold">Description</label>
//                   <p>{{ master.description || '-' }}</p>
//                 </div>
//               </div>
//               <div class="col-6">
//                 <div class="field">
//                   <label class="font-bold">Category</label>
//                   <p-tag [value]="master.category" severity="info" />
//                 </div>
//               </div>
//               <div class="col-6">
//                 <div class="field">
//                   <label class="font-bold">Status</label>
//                   <div class="flex gap-2">
//                     <p-tag 
//                       [value]="master.isPublished ? 'Published' : 'Draft'" 
//                       [severity]="master.isPublished ? 'success' : 'info'"
//                     />
//                     <p-tag 
//                       *ngIf="master.isSystem" 
//                       value="System" 
//                       severity="secondary"
//                     />
//                     <p-tag 
//                       *ngIf="master.isLocked" 
//                       value="Locked" 
//                       severity="warn"
//                     />
//                   </div>
//                 </div>
//               </div>
//             </div>

//             <div class="grid mb-4">
//               <div class="col-3">
//                 <div class="card text-center">
//                   <span class="text-2xl font-bold">{{ master.stats?.totalValues || 0 }}</span>
//                   <span class="block text-gray-500">Total Values</span>
//                 </div>
//               </div>
//               <div class="col-3">
//                 <div class="card text-center">
//                   <span class="text-2xl font-bold text-green-600">{{ master.stats?.publishedValues || 0 }}</span>
//                   <span class="block text-gray-500">Published</span>
//                 </div>
//               </div>
//               <div class="col-3">
//                 <div class="card text-center">
//                   <span class="text-2xl font-bold text-blue-600">{{ master.stats?.activeValues || 0 }}</span>
//                   <span class="block text-gray-500">Active</span>
//                 </div>
//               </div>
//               <div class="col-3">
//                 <div class="card text-center">
//                   <span class="text-2xl font-bold">{{ master.config?.isHierarchical ? 'Yes' : 'No' }}</span>
//                   <span class="block text-gray-500">Hierarchical</span>
//                 </div>
//               </div>
//             </div>

//             <p-table 
//               [value]="master.values || []" 
//               [rows]="10"
//               [paginator]="true"
//               [globalFilterFields]="['value', 'label', 'description']"
//               #detailsTable
//             >
//               <ng-template pTemplate="caption">
//                 <div class="flex justify-between items-center">
//                   <span class="font-semibold text-lg">Master Values</span>
//                   <p-iconfield iconPosition="left">
//                     <p-inputicon styleClass="pi pi-search"></p-inputicon>
//                     <input 
//                       pInputText 
//                       type="text" 
//                       (input)="detailsTable.filterGlobal($any($event.target).value, 'contains')" 
//                       placeholder="Search values..." 
//                       size="30"
//                     />
//                   </p-iconfield>
//                 </div>
//               </ng-template>
              
//               <ng-template pTemplate="header">
//                 <tr>
//                   <th>Value</th>
//                   <th>Label</th>
//                   <th>Description</th>
//                   <th>Parent</th>
//                   <th>Metadata</th>
//                   <th>Status</th>
//                   <th>Actions</th>
//                 </tr>
//               </ng-template>
              
//               <ng-template pTemplate="body" let-value>
//                 <tr>
//                   <td>
//                     <span class="font-mono">{{ value.value }}</span>
//                   </td>
//                   <td>
//                     <div class="flex items-center gap-2">
//                       <span *ngIf="value.metadata?.icon" class="text-xl">{{ value.metadata.icon }}</span>
//                       <span [style.color]="value.metadata?.color">{{ value.label }}</span>
//                     </div>
//                   </td>
//                   <td>{{ value.description || '-' }}</td>
//                   <td>
//                     <span *ngIf="value.parentValue">
//                       {{ getParentLabel(master.values || [], value.parentValue) }}
//                     </span>
//                     <span *ngIf="!value.parentValue">-</span>
//                   </td>
//                   <td>
//                     <div class="flex gap-1 flex-wrap">
//                       <p-chip 
//                         *ngIf="value.metadata?.sortOrder !== undefined" 
//                         label="Order: {{ value.metadata.sortOrder }}" 
//                       />
//                     </div>
//                   </td>
//                   <td>
//                     <div class="flex gap-1">
//                       <p-tag 
//                         *ngIf="value.isPublished" 
//                         value="Published" 
//                         severity="success" 
//                         size="small"
//                       />
//                       <p-tag 
//                         *ngIf="!value.isPublished" 
//                         value="Draft" 
//                         severity="info" 
//                         size="small"
//                       />
//                       <p-tag 
//                         *ngIf="value.isDefault" 
//                         value="Default" 
//                         severity="warn" 
//                         size="small"
//                       />
//                       <p-tag 
//                         *ngIf="value.isSystem" 
//                         value="System" 
//                         severity="secondary" 
//                         size="small"
//                       />
//                     </div>
//                   </td>
//                   <td>
//                     <div class="flex gap-2">
//                       <p-button 
//                         icon="pi pi-pencil" 
//                         size="small" 
//                         severity="info" 
//                         (onClick)="editValue(master, value)"
//                         pTooltip="Edit Value"
//                       />
//                       <p-button 
//                         *ngIf="!value.isPublished"
//                         icon="pi pi-check-circle" 
//                         size="small" 
//                         severity="success" 
//                         (onClick)="publishValue(master._id!, value._id!)"
//                         pTooltip="Publish"
//                       />
//                       <p-button 
//                         *ngIf="value.isPublished && !value.isSystem"
//                         icon="pi pi-ban" 
//                         size="small" 
//                         severity="warn" 
//                         (onClick)="unpublishValue(master._id!, value._id!)"
//                         pTooltip="Unpublish"
//                       />
//                       <p-button 
//                         *ngIf="!value.isSystem"
//                         icon="pi pi-trash" 
//                         size="small" 
//                         severity="danger" 
//                         (onClick)="deleteValue(master._id!, value._id!)"
//                         pTooltip="Delete"
//                       />
//                     </div>
//                   </td>
//                 </tr>
//               </ng-template>
              
//               <ng-template pTemplate="emptymessage">
//                 <tr>
//                   <td colspan="7" class="text-center p-4">No values found</td>
//                 </tr>
//               </ng-template>
//             </p-table>
//           </div>
//         </div>
//       </div>
//     </div>

//     <p-dialog 
//       [(visible)]="showMasterDialog" 
//       [style]="{ width: '500px' }"
//       [header]="masterDialogTitle()"
//       [modal]="true"
//       [draggable]="false"
//       [resizable]="false"
//     >
//       <form [formGroup]="masterForm">
//         <div class="field mb-3">
//           <label for="masterName" class="block mb-1">Master Name *</label>
//           <input 
//             pInputText 
//             id="masterName" 
//             formControlName="masterName" 
//             class="w-full"
//             [class.ng-invalid]="masterForm.get('masterName')?.invalid && masterForm.get('masterName')?.touched"
//           />
//           <small *ngIf="masterForm.get('masterName')?.invalid && masterForm.get('masterName')?.touched" class="text-red-500 block mt-1">
//             Master Name is required and must be uppercase
//           </small>
//         </div>

//         <div class="field mb-3">
//           <label for="displayName" class="block mb-1">Display Name *</label>
//           <input 
//             pInputText 
//             id="displayName" 
//             formControlName="displayName" 
//             class="w-full"
//           />
//         </div>

//         <div class="field mb-3">
//           <label for="description" class="block mb-1">Description</label>
//           <textarea 
//             pInputTextarea 
//             id="description" 
//             formControlName="description" 
//             rows="3"
//             class="w-full"
//           ></textarea>
//         </div>

//         <div class="field mb-3">
//           <label for="category" class="block mb-1">Category</label>
//           <p-select
//             id="category"
//             formControlName="category"
//             [options]="masterCategories"
//             optionLabel="label"
//             optionValue="value"
//             placeholder="Select Category"
//             class="w-full"
//           />
//         </div>

//         <div class="field-checkbox mb-3 flex items-center">
//           <p-checkbox 
//             inputId="isHierarchical" 
//             formControlName="isHierarchical"
//             [binary]="true"
//           />
//           <label for="isHierarchical" class="ml-2">Allow Hierarchical Values</label>
//         </div>
//       </form>

//       <ng-template pTemplate="footer">
//         <p-button label="Cancel" icon="pi pi-times" (onClick)="hideMasterDialog()" text />
//         <p-button 
//           label="Save" 
//           icon="pi pi-check" 
//           (onClick)="saveMaster()"
//           [disabled]="masterForm.invalid"
//         />
//       </ng-template>
//     </p-dialog>

//     <p-dialog 
//       [(visible)]="showValueDialog" 
//       [style]="{ width: '500px' }"
//       [header]="valueDialogTitle()"
//       [modal]="true"
//     >
//       <form [formGroup]="valueForm" *ngIf="selectedMasterForValue()">
//         <div class="field mb-3">
//           <label for="value" class="block mb-1">Value *</label>
//           <input 
//             pInputText 
//             id="value" 
//             formControlName="value" 
//             class="w-full"
//           />
//         </div>

//         <div class="field mb-3">
//           <label for="label" class="block mb-1">Label *</label>
//           <input 
//             pInputText 
//             id="label" 
//             formControlName="label" 
//             class="w-full"
//           />
//         </div>

//         <div class="field mb-3">
//           <label for="description" class="block mb-1">Description</label>
//           <textarea 
//             pInputTextarea 
//             id="description" 
//             formControlName="description" 
//             rows="2"
//             class="w-full"
//           ></textarea>
//         </div>

//         <div *ngIf="selectedMasterForValue()?.config?.isHierarchical" class="field mb-3">
//           <label for="parentValue" class="block mb-1">Parent Value</label>
//           <p-select
//             id="parentValue"
//             formControlName="parentValue"
//             [options]="parentOptions()"
//             optionLabel="label"
//             optionValue="_id"
//             placeholder="Select Parent"
//             class="w-full"
//           />
//         </div>

//         <p-accordion value="metadata" class="mb-3 block">
//           <p-accordion-panel value="metadata">
//             <p-accordion-header>Metadata</p-accordion-header>
//             <p-accordion-content>
//               <div class="field mb-3">
//                 <label for="icon" class="block mb-1">Icon</label>
//                 <input 
//                   pInputText 
//                   id="icon" 
//                   formControlName="icon" 
//                   class="w-full"
//                   placeholder="e.g., 🎨, pi pi-star"
//                 />
//               </div>

//               <div class="field mb-3">
//                 <label for="color" class="block mb-1">Color</label>
//                 <p-colorPicker 
//                   id="color" 
//                   formControlName="color" 
//                   [inline]="false"
//                 />
//               </div>

//               <div class="field mb-3">
//                 <label for="sortOrder" class="block mb-1">Sort Order</label>
//                 <p-inputNumber 
//                   inputId="sortOrder" 
//                   formControlName="sortOrder" 
//                   class="w-full"
//                 />
//               </div>
//             </p-accordion-content>
//           </p-accordion-panel>
//         </p-accordion>

//         <div class="field-checkbox mb-3 flex items-center">
//           <p-checkbox 
//             inputId="isPublished" 
//             formControlName="isPublished"
//             [binary]="true"
//           />
//           <label for="isPublished" class="ml-2">Published</label>
//         </div>

//         <div class="field-checkbox mb-3 flex items-center">
//           <p-checkbox 
//             inputId="isDefault" 
//             formControlName="isDefault"
//             [binary]="true"
//           />
//           <label for="isDefault" class="ml-2">Default Value</label>
//         </div>
//       </form>

//       <ng-template pTemplate="footer">
//         <p-button label="Cancel" icon="pi pi-times" (onClick)="hideValueDialog()" text />
//         <p-button 
//           label="Save" 
//           icon="pi pi-check" 
//           (onClick)="saveValue()"
//           [disabled]="valueForm.invalid"
//         />
//       </ng-template>
//     </p-dialog>

//     <input 
//       #importFileUpload
//       type="file" 
//       accept=".json,.csv"
//       style="display: none"
//       (change)="onFileSelected($event)"
//     />

//     <p-confirmDialog />
//     <p-toast />
//   `,
//   styles: [`
    // :host ::ng-deep {
    //   .p-accordion .p-accordion-header .p-accordion-header-link {
    //     padding: 1rem;
    //   }
      
    //   .p-accordion .p-accordion-content {
    //     padding: 1.5rem;
    //   }
    // }
//   `]
// })
// export class MasterDataGridComponent implements OnInit, AfterViewInit {
//   @ViewChild('dt') dt!: Table;

//   private masterApi = inject(MasterApiService);
//   private fb = inject(FormBuilder);
//   private messageService = inject(MessageService);
//   private confirmationService = inject(ConfirmationService);
//   private datePipe = inject(DatePipe);

//   // State
//   allMasters = signal<any[]>([]);
//   filteredMasters = signal<any[]>([]);
//   loading = signal<boolean>(false);
//   masterSearchValue = signal<string>('');

//   // Selection
//   selectedMasterCategory = signal<string>('');
//   selectedMaster = signal<string>('');
//   selectedMasterDetails = computed(() => {
//     const id = this.selectedMaster();
//     return this.allMasters().find(m => m._id === id);
//   });

//   // UI State
//   expandedMasters = signal<number[]>([]);
//   showMasterDialog = signal<boolean>(false);
//   showValueDialog = signal<boolean>(false);
//   editingMaster = signal<Master | null>(null);
//   editingValue = signal<{ master: Master; value: MasterValue } | null>(null);
//   selectedMasterForValue = signal<Master | null>(null);

//   // Categories
//   masterCategories = [
//     { label: 'System', value: 'SYSTEM' },
//     { label: 'Business', value: 'BUSINESS' },
//     { label: 'Education', value: 'EDUCATION' },
//     { label: 'Content', value: 'CONTENT' },
//     { label: 'User', value: 'USER' },
//     { label: 'Settings', value: 'SETTINGS' }
//   ];

//   // Forms
//   masterForm: FormGroup = this.fb.group({
//     masterName: ['', [Validators.required, Validators.pattern('^[A-Z_]+$')]],
//     displayName: ['', Validators.required],
//     description: [''],
//     category: ['BUSINESS'],
//     isHierarchical: [false]
//   });

//   valueForm: FormGroup = this.fb.group({
//     value: ['', Validators.required],
//     label: ['', Validators.required],
//     description: [''],
//     parentValue: [null],
//     icon: [''],
//     color: [''],
//     sortOrder: [0],
//     isPublished: [true],
//     isDefault: [false]
//   });

//   // Computed
//   masterDialogTitle = computed(() => 
//     this.editingMaster() ? 'Edit Master' : 'Create New Master'
//   );

//   valueDialogTitle = computed(() => 
//     this.editingValue() ? 'Edit Value' : 'Add New Value'
//   );

//   parentOptions = computed(() => {
//     const master = this.selectedMasterForValue();
//     if (!master?.values) return [];
//     return master.values.filter(v => v.isActive && v._id !== this.editingValue()?.value?._id);
//   });

//   displayedMasters = computed(() => {
//     let masters = this.filteredMasters();
//     const search = this.masterSearchValue().toLowerCase();
    
//     if (search) {
//       masters = masters.filter(m => 
//         m.displayName?.toLowerCase().includes(search) ||
//         m.masterName?.toLowerCase().includes(search) ||
//         m.description?.toLowerCase().includes(search)
//       );
//     }
    
//     return masters;
//   });

//   ngOnInit(): void {
//     this.loadMasters();
//   }

//   ngAfterViewInit(): void { }

//   loadMasters(): void {
//     this.loading.set(true);
//     this.masterApi.getAllMasters()
//       .pipe(
//         tap((response: any) => {
//           const masters = (response.data || []) as any[];
//           this.allMasters.set(masters);
//           this.filteredMasters.set(masters);
          
//           if (masters.length > 0) {
//             this.expandedMasters.set([0]);
//           }
//         }),
//         catchError(error => {
//           this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load masters' });
//           return of(null);
//         }),
//         finalize(() => this.loading.set(false))
//       )
//       .subscribe();
//   }

//   filterByCategory(): void {
//     const category = this.selectedMasterCategory();
//     if (category) {
//       this.filteredMasters.set(this.allMasters().filter(m => m.category === category));
//     } else {
//       this.filteredMasters.set(this.allMasters());
//     }
//   }

//   filterMasters(): void { }

//   onMasterSelect(): void {
//     const masterId = this.selectedMaster();
//     const index = this.allMasters().findIndex(m => m._id === masterId);
//     if (index >= 0) {
//       this.expandedMasters.set([index]);
//     }
//   }

//   // --- Master CRUD ---
//   openNewMasterDialog(): void {
//     this.editingMaster.set(null);
//     this.masterForm.reset({
//       masterName: '',
//       displayName: '',
//       description: '',
//       category: this.selectedMasterCategory() || 'BUSINESS',
//       isHierarchical: false
//     });
//     this.showMasterDialog.set(true);
//   }

//   editMaster(master: Master): void {
//     this.editingMaster.set(master);
//     this.masterForm.patchValue({
//       masterName: master.masterName,
//       displayName: master.displayName,
//       description: master.description,
//       category: master.category,
//       isHierarchical: master.config?.isHierarchical || false
//     });
//     this.showMasterDialog.set(true);
//   }

//   hideMasterDialog(): void {
//     this.showMasterDialog.set(false);
//     this.editingMaster.set(null);
//   }

//   saveMaster(): void {
//     if (this.masterForm.invalid) {
//       this.masterForm.markAllAsTouched();
//       return;
//     }

//     const formData = this.masterForm.value;
//     const masterData = {
//       masterName: formData.masterName,
//       displayName: formData.displayName,
//       description: formData.description,
//       category: formData.category,
//       config: {
//         isHierarchical: formData.isHierarchical,
//         allowMultiple: true,
//         hasMetadata: true
//       }
//     };

//     const request$ = this.editingMaster()
//       ? this.masterApi.updateMaster(this.editingMaster()!._id!, masterData)
//       : this.masterApi.createMaster(masterData);

//     request$.pipe(
//       tap(() => {
//         this.messageService.add({ severity: 'success', summary: 'Success', detail: `Master ${this.editingMaster() ? 'updated' : 'created'} successfully` });
//         this.hideMasterDialog();
//         this.loadMasters();
//       }),
//       catchError(() => {
//         this.messageService.add({ severity: 'error', summary: 'Error', detail: `Failed to ${this.editingMaster() ? 'update' : 'create'} master` });
//         return of(null);
//       })
//     ).subscribe();
//   }

//   publishMaster(master: Master): void {
//     this.confirmationService.confirm({
//       message: `Publish "${master.displayName}"?`,
//       header: 'Confirm Publish',
//       icon: 'pi pi-check-circle',
//       accept: () => {
//         this.masterApi.publishMaster(master._id!).pipe(
//           tap(() => {
//             this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Master published' });
//             this.loadMasters();
//           }),
//           catchError(() => {
//             this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to publish master' });
//             return of(null);
//           })
//         ).subscribe();
//       }
//     });
//   }

//   unpublishMaster(master: Master): void {
//     this.confirmationService.confirm({
//       message: `Unpublish "${master.displayName}"?`,
//       header: 'Confirm Unpublish',
//       icon: 'pi pi-ban',
//       accept: () => {
//         this.masterApi.unpublishMaster(master._id!).pipe(
//           tap(() => {
//             this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Master unpublished' });
//             this.loadMasters();
//           }),
//           catchError(() => {
//             this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to unpublish master' });
//             return of(null);
//           })
//         ).subscribe();
//       }
//     });
//   }

//   deleteMaster(master: Master): void {
//     this.confirmationService.confirm({
//       message: `Delete "${master.displayName}"? This action cannot be undone.`,
//       header: 'Confirm Delete',
//       icon: 'pi pi-exclamation-triangle',
//       acceptButtonStyleClass: 'p-button-danger',
//       accept: () => {
//         this.masterApi.deleteMaster(master._id!).pipe(
//           tap(() => {
//             this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Master deleted' });
//             this.loadMasters();
//           }),
//           catchError(() => {
//             this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete master' });
//             return of(null);
//           })
//         ).subscribe();
//       }
//     });
//   }

//   // --- Value CRUD ---
//   openNewValueDialog(master: Master): void {
//     this.selectedMasterForValue.set(master);
//     this.editingValue.set(null);
//     this.valueForm.reset({
//       value: '',
//       label: '',
//       description: '',
//       parentValue: null,
//       icon: '',
//       color: '',
//       sortOrder: 0,
//       isPublished: true,
//       isDefault: false
//     });
//     this.showValueDialog.set(true);
//   }

//   editValue(master: Master, value: MasterValue): void {
//     this.selectedMasterForValue.set(master);
//     this.editingValue.set({ master, value });
//     this.valueForm.patchValue({
//       value: value.value,
//       label: value.label,
//       description: value.description,
//       parentValue: value.parentValue,
//       icon: value.metadata?.icon || '',
//       color: value.metadata?.color || '',
//       sortOrder: value.metadata?.sortOrder || 0,
//       isPublished: value.isPublished,
//       isDefault: value.isDefault || false
//     });
//     this.showValueDialog.set(true);
//   }

//   hideValueDialog(): void {
//     this.showValueDialog.set(false);
//     this.editingValue.set(null);
//     this.selectedMasterForValue.set(null);
//   }

//   saveValue(): void {
//     if (this.valueForm.invalid || !this.selectedMasterForValue()) {
//       this.valueForm.markAllAsTouched();
//       return;
//     }

//     const formData = this.valueForm.value;
//     const master = this.selectedMasterForValue()!;
    
//     const valueData: Partial<MasterValue> = {
//       value: formData.value,
//       label: formData.label,
//       description: formData.description,
//       parentValue: formData.parentValue,
//       metadata: {
//         icon: formData.icon,
//         color: formData.color,
//         sortOrder: formData.sortOrder
//       },
//       isPublished: formData.isPublished,
//       isDefault: formData.isDefault
//     };

//     const request$ = this.editingValue()
//       ? this.masterApi.updateValue(master._id!, this.editingValue()!.value._id!, valueData)
//       : this.masterApi.addValue(master._id!, valueData);

//     request$.pipe(
//       tap(() => {
//         this.messageService.add({ severity: 'success', summary: 'Success', detail: `Value ${this.editingValue() ? 'updated' : 'added'} successfully` });
//         this.hideValueDialog();
//         this.loadMasters();
//       }),
//       catchError(() => {
//         this.messageService.add({ severity: 'error', summary: 'Error', detail: `Failed to ${this.editingValue() ? 'update' : 'add'} value` });
//         return of(null);
//       })
//     ).subscribe();
//   }

//   publishValue(masterId: string, valueId: string): void {
//     this.masterApi.publishValue(masterId, valueId).pipe(
//       tap(() => {
//         this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Value published' });
//         this.loadMasters();
//       }),
//       catchError(() => {
//         this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to publish value' });
//         return of(null);
//       })
//     ).subscribe();
//   }

//   unpublishValue(masterId: string, valueId: string): void {
//     this.masterApi.unpublishValue(masterId, valueId).pipe(
//       tap(() => {
//         this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Value unpublished' });
//         this.loadMasters();
//       }),
//       catchError(() => {
//         this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to unpublish value' });
//         return of(null);
//       })
//     ).subscribe();
//   }

//   deleteValue(masterId: string, valueId: string): void {
//     this.confirmationService.confirm({
//       message: 'Delete this value?',
//       header: 'Confirm Delete',
//       icon: 'pi pi-exclamation-triangle',
//       acceptButtonStyleClass: 'p-button-danger',
//       accept: () => {
//         this.masterApi.deleteValue(masterId, valueId).pipe(
//           tap(() => {
//             this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Value deleted' });
//             this.loadMasters();
//           }),
//           catchError(() => {
//             this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete value' });
//             return of(null);
//           })
//         ).subscribe();
//       }
//     });
//   }

//   // --- Import/Export ---
//   onFileSelected(event: any): void {
//     const file = event.target.files[0];
//     if (!file || !this.selectedMaster()) return;

//     const formData = new FormData();
//     formData.append('file', file);

//     this.masterApi.importValues(this.selectedMaster(), formData).pipe(
//       tap(() => {
//         this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Values imported successfully' });
//         this.loadMasters();
//       }),
//       catchError(() => {
//         this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to import values' });
//         return of(null);
//       })
//     ).subscribe();
//   }

//   exportData(): void {
//     if (!this.selectedMaster()) return;

//     this.masterApi.exportValues(this.selectedMaster(), { params: { format: 'json' } }).pipe(
//       tap(blob => {
//         const url = window.URL.createObjectURL(blob);
//         const a = document.createElement('a');
//         a.href = url;
//         a.download = `master-${this.selectedMaster()}-export.json`;
//         a.click();
//         window.URL.revokeObjectURL(url);
        
//         this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Data exported successfully' });
//       }),
//       catchError(() => {
//         this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to export data' });
//         return of(null);
//       })
//     ).subscribe();
//   }

//   // --- Helpers ---
//   getParentLabel(values: MasterValue[], parentId: string): string {
//     const parent = values.find(v => v._id === parentId);
//     return parent?.label || parentId;
//   }

//   clear(dt: Table): void {
//     this.masterSearchValue.set('');
//     dt.reset();
//   }

//   getSeverity(status: string): string {
//     switch (status) {
//       case 'Published': return 'success';
//       case 'Draft': return 'info';
//       case 'System': return 'secondary';
//       default: return 'info';
//     }
//   }
// }

// // // components/master-data-grid.component.ts
// // import { Component, OnInit, inject, signal, computed, ViewChild, AfterViewInit } from '@angular/core';
// // import { CommonModule, DatePipe } from '@angular/common';
// // import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
// // import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
// // import { catchError, of, switchMap, tap, finalize } from 'rxjs';

// // // PrimeNG Imports
// // import { TableModule, Table } from 'primeng/table';
// // import { ButtonModule } from 'primeng/button';
// // import { InputTextModule } from 'primeng/inputtext';
// // import { InputNumberModule } from 'primeng/inputnumber';
// // import { SelectModule } from 'primeng/select';
// // import { MultiSelectModule } from 'primeng/multiselect';
// // import { TagModule } from 'primeng/tag';
// // import { ChipModule } from 'primeng/chip';
// // import { IconFieldModule } from 'primeng/iconfield';
// // import { InputIconModule } from 'primeng/inputicon';
// // import { DialogModule } from 'primeng/dialog';
// // import { ConfirmDialogModule } from 'primeng/confirmdialog';
// // import { ToastModule } from 'primeng/toast';
// // import { ToolbarModule } from 'primeng/toolbar';
// // import { SplitButtonModule } from 'primeng/splitbutton';
// // import { MenuModule } from 'primeng/menu';
// // import { FileUploadModule } from 'primeng/fileupload';
// // import { ProgressBarModule } from 'primeng/progressbar';
// // import { SkeletonModule } from 'primeng/skeleton';
// // import { BadgeModule } from 'primeng/badge';
// // import { ColorPickerModule } from 'primeng/colorpicker';
// // import { MessageService, ConfirmationService } from 'primeng/api';
// // import { AccordionModule } from 'primeng/accordion';
// // import { OverlayModule } from 'primeng/overlay';
// // import { ToggleSwitchModule } from 'primeng/toggleswitch';

// // // Services

// // // interface any extends Master {
// // //   values: MasterValue[];
// // //   _expanded?: boolean;
// // // }

// // @Component({
// //   selector: 'app-master-data-grid',
// //   standalone: true,
// //   imports: [
// //     CommonModule,
// //     FormsModule,
// //     ReactiveFormsModule,
// //     TableModule,
// //     ButtonModule,
// //     InputTextModule,
// //     InputTextModule,
// //     InputNumberModule,
// //     SelectModule,
// //     MultiSelectModule,
// //     TagModule,
// //     ChipModule,
// //     IconFieldModule,
// //     InputIconModule,
// //     DialogModule,
// //     ConfirmDialogModule,
// //     ToastModule,
// //     ToolbarModule,
// //     SplitButtonModule,
// //     MenuModule,
// //     FileUploadModule,
// //     ProgressBarModule,
// //     SkeletonModule,
// //     BadgeModule,
// //     OverlayModule,
// //     ColorPickerModule,
// //     ToggleSwitchModule,
// //     AccordionModule
// //   ],
// //   providers: [MessageService, ConfirmationService, DatePipe],
// //   template: `
// //     <div class="card">
// //       <!-- Toolbar -->
// //       <p-toolbar styleClass="mb-4">
// //         <ng-template #start>
// //           <div class="flex flex-wrap gap-2">
// //             <p-button 
// //               label="New Master" 
// //               icon="pi pi-plus" 
// //               severity="success" 
// //               (onClick)="openNewMasterDialog()"
// //               [disabled]="!selectedMasterCategory"
// //             />
// //             <p-button 
// //               label="Import" 
// //               icon="pi pi-upload" 
// //               severity="help" 
// //               (onClick)="importFileUpload.click()"
// //               [disabled]="!selectedMaster"
// //             />
// //             <p-button 
// //               label="Export" 
// //               icon="pi pi-download" 
// //               severity="info" 
// //               (onClick)="exportData()"
// //               [disabled]="!selectedMaster"
// //             />
// //           </div>
// //         </ng-template>
        
// //         <ng-template #end>
// //           <div class="flex gap-2">
// //             <p-select
// //               [(ngModel)]="selectedMasterCategory"
// //               [options]="masterCategories"
// //               optionLabel="label"
// //               optionValue="value"
// //               placeholder="Filter by Category"
// //               class="w-48"
// //               (onChange)="filterByCategory()"
// //             />
// //             <p-select
// //               [(ngModel)]="selectedMaster"
// //               [options]="filteredMasters()"
// //               optionLabel="displayName"
// //               optionValue="_id"
// //               placeholder="Select Master"
// //               class="w-64"
// //               (onChange)="onMasterSelect()"
// //             />
// //           </div>
// //         </ng-template>
// //       </p-toolbar>

// //       <!-- Main Content - Split View -->
// //       <div class="grid">
// //         <!-- Masters List -->
// //         <div class="col-12 md:col-4">
// //           <div class="card">
// //             <h3>Master Types</h3>
            
// //             <!-- Search -->
// //             <p-iconField iconPosition="left" class="mb-3">
// //               <p-inputIcon>
// //                 <i class="pi pi-search"></i>
// //               </p-inputIcon>
// //               <input 
// //                 pInputText 
// //                 type="text" 
// //                 [(ngModel)]="masterSearchValue" 
// //                 (input)="filterMasters()"
// //                 placeholder="Search masters..." 
// //                 class="w-full"
// //               />
// //             </p-iconField>

// //             <!-- Masters Accordion -->
// //             <p-accordion [multiple]="true" [activeIndex]="expandedMasters">
// //               <p-accordionTab *ngFor="let master of displayedMasters(); let i = index"
// //                 <ng-template pTemplate="header">
// //                   <div class="flex justify-between items-center w-full">
// //                     <span class="font-bold">{{ master.displayName }}</span>
// //                     <div class="flex gap-2">
// //                       <p-tag 
// //                         [value]="master.isPublished ? 'Published' : 'Draft'" 
// //                         [severity]="master.isPublished ? 'success' : 'info'"
// //                         size="small"
// //                       />
// //                       <span class="text-sm text-gray-500">{{ master.stats?.totalValues || 0 }} values</span>
// //                     </div>
// //                   </div>
// //                 </ng-template>
                
// //                 <!-- Master Actions -->
// //                 <div class="flex gap-2 mb-3">
// //                   <p-button 
// //                     icon="pi pi-pencil" 
// //                     severity="info" 
// //                     size="small" 
// //                     (onClick)="editMaster(master)"
// //                     pTooltip="Edit Master"
// //                     tooltipPosition="top"
// //                   />
// //                   <p-button 
// //                     *ngIf="!master.isPublished"
// //                     icon="pi pi-check-circle" 
// //                     severity="success" 
// //                     size="small" 
// //                     (onClick)="publishMaster(master)"
// //                     pTooltip="Publish"
// //                     tooltipPosition="top"
// //                   />
// //                   <p-button 
// //                     *ngIf="master.isPublished"
// //                     icon="pi pi-ban" 
// //                     severity="warn" 
// //                     size="small" 
// //                     (onClick)="unpublishMaster(master)"
// //                     pTooltip="Unpublish"
// //                     tooltipPosition="top"
// //                   />
// //                   <p-button 
// //                     icon="pi pi-trash" 
// //                     severity="danger" 
// //                     size="small" 
// //                     (onClick)="deleteMaster(master)"
// //                     pTooltip="Delete"
// //                     tooltipPosition="top"
// //                   />
// //                 </div>

// //                 <!-- Values Table -->
// //                 <p-table 
// //                   [value]="master.values || []" 
// //                   [rows]="5"
// //                   [paginator]="true"
// //                   [globalFilterFields]="['value', 'label', 'description']"
// //                   #valuesTable
// //                 >
// //                   <ng-template #caption>
// //                     <div class="flex justify-between items-center">
// //                       <span class="font-semibold">Values</span>
// //                       <p-iconField iconPosition="left">
// //                         <p-inputIcon>
// //                           <i class="pi pi-search"></i>
// //                         </p-inputIcon>
// //                         <input 
// //                           pInputText 
// //                           type="text" 
// //                           (input)="valuesTable.filterGlobal($event.target.value, 'contains')" 
// //                           placeholder="Search values..." 
// //                           size="30"
// //                         />
// //                       </p-iconField>
// //                     </div>
// //                   </ng-template>
                  
// //                   <ng-template #header>
// //                     <tr>
// //                       <th>Value</th>
// //                       <th>Label</th>
// //                       <th>Description</th>
// //                       <th>Status</th>
// //                       <th>Actions</th>
// //                     </tr>
// //                   </ng-template>
                  
// //                   <ng-template #body let-value>
// //                     <tr>
// //                       <td>
// //                         <span class="font-mono">{{ value.value }}</span>
// //                       </td>
// //                       <td>
// //                         <div class="flex items-center gap-2">
// //                           <span *ngIf="value.metadata?.icon" class="text-xl">{{ value.metadata.icon }}</span>
// //                           <span [style.color]="value.metadata?.color">{{ value.label }}</span>
// //                         </div>
// //                       </td>
// //                       <td>{{ value.description || '-' }}</td>
// //                       <td>
// //                         <div class="flex gap-1">
// //                           <p-tag 
// //                             *ngIf="value.isPublished" 
// //                             value="Published" 
// //                             severity="success" 
// //                             size="small"
// //                           />
// //                           <p-tag 
// //                             *ngIf="!value.isPublished" 
// //                             value="Draft" 
// //                             severity="info" 
// //                             size="small"
// //                           />
// //                           <p-tag 
// //                             *ngIf="value.isDefault" 
// //                             value="Default" 
// //                             severity="warn" 
// //                             size="small"
// //                           />
// //                           <p-tag 
// //                             *ngIf="value.isSystem" 
// //                             value="System" 
// //                             severity="secondary" 
// //                             size="small"
// //                           />
// //                         </div>
// //                       </td>
// //                       <td>
// //                         <div class="flex gap-2">
// //                           <p-button 
// //                             icon="pi pi-pencil" 
// //                             size="small" 
// //                             severity="info" 
// //                             (onClick)="editValue(master, value)"
// //                             pTooltip="Edit Value"
// //                           />
// //                           <p-button 
// //                             *ngIf="!value.isPublished"
// //                             icon="pi pi-check-circle" 
// //                             size="small" 
// //                             severity="success" 
// //                             (onClick)="publishValue(master._id!, value._id!)"
// //                             pTooltip="Publish"
// //                           />
// //                           <p-button 
// //                             *ngIf="value.isPublished && !value.isSystem"
// //                             icon="pi pi-ban" 
// //                             size="small" 
// //                             severity="warn" 
// //                             (onClick)="unpublishValue(master._id!, value._id!)"
// //                             pTooltip="Unpublish"
// //                           />
// //                           <p-button 
// //                             *ngIf="!value.isSystem"
// //                             icon="pi pi-trash" 
// //                             size="small" 
// //                             severity="danger" 
// //                             (onClick)="deleteValue(master._id!, value._id!)"
// //                             pTooltip="Delete"
// //                           />
// //                         </div>
// //                       </td>
// //                     </tr>
// //                   </ng-template>
                  
// //                   <ng-template #emptymessage>
// //                     <tr>
// //                       <td colspan="5" class="text-center p-4">No values found</td>
// //                     </tr>
// //                   </ng-template>
// //                 </p-table>

// //                 <!-- Add Value Button -->
// //                 <div class="mt-3">
// //                   <p-button 
// //                     label="Add Value" 
// //                     icon="pi pi-plus" 
// //                     size="small" 
// //                     (onClick)="openNewValueDialog(master)"
// //                   />
// //                 </div>
// //               </p-accordionTab>
// //             </p-accordion>
// //           </div>
// //         </div>

// //         <!-- Master Details Panel -->
// //         <div class="col-12 md:col-8" *ngIf="selectedMasterDetails() as master">
// //           <div class="card">
// //             <div class="flex justify-between items-center mb-4">
// //               <h3>{{ master.displayName }} - Details</h3>
// //               <div class="flex gap-2">
// //                 <p-button 
// //                   label="Edit" 
// //                   icon="pi pi-pencil" 
// //                   size="small" 
// //                   (onClick)="editMaster(master)"
// //                 />
// //                 <p-button 
// //                   label="Add Value" 
// //                   icon="pi pi-plus" 
// //                   size="small" 
// //                   (onClick)="openNewValueDialog(master)"
// //                 />
// //               </div>
// //             </div>

// //             <!-- Master Info -->
// //             <div class="grid mb-4">
// //               <div class="col-6">
// //                 <div class="field">
// //                   <label class="font-bold">Master Name</label>
// //                   <p>{{ master.masterName }}</p>
// //                 </div>
// //               </div>
// //               <div class="col-6">
// //                 <div class="field">
// //                   <label class="font-bold">Display Name</label>
// //                   <p>{{ master.displayName }}</p>
// //                 </div>
// //               </div>
// //               <div class="col-12">
// //                 <div class="field">
// //                   <label class="font-bold">Description</label>
// //                   <p>{{ master.description || '-' }}</p>
// //                 </div>
// //               </div>
// //               <div class="col-6">
// //                 <div class="field">
// //                   <label class="font-bold">Category</label>
// //                   <p-tag [value]="master.category" severity="info" />
// //                 </div>
// //               </div>
// //               <div class="col-6">
// //                 <div class="field">
// //                   <label class="font-bold">Status</label>
// //                   <div class="flex gap-2">
// //                     <p-tag 
// //                       [value]="master.isPublished ? 'Published' : 'Draft'" 
// //                       [severity]="master.isPublished ? 'success' : 'info'"
// //                     />
// //                     <p-tag 
// //                       *ngIf="master.isSystem" 
// //                       value="System" 
// //                       severity="secondary"
// //                     />
// //                     <p-tag 
// //                       *ngIf="master.isLocked" 
// //                       value="Locked" 
// //                       severity="warn"
// //                     />
// //                   </div>
// //                 </div>
// //               </div>
// //             </div>

// //             <!-- Stats Cards -->
// //             <div class="grid mb-4">
// //               <div class="col-3">
// //                 <div class="card text-center">
// //                   <span class="text-2xl font-bold">{{ master.stats?.totalValues || 0 }}</span>
// //                   <span class="block text-gray-500">Total Values</span>
// //                 </div>
// //               </div>
// //               <div class="col-3">
// //                 <div class="card text-center">
// //                   <span class="text-2xl font-bold text-green-600">{{ master.stats?.publishedValues || 0 }}</span>
// //                   <span class="block text-gray-500">Published</span>
// //                 </div>
// //               </div>
// //               <div class="col-3">
// //                 <div class="card text-center">
// //                   <span class="text-2xl font-bold text-blue-600">{{ master.stats?.activeValues || 0 }}</span>
// //                   <span class="block text-gray-500">Active</span>
// //                 </div>
// //               </div>
// //               <div class="col-3">
// //                 <div class="card text-center">
// //                   <span class="text-2xl font-bold">{{ master.config?.isHierarchical ? 'Yes' : 'No' }}</span>
// //                   <span class="block text-gray-500">Hierarchical</span>
// //                 </div>
// //               </div>
// //             </div>

// //             <!-- Values Table -->
// //             <p-table 
// //               [value]="master.values || []" 
// //               [rows]="10"
// //               [paginator]="true"
// //               [globalFilterFields]="['value', 'label', 'description']"
// //               #detailsTable
// //             >
// //               <ng-template #caption>
// //                 <div class="flex justify-between items-center">
// //                   <span class="font-semibold text-lg">Master Values</span>
// //                   <p-iconField iconPosition="left">
// //                     <p-inputIcon>
// //                       <i class="pi pi-search"></i>
// //                     </p-inputIcon>
// //                     <input 
// //                       pInputText 
// //                       type="text" 
// //                       (input)="detailsTable.filterGlobal($event.target.value, 'contains')" 
// //                       placeholder="Search values..." 
// //                       size="30"
// //                     />
// //                   </p-iconField>
// //                 </div>
// //               </ng-template>
              
// //               <ng-template #header>
// //                 <tr>
// //                   <th>Value</th>
// //                   <th>Label</th>
// //                   <th>Description</th>
// //                   <th>Parent</th>
// //                   <th>Metadata</th>
// //                   <th>Status</th>
// //                   <th>Actions</th>
// //                 </tr>
// //               </ng-template>
              
// //               <ng-template #body let-value>
// //                 <tr>
// //                   <td>
// //                     <span class="font-mono">{{ value.value }}</span>
// //                   </td>
// //                   <td>
// //                     <div class="flex items-center gap-2">
// //                       <span *ngIf="value.metadata?.icon" class="text-xl">{{ value.metadata.icon }}</span>
// //                       <span [style.color]="value.metadata?.color">{{ value.label }}</span>
// //                     </div>
// //                   </td>
// //                   <td>{{ value.description || '-' }}</td>
// //                   <td>
// //                     <span *ngIf="value.parentValue">
// //                       {{ getParentLabel(master.values, value.parentValue) }}
// //                     </span>
// //                     <span *ngIf="!value.parentValue">-</span>
// //                   </td>
// //                   <td>
// //                     <div class="flex gap-1 flex-wrap">
// //                       <p-chip 
// //                         *ngIf="value.metadata?.sortOrder !== undefined" 
// //                         label="Order: {{ value.metadata.sortOrder }}" 
// //                         size="small"
// //                       />
// //                     </div>
// //                   </td>
// //                   <td>
// //                     <div class="flex gap-1">
// //                       <p-tag 
// //                         *ngIf="value.isPublished" 
// //                         value="Published" 
// //                         severity="success" 
// //                         size="small"
// //                       />
// //                       <p-tag 
// //                         *ngIf="!value.isPublished" 
// //                         value="Draft" 
// //                         severity="info" 
// //                         size="small"
// //                       />
// //                       <p-tag 
// //                         *ngIf="value.isDefault" 
// //                         value="Default" 
// //                         severity="warn" 
// //                         size="small"
// //                       />
// //                       <p-tag 
// //                         *ngIf="value.isSystem" 
// //                         value="System" 
// //                         severity="secondary" 
// //                         size="small"
// //                       />
// //                     </div>
// //                   </td>
// //                   <td>
// //                     <div class="flex gap-2">
// //                       <p-button 
// //                         icon="pi pi-pencil" 
// //                         size="small" 
// //                         severity="info" 
// //                         (onClick)="editValue(master, value)"
// //                         pTooltip="Edit Value"
// //                       />
// //                       <p-button 
// //                         *ngIf="!value.isPublished"
// //                         icon="pi pi-check-circle" 
// //                         size="small" 
// //                         severity="success" 
// //                         (onClick)="publishValue(master._id!, value._id!)"
// //                         pTooltip="Publish"
// //                       />
// //                       <p-button 
// //                         *ngIf="value.isPublished && !value.isSystem"
// //                         icon="pi pi-ban" 
// //                         size="small" 
// //                         severity="warn" 
// //                         (onClick)="unpublishValue(master._id!, value._id!)"
// //                         pTooltip="Unpublish"
// //                       />
// //                       <p-button 
// //                         *ngIf="!value.isSystem"
// //                         icon="pi pi-trash" 
// //                         size="small" 
// //                         severity="danger" 
// //                         (onClick)="deleteValue(master._id!, value._id!)"
// //                         pTooltip="Delete"
// //                       />
// //                     </div>
// //                   </td>
// //                 </tr>
// //               </ng-template>
              
// //               <ng-template #emptymessage>
// //                 <tr>
// //                   <td colspan="7" class="text-center p-4">No values found</td>
// //                 </tr>
// //               </ng-template>
// //             </p-table>
// //           </div>
// //         </div>
// //       </div>
// //     </div>

// //     <!-- Master Dialog -->
// //     <p-dialog 
// //       [(visible)]="showMasterDialog" 
// //       [style]="{ width: '500px' }"
     
// //       [modal]="true"
// //       [draggable]="false"
// //       [resizable]="false"
// //     >
// //       <form [formGroup]="masterForm">
// //         <div class="field">
// //           <label for="masterName">Master Name *</label>
// //           <input 
// //             pInputText 
// //             id="masterName" 
// //             formControlName="masterName" 
// //             class="w-full"
// //             [class.ng-invalid]="masterForm.get('masterName')?.invalid && masterForm.get('masterName')?.touched"
// //           />
// //           <small *ngIf="masterForm.get('masterName')?.invalid && masterForm.get('masterName')?.touched" class="text-red-500">
// //             Master Name is required and must be uppercase
// //           </small>
// //         </div>

// //         <div class="field">
// //           <label for="displayName">Display Name *</label>
// //           <input 
// //             pInputText 
// //             id="displayName" 
// //             formControlName="displayName" 
// //             class="w-full"
// //           />
// //         </div>

// //         <div class="field">
// //           <label for="description">Description</label>
// //           <textarea 
// //             pInputTextarea 
// //             id="description" 
// //             formControlName="description" 
// //             rows="3"
// //             class="w-full"
// //           ></textarea>
// //         </div>

// //         <div class="field">
// //           <label for="category">Category</label>
// //           <p-select
// //             id="category"
// //             formControlName="category"
// //             [options]="masterCategories"
// //             optionLabel="label"
// //             optionValue="value"
// //             placeholder="Select Category"
// //             class="w-full"
// //           />
// //         </div>

// //         <div class="field-checkbox">
// //           <p-checkbox 
// //             id="isHierarchical" 
// //             formControlName="isHierarchical"
// //             binary="true"
// //           />
// //           <label for="isHierarchical" class="ml-2">Allow Hierarchical Values</label>
// //         </div>
// //       </form>

// //       <ng-template #footer>
// //         <p-button label="Cancel" icon="pi pi-times" (onClick)="hideMasterDialog()" text />
// //         <p-button 
// //           label="Save" 
// //           icon="pi pi-check" 
// //           (onClick)="saveMaster()"
// //           [disabled]="masterForm.invalid"
// //         />
// //       </ng-template>
// //     </p-dialog>

// //     <!-- Value Dialog -->
// //     <p-dialog 
// //       [(visible)]="showValueDialog" 
// //       [style]="{ width: '500px' }"
     
// //       [modal]="true"
// //     >
// //       <form [formGroup]="valueForm" *ngIf="selectedMasterForValue">
// //         <div class="field">
// //           <label for="value">Value *</label>
// //           <input 
// //             pInputText 
// //             id="value" 
// //             formControlName="value" 
// //             class="w-full"
// //           />
// //         </div>

// //         <div class="field">
// //           <label for="label">Label *</label>
// //           <input 
// //             pInputText 
// //             id="label" 
// //             formControlName="label" 
// //             class="w-full"
// //           />
// //         </div>

// //         <div class="field">
// //           <label for="description">Description</label>
// //           <textarea 
// //             pInputTextarea 
// //             id="description" 
// //             formControlName="description" 
// //             rows="2"
// //             class="w-full"
// //           ></textarea>
// //         </div>

// //         <div *ngIf="selectedMasterForValue.config?.isHierarchical" class="field">
// //           <label for="parentValue">Parent Value</label>
// //           <p-select
// //             id="parentValue"
// //             formControlName="parentValue"
// //             [options]="parentOptions"
// //             optionLabel="label"
// //             optionValue="_id"
// //             placeholder="Select Parent"
// //             class="w-full"
// //           />
// //         </div>

// //         <p-accordion>
// //           <p-accordionTab header="Metadata">
// //             <div class="field">
// //               <label for="icon">Icon</label>
// //               <input 
// //                 pInputText 
// //                 id="icon" 
// //                 formControlName="icon" 
// //                 class="w-full"
// //                 placeholder="e.g., 🎨, pi pi-star"
// //               />
// //             </div>

// //             <div class="field">
// //               <label for="color">Color</label>
// //               <p-colorPicker 
// //                 id="color" 
// //                 formControlName="color" 
// //                 [inline]="false"
// //               />
// //             </div>

// //             <div class="field">
// //               <label for="sortOrder">Sort Order</label>
// //               <p-inputNumber 
// //                 id="sortOrder" 
// //                 formControlName="sortOrder" 
// //                 class="w-full"
// //               />
// //             </div>
// //           </p-accordionTab>
// //         </p-accordion>

// //         <div class="field-checkbox">
// //           <p-checkbox 
// //             id="isPublished" 
// //             formControlName="isPublished"
// //             [binary]="true"
// //           />
// //           <label for="isPublished" class="ml-2">Published</label>
// //         </div>

// //         <div class="field-checkbox">
// //           <p-checkbox 
// //             id="isDefault" 
// //             formControlName="isDefault"
// //             [binary]="true"
// //           />
// //           <label for="isDefault" class="ml-2">Default Value</label>
// //         </div>
// //       </form>

// //       <ng-template #footer>
// //         <p-button label="Cancel" icon="pi pi-times" (onClick)="hideValueDialog()" text />
// //         <p-button 
// //           label="Save" 
// //           icon="pi pi-check" 
// //           (onClick)="saveValue()"
// //           [disabled]="valueForm.invalid"
// //         />
// //       </ng-template>
// //     </p-dialog>

// //     <!-- File Upload (Hidden) -->
// //     <input 
// //       #importFileUpload
// //       type="file" 
// //       accept=".json,.csv"
// //       style="display: none"
// //       (change)="onFileSelected($event)"
// //     />

// //     <!-- Confirm Dialog -->
// //     <p-confirmDialog />
// //     <p-toast />
// //   `,
// //   styles: [`
// //     :host ::ng-deep {
// //       .p-accordion .p-accordion-header .p-accordion-header-link {
// //         padding: 1rem;
// //       }
      
// //       .p-accordion .p-accordion-content {
// //         padding: 1.5rem;
// //       }
      
// //       .field {
// //         margin-bottom: 1.5rem;
// //       }
      
// //       .field-checkbox {
// //         margin-bottom: 1rem;
// //       }
// //     }
// //   `]
// // })
// // export class MasterDataGridComponent implements OnInit, AfterViewInit {
// //   @ViewChild('dt') dt!: Table;

// //   private masterApi = inject(MasterApiService);
// //   private fb = inject(FormBuilder);
// //   private messageService = inject(MessageService);
// //   private confirmationService = inject(ConfirmationService);
// //   private datePipe = inject(DatePipe);

// //   // State
// //   allMasters = signal<any[]>([]);
// //   filteredMasters = signal<any[]>([]);
// //   loading = signal<boolean>(false);
// //   masterSearchValue = signal<string>('');

// //   // Selection
// //   selectedMasterCategory = signal<string>('');
// //   selectedMaster = signal<string>('');
// //   selectedMasterDetails = computed(() => {
// //     const id = this.selectedMaster();
// //     return this.allMasters().find(m => m._id === id);
// //   });

// //   // UI State
// //   expandedMasters = signal<number[]>([]);
// //   showMasterDialog = signal<boolean>(false);
// //   showValueDialog = signal<boolean>(false);
// //   editingMaster = signal<Master | null>(null);
// //   editingValue = signal<{ master: Master; value: MasterValue } | null>(null);
// //   selectedMasterForValue = signal<Master | null>(null);

// //   // Categories
// //   masterCategories = [
// //     { label: 'System', value: 'SYSTEM' },
// //     { label: 'Business', value: 'BUSINESS' },
// //     { label: 'Education', value: 'EDUCATION' },
// //     { label: 'Content', value: 'CONTENT' },
// //     { label: 'User', value: 'USER' },
// //     { label: 'Settings', value: 'SETTINGS' }
// //   ];

// //   // Forms
// //   masterForm: FormGroup = this.fb.group({
// //     masterName: ['', [Validators.required, Validators.pattern('^[A-Z_]+$')]],
// //     displayName: ['', Validators.required],
// //     description: [''],
// //     category: ['BUSINESS'],
// //     isHierarchical: [false]
// //   });

// //   valueForm: FormGroup = this.fb.group({
// //     value: ['', Validators.required],
// //     label: ['', Validators.required],
// //     description: [''],
// //     parentValue: [null],
// //     icon: [''],
// //     color: [''],
// //     sortOrder: [0],
// //     isPublished: [true],
// //     isDefault: [false]
// //   });

// //   // Computed
// //   masterDialogTitle = computed(() => 
// //     this.editingMaster() ? 'Edit Master' : 'Create New Master'
// //   );

// //   valueDialogTitle = computed(() => 
// //     this.editingValue() ? 'Edit Value' : 'Add New Value'
// //   );

// //   parentOptions:any = computed(() => {
// //     const master = this.selectedMasterForValue();
// //     if (!master?.values) return [];
// //     return master.values.filter(v => v.isActive && v._id !== this.editingValue()?.value._id);
// //   });

// //   displayedMasters = computed(() => {
// //     let masters = this.filteredMasters();
// //     const search = this.masterSearchValue().toLowerCase();
    
// //     if (search) {
// //       masters = masters.filter(m => 
// //         m.displayName?.toLowerCase().includes(search) ||
// //         m.masterName?.toLowerCase().includes(search) ||
// //         m.description?.toLowerCase().includes(search)
// //       );
// //     }
    
// //     return masters;
// //   });

// //   ngOnInit(): void {
// //     this.loadMasters();
// //   }

// //   ngAfterViewInit(): void {
// //     // Initialize expanded masters if needed
// //   }

// //   loadMasters(): void {
// //     this.loading.set(true);
// //     this.masterApi.getAllMasters()
// //       .pipe(
// //         tap(response => {
// //           const masters = (response.data || []) as any[];
// //           this.allMasters.set(masters);
// //           this.filteredMasters.set(masters);
          
// //           // Auto-expand first master
// //           if (masters.length > 0) {
// //             this.expandedMasters.set([0]);
// //           }
// //         }),
// //         catchError(error => {
// //           this.messageService.add({
// //             severity: 'error',
// //             summary: 'Error',
// //             detail: 'Failed to load masters'
// //           });
// //           return of(null);
// //         }),
// //         finalize(() => this.loading.set(false))
// //       )
// //       .subscribe();
// //   }

// //   filterByCategory(): void {
// //     const category = this.selectedMasterCategory();
// //     if (category) {
// //       this.filteredMasters.set(
// //         this.allMasters().filter(m => m.category === category)
// //       );
// //     } else {
// //       this.filteredMasters.set(this.allMasters());
// //     }
// //   }

// //   filterMasters(): void {
// //     // Handled by computed
// //   }

// //   onMasterSelect(): void {
// //     const masterId = this.selectedMaster();
// //     const index = this.allMasters().findIndex(m => m._id === masterId);
// //     if (index >= 0) {
// //       this.expandedMasters.set([index]);
// //     }
// //   }

// //   // --- Master CRUD ---

// //   openNewMasterDialog(): void {
// //     this.editingMaster.set(null);
// //     this.masterForm.reset({
// //       masterName: '',
// //       displayName: '',
// //       description: '',
// //       category: this.selectedMasterCategory() || 'BUSINESS',
// //       isHierarchical: false
// //     });
// //     this.showMasterDialog.set(true);
// //   }

// //   editMaster(master: Master): void {
// //     this.editingMaster.set(master);
// //     this.masterForm.patchValue({
// //       masterName: master.masterName,
// //       displayName: master.displayName,
// //       description: master.description,
// //       category: master.category,
// //       isHierarchical: master.config?.isHierarchical || false
// //     });
// //     this.showMasterDialog.set(true);
// //   }

// //   hideMasterDialog(): void {
// //     this.showMasterDialog.set(false);
// //     this.editingMaster.set(null);
// //   }

// //   saveMaster(): void {
// //     if (this.masterForm.invalid) {
// //       this.masterForm.markAllAsTouched();
// //       return;
// //     }

// //     const formData = this.masterForm.value;
// //     const masterData = {
// //       masterName: formData.masterName,
// //       displayName: formData.displayName,
// //       description: formData.description,
// //       category: formData.category,
// //       config: {
// //         isHierarchical: formData.isHierarchical,
// //         allowMultiple: true,
// //         hasMetadata: true
// //       }
// //     };

// //     const request$ = this.editingMaster()
// //       ? this.masterApi.updateMaster(this.editingMaster()!._id!, masterData)
// //       : this.masterApi.createMaster(masterData);

// //     request$.pipe(
// //       tap(response => {
// //         this.messageService.add({
// //           severity: 'success',
// //           summary: 'Success',
// //           detail: `Master ${this.editingMaster() ? 'updated' : 'created'} successfully`
// //         });
// //         this.hideMasterDialog();
// //         this.loadMasters();
// //       }),
// //       catchError(error => {
// //         this.messageService.add({
// //           severity: 'error',
// //           summary: 'Error',
// //           detail: `Failed to ${this.editingMaster() ? 'update' : 'create'} master`
// //         });
// //         return of(null);
// //       })
// //     ).subscribe();
// //   }

// //   publishMaster(master: Master): void {
// //     this.confirmationService.confirm({
// //       message: `Publish "${master.displayName}"?`,
// //       header: 'Confirm Publish',
// //       icon: 'pi pi-check-circle',
// //       accept: () => {
// //         this.masterApi.publishMaster(master._id!).pipe(
// //           tap(() => {
// //             this.messageService.add({
// //               severity: 'success',
// //               summary: 'Success',
// //               detail: 'Master published'
// //             });
// //             this.loadMasters();
// //           }),
// //           catchError(error => {
// //             this.messageService.add({
// //               severity: 'error',
// //               summary: 'Error',
// //               detail: 'Failed to publish master'
// //             });
// //             return of(null);
// //           })
// //         ).subscribe();
// //       }
// //     });
// //   }

// //   unpublishMaster(master: Master): void {
// //     this.confirmationService.confirm({
// //       message: `Unpublish "${master.displayName}"?`,
// //       header: 'Confirm Unpublish',
// //       icon: 'pi pi-ban',
// //       accept: () => {
// //         this.masterApi.unpublishMaster(master._id!).pipe(
// //           tap(() => {
// //             this.messageService.add({
// //               severity: 'success',
// //               summary: 'Success',
// //               detail: 'Master unpublished'
// //             });
// //             this.loadMasters();
// //           }),
// //           catchError(error => {
// //             this.messageService.add({
// //               severity: 'error',
// //               summary: 'Error',
// //               detail: 'Failed to unpublish master'
// //             });
// //             return of(null);
// //           })
// //         ).subscribe();
// //       }
// //     });
// //   }

// //   deleteMaster(master: Master): void {
// //     this.confirmationService.confirm({
// //       message: `Delete "${master.displayName}"? This action cannot be undone.`,
// //       header: 'Confirm Delete',
// //       icon: 'pi pi-exclamation-triangle',
// //       acceptButtonStyleClass: 'p-button-danger',
// //       accept: () => {
// //         this.masterApi.deleteMaster(master._id!).pipe(
// //           tap(() => {
// //             this.messageService.add({
// //               severity: 'success',
// //               summary: 'Success',
// //               detail: 'Master deleted'
// //             });
// //             this.loadMasters();
// //           }),
// //           catchError(error => {
// //             this.messageService.add({
// //               severity: 'error',
// //               summary: 'Error',
// //               detail: 'Failed to delete master'
// //             });
// //             return of(null);
// //           })
// //         ).subscribe();
// //       }
// //     });
// //   }

// //   // --- Value CRUD ---

// //   openNewValueDialog(master: Master): void {
// //     this.selectedMasterForValue.set(master);
// //     this.editingValue.set(null);
// //     this.valueForm.reset({
// //       value: '',
// //       label: '',
// //       description: '',
// //       parentValue: null,
// //       icon: '',
// //       color: '',
// //       sortOrder: 0,
// //       isPublished: true,
// //       isDefault: false
// //     });
// //     this.showValueDialog.set(true);
// //   }

// //   editValue(master: Master, value: MasterValue): void {
// //     this.selectedMasterForValue.set(master);
// //     this.editingValue.set({ master, value });
// //     this.valueForm.patchValue({
// //       value: value.value,
// //       label: value.label,
// //       description: value.description,
// //       parentValue: value.parentValue,
// //       icon: value.metadata?.icon || '',
// //       color: value.metadata?.color || '',
// //       sortOrder: value.metadata?.sortOrder || 0,
// //       isPublished: value.isPublished,
// //       isDefault: value.isDefault || false
// //     });
// //     this.showValueDialog.set(true);
// //   }

// //   hideValueDialog(): void {
// //     this.showValueDialog.set(false);
// //     this.editingValue.set(null);
// //     this.selectedMasterForValue.set(null);
// //   }

// //   saveValue(): void {
// //     if (this.valueForm.invalid || !this.selectedMasterForValue()) {
// //       this.valueForm.markAllAsTouched();
// //       return;
// //     }

// //     const formData = this.valueForm.value;
// //     const master = this.selectedMasterForValue()!;
    
// //     const valueData: Partial<MasterValue> = {
// //       value: formData.value,
// //       label: formData.label,
// //       description: formData.description,
// //       parentValue: formData.parentValue,
// //       metadata: {
// //         icon: formData.icon,
// //         color: formData.color,
// //         sortOrder: formData.sortOrder
// //       },
// //       isPublished: formData.isPublished,
// //       isDefault: formData.isDefault
// //     };

// //     const request$ = this.editingValue()
// //       ? this.masterApi.updateValue(master._id!, this.editingValue()!.value._id!, valueData)
// //       : this.masterApi.addValue(master._id!, valueData);

// //     request$.pipe(
// //       tap(() => {
// //         this.messageService.add({
// //           severity: 'success',
// //           summary: 'Success',
// //           detail: `Value ${this.editingValue() ? 'updated' : 'added'} successfully`
// //         });
// //         this.hideValueDialog();
// //         this.loadMasters();
// //       }),
// //       catchError(error => {
// //         this.messageService.add({
// //           severity: 'error',
// //           summary: 'Error',
// //           detail: `Failed to ${this.editingValue() ? 'update' : 'add'} value`
// //         });
// //         return of(null);
// //       })
// //     ).subscribe();
// //   }

// //   publishValue(masterId: string, valueId: string): void {
// //     this.masterApi.publishValue(masterId, valueId).pipe(
// //       tap(() => {
// //         this.messageService.add({
// //           severity: 'success',
// //           summary: 'Success',
// //           detail: 'Value published'
// //         });
// //         this.loadMasters();
// //       }),
// //       catchError(error => {
// //         this.messageService.add({
// //           severity: 'error',
// //           summary: 'Error',
// //           detail: 'Failed to publish value'
// //         });
// //         return of(null);
// //       })
// //     ).subscribe();
// //   }

// //   unpublishValue(masterId: string, valueId: string): void {
// //     this.masterApi.unpublishValue(masterId, valueId).pipe(
// //       tap(() => {
// //         this.messageService.add({
// //           severity: 'success',
// //           summary: 'Success',
// //           detail: 'Value unpublished'
// //         });
// //         this.loadMasters();
// //       }),
// //       catchError(error => {
// //         this.messageService.add({
// //           severity: 'error',
// //           summary: 'Error',
// //           detail: 'Failed to unpublish value'
// //         });
// //         return of(null);
// //       })
// //     ).subscribe();
// //   }

// //   deleteValue(masterId: string, valueId: string): void {
// //     this.confirmationService.confirm({
// //       message: 'Delete this value?',
// //       header: 'Confirm Delete',
// //       icon: 'pi pi-exclamation-triangle',
// //       acceptButtonStyleClass: 'p-button-danger',
// //       accept: () => {
// //         this.masterApi.deleteValue(masterId, valueId).pipe(
// //           tap(() => {
// //             this.messageService.add({
// //               severity: 'success',
// //               summary: 'Success',
// //               detail: 'Value deleted'
// //             });
// //             this.loadMasters();
// //           }),
// //           catchError(error => {
// //             this.messageService.add({
// //               severity: 'error',
// //               summary: 'Error',
// //               detail: 'Failed to delete value'
// //             });
// //             return of(null);
// //           })
// //         ).subscribe();
// //       }
// //     });
// //   }

// //   // --- Import/Export ---

// //   onFileSelected(event: any): void {
// //     const file = event.target.files[0];
// //     if (!file || !this.selectedMaster()) return;

// //     const formData = new FormData();
// //     formData.append('file', file);

// //     this.masterApi.importValues(this.selectedMaster(), formData).pipe(
// //       tap(() => {
// //         this.messageService.add({
// //           severity: 'success',
// //           summary: 'Success',
// //           detail: 'Values imported successfully'
// //         });
// //         this.loadMasters();
// //       }),
// //       catchError(error => {
// //         this.messageService.add({
// //           severity: 'error',
// //           summary: 'Error',
// //           detail: 'Failed to import values'
// //         });
// //         return of(null);
// //       })
// //     ).subscribe();
// //   }

// //   exportData(): void {
// //     if (!this.selectedMaster()) return;

// //     this.masterApi.exportValues(this.selectedMaster(), { 
// //       params: { format: 'json' } 
// //     }).pipe(
// //       tap(blob => {
// //         const url = window.URL.createObjectURL(blob);
// //         const a = document.createElement('a');
// //         a.href = url;
// //         a.download = `master-${this.selectedMaster()}-export.json`;
// //         a.click();
// //         window.URL.revokeObjectURL(url);
        
// //         this.messageService.add({
// //           severity: 'success',
// //           summary: 'Success',
// //           detail: 'Data exported successfully'
// //         });
// //       }),
// //       catchError(error => {
// //         this.messageService.add({
// //           severity: 'error',
// //           summary: 'Error',
// //           detail: 'Failed to export data'
// //         });
// //         return of(null);
// //       })
// //     ).subscribe();
// //   }

// //   // --- Helpers ---

// //   getParentLabel(values: MasterValue[], parentId: string): string {
// //     const parent = values.find(v => v._id === parentId);
// //     return parent?.label || parentId;
// //   }

// //   clear(dt: Table): void {
// //     this.masterSearchValue.set('');
// //     dt.reset();
// //   }

// //   getSeverity(status: string): string {
// //     switch (status) {
// //       case 'Published': return 'success';
// //       case 'Draft': return 'info';
// //       case 'System': return 'secondary';
// //       default: return 'info';
// //     }
// //   }
// // }