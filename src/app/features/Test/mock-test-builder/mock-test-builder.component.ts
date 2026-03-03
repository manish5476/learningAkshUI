import { Component, OnInit, inject, DestroyRef, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { switchMap } from 'rxjs/operators';
import { of } from 'rxjs';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { TextareaModule } from 'primeng/textarea';
import { CheckboxModule } from 'primeng/checkbox';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';

// Services
import { MockTestService } from '../../../core/services/mock-test.service';
import { CategoryService } from '../../../core/services/category.service';
import { Category } from '../../../core/models/course.model';

@Component({
  selector: 'app-mock-test-builder',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    RouterModule,
    ButtonModule, 
    InputTextModule, 
    InputNumberModule, 
    TextareaModule, 
    CheckboxModule, 
    SelectModule,
    ToastModule,
    TooltipModule
  ],
  providers: [MessageService],
  templateUrl: './mock-test-builder.component.html',
  styleUrls: ['./mock-test-builder.component.scss']
})
export class MockTestBuilderComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private messageService = inject(MessageService);
  private mockTestService = inject(MockTestService);
  private categoryService = inject(CategoryService);
  private destroyRef = inject(DestroyRef);

  // State
  categories = signal<Category[]>([]);
  mockTestId = signal<string | null>(null);
  isLoading = signal<boolean>(false);
  isSaving = signal<boolean>(false);

  levels = [
    { label: 'Beginner', value: 'beginner' }, 
    { label: 'Intermediate', value: 'intermediate' }, 
    { label: 'Advanced', value: 'advanced' }
  ];
  
  testForm: FormGroup = this.fb.group({
    title: ['', Validators.required],
    description: [''],
    level: ['beginner', Validators.required],
    category: [null, Validators.required], // Added Category Form Control
    duration: [60, [Validators.required, Validators.min(1)]],
    passingMarks: [50, [Validators.required, Validators.min(1)]],
    isFree: [false],
    price: [{ value: 0, disabled: false }, [Validators.min(0)]], 
    questions: this.fb.array([])
  });

  ngOnInit() { 
    // Load categories first
    this.loadCategories();

    // Handle Routing & Initialization
    this.route.params.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      if (params['id'] && params['id'] !== 'new') {
        this.mockTestId.set(params['id']);
        this.loadMockTest(params['id']);
      } else {
        // If creating new, check if we came from a specific category route
        this.route.queryParams.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(qParams => {
          if (qParams['categoryId']) {
            this.testForm.patchValue({ category: qParams['categoryId'] });
          }
        });
        this.addQuestion(); // Start with one empty question
      }
    });

    // Handle Monetary Logic: Clear & disable price if test is set to Free
    this.testForm.get('isFree')?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(isFree => {
      this.togglePriceField(isFree);
    });
  }

  private loadCategories(): void {
    this.categoryService.getAllCategories({ isActive: true })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: any) => this.categories.set(res.data?.data || res.data || []),
        error: (error: any) => console.error('Failed to load categories', error)
      });
  }

  // Form Validation Helper
  isFieldInvalid(fieldName: string): boolean {
    const field = this.testForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  // Helper to dynamically enable/disable price
  private togglePriceField(isFree: boolean): void {
    const priceControl = this.testForm.get('price');
    if (isFree) {
      priceControl?.setValue(0, { emitEvent: false });
      priceControl?.disable({ emitEvent: false });
    } else {
      priceControl?.enable({ emitEvent: false });
    }
  }

  // --- Form Array Getters ---
  get questions(): FormArray { return this.testForm.get('questions') as FormArray; }
  getOptions(qIndex: number): FormArray { return this.questions.at(qIndex).get('options') as FormArray; }

  // --- Mutators ---
  addQuestion() {
    this.questions.push(this.fb.group({
      sectionName: ['General', Validators.required], 
      question: ['', Validators.required],
      marks: [1, [Validators.required, Validators.min(0.1)]],
      negativeMarks: [0, Validators.min(0)], 
      options: this.fb.array([
        this.fb.group({ text: ['', Validators.required], isCorrect: [false] }),
        this.fb.group({ text: ['', Validators.required], isCorrect: [false] })
      ])
    }));
  }

  addOption(qIndex: number) {
    this.getOptions(qIndex).push(this.fb.group({ text: ['', Validators.required], isCorrect: [false] }));
  }

  removeQuestion(index: number) { this.questions.removeAt(index); }
  removeOption(qIndex: number, optIndex: number) { this.getOptions(qIndex).removeAt(optIndex); }

  onCorrectChange(qIndex: number, optIndex: number, checked: boolean) {
    const options = this.getOptions(qIndex);
    
    if (checked) {
      options.controls.forEach((ctrl, idx) => {
        if (idx !== optIndex) {
          ctrl.get('isCorrect')?.setValue(false, { emitEvent: false });
        }
      });
    }
  }

  calculateTotalMarks(): number {
    const questions = this.testForm.getRawValue().questions || []; 
    return questions.reduce((acc: number, q: any) => acc + (q.marks || 0), 0);
  }

  // --- API Integrations ---
  private loadMockTest(id: string): void {
    this.isLoading.set(true);
    this.mockTestService.getById(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: any) => {
          const test = res.data?.mockTest || res.data;
          
          this.testForm.patchValue({
            title: test.title,
            description: test.description,
            level: test.level,
            category: test.category?._id || test.category, // Handle populated category
            duration: test.duration,
            passingMarks: test.passingMarks,
            isFree: test.isFree,
            price: test.price
          });

          this.togglePriceField(test.isFree);
          
          if (test.questions && Array.isArray(test.questions)) {
            this.questions.clear();
            test.questions.forEach((q: any) => {
               // Your logic for mapping backend questions to the form array goes here
            });
          }

          if (this.questions.length === 0) {
             this.addQuestion(); 
          }

          this.isLoading.set(false);
        },
        error: () => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Could not load Mock Test.' });
          this.isLoading.set(false);
        }
      });
  }

  saveMockTest() {
    if (this.testForm.invalid) {
      this.testForm.markAllAsTouched();
      this.messageService.add({ severity: 'warn', summary: 'Incomplete', detail: 'Please fill out all required fields before saving.' });
      return;
    }

    const rawData = this.testForm.getRawValue(); 
    
    for (let i = 0; i < rawData.questions.length; i++) {
      const hasCorrect = rawData.questions[i].options.some((opt: any) => opt.isCorrect);
      if (!hasCorrect) {
         this.messageService.add({ severity: 'error', summary: 'Missing Answer', detail: `Question ${i + 1} needs a correct option selected.` });
         return;
      }
    }

    // Notice we now use rawData.category directly from the form dropdown
    const mockTestPayload = {
      title: rawData.title,
      description: rawData.description,
      level: rawData.level,
      category: rawData.category,
      duration: rawData.duration,
      passingMarks: rawData.passingMarks,
      isFree: rawData.isFree,
      price: rawData.price,
      totalQuestions: rawData.questions.length,
      totalMarks: this.calculateTotalMarks(),
      isPublished: true
    };

    this.isSaving.set(true);

    const request$ = this.mockTestId()
      ? this.mockTestService.update(this.mockTestId()!, mockTestPayload)
      : this.mockTestService.create(mockTestPayload).pipe(
          switchMap((res: any) => {
            const newId = res.data.mockTest._id;
            
            const questionsWithRef = rawData.questions.map((q: any, index: number) => ({
              ...q,
              mockTest: newId,
              order: index
            }));
            
            return this.mockTestService.addQuestions(newId, questionsWithRef);
          })
        );

    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.messageService.add({ severity: 'success', summary: 'Published', detail: 'Mock Test is now live and assigned.' });
        setTimeout(() => this.router.navigate(['/instructor/mock-tests']), 1200);
      },
      error: (err: any) => {
        this.isSaving.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Failed to publish mock test.' });
      }
    });
  }
}
// import { Component, OnInit, inject, DestroyRef, signal } from '@angular/core';
// import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
// import { CommonModule } from '@angular/common';
// import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
// import { ActivatedRoute, Router, RouterModule } from '@angular/router';
// import { switchMap } from 'rxjs/operators';
// import { of } from 'rxjs';

// // PrimeNG
// import { ButtonModule } from 'primeng/button';
// import { InputTextModule } from 'primeng/inputtext';
// import { InputNumberModule } from 'primeng/inputnumber';
// import { TextareaModule } from 'primeng/textarea';
// import { CheckboxModule } from 'primeng/checkbox';
// import { SelectModule } from 'primeng/select';
// import { ToastModule } from 'primeng/toast';
// import { TooltipModule } from 'primeng/tooltip';
// import { MessageService } from 'primeng/api';

// // Services
// import { MockTestService } from '../../../core/services/mock-test.service';
// import { CategoryService } from '../../../core/services/category.service';
// import { Category } from '../../../core/models/course.model';

// @Component({
//   selector: 'app-mock-test-builder',
//   standalone: true,
//   imports: [
//     CommonModule, 
//     ReactiveFormsModule, 
//     RouterModule,
//     ButtonModule, 
//     InputTextModule, 
//     InputNumberModule, 
//     TextareaModule, 
//     CheckboxModule, 
//     SelectModule,
//     ToastModule,
//     TooltipModule
//   ],
//   providers: [MessageService],
//   templateUrl: './mock-test-builder.component.html',
//   styleUrls: ['./mock-test-builder.component.scss']
// })
// export class MockTestBuilderComponent implements OnInit {
//   private fb = inject(FormBuilder);
//   private route = inject(ActivatedRoute);
//   private router = inject(Router);
//   private messageService = inject(MessageService);
//   private mockTestService = inject(MockTestService);
//   private destroyRef = inject(DestroyRef);
//   categories = signal<Category[]>([]);

//   // State
//   mockTestId = signal<string | null>(null);
//   categoryId = signal<string | null>(null);
//   isLoading = signal<boolean>(false);
//   isSaving = signal<boolean>(false);
//   private categoryService = inject(CategoryService);

//   levels = [
//     { label: 'Beginner', value: 'beginner' }, 
//     { label: 'Intermediate', value: 'intermediate' }, 
//     { label: 'Advanced', value: 'advanced' }
//   ];
  
//   testForm: FormGroup = this.fb.group({
//     title: ['', Validators.required],
//     description: [''],
//     level: ['beginner', Validators.required],
//     duration: [60, [Validators.required, Validators.min(1)]],
//     passingMarks: [50, [Validators.required, Validators.min(1)]],
//     isFree: [false],
//     price: [{ value: 0, disabled: false }, [Validators.min(0)]], // Dynamic disable based on isFree
//     questions: this.fb.array([])
//   });

//   ngOnInit() { 
//     // Handle Routing & Initialization
//     this.route.params.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
//       if (params['id'] && params['id'] !== 'new') {
//         this.mockTestId.set(params['id']);
//         this.loadMockTest(params['id']);
//       } else {
//         this.route.queryParams.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(qParams => {
//           if (qParams['categoryId']) this.categoryId.set(qParams['categoryId']);
//         });
//         this.addQuestion(); // Start with one empty question
//       }
//     });

//     // Handle Monetary Logic: Clear & disable price if test is set to Free
//     this.testForm.get('isFree')?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(isFree => {
//       this.togglePriceField(isFree);
//     });
//   }

//   // Helper to dynamically enable/disable price
//   private togglePriceField(isFree: boolean): void {
//     const priceControl = this.testForm.get('price');
//     if (isFree) {
//       priceControl?.setValue(0, { emitEvent: false });
//       priceControl?.disable({ emitEvent: false });
//     } else {
//       priceControl?.enable({ emitEvent: false });
//     }
//   }

//   // --- Form Array Getters ---
//   get questions(): FormArray { return this.testForm.get('questions') as FormArray; }
//   getOptions(qIndex: number): FormArray { return this.questions.at(qIndex).get('options') as FormArray; }

//   // --- Mutators ---
//   addQuestion() {
//     this.questions.push(this.fb.group({
//       sectionName: ['General', Validators.required], 
//       question: ['', Validators.required],
//       marks: [1, [Validators.required, Validators.min(0.1)]],
//       negativeMarks: [0, Validators.min(0)], 
//       options: this.fb.array([
//         this.fb.group({ text: ['', Validators.required], isCorrect: [false] }),
//         this.fb.group({ text: ['', Validators.required], isCorrect: [false] })
//       ])
//     }));
//   }

//   addOption(qIndex: number) {
//     this.getOptions(qIndex).push(this.fb.group({ text: ['', Validators.required], isCorrect: [false] }));
//   }

//   removeQuestion(index: number) { this.questions.removeAt(index); }
//   removeOption(qIndex: number, optIndex: number) { this.getOptions(qIndex).removeAt(optIndex); }

//   onCorrectChange(qIndex: number, optIndex: number, checked: boolean) {
//     const options = this.getOptions(qIndex);
    
//     // Ensure only one option can be selected as correct (Radio Button behavior)
//     if (checked) {
//       options.controls.forEach((ctrl, idx) => {
//         if (idx !== optIndex) {
//           ctrl.get('isCorrect')?.setValue(false, { emitEvent: false });
//         }
//       });
//     }
//   }

//   // Calculate live total marks for the Floating Stats Widget
//   calculateTotalMarks(): number {
//     const questions = this.testForm.getRawValue().questions || []; // use getRawValue to ensure we grab everything
//     return questions.reduce((acc: number, q: any) => acc + (q.marks || 0), 0);
//   }

//   // --- API Integrations ---
//   private loadMockTest(id: string): void {
//     this.isLoading.set(true);
//     this.mockTestService.getById(id)
//       .pipe(takeUntilDestroyed(this.destroyRef))
//       .subscribe({
//         next: (res: any) => {
//           const test = res.data?.mockTest || res.data;
          
//           this.testForm.patchValue({
//             title: test.title,
//             description: test.description,
//             level: test.level,
//             duration: test.duration,
//             passingMarks: test.passingMarks,
//             isFree: test.isFree,
//             price: test.price
//           });

//           // Explicitly toggle the price field based on incoming data
//           this.togglePriceField(test.isFree);
          
//           // Populate Questions if the backend provides them in the same payload
//           if (test.questions && Array.isArray(test.questions)) {
//             this.questions.clear();
//             test.questions.forEach((q: any) => {
//                // Assuming you want to populate them similarly to the quiz builder
//                // (Add logic here if your getById returns questions)
//             });
//           }

//           if (this.questions.length === 0) {
//              this.addQuestion(); // Failsafe
//           }

//           this.isLoading.set(false);
//         },
//         error: () => {
//           this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Could not load Mock Test.' });
//           this.isLoading.set(false);
//         }
//       });
//   }

//   saveMockTest() {
//     if (this.testForm.invalid) {
//       this.testForm.markAllAsTouched();
//       this.messageService.add({ severity: 'warn', summary: 'Incomplete', detail: 'Please fill out all required fields before saving.' });
//       return;
//     }

//     const rawData = this.testForm.getRawValue(); // gets values including disabled fields (like price = 0)
    
//     // Validate that every question has at least one correct option selected
//     for (let i = 0; i < rawData.questions.length; i++) {
//       const hasCorrect = rawData.questions[i].options.some((opt: any) => opt.isCorrect);
//       if (!hasCorrect) {
//          this.messageService.add({ severity: 'error', summary: 'Missing Answer', detail: `Question ${i + 1} needs a correct option selected.` });
//          return;
//       }
//     }

//     // Construct Payload matching Schema
//     const mockTestPayload = {
//       title: rawData.title,
//       description: rawData.description,
//       level: rawData.level,
//       duration: rawData.duration,
//       passingMarks: rawData.passingMarks,
//       isFree: rawData.isFree,
//       price: rawData.price,
//       totalQuestions: rawData.questions.length,
//       totalMarks: this.calculateTotalMarks(),
//       category: this.categoryId(),
//       isPublished: true
//     };

//     this.isSaving.set(true);

//     // 1. Save Test -> 2. Save Questions 
//     const request$ = this.mockTestId()
//       ? this.mockTestService.update(this.mockTestId()!, mockTestPayload)
//       : this.mockTestService.create(mockTestPayload).pipe(
//           switchMap((res: any) => {
//             const newId = res.data.mockTest._id;
            
//             // Map questions to include the mockTest ID for reference
//             const questionsWithRef = rawData.questions.map((q: any, index: number) => ({
//               ...q,
//               mockTest: newId,
//               order: index
//             }));
            
//             return this.mockTestService.addQuestions(newId, questionsWithRef);
//           })
//         );

//     request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
//       next: () => {
//         this.isSaving.set(false);
//         this.messageService.add({ severity: 'success', summary: 'Published', detail: 'Mock Test is now live and assigned.' });
//         setTimeout(() => this.router.navigate(['/instructor/mock-tests']), 1200);
//       },
//       error: (err: any) => {
//         this.isSaving.set(false);
//         this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Failed to publish mock test.' });
//       }
//     });
//   }

//    private loadCategories(): void {
//     this.categoryService.getAllCategory({ isActive: true })
//       .pipe(takeUntilDestroyed(this.destroyRef))
//       .subscribe({
//         next: (res: any) => this.categories.set(res.data?.data || res.data || []),
//         error: (error: any) => console.error('Failed to load categories', error)
//       });
//   }
// }