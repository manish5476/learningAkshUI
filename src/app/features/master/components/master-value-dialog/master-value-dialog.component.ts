import { Component, effect, inject, input, output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { MasterValue } from '../../../../core/services/master-list.service';


@Component({
  selector: 'app-master-value-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DialogModule, ButtonModule, InputTextModule, ToggleSwitchModule],
  template: `
    <p-dialog 
      [header]="editingValue() ? 'Edit Value' : 'Add New Value'" 
      [visible]="visible()" 
      (visibleChange)="visibleChange.emit($event)"
      [modal]="true" 
      [style]="{ width: '450px' }">
      
      <form [formGroup]="valueForm" (ngSubmit)="submit()" class="p-fluid mt-3">
        <div class="field mb-4">
          <label for="label">Label *</label>
          <input pInputText id="label" formControlName="label" autofocus />
        </div>
        
        <div class="field mb-4">
          <label for="value">Value Key *</label>
          <input pInputText id="value" formControlName="value" [readOnly]="!!editingValue()" />
          <small class="text-gray-500" *ngIf="editingValue()">Value keys cannot be changed after creation.</small>
        </div>

        <div class="field mb-4">
          <label for="description">Description</label>
          <input pInputText id="description" formControlName="description" />
        </div>

        <div class="field flex align-items-center mb-4">
          <p-toggleSwitch formControlName="isPublished" inputId="isPublished"></p-toggleSwitch>
          <label for="isPublished" class="ml-2 mb-0">Published</label>
        </div>

        <div class="flex justify-content-end gap-2 mt-4">
          <button pButton type="button" label="Cancel" icon="pi pi-times" class="p-button-text" (click)="close()"></button>
          <button pButton type="submit" label="Save" icon="pi pi-check" [disabled]="valueForm.invalid"></button>
        </div>
      </form>
    </p-dialog>
  `
})
export class MasterValueDialogComponent {
  private fb = inject(FormBuilder);

  visible = input<boolean>(false);
  editingValue = input<MasterValue | null>(null);

  visibleChange = output<boolean>();
  save = output<Partial<MasterValue>>();

  valueForm: FormGroup = this.fb.group({
    value: ['', Validators.required],
    label: ['', Validators.required],
    description: [''],
    isPublished: [true]
  });

  constructor() {
    // React to changes in the editingValue input
    effect(() => {
      const val = this.editingValue();
      if (val) {
        this.valueForm.patchValue({
          value: val.value,
          label: val.label,
          description: val.description,
          isPublished: val.isPublished !== false
        });
      } else {
        this.valueForm.reset({ isPublished: true });
      }
    });
  }

  close() {
    this.visibleChange.emit(false);
  }

  submit() {
    if (this.valueForm.valid) {
      this.save.emit(this.valueForm.value);
    }
  }
}