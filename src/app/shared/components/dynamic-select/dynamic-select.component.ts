import { Component, Input, OnInit, SimpleChanges, forwardRef, inject } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { MultiSelectModule } from 'primeng/multiselect';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { DropdownOption, DropdownService } from '../../../core/services/dropdown.service';

@Component({
  selector: 'app-dynamic-dropdown',
  standalone: true,
  imports: [SelectModule, MultiSelectModule, FormsModule, CommonModule],
  template: `
    @if (!multiple) {
      <p-select  appendTo="body"
        [options]="options" 
        [(ngModel)]="value" 
        [placeholder]="placeholder" 
        [virtualScroll]="true" 
        [virtualScrollItemSize]="32"
        [filter]="true"
        [loading]="loading"
        [disabled]="disabled"
        [showClear]="true"
        (onFilter)="onSearch($event)"
        (onChange)="onSelectChange($event.value)"
        class="w-full"
        styleClass="w-full">
      </p-select>
    } @else {
      <p-multiselect
        [options]="options" appendTo="body"
        [(ngModel)]="value"
        [placeholder]="placeholder"
        [virtualScroll]="true"
        [virtualScrollItemSize]="43"
        [filter]="true"
        [loading]="loading"
        [disabled]="disabled"
        [maxSelectedLabels]="maxSelectedLabels"
        [showToggleAll]="true"
        (onFilter)="onSearch($event)"
        (onChange)="onSelectChange($event.value)"
        class="w-full"
        styleClass="w-full">
      </p-multiselect>
    }
  `,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DynamicDropdownComponent),
      multi: true
    }
  ]
})
export class DynamicDropdownComponent implements OnInit, ControlValueAccessor {
  // Config Inputs
  @Input() model!: string;
  @Input() masterType?: string;
  @Input() placeholder: string = 'Select item(s)';
  @Input() multiple: boolean = false;
  @Input() maxSelectedLabels: number = 3;
  @Input() initialOptions: DropdownOption[] = [];

  options: DropdownOption[] = [];
  value: any;
  loading: boolean = false;
  disabled: boolean = false;

  private dropdownService = inject(DropdownService);
  private searchSubject = new Subject<string>();


  onChange: any = () => { };
  onTouch: any = () => { };

  ngOnInit() {
    this.loadInitialData();
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(searchTerm => {
        this.loading = true;
        return this.dropdownService.getOptions(this.model, searchTerm, this.masterType);
      })
    ).subscribe({
      next: (res) => {
        this.options = res;
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['initialOptions'] && this.initialOptions?.length > 0) {
      this.mergeInitialOptions();
    }
  }
  private mergeInitialOptions() {
    const existingValues = new Set(this.options.map(o => o.value));
    const toAdd = this.initialOptions.filter(o => !existingValues.has(o.value));

    if (toAdd.length > 0) {
      this.options = [...toAdd, ...this.options];
    }
  }

  loadInitialData() {
    this.loading = true;
    this.dropdownService.getOptions(this.model, '', this.masterType).subscribe({
      next: (res) => {
        this.options = res;
        if (this.initialOptions?.length > 0) {
          this.mergeInitialOptions();
        }
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  onSearch(event: any) {
    this.searchSubject.next(event.filter || '');
  }

  onSelectChange(val: any) {
    this.value = val;
    this.onChange(val);
    this.onTouch();
  }

  // --- ControlValueAccessor Implementation ---
  writeValue(val: any): void {
    // If multi is enabled, ensure value defaults to an empty array instead of null
    if (this.multiple) {
      this.value = val || [];
    } else {
      this.value = val;
    }
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouch = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}