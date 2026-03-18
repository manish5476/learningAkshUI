import { Component, Input, OnInit, forwardRef, inject } from '@angular/core';
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
      <p-select 
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
        [options]="options"
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

  
  options: DropdownOption[] = [];
  value: any; 
  loading: boolean = false;
  disabled: boolean = false;

  private dropdownService = inject(DropdownService);
  private searchSubject = new Subject<string>();

  
  onChange: any = () => {};
  onTouch: any = () => {};

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

  loadInitialData() {
    this.loading = true;
    this.dropdownService.getOptions(this.model, '', this.masterType).subscribe({
      next: (res) => {
        this.options = res;
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
// <app-dynamic-dropdown 
//   model="master" 
//   masterType="course_level" 
//   [(ngModel)]="selectedLevel">
// </app-dynamic-dropdown>
// <app-dynamic-dropdown 
//   model="category" 
//   [multiple]="true" 
//   [(ngModel)]="selectedCategories">
// </app-dynamic-dropdown>
// import { Component, Input, OnInit, forwardRef, inject } from '@angular/core';
// import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';
// import { SelectModule } from 'primeng/select';
// import { Subject } from 'rxjs';
// import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
// import { CommonModule } from '@angular/common';
// import { DropdownOption, DropdownService } from '../../../core/services/dropdown.service';

// @Component({
//   selector: 'app-dynamic-select',
//   standalone: true,
//   imports: [SelectModule, FormsModule, CommonModule],
//   template: `
//     <p-select 
//       [options]="options" 
//       [(ngModel)]="value" 
//       [placeholder]="placeholder" 
//       [virtualScroll]="true" 
//       [virtualScrollItemSize]="32"
//       [filter]="true"
//       [loading]="loading"
//       [disabled]="disabled"
//       [showClear]="true"
//       (onFilter)="onSearch($event)"
//       (onChange)="onSelectChange($event.value)"
//       class="w-full"
//       styleClass="w-full">
//     </p-select>
//   `,
//   providers: [
//     {
//       provide: NG_VALUE_ACCESSOR,
//       useExisting: forwardRef(() => DynamicSelectComponent),
//       multi: true
//     }
//   ]
// })
// export class DynamicSelectComponent implements OnInit, ControlValueAccessor {
//   @Input() model!: string; // e.g., 'course', 'category', 'mock-test'
//   @Input() masterType?: string; // Only needed if model === 'master'
//   @Input() placeholder: string = 'Select an item';
  
//   options: DropdownOption[] = [];
//   value: any;
//   loading: boolean = false;
//   disabled: boolean = false;

//   private dropdownService = inject(DropdownService);
//   private searchSubject = new Subject<string>();

//   // CVA Methods
//   onChange: any = () => {};
//   onTouch: any = () => {};

//   ngOnInit() {
//     this.loadInitialData();

//     // Listen to search events and debounce API calls by 300ms
//     this.searchSubject.pipe(
//       debounceTime(300),
//       distinctUntilChanged(),
//       switchMap(searchTerm => {
//         this.loading = true;
//         return this.dropdownService.getOptions(this.model, searchTerm, this.masterType);
//       })
//     ).subscribe({
//       next: (res) => {
//         this.options = res;
//         this.loading = false;
//       },
//       error: () => this.loading = false
//     });
//   }

//   loadInitialData() {
//     this.loading = true;
//     this.dropdownService.getOptions(this.model, '', this.masterType).subscribe({
//       next: (res) => {
//         this.options = res;
//         this.loading = false;
//       },
//       error: () => this.loading = false
//     });
//   }

//   onSearch(event: any) {
//     // Push the search term to the subject
//     this.searchSubject.next(event.filter || '');
//   }

//   onSelectChange(val: any) {
//     this.value = val;
//     this.onChange(val);
//     this.onTouch();
//   }

//   // --- ControlValueAccessor Implementation ---
//   writeValue(val: any): void {
//     this.value = val;
//   }
//   registerOnChange(fn: any): void {
//     this.onChange = fn;
//   }
//   registerOnTouched(fn: any): void {
//     this.onTouch = fn;
//   }
//   setDisabledState(isDisabled: boolean): void {
//     this.disabled = isDisabled;
//   }
// }