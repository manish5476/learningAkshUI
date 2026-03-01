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
import { MessageService } from 'primeng/api';

// Services
import { MockTestService } from '../../../core/services/mock-test.service';

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
    ToastModule
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
  private mockTestService = inject(MockTestService); // <-- Injected the real service
  private destroyRef = inject(DestroyRef);

  // State
  mockTestId = signal<string | null>(null);
  categoryId = signal<string | null>(null); // Assuming tests belong to categories in your app
  isLoading = signal<boolean>(false);
  isSaving = signal<boolean>(false);

  levels = [
    {label: 'Beginner', value: 'beginner'}, 
    {label: 'Intermediate', value: 'intermediate'}, 
    {label: 'Advanced', value: 'advanced'}
  ];
  
  testForm: FormGroup = this.fb.group({
    title: ['', Validators.required],
    description: [''],
    level: ['beginner', Validators.required],
    duration: [60, Validators.required], // Minutes
    passingMarks: [50, Validators.required],
    isFree: [false],
    price: [0],
    questions: this.fb.array([])
  });

  ngOnInit() { 
    this.route.params.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      if (params['id'] && params['id'] !== 'new') {
        this.mockTestId.set(params['id']);
        this.loadMockTest(params['id']);
      } else {
        // We need a category ID to create a mock test according to your schema!
        // For now, we assume it's passed via query params, e.g. /mock-tests/new?categoryId=123
        this.route.queryParams.subscribe(qParams => {
          if (qParams['categoryId']) this.categoryId.set(qParams['categoryId']);
        });
        this.addQuestion();
      }
    });

    // Handle price clearing if "isFree" is checked
    this.testForm.get('isFree')?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(isFree => {
      if (isFree) {
        this.testForm.get('price')?.setValue(0);
        this.testForm.get('price')?.disable();
      } else {
        this.testForm.get('price')?.enable();
      }
    });
  }

  // --- Form Array Getters ---
  get questions(): FormArray { return this.testForm.get('questions') as FormArray; }
  getOptions(qIndex: number): FormArray { return this.questions.at(qIndex).get('options') as FormArray; }

  // --- Mutators ---
  addQuestion() {
    this.questions.push(this.fb.group({
      sectionName: ['General', Validators.required], 
      question: ['', Validators.required],
      marks: [1, Validators.required],
      negativeMarks: [0], 
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
    if (checked) {
      this.getOptions(qIndex).controls.forEach((ctrl, idx) => {
        if (idx !== optIndex) ctrl.get('isCorrect')?.setValue(false, { emitEvent: false });
      });
    }
  }

  // --- API Integrations ---
  private loadMockTest(id: string): void {
    this.isLoading.set(true);
    // Since your backend getMockTest doesn't seem to populate questions automatically by default in the standard route, 
    // you might need a dedicated endpoint to fetch a mock test WITH its questions for editing.
    // Assuming getById does this for now:
    this.mockTestService.getById(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: any) => {
          const test = res.data?.mockTest || res.data;
          this.testForm.patchValue({
            title: test.title,
            description: test.description,
            level: test.level,
            duration: test.duration,
            passingMarks: test.passingMarks,
            isFree: test.isFree,
            price: test.price
          });
          // Note: Patching existing questions array logic omitted for brevity (similar to Quiz Builder)
          this.isLoading.set(false);
        },
        error: () => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Could not load Mock Test.' });
          this.isLoading.set(false);
        }
      });
  }

  saveMockTest() {
    // 1. Validation
    if (this.testForm.invalid) {
      this.testForm.markAllAsTouched();
      this.messageService.add({ severity: 'warn', summary: 'Incomplete', detail: 'Please fill out all required fields.' });
      return;
    }

    const rawData = this.testForm.getRawValue();

    // Validate correct options are selected
    for (let i = 0; i < rawData.questions.length; i++) {
      const hasCorrect = rawData.questions[i].options.some((opt: any) => opt.isCorrect);
      if (!hasCorrect) {
        this.messageService.add({ severity: 'error', summary: 'Validation Error', detail: `Question ${i + 1} must have a correct option.` });
        return;
      }
    }

    // Note: your backend schema requires a category ID to create a Mock Test. 
    // If you don't have one selected, we mock one for safety, but in production, ensure the user selects a category!
    const fallbackCategoryId = '60d5ecb8b392d700153ef2c1'; // Replace with a real category ID in your DB

    this.isSaving.set(true);

    const baseTestPayload = {
      title: rawData.title,
      description: rawData.description,
      level: rawData.level,
      duration: rawData.duration,
      passingMarks: rawData.passingMarks,
      isFree: rawData.isFree,
      price: rawData.price,
      category: this.categoryId() || fallbackCategoryId,
      isPublished: true // Auto-publish for now
    };

    // 2. Chained API Call
   const request$ = this.mockTestId()
  ? this.mockTestService.update(this.mockTestId()!, baseTestPayload)
  : this.mockTestService.create(baseTestPayload).pipe(
      switchMap((res: any) => {
        const newTestId = res.data.mockTest._id;
        this.mockTestId.set(newTestId);
        return this.mockTestService.addQuestions(newTestId, rawData.questions);
      })
    );

    request$.pipe(takeUntilDestroyed()).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.messageService.add({ severity: 'success', summary: 'Saved!', detail: 'Mock Test has been published.' });
        
        // Redirect to the dashboard we are about to build!
        setTimeout(() => this.router.navigate(['/instructor/mock-tests']), 1500);
      },
      error: (err: any) => {
        this.isSaving.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Failed to save.' });
      }
    });
  }
}
// import { Component, OnInit, inject, signal } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
// import { ButtonModule } from 'primeng/button';
// import { InputTextModule } from 'primeng/inputtext';
// import { InputNumberModule } from 'primeng/inputnumber';
// import { TextareaModule } from 'primeng/textarea';
// import { CheckboxModule } from 'primeng/checkbox';
// import { SelectModule } from 'primeng/select';
// // import { MockTestService } from '../../../core/services/mock-test.service';

// @Component({
//   selector: 'app-mock-test-builder',
//   standalone: true,
//   imports: [CommonModule, ReactiveFormsModule, ButtonModule, InputTextModule, InputNumberModule, TextareaModule, CheckboxModule, SelectModule],
//   templateUrl: './mock-test-builder.component.html',
//   styleUrls: ['./mock-test-builder.component.scss']
// })
// export class MockTestBuilderComponent implements OnInit {
//   private fb = inject(FormBuilder);

//   levels = [{label: 'Beginner', value: 'beginner'}, {label: 'Intermediate', value: 'intermediate'}, {label: 'Advanced', value: 'advanced'}];
  
//   testForm: FormGroup = this.fb.group({
//     title: ['', Validators.required],
//     description: [''],
//     level: ['beginner', Validators.required],
//     duration: [60, Validators.required], // Minutes
//     passingMarks: [50, Validators.required],
//     isFree: [false],
//     price: [0],
//     questions: this.fb.array([])
//   });

//   ngOnInit() { this.addQuestion(); }

//   get questions(): FormArray { return this.testForm.get('questions') as FormArray; }
//   getOptions(qIndex: number): FormArray { return this.questions.at(qIndex).get('options') as FormArray; }

//   addQuestion() {
//     this.questions.push(this.fb.group({
//       sectionName: ['General', Validators.required], // Grouping capability for Mock Tests
//       question: ['', Validators.required],
//       marks: [1, Validators.required],
//       negativeMarks: [0], // Specific to mock tests!
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
//     if (checked) {
//       this.getOptions(qIndex).controls.forEach((ctrl, idx) => {
//         if (idx !== optIndex) ctrl.get('isCorrect')?.setValue(false, { emitEvent: false });
//       });
//     }
//   }

//   saveMockTest() {
//     console.log(this.testForm.getRawValue());
//     // MOCK: this.mockTestService.create(this.testForm.value).subscribe(...)
//   }
// }