// components/master-data-grid.component.ts
import { Component, OnInit, inject, signal, computed, ViewChild, AfterViewInit, effect } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { tap, catchError, of, finalize, switchMap, debounceTime, distinctUntilChanged } from 'rxjs';

// PrimeNG Imports
import { TableModule, Table, TableRowSelectEvent, TableFilterEvent } from 'primeng/table';
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
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import { PanelModule } from 'primeng/panel';
import { TreeModule } from 'primeng/tree';
import { TreeSelectModule } from 'primeng/treeselect';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { RadioButtonModule } from 'primeng/radiobutton';
import { KeyFilterModule } from 'primeng/keyfilter';
import { InputMaskModule } from 'primeng/inputmask';
import { CascadeSelectModule } from 'primeng/cascadeselect';
import { SliderModule } from 'primeng/slider';
import { RatingModule } from 'primeng/rating';
import { ListboxModule } from 'primeng/listbox';
import { PickListModule } from 'primeng/picklist';
import { OrderListModule } from 'primeng/orderlist';
import { TimelineModule } from 'primeng/timeline';
import { OrganizationChartModule } from 'primeng/organizationchart';
import { SpeedDialModule } from 'primeng/speeddial';

import { Master, MasterApiService, MasterValue } from '../../../core/services/master-list.service';
import { TabsModule } from 'primeng/tabs';
import { DatePicker } from "primeng/datepicker";

export interface MasterValueExtended extends MasterValue {
  description?: string;
  parentValue?: string;
  metadata?: { 
    icon?: string; 
    color?: string; 
    sortOrder?: number;
    [key: string]: any;
  };
  isPublished?: boolean;
  isDefault?: boolean;
  isSystem?: boolean;
  isActive?: boolean;
  children?: MasterValueExtended[];
  path?: string;
  level?: number;
}

@Component({
  selector: 'app-master-data-grid',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule, DatePipe, TableModule, ButtonModule, InputTextModule, InputNumberModule, SelectModule, MultiSelectModule, TagModule, ChipModule, IconFieldModule, InputIconModule, DialogModule, ConfirmDialogModule, ToastModule, ToolbarModule, SplitButtonModule, MenuModule, FileUploadModule, ProgressBarModule, SkeletonModule, BadgeModule, OverlayModule, ColorPickerModule, ToggleSwitchModule, AccordionModule, CheckboxModule, TooltipModule, TabsModule, CardModule, DividerModule, PanelModule, TreeModule, TreeSelectModule, InputTextModule, SelectModule, AutoCompleteModule, RadioButtonModule, KeyFilterModule, InputMaskModule, CascadeSelectModule, SliderModule, RatingModule, CheckboxModule, ListboxModule, PickListModule, OrderListModule, TimelineModule, OrganizationChartModule, SpeedDialModule,
    DatePicker
],
  providers: [MessageService, ConfirmationService, DatePipe],
  template: `
    <div class="master-data-grid">
      <!-- Main Toolbar -->
      <p-toolbar styleClass="mb-4 shadow-2 border-round-xl">
        <ng-template pTemplate="start">
          <div class="flex flex-wrap gap-2 align-items-center">
            <p-button 
              label="New Master" 
              icon="pi pi-plus" 
              severity="success" 
              (onClick)="openNewMasterDialog()"
              [outlined]="true"
              [disabled]="!selectedMasterCategory()"
              pTooltip="Create new master data type"
              tooltipPosition="bottom"
            />
            <p-button 
              label="Import" 
              icon="pi pi-upload" 
              severity="help" 
              (onClick)="importFileUpload.click()"
              [disabled]="!selectedMaster()"
              [outlined]="true"
              pTooltip="Import values from CSV/JSON"
              tooltipPosition="bottom"
            />
            <p-button 
              label="Export" 
              icon="pi pi-download" 
              severity="info" 
              (onClick)="exportData()"
              [disabled]="!selectedMaster()"
              [outlined]="true"
              pTooltip="Export values"
              tooltipPosition="bottom"
            />
            <p-button 
              *ngIf="selectedMasterDetails()"
              label="Clone" 
              icon="pi pi-copy" 
              severity="secondary" 
              (onClick)="cloneMaster()"
              [outlined]="true"
              pTooltip="Clone this master"
              tooltipPosition="bottom"
            />
          </div>
        </ng-template>
        
        <ng-template pTemplate="center">
          <div class="flex gap-2 align-items-center">
            <span class="text-primary font-bold hidden md:block">Master Data Management</span>
          </div>
        </ng-template>
        
        <ng-template pTemplate="end">
          <div class="flex gap-2 align-items-center">
            <span class="font-medium text-sm hidden lg:block">Quick Filters:</span>
         <p-select
  [ngModel]="selectedMasterCategory()"
  (ngModelChange)="selectedMasterCategory.set($event); filterByCategory()"
  [options]="masterCategories"
  optionLabel="label"
  optionValue="value"
  placeholder="Filter by Category"
  class="w-48"
/>

<p-select
  [ngModel]="selectedMaster()"
  (ngModelChange)="selectedMaster.set($event); onMasterSelect()"
  [options]="filteredMasters()"
  optionLabel="displayName"
  optionValue="_id"
  placeholder="Select Master"
  class="w-64"
/>
            <p-button 
              icon="pi pi-refresh" 
              severity="secondary" 
              [text]="true"
              (onClick)="loadMasters()"
              pTooltip="Refresh"
            />
          </div>
        </ng-template>
      </p-toolbar>

      <!-- Main Content Grid -->
      <div class="grid">
        <!-- Left Panel - Master List -->
        <div class="col-12 lg:col-4">
          <p-panel header="Master Types" [toggleable]="true" [collapsed]="false" styleClass="shadow-2 border-round-xl">
            <ng-template pTemplate="icons">
              <p-button icon="pi pi-search" (onClick)="focusSearch()" styleClass="p-panel-header-icon" [text]="true" />
            </ng-template>
            
            <div class="p-2">
              <p-iconfield iconPosition="left" class="mb-3 block w-full">
                <p-inputicon styleClass="pi pi-search"></p-inputicon>
                <input 
  pInputText 
  type="text" 
  [ngModel]="masterSearchValue()" 
  (ngModelChange)="masterSearchValue.set($event)"
  placeholder="Search masters..." 
  class="w-full"
/>
              </p-iconfield>

              <div class="flex gap-2 mb-3 flex-wrap">
                <p-button 
                  label="Expand All" 
                  icon="pi pi-angle-double-down" 
                  size="small" 
                  [text]="true"
                  (onClick)="expandAllMasters()"
                />
                <p-button 
                  label="Collapse All" 
                  icon="pi pi-angle-double-up" 
                  size="small" 
                  [text]="true"
                  (onClick)="collapseAllMasters()"
                />
              </div>

              <p-accordion [multiple]="true" [value]="expandedMasters()" class="master-accordion">
  <p-accordion-panel *ngFor="let master of displayedMasters(); let i = index" [value]="i">
    <p-accordion-header>
      <div class="flex justify-content-between align-items-center w-full">
        <div class="flex align-items-center gap-2">
          <i class="pi pi-database" [class.text-primary]="master.isPublished"></i>
          <span class="font-bold">{{ master.displayName || master.masterName }}</span>
        </div>
        <div class="flex gap-2 align-items-center">
          <p-badge 
            *ngIf="master.stats?.totalValues" 
            [value]="master.stats?.totalValues" 
            severity="info"
          ></p-badge>
          <p-tag 
            [value]="master.isPublished ? 'Published' : 'Draft'" 
            [severity]="master.isPublished ? 'success' : 'info'"
            [rounded]="true"
            size="small"
          />
        </div>
      </div>
    </p-accordion-header>
    
    <p-accordion-content>
      <div class="flex gap-2 mb-3 flex-wrap">
        <p-button 
          icon="pi pi-pencil" 
          severity="info" 
          size="small" 
          [outlined]="true"
          (onClick)="editMaster(master)"
          pTooltip="Edit Master"
          tooltipPosition="top"
        />
        <p-button 
          *ngIf="!master.isPublished"
          icon="pi pi-check-circle" 
          severity="success" 
          size="small" 
          [outlined]="true"
          (onClick)="publishMaster(master)"
          pTooltip="Publish"
          tooltipPosition="top"
        />
        <p-button 
          *ngIf="master.isPublished"
          icon="pi pi-ban" 
          severity="warn" 
          size="small" 
          [outlined]="true"
          (onClick)="unpublishMaster(master)"
          pTooltip="Unpublish"
          tooltipPosition="top"
        />
        <p-button 
          icon="pi pi-copy" 
          severity="secondary" 
          size="small" 
          [outlined]="true"
          (onClick)="cloneMasterFromList(master)"
          pTooltip="Clone"
          tooltipPosition="top"
        />
        <p-button 
          *ngIf="!master.isSystem"
          icon="pi pi-trash" 
          severity="danger" 
          size="small" 
          [outlined]="true"
          (onClick)="deleteMaster(master)"
          pTooltip="Delete"
          tooltipPosition="top"
        />
      </div>

      <div class="bg-gray-50 p-3 border-round mb-3 text-sm">
        <div class="grid">
          <div class="col-6">
            <span class="text-secondary">Category</span>
            <p-tag [value]="master.category || 'None'" severity="info" size="small" class="ml-2" />
          </div>
          <div class="col-6">
            <span class="text-secondary">Type</span>
            <p-tag 
              [value]="master.config?.isHierarchical ? 'Hierarchical' : 'Flat'" 
              [severity]="master.config?.isHierarchical ? 'warn' : 'secondary'" 
              size="small" 
              class="ml-2"
            />
          </div>
          <div class="col-6">
            <span class="text-secondary">Multiple</span>
            <i 
              class="ml-2 pi" 
              [class.pi-check-circle]="master.config?.allowMultiple" 
              [class.pi-times-circle]="!master.config?.allowMultiple"
              [style.color]="master.config?.allowMultiple ? 'green' : 'red'"
            ></i>
          </div>
          <div class="col-6">
            <span class="text-secondary">Metadata</span>
            <i 
              class="ml-2 pi" 
              [class.pi-check-circle]="master.config?.hasMetadata" 
              [class.pi-times-circle]="!master.config?.hasMetadata"
              [style.color]="master.config?.hasMetadata ? 'green' : 'red'"
            ></i>
          </div>
        </div>
      </div>

      <p-table 
        #valuesTable
        [value]="master.values || []" 
        [rows]="3"
        [paginator]="true"
        [globalFilterFields]="['value', 'label', 'description']"
        styleClass="p-datatable-sm"
        [scrollable]="true"
        scrollHeight="200px"
      >
        <ng-template pTemplate="caption">
          <div class="flex justify-content-between align-items-center">
            <span class="font-semibold">Values ({{master.values?.length || 0}})</span>
            <p-button 
              icon="pi pi-plus" 
              size="small" 
              [text]="true"
              (onClick)="openNewValueDialog(master)"
              pTooltip="Add Value"
            />
          </div>
        </ng-template>
        
        <ng-template pTemplate="header">
          <tr>
            <th>Value</th>
            <th>Label</th>
            <th>Status</th>
            <th style="width: 80px"></th>
          </tr>
        </ng-template>
        
        <ng-template pTemplate="body" let-value>
          <tr>
            <td>
              <span class="font-mono text-sm">{{ value.value }}</span>
            </td>
            <td>
              <div class="flex align-items-center gap-2">
                <span *ngIf="value.metadata?.icon" class="text-xl">{{ value.metadata.icon }}</span>
                <span [style.color]="value.metadata?.color" class="font-medium">{{ value.label }}</span>
              </div>
            </td>
            <td>
              <div class="flex flex-wrap gap-1">
                <p-tag 
                  *ngIf="value.isPublished" 
                  value="Pub" 
                  severity="success" 
                  size="small"
                  [rounded]="true"
                />
                <p-tag 
                  *ngIf="!value.isPublished" 
                  value="Draft" 
                  severity="info" 
                  size="small"
                  [rounded]="true"
                />
                <p-tag 
                  *ngIf="value.isSystem" 
                  value="Sys" 
                  severity="secondary" 
                  size="small"
                  [rounded]="true"
                />
              </div>
            </td>
            <td>
              <div class="flex gap-1">
                <p-button 
                  icon="pi pi-pencil" 
                  size="small" 
                  [text]="true"
                  severity="info" 
                  (onClick)="editValue(master, value)"
                  pTooltip="Edit"
                />
                <p-button 
                  *ngIf="!value.isSystem"
                  icon="pi pi-trash" 
                  size="small" 
                  [text]="true"
                  severity="danger" 
                  (onClick)="deleteValue(master._id!, value._id!)"
                  pTooltip="Delete"
                />
              </div>
            </td>
          </tr>
        </ng-template>
        <ng-template pTemplate="emptymessage">
          <tr>
            <td colspan="4" class="text-center p-4 text-gray-400">
              <i class="pi pi-database mr-2"></i> No values found
            </td>
          </tr>
        </ng-template>
      </p-table>

      <div class="mt-2 flex justify-content-between align-items-center">
        <span class="text-xs text-secondary">
          Last updated: {{master.updatedAt | date:'short'}}
        </span>
        <p-button 
          label="View All" 
          icon="pi pi-arrow-right" 
          size="small" 
          [link]="true"
          (onClick)="selectMaster(master)"
        />
      </div>
    </p-accordion-content>
  </p-accordion-panel>
</p-accordion>

              <!-- No Results Message -->
              <div *ngIf="displayedMasters().length === 0" class="text-center p-4 text-gray-400">
                <i class="pi pi-search mb-2" style="font-size: 2rem"></i>
                <p>No masters found</p>
              </div>
            </div>
          </p-panel>
        </div>

        <!-- Right Panel - Master Details -->
        <div class="col-12 lg:col-8" *ngIf="selectedMasterDetails() as master; else noSelection">
          <p-panel 
            [header]="master.displayName || master.masterName" 
            [toggleable]="true"
            styleClass="shadow-2 border-round-xl"
          >
            <ng-template pTemplate="icons">
              <p-menu #masterMenu [model]="masterMenuItems" [popup]="true" />
              <p-button 
                icon="pi pi-ellipsis-v" 
                (onClick)="masterMenu.toggle($event)" 
                styleClass="p-panel-header-icon" 
                [text]="true"
              />
            </ng-template>
            
            <div class="p-2">
              <!-- Master Summary Cards -->
              <div class="grid mb-4">
                <div class="col-12 md:col-6 lg:col-3">
                  <p-card styleClass="shadow-1 border-round">
                    <div class="text-center">
                      <span class="text-secondary block text-sm">Total Values</span>
                      <span class="text-2xl font-bold">{{master.stats?.totalValues || 0}}</span>
                    </div>
                  </p-card>
                </div>
                <div class="col-12 md:col-6 lg:col-3">
                  <p-card styleClass="shadow-1 border-round">
                    <div class="text-center">
                      <span class="text-secondary block text-sm">Active</span>
                      <span class="text-2xl font-bold text-green-500">{{master.stats?.activeValues || 0}}</span>
                    </div>
                  </p-card>
                </div>
                <div class="col-12 md:col-6 lg:col-3">
                  <p-card styleClass="shadow-1 border-round">
                    <div class="text-center">
                      <span class="text-secondary block text-sm">Published</span>
                      <span class="text-2xl font-bold text-blue-500">{{master.stats?.publishedValues || 0}}</span>
                    </div>
                  </p-card>
                </div>
                <div class="col-12 md:col-6 lg:col-3">
                  <p-card styleClass="shadow-1 border-round">
                    <div class="text-center">
                      <span class="text-secondary block text-sm">Last Added</span>
                      <span class="font-medium">{{(master.stats?.lastValueAdded | date:'MMM d') || 'N/A'}}</span>
                    </div>
                  </p-card>
                </div>
              </div>

              <!-- Master Details Tabs -->
            <p-tabs value="0">
  <p-tablist>
    <p-tab value="0"><i class="pi pi-table mr-2"></i> Values</p-tab>
    <p-tab value="1"><i class="pi pi-cog mr-2"></i> Settings</p-tab>
    <p-tab value="2" *ngIf="master.config?.isHierarchical"><i class="pi pi-sitemap mr-2"></i> Hierarchy</p-tab>
    <p-tab value="3"><i class="pi pi-history mr-2"></i> Audit Log</p-tab>
  </p-tablist>

  <p-tabpanels>
    <p-tabpanel value="0">
      <div class="flex justify-content-between align-items-center mb-3">
        <div class="flex gap-2">
          <p-button 
            label="Add Value" 
            icon="pi pi-plus" 
            size="small" 
            (onClick)="openNewValueDialog(master)"
          />
          <p-button 
            label="Bulk Add" 
            icon="pi pi-list" 
            size="small" 
            [outlined]="true"
            (onClick)="openBulkAddDialog(master)"
          />
          <p-button 
            label="Reorder" 
            icon="pi pi-sort" 
            size="small" 
            [outlined]="true"
            (onClick)="openReorderDialog(master)"
            *ngIf="master.values && master.values.length > 0"
          />
        </div>
        
        <div class="flex gap-2">
          <p-select
  [ngModel]="valueFilterStatus()"
  (ngModelChange)="valueFilterStatus.set($event); filterValues()"
  [options]="valueStatusOptions"
  placeholder="Filter by Status"
  class="w-40"
  [showClear]="true"
/>

<input 
  pInputText 
  type="text" 
  [ngModel]="valueSearchText()"
  (ngModelChange)="valueSearchText.set($event); filterValues()"
  placeholder="Search values..." 
  class="w-48"
/>
          <!-- <p-select
            [(ngModel)]="valueFilterStatus"
            [options]="valueStatusOptions"
            placeholder="Filter by Status"
            class="w-40"
            (onChange)="filterValues()"
            [showClear]="true"
          />
          <p-iconfield iconPosition="left">
            <p-inputicon styleClass="pi pi-search"></p-inputicon>
            <input 
              pInputText 
              type="text" 
              [(ngModel)]="valueSearchText"
              (ngModelChange)="filterValues()"
              placeholder="Search values..." 
              class="w-48"
            />
          </p-iconfield> -->
        </div>
      </div>

      <p-table 
        #detailsTable
        [value]="filteredValues()" 
        [rows]="10"
        [paginator]="true"
        [rowsPerPageOptions]="[5,10,25,50]"
        [globalFilterFields]="['value', 'label', 'description']"
        [sortField]="sortField"
        [sortOrder]="sortOrder"
        (sortFunction)="customSort($event)"
        [customSort]="true"
        [resizableColumns]="true"
        columnResizeMode="expand"
        [reorderableColumns]="true"
        [rowHover]="true"
        [showGridlines]="true"
        styleClass="p-datatable-striped"
        [scrollable]="true"
        scrollHeight="400px"
        [loading]="loading()"
      >
        <ng-template pTemplate="caption">
          <div class="flex justify-content-between align-items-center flex-wrap">
            <div class="flex gap-2 flex-wrap">
              <p-button 
                icon="pi pi-filter-slash" 
                label="Clear Filters" 
                size="small" 
                [outlined]="true"
                (onClick)="clearValueFilters()"
              />
              <p-button 
                icon="pi pi-print" 
                size="small" 
                [text]="true"
                (onClick)="printValues()"
              />
            </div>
            <div class="flex gap-2">
            <p-multiSelect 
  [options]="columnOptions" 
  [(ngModel)]="visibleColumns" 
  optionLabel="label"
  optionValue="value"          selectedItemsLabel="{0} columns selected"
  placeholder="Toggle Columns"
  styleClass="w-48"
/>
            </div>
          </div>
        </ng-template>
        
        <ng-template pTemplate="header">
          <tr>
            <th *ngIf="visibleColumns.includes('value')" 
                pResizableColumn 
                pReorderableColumn
                [pSortableColumn]="'value'">
              Value
              <p-sortIcon field="value" />
            </th>
            <th *ngIf="visibleColumns.includes('label')" 
                pResizableColumn 
                pReorderableColumn
                [pSortableColumn]="'label'">
              Label
              <p-sortIcon field="label" />
            </th>
            <th *ngIf="visibleColumns.includes('description')" 
                pResizableColumn 
                pReorderableColumn
                [pSortableColumn]="'description'">
              Description
              <p-sortIcon field="description" />
            </th>
            <th *ngIf="visibleColumns.includes('status')" 
                pResizableColumn 
                pReorderableColumn>
              Status
            </th>
            <th *ngIf="visibleColumns.includes('metadata')" 
                pResizableColumn 
                pReorderableColumn>
              Metadata
            </th>
            <th *ngIf="visibleColumns.includes('createdAt')" 
                pResizableColumn 
                pReorderableColumn
                [pSortableColumn]="'createdAt'">
              Created
              <p-sortIcon field="createdAt" />
            </th>
            <th style="width: 120px">Actions</th>
          </tr>
          <tr>
            <th *ngIf="visibleColumns.includes('value')">
              <input pInputText type="text" (input)="detailsTable.filter($event.target.value, 'value', 'contains')" placeholder="Search" class="w-full p-1 text-sm"/>
            </th>
            <th *ngIf="visibleColumns.includes('label')">
              <input pInputText type="text" (input)="detailsTable.filter($event.target.value, 'label', 'contains')" placeholder="Search" class="w-full p-1 text-sm"/>
            </th>
            <th *ngIf="visibleColumns.includes('description')">
              <input pInputText type="text" (input)="detailsTable.filter($event.target.value, 'description', 'contains')" placeholder="Search" class="w-full p-1 text-sm"/>
            </th>
            <th *ngIf="visibleColumns.includes('status')">
              <p-select
                [options]="valueStatusOptions"
                (onChange)="detailsTable.filter($event.value, 'status', 'equals')"
                placeholder="Filter"
                class="w-full"
              />
            </th>
            <th *ngIf="visibleColumns.includes('metadata')"></th>
            <th *ngIf="visibleColumns.includes('createdAt')">
              <p-datepicker 
                (onSelect)="detailsTable.filter($event, 'createdAt', 'equals')" 
                placeholder="Date"
                class="w-full"
              />
            </th>
            <th></th>
          </tr>
        </ng-template>
        
        <ng-template pTemplate="body" let-value>
          <tr>
            <td *ngIf="visibleColumns.includes('value')">
              <span class="font-mono text-sm bg-gray-100 p-1 border-round">{{ value.value }}</span>
            </td>
            <td *ngIf="visibleColumns.includes('label')">
              <div class="flex align-items-center gap-2">
                <span *ngIf="value.metadata?.icon" class="text-2xl">{{ value.metadata.icon }}</span>
                <span [style.color]="value.metadata?.color" class="font-medium">{{ value.label }}</span>
              </div>
            </td>
            <td *ngIf="visibleColumns.includes('description')">
              {{ value.description || '-' }}
            </td>
            <td *ngIf="visibleColumns.includes('status')">
              <div class="flex flex-wrap gap-1">
                <p-tag 
                  *ngIf="value.isPublished" 
                  value="Published" 
                  severity="success" 
                  [rounded]="true"
                />
                <p-tag 
                  *ngIf="!value.isPublished" 
                  value="Draft" 
                  severity="info" 
                  [rounded]="true"
                />
                <p-tag 
                  *ngIf="value.isSystem" 
                  value="System" 
                  severity="secondary" 
                  [rounded]="true"
                />
                <p-tag 
                  *ngIf="value.isDefault" 
                  value="Default" 
                  severity="warn" 
                  [rounded]="true"
                />
              </div>
            </td>
            <td *ngIf="visibleColumns.includes('metadata')">
              <div class="flex gap-2 flex-wrap">
                <span *ngIf="value.metadata?.sortOrder !== undefined" class="text-sm">
                  <i class="pi pi-sort mr-1"></i>{{value.metadata.sortOrder}}
                </span>
                <span *ngIf="value.metadata?.color" class="text-sm">
                  <i class="pi pi-palette mr-1" [style.color]="value.metadata.color"></i>
                </span>
              </div>
            </td>
            <td *ngIf="visibleColumns.includes('createdAt')">
              {{value.createdAt | date:'mediumDate'}}
            </td>
            <td>
              <div class="flex gap-1">
                <p-button 
                  icon="pi pi-pencil" 
                  size="small" 
                  severity="info" 
                  [text]="true"
                  (onClick)="editValue(master, value)"
                  pTooltip="Edit Value"
                />
                <p-button 
                  *ngIf="!value.isPublished"
                  icon="pi pi-check-circle" 
                  size="small" 
                  severity="success" 
                  [text]="true"
                  (onClick)="publishValue(master._id!, value._id!)"
                  pTooltip="Publish"
                />
                <p-button 
                  *ngIf="value.isPublished && !value.isSystem"
                  icon="pi pi-ban" 
                  size="small" 
                  severity="warn" 
                  [text]="true"
                  (onClick)="unpublishValue(master._id!, value._id!)"
                  pTooltip="Unpublish"
                />
                <p-button 
                  icon="pi pi-copy" 
                  size="small" 
                  severity="secondary" 
                  [text]="true"
                  (onClick)="cloneValue(master, value)"
                  pTooltip="Clone"
                />
                <p-button 
                  *ngIf="!value.isSystem"
                  icon="pi pi-trash" 
                  size="small" 
                  severity="danger" 
                  [text]="true"
                  (onClick)="deleteValue(master._id!, value._id!)"
                  pTooltip="Delete"
                />
              </div>
            </td>
          </tr>
        </ng-template>
        <ng-template pTemplate="emptymessage">
          <tr>
            <td [attr.colspan]="visibleColumns.length + 1" class="text-center p-4">
              <i class="pi pi-database mr-2" style="font-size: 2rem; opacity: 0.5"></i>
              <p class="text-gray-400">No values found</p>
            </td>
          </tr>
        </ng-template>
      </p-table>
    </p-tabpanel>

    <p-tabpanel value="1">
      <div class="grid">
        <div class="col-12 md:col-6">
          <p-panel header="Basic Information" styleClass="shadow-1">
            <div class="grid">
              <div class="col-12">
                <label class="font-bold block mb-1">Master Name</label>
                <p>{{ master.masterName }}</p>
              </div>
              <div class="col-12">
                <label class="font-bold block mb-1">Display Name</label>
                <p>{{ master.displayName || '-' }}</p>
              </div>
              <div class="col-12">
                <label class="font-bold block mb-1">Description</label>
                <p>{{ master.description || '-' }}</p>
              </div>
              <div class="col-6">
                <label class="font-bold block mb-1">Category</label>
                <p-tag [value]="master.category || 'None'" severity="info" />
              </div>
              <div class="col-6">
                <label class="font-bold block mb-1">Status</label>
                <div class="flex gap-2">
                  <p-tag 
                    [value]="master.isPublished ? 'Published' : 'Draft'" 
                    [severity]="master.isPublished ? 'success' : 'info'"
                  />
                  <p-tag *ngIf="master.isSystem" value="System" severity="secondary"/>
                  <p-tag *ngIf="master.isLocked" value="Locked" severity="warn"/>
                </div>
              </div>
            </div>
          </p-panel>
        </div>

        <div class="col-12 md:col-6">
          <p-panel header="Configuration" styleClass="shadow-1">
            <div class="grid">
              <div class="col-6">
                <div class="flex align-items-center gap-2">
                  <i class="pi pi-sitemap" [class.text-primary]="master.config?.isHierarchical"></i>
                  <span>Hierarchical</span>
                  <p-toggleSwitch [(ngModel)]="master.config.isHierarchical" [disabled]="true" />
                </div>
              </div>
              <div class="col-6">
                <div class="flex align-items-center gap-2">
                  <i class="pi pi-check-square" [class.text-primary]="master.config?.allowMultiple"></i>
                  <span>Allow Multiple</span>
                  <p-toggleSwitch [(ngModel)]="master.config.allowMultiple" [disabled]="true" />
                </div>
              </div>
              <div class="col-6">
                <div class="flex align-items-center gap-2">
                  <i class="pi pi-tag" [class.text-primary]="master.config?.hasMetadata"></i>
                  <span>Has Metadata</span>
                  <p-toggleSwitch [(ngModel)]="master.config.hasMetadata" [disabled]="true" />
                </div>
              </div>
              <div class="col-6">
                <div class="flex align-items-center gap-2">
                  <i class="pi pi-language" [class.text-primary]="master.config?.isTranslatable"></i>
                  <span>Translatable</span>
                  <p-toggleSwitch [(ngModel)]="master.config.isTranslatable" [disabled]="true" />
                </div>
              </div>
            </div>
          </p-panel>
        </div>

        <div class="col-12">
          <p-panel header="Statistics" styleClass="shadow-1">
            <div class="grid">
              <div class="col-3">
                <div class="text-center p-3">
                  <span class="text-secondary block">Created</span>
                  <span class="font-bold">{{master.createdAt | date:'medium'}}</span>
                </div>
              </div>
              <div class="col-3">
                <div class="text-center p-3">
                  <span class="text-secondary block">Last Updated</span>
                  <span class="font-bold">{{master.updatedAt | date:'medium'}}</span>
                </div>
              </div>
              <div class="col-3">
                <div class="text-center p-3">
                  <span class="text-secondary block">Created By</span>
                  <span class="font-bold">{{master.createdBy?.email || 'System'}}</span>
                </div>
              </div>
              <div class="col-3">
                <div class="text-center p-3">
                  <span class="text-secondary block">Version</span>
                  <span class="font-bold">{{master.__v || 0}}</span>
                </div>
              </div>
            </div>
          </p-panel>
        </div>
      </div>
    </p-tabpanel>

    <p-tabpanel value="2" *ngIf="master.config?.isHierarchical">
      <div class="grid">
        <div class="col-6">
          <p-panel header="Tree View">
            <p-tree 
              [value]="master.hierarchy || []" 
              selectionMode="single"
              [(selection)]="selectedNode"
              (onNodeSelect)="onNodeSelect($event)"
              styleClass="w-full"
            />
          </p-panel>
        </div>
        <div class="col-6">
          <p-panel header="Organization Chart" *ngIf="master.hierarchy && master.hierarchy.length > 0">
            <p-organizationChart [value]="master.hierarchy">
              <ng-template let-node pTemplate="person">
                <div class="p-2 text-center">
                  <div class="font-bold">{{node.label}}</div>
                  <div class="text-sm">{{node.value}}</div>
                </div>
              </ng-template>
            </p-organizationChart>
          </p-panel>
        </div>
      </div>
    </p-tabpanel>

    <p-tabpanel value="3">
      <p-timeline [value]="auditLogs()">
        <ng-template pTemplate="content" let-event>
          <small class="text-secondary">{{event.date | date:'medium'}}</small>
          <div class="font-medium">{{event.action}}</div>
          <div class="text-sm">{{event.user}}</div>
        </ng-template>
        <ng-template pTemplate="opposite" let-event>
          <p-tag [value]="event.type" [severity]="event.severity" />
        </ng-template>
      </p-timeline>
    </p-tabpanel>
  </p-tabpanels>
</p-tabs>
            </div>
          </p-panel>
        </div>

        <ng-template #noSelection>
          <div class="col-12 lg:col-8">
            <p-panel styleClass="shadow-2 border-round-xl">
              <div class="text-center p-6 text-gray-400">
                <i class="pi pi-database" style="font-size: 4rem; opacity: 0.5"></i>
                <h3>No Master Selected</h3>
                <p>Select a master from the left panel to view and manage its values</p>
                <p-button 
                  label="Create New Master" 
                  icon="pi pi-plus" 
                  (onClick)="openNewMasterDialog()"
                  [disabled]="!selectedMasterCategory()"
                />
              </div>
            </p-panel>
          </div>
        </ng-template>
      </div>

      <!-- Master Dialog -->
      <p-dialog 
        [(visible)]="showMasterDialog" 
        [style]="{ width: '600px' }"
        [header]="masterDialogTitle()"
        [modal]="true"
        [draggable]="false"
        [resizable]="false"
        [closeOnEscape]="true"
        [dismissableMask]="true"
      >
        <form [formGroup]="masterForm" class="p-fluid">
          <div class="field mb-3">
            <label for="masterName" class="font-medium">Master Name <span class="text-red-500">*</span></label>
            <span class="p-input-icon-right">
              <i class="pi pi-info-circle" pTooltip="Uppercase letters and underscores only"></i>
              <input 
                pInputText 
                id="masterName" 
                formControlName="masterName" 
                class="w-full"
                [class.ng-invalid]="masterForm.get('masterName')?.invalid && masterForm.get('masterName')?.touched"
             
              />
            </span>
            <small *ngIf="masterForm.get('masterName')?.invalid && masterForm.get('masterName')?.touched" class="text-red-500">
              Required, uppercase letters only
            </small>
          </div>

          <div class="field mb-3">
            <label for="displayName" class="font-medium">Display Name <span class="text-red-500">*</span></label>
            <input pInputText id="displayName" formControlName="displayName" class="w-full"/>
          </div>

          <div class="field mb-3">
            <label for="description" class="font-medium">Description</label>
            <textarea pInputTextarea id="description" formControlName="description" rows="3" class="w-full"></textarea>
          </div>

          <div class="field mb-3">
            <label for="category" class="font-medium">Category</label>
            <p-select 
              id="category" 
              formControlName="category" 
              [options]="masterCategories" 
              optionLabel="label" 
              optionValue="value" 
              placeholder="Select Category" 
              class="w-full"
            />
          </div>

          <p-accordion [multiple]="true" class="mb-3">
            <p-accordion-panel>
              <p-accordion-header>Advanced Configuration</p-accordion-header>
              <p-accordion-content>
                <div class="grid">
                  <div class="col-6">
                    <div class="field-checkbox flex align-items-center">
                      <p-checkbox inputId="isHierarchical" formControlName="isHierarchical" [binary]="true"/>
                      <label for="isHierarchical" class="ml-2">Allow Hierarchical Values</label>
                    </div>
                  </div>
                  <div class="col-6">
                    <div class="field-checkbox flex align-items-center">
                      <p-checkbox inputId="allowMultiple" formControlName="allowMultiple" [binary]="true"/>
                      <label for="allowMultiple" class="ml-2">Allow Multiple Selection</label>
                    </div>
                  </div>
                  <div class="col-6">
                    <div class="field-checkbox flex align-items-center">
                      <p-checkbox inputId="hasMetadata" formControlName="hasMetadata" [binary]="true"/>
                      <label for="hasMetadata" class="ml-2">Enable Metadata</label>
                    </div>
                  </div>
                  <div class="col-6">
                    <div class="field-checkbox flex align-items-center">
                      <p-checkbox inputId="isTranslatable" formControlName="isTranslatable" [binary]="true"/>
                      <label for="isTranslatable" class="ml-2">Translatable</label>
                    </div>
                  </div>
                </div>
              </p-accordion-content>
            </p-accordion-panel>
          </p-accordion>
        </form>

        <ng-template pTemplate="footer">
          <p-button 
            label="Cancel" 
            icon="pi pi-times" 
            (onClick)="hideMasterDialog()" 
            [text]="true"
            severity="secondary"
          />
          <p-button 
            label="Save" 
            icon="pi pi-check" 
            (onClick)="saveMaster()" 
            [disabled]="masterForm.invalid"
          />
        </ng-template>
      </p-dialog>

      <!-- Value Dialog -->
      <p-dialog 
        [(visible)]="showValueDialog" 
        [style]="{ width: '600px' }"
        [header]="valueDialogTitle()"
        [modal]="true"
        [draggable]="false"
        [resizable]="false"
      >
        <form [formGroup]="valueForm" *ngIf="selectedMasterForValue()">
          <div class="field mb-3">
            <label for="value" class="font-medium">Value <span class="text-red-500">*</span></label>
            <input pInputText id="value" formControlName="value" class="w-full" />
          </div>

          <div class="field mb-3">
            <label for="label" class="font-medium">Display Label <span class="text-red-500">*</span></label>
            <input pInputText id="label" formControlName="label" class="w-full" />
          </div>

          <div class="field mb-3">
            <label for="description" class="font-medium">Description</label>
            <textarea pInputTextarea id="description" formControlName="description" rows="2" class="w-full"></textarea>
          </div>

          <!-- Parent Value for Hierarchical -->
          <div class="field mb-3" *ngIf="selectedMasterForValue()?.config?.isHierarchical">
            <label for="parentValue" class="font-medium">Parent Value</label>
            <p-treeSelect 
              id="parentValue"
              formControlName="parentValue"
              [options]="parentOptions()"
              placeholder="Select Parent"
              class="w-full"
            />
          </div>

          <p-accordion [multiple]="true" class="mb-3">
            <p-accordion-panel>
              <p-accordion-header>Appearance & Metadata</p-accordion-header>
              <p-accordion-content>
                <div class="grid">
                  <div class="col-6">
                    <label for="icon" class="font-medium block mb-1">Icon</label>
                    <div class="flex gap-2">
                      <input pInputText id="icon" formControlName="icon" class="w-full" placeholder="e.g., pi pi-star"/>
                      <span *ngIf="valueForm.get('icon')?.value" class="text-2xl">{{valueForm.get('icon')?.value}}</span>
                    </div>
                  </div>
                  <div class="col-6">
                    <label for="color" class="font-medium block mb-1">Color</label>
                    <div class="flex gap-2 align-items-center">
                      <p-colorPicker id="color" formControlName="color" />
                      <span [style.background-color]="valueForm.get('color')?.value" class="w-2rem h-2rem border-round"></span>
                    </div>
                  </div>
                  <div class="col-6">
                    <label for="sortOrder" class="font-medium block mb-1">Sort Order</label>
                    <p-inputNumber inputId="sortOrder" formControlName="sortOrder" class="w-full"/>
                  </div>
                </div>
              </p-accordion-content>
            </p-accordion-panel>
          </p-accordion>

          <div class="flex gap-4">
            <div class="field-checkbox flex align-items-center">
              <p-checkbox inputId="isPublished" formControlName="isPublished" [binary]="true"/>
              <label for="isPublished" class="ml-2">Published</label>
            </div>
            <div class="field-checkbox flex align-items-center" *ngIf="!editingValue()">
              <p-checkbox inputId="isDefault" formControlName="isDefault" [binary]="true"/>
              <label for="isDefault" class="ml-2">Set as Default</label>
            </div>
          </div>
        </form>

        <ng-template pTemplate="footer">
          <p-button 
            label="Cancel" 
            icon="pi pi-times" 
            (onClick)="hideValueDialog()" 
            [text]="true"
            severity="secondary"
          />
          <p-button 
            label="Save" 
            icon="pi pi-check" 
            (onClick)="saveValue()" 
            [disabled]="valueForm.invalid"
          />
        </ng-template>
      </p-dialog>

      <!-- Bulk Add Dialog -->
      <p-dialog 
        [(visible)]="showBulkAddDialog" 
        [style]="{ width: '700px' }"
        header="Bulk Add Values"
        [modal]="true"
      >
        <div class="p-fluid">
          <div class="field mb-3">
            <label>Enter values (one per line, format: value|label|description)</label>
            <textarea 
              pInputTextarea 
              [(ngModel)]="bulkValues" 
              rows="10" 
              class="w-full"
              placeholder="e.g.,&#10;new|New Value|Description here&#10;another|Another Value|Another description"
            ></textarea>
          </div>
          <small class="text-secondary">Format: value|label|description (description optional)</small>
        </div>

        <ng-template pTemplate="footer">
          <p-button label="Cancel" icon="pi pi-times" (onClick)="showBulkAddDialog.set(false)" [text]="true"/>
          <p-button label="Import" icon="pi pi-upload" (onClick)="bulkAddValues()" severity="success"/>
        </ng-template>
      </p-dialog>

      <!-- Reorder Dialog -->
      <p-dialog 
        [(visible)]="showReorderDialog" 
        [style]="{ width: '500px' }"
        header="Reorder Values"
        [modal]="true"
      >
        <p-orderList 
          [value]="selectedMasterDetails()?.values || []" 
          [listStyle]="{ height: '400px' }"
          dragdrop="true"
          (onReorder)="onReorder($event)"
        >
          <ng-template let-value pTemplate="item">
            <div class="flex align-items-center gap-2 p-2">
              <span *ngIf="value.metadata?.icon" class="text-xl">{{value.metadata.icon}}</span>
              <span [style.color]="value.metadata?.color">{{value.label}}</span>
              <span class="text-sm text-secondary">({{value.value}})</span>
            </div>
          </ng-template>
        </p-orderList>

        <ng-template pTemplate="footer">
          <p-button label="Cancel" icon="pi pi-times" (onClick)="showReorderDialog.set(false)" [text]="true"/>
          <p-button label="Save Order" icon="pi pi-check" (onClick)="saveReorder()" severity="success"/>
        </ng-template>
      </p-dialog>

      <!-- Hidden File Input -->
      <input #importFileUpload type="file" accept=".json,.csv" style="display: none" (change)="onFileSelected($event)"/>
      
      <!-- Confirmation Dialog -->
      <p-confirmDialog />
      
      <!-- Toast Notifications -->
      <p-toast position="top-right" />
    </div>
  `,
  styles: [`
    :host ::ng-deep {
      .master-accordion .p-accordion-header .p-accordion-header-link {
        padding: 1rem;
        background: var(--surface-0);
        border-bottom: 1px solid var(--surface-200);
      }
      
      .master-accordion .p-accordion-content {
        padding: 1.5rem;
        background: var(--surface-50);
      }

      .p-toolbar {
        background: var(--surface-0);
        border: none;
      }

      .p-panel .p-panel-header {
        background: var(--surface-0);
      }

      .p-datatable .p-datatable-tbody > tr:hover {
        background: var(--surface-100);
        cursor: pointer;
      }

      .p-card {
        transition: transform 0.2s;
      }

      .p-card:hover {
        transform: translateY(-2px);
      }
    }
  `]
})
export class MasterDataGridComponent implements OnInit, AfterViewInit {
  private masterApi = inject(MasterApiService);
  private fb = inject(FormBuilder);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private datePipe = inject(DatePipe);

  @ViewChild('searchInput') searchInput: any;
  @ViewChild('detailsTable') detailsTable!: Table;

  // State Management
  allMasters = signal<any[]>([]);
  filteredMasters = signal<any[]>([]);
  loading = signal<boolean>(false);
  masterSearchValue = signal<string>('');
  valueSearchText = signal<string>('');
  valueFilterStatus = signal<string>('');
  selectedMasterCategory = signal<string>('');
  selectedMaster = signal<string>('');
  expandedMasters = signal<number[]>([]);
  selectedNode = signal<any>(null);

  // Dialog Visibility
  showMasterDialog = signal<boolean>(false);
  showValueDialog = signal<boolean>(false);
  showBulkAddDialog = signal<boolean>(false);
  showReorderDialog = signal<boolean>(false);

  // Editing State
  editingMaster = signal<any | null>(null);
  editingValue = signal<{ master: any; value: MasterValueExtended } | null>(null);
  selectedMasterForValue = signal<any | null>(null);

  // Table Configuration
  sortField: string = 'label';
  sortOrder: number = 1;
  visibleColumns: string[] = ['value', 'label', 'description', 'status', 'metadata', 'createdAt'];
  columnOptions = [
    { label: 'Value', value: 'value' },
    { label: 'Label', value: 'label' },
    { label: 'Description', value: 'description' },
    { label: 'Status', value: 'status' },
    { label: 'Metadata', value: 'metadata' },
    { label: 'Created Date', value: 'createdAt' }
  ];

  // Bulk Operations
  bulkValues: string = '';

  // Filter Options
  valueStatusOptions = [
    { label: 'Published', value: 'published' },
    { label: 'Draft', value: 'draft' },
    { label: 'System', value: 'system' }
  ];

  masterCategories = [
    { label: 'System', value: 'SYSTEM' },
    { label: 'Content', value: 'CONTENT' },
    { label: 'Education', value: 'EDUCATION' },
    { label: 'User', value: 'USER' },
    { label: 'Business', value: 'BUSINESS' },
    { label: 'Settings', value: 'SETTINGS' }
  ];

  // Menu Items
  masterMenuItems = [
    { label: 'Edit', icon: 'pi pi-pencil', command: () => this.editMaster(this.selectedMasterDetails()) },
    { label: 'Clone', icon: 'pi pi-copy', command: () => this.cloneMaster() },
    { label: 'Export', icon: 'pi pi-download', command: () => this.exportData() },
    { label: 'Settings', icon: 'pi pi-cog', command: () => this.openSettings() },
    { separator: true },
    { label: 'Delete', icon: 'pi pi-trash', command: () => this.deleteMaster(this.selectedMasterDetails()) }
  ];

  // Computed Values
  selectedMasterDetails = computed(() => {
    return this.allMasters().find(m => m._id === this.selectedMaster());
  });

  filteredValues = computed(() => {
    const master = this.selectedMasterDetails();
    if (!master || !master.values) return [];

    let values = [...master.values];

    // Filter by status
    if (this.valueFilterStatus()) {
      values = values.filter(v => {
        if (this.valueFilterStatus() === 'published') return v.isPublished;
        if (this.valueFilterStatus() === 'draft') return !v.isPublished;
        if (this.valueFilterStatus() === 'system') return v.isSystem;
        return true;
      });
    }

    // Filter by search text
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

  displayedMasters = computed(() => {
    const search = this.masterSearchValue().toLowerCase();
    if (!search) return this.filteredMasters();

    return this.filteredMasters().filter(m =>
      m.displayName?.toLowerCase().includes(search) ||
      m.masterName?.toLowerCase().includes(search) ||
      m.category?.toLowerCase().includes(search)
    );
  });

  parentOptions = computed(() => {
    const master = this.selectedMasterForValue();
    if (!master || !master.values) return [];
    return this.buildTreeOptions(master.values);
  });

  auditLogs = computed(() => {
    // Simulated audit logs - replace with actual API call
    return [
      { date: new Date(), action: 'Master created', user: 'admin@gmail.com', type: 'Create', severity: 'info' },
      { date: new Date(), action: 'Value added', user: 'admin@gmail.com', type: 'Update', severity: 'success' }
    ];
  });

  masterDialogTitle = computed(() => this.editingMaster() ? 'Edit Master' : 'Create New Master');
  valueDialogTitle = computed(() => this.editingValue() ? 'Edit Value' : 'Add New Value');

  // Forms
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

  valueForm: FormGroup = this.fb.group({
    value: ['', Validators.required],
    label: ['', Validators.required],
    description: [''],
    parentValue: [null],
    icon: [''],
    color: [''],
    sortOrder: [0],
    isPublished: [true],
    isDefault: [false]
  });

  constructor() {
    // Effect to update when master changes
    effect(() => {
      const master = this.selectedMasterDetails();
      if (master) {
        this.resetValueFilters();
      }
    });
  }

  ngOnInit(): void {
    this.loadMasters();
    this.setupSearchDebounce();
  }

  ngAfterViewInit(): void {
    // Focus search on init if no master selected
    setTimeout(() => {
      if (!this.selectedMaster()) {
        this.searchInput?.nativeElement?.focus();
      }
    }, 500);
  }

  // ==================== DATA LOADING ====================

  loadMasters(): void {
    this.loading.set(true);
    this.masterApi.getAllMasters().pipe(
      tap((res: any) => {
        const masters = res.data 
        this.allMasters.set(masters);
        this.filterByCategory();
        
        // Restore selection if exists
        if (this.selectedMaster()) {
          const exists = masters.some((m:any) => m._id === this.selectedMaster());
          if (!exists) this.selectedMaster.set('');
        }
      }),
      catchError(err => {
        this.messageService.add({ 
          severity: 'error', 
          summary: 'Error', 
          detail: 'Failed to load masters',
          life: 3000
        });
        return of(null);
      }),
      finalize(() => this.loading.set(false))
    ).subscribe();
  }

  private setupSearchDebounce(): void {
    // Debounced master search
    // Implement if needed
  }

  // ==================== FILTERING ====================

  filterByCategory(): void {
    const category = this.selectedMasterCategory();
    if (category) {
      this.filteredMasters.set(this.allMasters().filter(m => m.category === category));
    } else {
      this.filteredMasters.set(this.allMasters());
    }
  }

  filterMasters(): void {
    // Already handled by computed property
  }

  filterValues(): void {
    // Already handled by computed property
  }

  clearValueFilters(): void {
    this.valueSearchText.set('');
    this.valueFilterStatus.set('');
    this.detailsTable?.clear();
  }

  resetValueFilters(): void {
    this.valueSearchText.set('');
    this.valueFilterStatus.set('');
  }

  // ==================== MASTER SELECTION ====================

  onMasterSelect(): void {
    const masterId = this.selectedMaster();
    const index = this.allMasters().findIndex(m => m._id === masterId);
    if (index >= 0) {
      this.expandedMasters.set([index]);
      this.resetValueFilters();
    }
  }

  selectMaster(master: any): void {
    this.selectedMaster.set(master._id);
    const index = this.allMasters().findIndex(m => m._id === master._id);
    if (index >= 0) {
      this.expandedMasters.set([index]);
    }
  }

  // ==================== ACCORDION MANAGEMENT ====================

  expandAllMasters(): void {
    this.expandedMasters.set(this.displayedMasters().map((_, i) => i));
  }

  collapseAllMasters(): void {
    this.expandedMasters.set([]);
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

  editMaster(master: any): void {
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
      config: {
        isHierarchical: formData.isHierarchical,
        allowMultiple: formData.allowMultiple,
        hasMetadata: formData.hasMetadata,
        isTranslatable: formData.isTranslatable
      }
    };

    const request$ = this.editingMaster()
      ? this.masterApi.updateMaster(this.editingMaster()!._id!, masterData)
      : this.masterApi.createMaster(masterData);

    request$.pipe(
      tap(() => {
        this.messageService.add({ 
          severity: 'success', 
          summary: 'Success', 
          detail: `Master ${this.editingMaster() ? 'updated' : 'created'} successfully`,
          life: 3000
        });
        this.hideMasterDialog();
        this.loadMasters();
      }),
      catchError((err) => {
        this.messageService.add({ 
          severity: 'error', 
          summary: 'Error', 
          detail: err.error?.message || 'Failed to save master',
          life: 5000
        });
        return of(null);
      })
    ).subscribe();
  }

  publishMaster(master: any): void {
    this.masterApi.publishMaster(master._id!).pipe(
      tap(() => {
        this.messageService.add({ 
          severity: 'success', 
          summary: 'Published', 
          detail: 'Master published successfully',
          life: 3000
        });
        this.loadMasters();
      }),
      catchError(err => {
        this.messageService.add({ 
          severity: 'error', 
          summary: 'Error', 
          detail: 'Failed to publish master',
          life: 5000
        });
        return of(null);
      })
    ).subscribe();
  }

  unpublishMaster(master: any): void {
    this.masterApi.unpublishMaster(master._id!).pipe(
      tap(() => {
        this.messageService.add({ 
          severity: 'success', 
          summary: 'Unpublished', 
          detail: 'Master unpublished successfully',
          life: 3000
        });
        this.loadMasters();
      }),
      catchError(err => {
        this.messageService.add({ 
          severity: 'error', 
          summary: 'Error', 
          detail: 'Failed to unpublish master',
          life: 5000
        });
        return of(null);
      })
    ).subscribe();
  }

  deleteMaster(master: any): void {
    if (master.isSystem) {
      this.messageService.add({ 
        severity: 'warn', 
        summary: 'Cannot Delete', 
        detail: 'System masters cannot be deleted',
        life: 3000
      });
      return;
    }

    this.confirmationService.confirm({
      message: `Are you sure you want to delete "${master.displayName || master.masterName}"?`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-text',
      accept: () => {
        this.masterApi.deleteMaster(master._id!).pipe(
          tap(() => {
            this.messageService.add({ 
              severity: 'success', 
              summary: 'Deleted', 
              detail: 'Master deleted successfully',
              life: 3000
            });
            if (this.selectedMaster() === master._id) {
              this.selectedMaster.set('');
            }
            this.loadMasters();
          }),
          catchError(err => {
            this.messageService.add({ 
              severity: 'error', 
              summary: 'Error', 
              detail: 'Failed to delete master',
              life: 5000
            });
            return of(null);
          })
        ).subscribe();
      }
    });
  }

  cloneMaster(): void {
    const master = this.selectedMasterDetails();
    if (!master) return;

    this.masterForm.reset({
      masterName: master.masterName + '_COPY',
      displayName: master.displayName + ' (Copy)',
      description: master.description,
      category: master.category,
      isHierarchical: master.config?.isHierarchical,
      allowMultiple: master.config?.allowMultiple,
      hasMetadata: master.config?.hasMetadata,
      isTranslatable: master.config?.isTranslatable
    });
    this.editingMaster.set(null);
    this.showMasterDialog.set(true);
  }

  cloneMasterFromList(master: any): void {
    this.selectedMaster.set(master._id);
    this.cloneMaster();
  }

  // ==================== VALUE CRUD ====================

  openNewValueDialog(master: any): void {
    this.selectedMasterForValue.set(master);
    this.editingValue.set(null);
    this.valueForm.reset({ 
      sortOrder: 0, 
      isPublished: true,
      isDefault: false
    });
    this.showValueDialog.set(true);
  }

  editValue(master: any, value: MasterValueExtended): void {
    this.selectedMasterForValue.set(master);
    this.editingValue.set({ master, value });
    this.valueForm.patchValue({
      value: value.value,
      label: value.label,
      description: value.description,
      parentValue: value.parentValue || null,
      icon: value.metadata?.icon || '',
      color: value.metadata?.color || '',
      sortOrder: value.metadata?.sortOrder || 0,
      isPublished: value.isPublished !== false,
      isDefault: value.isDefault || false
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

    const valueData: any = {
      value: formData.value,
      label: formData.label,
      description: formData.description,
      isPublished: formData.isPublished,
      isDefault: formData.isDefault,
      metadata: {
        icon: formData.icon,
        color: formData.color,
        sortOrder: formData.sortOrder
      }
    };

    if (formData.parentValue && this.selectedMasterForValue()?.config?.isHierarchical) {
      valueData.parentValue = formData.parentValue;
    }

    const request$ = this.editingValue()
      ? this.masterApi.updateValue(masterId, this.editingValue()!.value._id!, valueData)
      : this.masterApi.addValue(masterId, valueData);

    request$.pipe(
      tap(() => {
        this.messageService.add({ 
          severity: 'success', 
          summary: 'Success', 
          detail: `Value ${this.editingValue() ? 'updated' : 'added'} successfully`,
          life: 3000
        });
        this.hideValueDialog();
        this.loadMasters();
      }),
      catchError((err) => {
        this.messageService.add({ 
          severity: 'error', 
          summary: 'Error', 
          detail: err.error?.message || 'Failed to save value',
          life: 5000
        });
        return of(null);
      })
    ).subscribe();
  }

  publishValue(masterId: string, valueId: string): void {
    this.masterApi.publishValue(masterId, valueId).pipe(
      tap(() => {
        this.messageService.add({ 
          severity: 'success', 
          summary: 'Published', 
          detail: 'Value published successfully',
          life: 3000
        });
        this.loadMasters();
      }),
      catchError(err => {
        this.messageService.add({ 
          severity: 'error', 
          summary: 'Error', 
          detail: 'Failed to publish value',
          life: 5000
        });
        return of(null);
      })
    ).subscribe();
  }

  unpublishValue(masterId: string, valueId: string): void {
    this.masterApi.unpublishValue(masterId, valueId).pipe(
      tap(() => {
        this.messageService.add({ 
          severity: 'success', 
          summary: 'Unpublished', 
          detail: 'Value unpublished successfully',
          life: 3000
        });
        this.loadMasters();
      }),
      catchError(err => {
        this.messageService.add({ 
          severity: 'error', 
          summary: 'Error', 
          detail: 'Failed to unpublish value',
          life: 5000
        });
        return of(null);
      })
    ).subscribe();
  }

  deleteValue(masterId: string, valueId: string): void {
    const master = this.allMasters().find(m => m._id === masterId);
    const value = master?.values?.find((v: any) => v._id === valueId);

    if (value?.isSystem) {
      this.messageService.add({ 
        severity: 'warn', 
        summary: 'Cannot Delete', 
        detail: 'System values cannot be deleted',
        life: 3000
      });
      return;
    }

    this.confirmationService.confirm({
      message: 'Are you sure you want to delete this value?',
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-text',
      accept: () => {
        this.masterApi.deleteValue(masterId, valueId).pipe(
          tap(() => {
            this.messageService.add({ 
              severity: 'success', 
              summary: 'Deleted', 
              detail: 'Value deleted successfully',
              life: 3000
            });
            this.loadMasters();
          }),
          catchError(err => {
            this.messageService.add({ 
              severity: 'error', 
              summary: 'Error', 
              detail: 'Failed to delete value',
              life: 5000
            });
            return of(null);
          })
        ).subscribe();
      }
    });
  }

  cloneValue(master: any, value: MasterValueExtended): void {
    this.selectedMasterForValue.set(master);
    this.editingValue.set(null);
    this.valueForm.reset({
      value: value.value + '_copy',
      label: value.label + ' (Copy)',
      description: value.description,
      icon: value.metadata?.icon,
      color: value.metadata?.color,
      sortOrder: (value.metadata?.sortOrder || 0) + 1,
      isPublished: false,
      isDefault: false
    });
    this.showValueDialog.set(true);
  }

  // ==================== BULK OPERATIONS ====================

  openBulkAddDialog(master: any): void {
    this.selectedMasterForValue.set(master);
    this.bulkValues = '';
    this.showBulkAddDialog.set(true) 
  }

  bulkAddValues(): void {
    if (!this.bulkValues.trim() || !this.selectedMasterForValue()) return;

    const lines = this.bulkValues.split('\n').filter(line => line.trim());
    const values = [];

    for (const line of lines) {
      const parts = line.split('|').map(p => p.trim());
      if (parts.length >= 2) {
        values.push({
          value: parts[0],
          label: parts[1],
          description: parts[2] || '',
          isPublished: true,
          metadata: {}
        });
      }
    }

    if (values.length === 0) {
      this.messageService.add({ 
        severity: 'warn', 
        summary: 'Warning', 
        detail: 'No valid values found',
        life: 3000
      });
      return;
    }

    // Sequential creation
    const masterId = this.selectedMasterForValue()!._id!;
    let completed = 0;
    let failed = 0;

    values.forEach(valueData => {
      this.masterApi.addValue(masterId, valueData).pipe(
        tap(() => completed++),
        catchError(() => {
          failed++;
          return of(null);
        }),
        finalize(() => {
          if (completed + failed === values.length) {
            this.messageService.add({ 
              severity: completed > 0 ? 'success' : 'error', 
              summary: 'Bulk Import Complete', 
              detail: `${completed} imported, ${failed} failed`,
              life: 5000
            });
            this.showBulkAddDialog.set(false) 
            this.loadMasters();
          }
        })
      ).subscribe();
    });
  }

  // ==================== REORDER ====================

  openReorderDialog(master: any): void {
    this.selectedMasterForValue.set(master);
    this.showReorderDialog.set(true) 
  }

  onReorder(event: any): void {
    // Store reordered values temporarily
    this.selectedMasterForValue.set({
      ...this.selectedMasterForValue(),
      values: event.items
    });
  }

  saveReorder(): void {
    const master = this.selectedMasterForValue();
    if (!master) return;

    // Update sort orders based on new order
    const updates = master.values.map((value: any, index: number) => {
      return this.masterApi.updateValue(master._id, value._id, {
        ...value,
        metadata: { ...value.metadata, sortOrder: index }
      });
    });

    // Sequential updates
    let completed = 0;
    updates.forEach((obs:any) => {
      obs.pipe(
        tap(() => completed++),
        catchError(() => of(null)),
        finalize(() => {
          if (completed === updates.length) {
            this.messageService.add({ 
              severity: 'success', 
              summary: 'Success', 
              detail: 'Order updated successfully',
              life: 3000
            });
            this.showReorderDialog.set(false) 
            this.loadMasters();
          }
        })
      ).subscribe();
    });
  }

  // ==================== HIERARCHY ====================

  private buildTreeOptions(values: any[], parentValue?: string): any[] {
    const options: any[] = [];
    
    for (const value of values) {
      if (value.parentValue === parentValue) {
        const children = this.buildTreeOptions(values, value.value);
        options.push({
          label: value.label,
          value: value.value,
          children: children.length > 0 ? children : undefined
        });
      }
    }

    return options.sort((a, b) => (a.label || '').localeCompare(b.label || ''));
  }

  onNodeSelect(event: any): void {
    console.log('Selected node:', event.node);
    // Handle node selection
  }

  // ==================== TABLE FUNCTIONS ====================

  customSort(event: any): void {
    this.sortField = event.field;
    this.sortOrder = event.order;
    // Custom sort logic if needed
  }

  focusSearch(): void {
    this.searchInput?.nativeElement?.focus();
  }

  // ==================== IMPORT/EXPORT ====================

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (!file || !this.selectedMaster()) return;

    const formData = new FormData();
    formData.append('file', file);

    this.masterApi.importValues(this.selectedMaster(), formData).pipe(
      tap(() => {
        this.messageService.add({ 
          severity: 'success', 
          summary: 'Imported', 
          detail: 'Values imported successfully',
          life: 3000
        });
        this.loadMasters();
      }),
      catchError(() => {
        this.messageService.add({ 
          severity: 'error', 
          summary: 'Error', 
          detail: 'Failed to import values',
          life: 5000
        });
        return of(null);
      })
    ).subscribe();

    // Reset input
    event.target.value = null;
  }

  exportData(): void {
    if (!this.selectedMaster()) return;

    const master = this.selectedMasterDetails();
    const format = 'json'; // Could make this configurable

    this.masterApi.exportValues(this.selectedMaster(), { params: { format } }).pipe(
      tap(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `master-${master?.masterName || this.selectedMaster()}-export.${format}`;
        a.click();
        window.URL.revokeObjectURL(url);
        
        this.messageService.add({ 
          severity: 'success', 
          summary: 'Exported', 
          detail: 'Data exported successfully',
          life: 3000
        });
      }),
      catchError(() => {
        this.messageService.add({ 
          severity: 'error', 
          summary: 'Error', 
          detail: 'Failed to export data',
          life: 5000
        });
        return of(null);
      })
    ).subscribe();
  }

  // ==================== UTILITIES ====================

  printValues(): void {
    window.print();
  }

  openSettings(): void {
    // Navigate to settings or open dialog
    this.messageService.add({ 
      severity: 'info', 
      summary: 'Settings', 
      detail: 'Settings panel coming soon',
      life: 3000
    });
  }

  getSeverity(status: string): "success" | "info" | "warn" | "danger" | "secondary" | "contrast" | undefined {
    switch (status) {
      case 'published': return 'success';
      case 'draft': return 'info';
      case 'system': return 'secondary';
      default: return 'info';
    }
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
// import { Master, MasterApiService, MasterValue } from '../../../core/services/master-list.service';


// export interface MasterValueExtended extends MasterValue {
//   description?: string;
//   parentValue?: string;
//   metadata?: { icon?: string; color?: string; sortOrder?: number };
//   isPublished?: boolean;
//   isDefault?: boolean;
//   isSystem?: boolean;
//   isActive?: boolean;
// }

// @Component({
//   selector: 'app-master-data-grid',
//   standalone: true,
//   imports: [CommonModule, FormsModule, ReactiveFormsModule, TableModule, ButtonModule, InputTextModule, InputNumberModule, SelectModule, MultiSelectModule, TagModule, ChipModule, IconFieldModule, InputIconModule, DialogModule, ConfirmDialogModule, ToastModule, ToolbarModule, SplitButtonModule, MenuModule, FileUploadModule, ProgressBarModule, SkeletonModule, BadgeModule, OverlayModule, ColorPickerModule, ToggleSwitchModule, AccordionModule, CheckboxModule, TooltipModule],
//   providers: [MessageService, ConfirmationService, DatePipe],
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
//                 placeholder="Search masters..." 
//                 class="w-full"
//               />
//             </p-iconfield>

//             <p-accordion [multiple]="true" [value]="expandedMasters()">
//               <p-accordion-panel *ngFor="let master of displayedMasters(); let i = index" [value]="i">
//                 <p-accordion-header>
//                   <div class="flex justify-between items-center w-full">
//                     <span class="font-bold">{{ master.displayName || master.masterName }}</span>
//                     <div class="flex gap-2 ml-auto items-center pr-3">
//                       <p-tag 
//                         [value]="master.isPublished ? 'Published' : 'Draft'" 
//                         [severity]="master.isPublished ? 'success' : 'info'"
//                         size="small"
//                       />
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
//                         <th>Status</th>
//                         <th>Actions</th>
//                       </tr>
//                     </ng-template>
                    
//                     <ng-template pTemplate="body" let-value>
//                       <tr>
//                         <td><span class="font-mono">{{ value.value }}</span></td>
//                         <td>
//                           <div class="flex items-center gap-2">
//                             <span *ngIf="value.metadata?.icon" class="text-xl">{{ value.metadata.icon }}</span>
//                             <span [style.color]="value.metadata?.color">{{ value.label }}</span>
//                           </div>
//                         </td>
//                         <td>
//                           <div class="flex flex-wrap gap-1">
//                             <p-tag *ngIf="value.isPublished" value="Published" severity="success" size="small"/>
//                             <p-tag *ngIf="!value.isPublished" value="Draft" severity="info" size="small"/>
//                             <p-tag *ngIf="value.isSystem" value="System" severity="secondary" size="small"/>
//                           </div>
//                         </td>
//                         <td>
//                           <div class="flex gap-2">
//                             <p-button 
//                               icon="pi pi-pencil" 
//                               size="small" 
//                               severity="info" 
//                               (onClick)="editValue(master, value)"
//                               pTooltip="Edit"
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
//                       <tr><td colspan="4" class="text-center p-4">No values found</td></tr>
//                     </ng-template>
//                   </p-table>

//                   <div class="mt-3">
//                     <p-button label="Add Value" icon="pi pi-plus" size="small" (onClick)="openNewValueDialog(master)"/>
//                   </div>
//                 </p-accordion-content>
//               </p-accordion-panel>
//             </p-accordion>
//           </div>
//         </div>

//         <div class="col-12 md:col-8" *ngIf="selectedMasterDetails() as master">
//           <div class="card">
//             <div class="flex justify-between items-center mb-4">
//               <h3>{{ master.displayName || master.masterName }} - Details</h3>
//               <div class="flex gap-2">
//                 <p-button label="Edit Master" icon="pi pi-pencil" size="small" (onClick)="editMaster(master)"/>
//                 <p-button label="Add Value" icon="pi pi-plus" size="small" (onClick)="openNewValueDialog(master)"/>
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
//                   <p>{{ master.displayName || '-' }}</p>
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
//                   <p-tag [value]="master.category || 'None'" severity="info" />
//                 </div>
//               </div>
//               <div class="col-6">
//                 <div class="field">
//                   <label class="font-bold">Status</label>
//                   <div class="flex gap-2">
//                     <p-tag [value]="master.isPublished ? 'Published' : 'Draft'" [severity]="master.isPublished ? 'success' : 'info'"/>
//                     <p-tag *ngIf="master.isSystem" value="System" severity="secondary"/>
//                     <p-tag *ngIf="master.isLocked" value="Locked" severity="warn"/>
//                   </div>
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
//                     <input pInputText type="text" (input)="detailsTable.filterGlobal($any($event.target).value, 'contains')" placeholder="Search values..." size="30"/>
//                   </p-iconfield>
//                 </div>
//               </ng-template>
              
//               <ng-template pTemplate="header">
//                 <tr>
//                   <th>Value</th>
//                   <th>Label</th>
//                   <th>Description</th>
//                   <th>Status</th>
//                   <th>Actions</th>
//                 </tr>
//               </ng-template>
              
//               <ng-template pTemplate="body" let-value>
//                 <tr>
//                   <td><span class="font-mono">{{ value.value }}</span></td>
//                   <td>
//                     <div class="flex items-center gap-2">
//                       <span *ngIf="value.metadata?.icon" class="text-xl">{{ value.metadata.icon }}</span>
//                       <span [style.color]="value.metadata?.color">{{ value.label }}</span>
//                     </div>
//                   </td>
//                   <td>{{ value.description || '-' }}</td>
//                   <td>
//                     <div class="flex flex-wrap gap-1">
//                       <p-tag *ngIf="value.isPublished" value="Published" severity="success" size="small"/>
//                       <p-tag *ngIf="!value.isPublished" value="Draft" severity="info" size="small"/>
//                       <p-tag *ngIf="value.isSystem" value="System" severity="secondary" size="small"/>
//                     </div>
//                   </td>
//                   <td>
//                     <div class="flex gap-2">
//                       <p-button icon="pi pi-pencil" size="small" severity="info" (onClick)="editValue(master, value)" pTooltip="Edit"/>
//                       <p-button *ngIf="!value.isPublished" icon="pi pi-check-circle" size="small" severity="success" (onClick)="publishValue(master._id!, value._id!)" pTooltip="Publish"/>
//                       <p-button *ngIf="value.isPublished && !value.isSystem" icon="pi pi-ban" size="small" severity="warn" (onClick)="unpublishValue(master._id!, value._id!)" pTooltip="Unpublish"/>
//                       <p-button *ngIf="!value.isSystem" icon="pi pi-trash" size="small" severity="danger" (onClick)="deleteValue(master._id!, value._id!)" pTooltip="Delete"/>
//                     </div>
//                   </td>
//                 </tr>
//               </ng-template>
//               <ng-template pTemplate="emptymessage">
//                 <tr><td colspan="5" class="text-center p-4">No values found</td></tr>
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
//     >
//       <form [formGroup]="masterForm">
//         <div class="field mb-3">
//           <label for="masterName" class="block mb-1">Master Name (Uppercase)*</label>
//           <input 
//             pInputText 
//             id="masterName" 
//             formControlName="masterName" 
//             class="w-full uppercase"
//             [class.ng-invalid]="masterForm.get('masterName')?.invalid && masterForm.get('masterName')?.touched"
//           />
//         </div>

//         <div class="field mb-3">
//           <label for="displayName" class="block mb-1">Display Name *</label>
//           <input pInputText id="displayName" formControlName="displayName" class="w-full"/>
//         </div>

//         <div class="field mb-3">
//           <label for="description" class="block mb-1">Description</label>
//           <textarea pInputTextarea id="description" formControlName="description" rows="3" class="w-full"></textarea>
//         </div>

//         <div class="field mb-3">
//           <label for="category" class="block mb-1">Category</label>
//           <p-select id="category" formControlName="category" [options]="masterCategories" optionLabel="label" optionValue="value" placeholder="Select Category" class="w-full"/>
//         </div>

//         <div class="field-checkbox mb-3 flex items-center">
//           <p-checkbox inputId="isHierarchical" formControlName="isHierarchical" [binary]="true"/>
//           <label for="isHierarchical" class="ml-2">Allow Hierarchical Values</label>
//         </div>
//       </form>

//       <ng-template pTemplate="footer">
//         <p-button label="Cancel" icon="pi pi-times" (onClick)="hideMasterDialog()" text />
//         <p-button label="Save" icon="pi pi-check" (onClick)="saveMaster()" [disabled]="masterForm.invalid"/>
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
//           <label for="value" class="block mb-1">Value (Unique Code)*</label>
//           <input pInputText id="value" formControlName="value" class="w-full" />
//         </div>

//         <div class="field mb-3">
//           <label for="label" class="block mb-1">Display Label *</label>
//           <input pInputText id="label" formControlName="label" class="w-full" />
//         </div>

//         <div class="field mb-3">
//           <label for="description" class="block mb-1">Description</label>
//           <textarea pInputTextarea id="description" formControlName="description" rows="2" class="w-full"></textarea>
//         </div>

//         <p-accordion value="metadata" class="mb-3 block">
//           <p-accordion-panel value="metadata">
//             <p-accordion-header>Appearance & Metadata</p-accordion-header>
//             <p-accordion-content>
//               <div class="field mb-3">
//                 <label for="icon" class="block mb-1">Icon Class</label>
//                 <input pInputText id="icon" formControlName="icon" class="w-full" placeholder="e.g., pi pi-star"/>
//               </div>

//               <div class="field mb-3">
//                 <label for="color" class="block mb-1">Color Code</label>
//                 <p-colorPicker id="color" formControlName="color" [inline]="false"/>
//               </div>

//               <div class="field mb-3">
//                 <label for="sortOrder" class="block mb-1">Sort Order</label>
//                 <p-inputNumber inputId="sortOrder" formControlName="sortOrder" class="w-full"/>
//               </div>
//             </p-accordion-content>
//           </p-accordion-panel>
//         </p-accordion>

//         <div class="flex gap-4">
//           <div class="field-checkbox mb-3 flex items-center">
//             <p-checkbox inputId="isPublished" formControlName="isPublished" [binary]="true"/>
//             <label for="isPublished" class="ml-2">Published</label>
//           </div>
//         </div>
//       </form>

//       <ng-template pTemplate="footer">
//         <p-button label="Cancel" icon="pi pi-times" (onClick)="hideValueDialog()" text />
//         <p-button label="Save" icon="pi pi-check" (onClick)="saveValue()" [disabled]="valueForm.invalid"/>
//       </ng-template>
//     </p-dialog>

//     <input #importFileUpload type="file" accept=".json,.csv" style="display: none" (change)="onFileSelected($event)"/>
//     <p-confirmDialog />
//     <p-toast />
//   `,
//   styles: [`
//     :host ::ng-deep {
//       .p-accordion .p-accordion-header .p-accordion-header-link {
//         padding: 1rem;
//       }
      
//       .p-accordion .p-accordion-content {
//         padding: 1.5rem;
//       }
//     }
//   `]
// })
// export class MasterDataGridComponent implements OnInit {
//   private masterApi = inject(MasterApiService);
//   private fb = inject(FormBuilder);
//   private messageService = inject(MessageService);
//   private confirmationService = inject(ConfirmationService);

//   allMasters = signal<any[]>([]);
//   filteredMasters = signal<any[]>([]);
//   loading = signal<boolean>(false);
//   masterSearchValue = signal<string>('');

//   selectedMasterCategory = signal<string>('');
//   selectedMaster = signal<string>('');

//   selectedMasterDetails = computed(() => {
//     return this.allMasters().find(m => m._id === this.selectedMaster());
//   });

//   expandedMasters = signal<number[]>([]);
//   showMasterDialog = signal<boolean>(false);
//   showValueDialog = signal<boolean>(false);

//   editingMaster = signal<any | null>(null);
//   editingValue = signal<{ master: any; value: MasterValueExtended } | null>(null);
//   selectedMasterForValue = signal<any | null>(null);

//   masterCategories = [
//     { label: 'System', value: 'SYSTEM' },
//     { label: 'Business', value: 'BUSINESS' },
//     { label: 'Education', value: 'EDUCATION' },
//     { label: 'User', value: 'USER' },
//     { label: 'Settings', value: 'SETTINGS' }
//   ];

//   masterForm: FormGroup = this.fb.group({
//     masterName: ['', [Validators.required]], // Let user type, backend converts to UPPERCASE
//     displayName: ['', Validators.required],
//     description: [''],
//     category: ['BUSINESS'],
//     isHierarchical: [false]
//   });

//   valueForm: FormGroup = this.fb.group({
//     value: ['', Validators.required],
//     label: ['', Validators.required],
//     description: [''],
//     icon: [''],
//     color: [''],
//     sortOrder: [0],
//     isPublished: [true]
//   });

//   masterDialogTitle = computed(() => this.editingMaster() ? 'Edit Master' : 'Create New Master');
//   valueDialogTitle = computed(() => this.editingValue() ? 'Edit Value' : 'Add New Value');

//   displayedMasters = computed(() => {
//     const search = this.masterSearchValue().toLowerCase();
//     if (!search) return this.filteredMasters();

//     return this.filteredMasters().filter(m =>
//       m.displayName?.toLowerCase().includes(search) ||
//       m.masterName?.toLowerCase().includes(search)
//     );
//   });

//   ngOnInit(): void {
//     this.loadMasters();
//   }

//   // ==================== MASTER CRUD ====================
//   loadMasters(): void {
//     this.loading.set(true);
//     this.masterApi.getAllMasters().pipe(
//       tap((res: any) => {
//         // Grab the 'data' array out of your JSON response wrapper
//         const masters = res.data || [];

//         this.allMasters.set(masters);
//         // If there's an active category filter, re-apply it
//         this.filterByCategory();
//       }),
//       catchError(err => {
//         this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load masters' });
//         return of(null);
//       }),
//       finalize(() => this.loading.set(false))
//     ).subscribe();
//   }

//   filterByCategory(): void {
//     const category = this.selectedMasterCategory();
//     if (category) {
//       this.filteredMasters.set(this.allMasters().filter(m => m.category === category));
//     } else {
//       this.filteredMasters.set(this.allMasters());
//     }
//   }

//   onMasterSelect(): void {
//     const masterId = this.selectedMaster();
//     const index = this.allMasters().findIndex(m => m._id === masterId);
//     if (index >= 0) this.expandedMasters.set([index]);
//   }

//   openNewMasterDialog(): void {
//     this.editingMaster.set(null);
//     this.masterForm.reset({ category: this.selectedMasterCategory() || 'BUSINESS', isHierarchical: false });
//     this.showMasterDialog.set(true);
//   }

//   editMaster(master: any): void {
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
//   }

//   saveMaster(): void {
//     if (this.masterForm.invalid) return;

//     const formData = this.masterForm.value;
//     const masterData: Partial<any> = {
//       masterName: formData.masterName,
//       displayName: formData.displayName,
//       description: formData.description,
//       category: formData.category,
//       config: { isHierarchical: formData.isHierarchical, allowMultiple: true, hasMetadata: true }
//     };

//     const request$ = this.editingMaster()
//       ? this.masterApi.updateMaster(this.editingMaster()!._id!, masterData)
//       : this.masterApi.createMaster(masterData);

//     request$.pipe(
//       tap(() => {
//         this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Master saved successfully' });
//         this.hideMasterDialog();
//         this.loadMasters(); // Refresh data from backend
//       }),
//       catchError((err) => {
//         this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Failed to save master' });
//         return of(null);
//       })
//     ).subscribe();
//   }

//   publishMaster(master: any): void {
//     this.masterApi.publishMaster(master._id!).pipe(
//       tap(() => {
//         this.messageService.add({ severity: 'success', summary: 'Published', detail: 'Master published' });
//         this.loadMasters();
//       })
//     ).subscribe();
//   }

//   unpublishMaster(master: any): void {
//     this.masterApi.unpublishMaster(master._id!).pipe(
//       tap(() => {
//         this.messageService.add({ severity: 'success', summary: 'Unpublished', detail: 'Master unpublished' });
//         this.loadMasters();
//       })
//     ).subscribe();
//   }

//   deleteMaster(master: any): void {
//     this.confirmationService.confirm({
//       message: `Delete "${master.displayName || master.masterName}"?`,
//       header: 'Confirm Delete',
//       icon: 'pi pi-exclamation-triangle',
//       acceptButtonStyleClass: 'p-button-danger',
//       accept: () => {
//         this.masterApi.deleteMaster(master._id!).pipe(
//           tap(() => {
//             this.messageService.add({ severity: 'success', summary: 'Deleted', detail: 'Master deleted' });
//             this.loadMasters();
//           })
//         ).subscribe();
//       }
//     });
//   }

//   // ==================== MASTER VALUES CRUD ====================

//   openNewValueDialog(master: any): void {
//     this.selectedMasterForValue.set(master);
//     this.editingValue.set(null);
//     this.valueForm.reset({ sortOrder: 0, isPublished: true });
//     this.showValueDialog.set(true);
//   }

//   editValue(master: any, value: MasterValueExtended): void {
//     this.selectedMasterForValue.set(master);
//     this.editingValue.set({ master, value });
//     this.valueForm.patchValue({
//       value: value.value,
//       label: value.label,
//       description: value.description,
//       icon: value.metadata?.icon || '',
//       color: value.metadata?.color || '',
//       sortOrder: value.metadata?.sortOrder || 0,
//       isPublished: value.isPublished !== false // Default to true if undefined
//     });
//     this.showValueDialog.set(true);
//   }

//   hideValueDialog(): void {
//     this.showValueDialog.set(false);
//   }

//   saveValue(): void {
//     if (this.valueForm.invalid || !this.selectedMasterForValue()) return;

//     const formData = this.valueForm.value;
//     const masterId = this.selectedMasterForValue()!._id!;

//     // Construct the payload based on your backend model
//     const valueData: any = {
//       value: formData.value,
//       label: formData.label,
//       description: formData.description,
//       isPublished: formData.isPublished,
//       metadata: {
//         icon: formData.icon,
//         color: formData.color,
//         sortOrder: formData.sortOrder
//       }
//     };

//     // Use updateValue if editing (requires both master ID and value ID), else addValue
//     const request$ = this.editingValue()
//       ? this.masterApi.updateValue(masterId, this.editingValue()!.value._id!, valueData)
//       : this.masterApi.addValue(masterId, valueData);

//     request$.pipe(
//       tap(() => {
//         this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Value saved successfully' });
//         this.hideValueDialog();
//         this.loadMasters(); // Refresh grid to show new value
//       }),
//       catchError((err) => {
//         this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Failed to save value' });
//         return of(null);
//       })
//     ).subscribe();
//   }

//   publishValue(masterId: string, valueId: string): void {
//     this.masterApi.publishValue(masterId, valueId).pipe(
//       tap(() => {
//         this.messageService.add({ severity: 'success', summary: 'Published', detail: 'Value published' });
//         this.loadMasters();
//       })
//     ).subscribe();
//   }

//   unpublishValue(masterId: string, valueId: string): void {
//     this.masterApi.unpublishValue(masterId, valueId).pipe(
//       tap(() => {
//         this.messageService.add({ severity: 'success', summary: 'Unpublished', detail: 'Value unpublished' });
//         this.loadMasters();
//       })
//     ).subscribe();
//   }

//   deleteValue(masterId: string, valueId: string): void {
//     this.confirmationService.confirm({
//       message: 'Are you sure you want to delete this value?',
//       header: 'Confirm Delete',
//       icon: 'pi pi-exclamation-triangle',
//       acceptButtonStyleClass: 'p-button-danger',
//       accept: () => {
//         this.masterApi.deleteValue(masterId, valueId).pipe(
//           tap(() => {
//             this.messageService.add({ severity: 'success', summary: 'Deleted', detail: 'Value deleted' });
//             this.loadMasters();
//           })
//         ).subscribe();
//       }
//     });
//   }

//   // ==================== IMPORT / EXPORT ====================

//   onFileSelected(event: any): void {
//     const file = event.target.files[0];
//     if (!file || !this.selectedMaster()) return;

//     const formData = new FormData();
//     formData.append('file', file);

//     this.masterApi.importValues(this.selectedMaster(), formData).pipe(
//       tap(() => {
//         this.messageService.add({ severity: 'success', summary: 'Imported', detail: 'Values imported successfully' });
//         this.loadMasters();
//       }),
//       catchError(() => {
//         this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to import values' });
//         return of(null);
//       })
//     ).subscribe();

//     // Reset input
//     event.target.value = null;
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
//       })
//     ).subscribe();
//   }
// }
