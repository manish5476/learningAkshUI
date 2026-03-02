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
  private mockTestService = inject(MockTestService);
  private destroyRef = inject(DestroyRef);

  // State
  mockTestId = signal<string | null>(null);
  categoryId = signal<string | null>(null);
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
    duration: [60, Validators.required],
    passingMarks: [50, Validators.required],
    isFree: [false],
    price: [{value: 0, disabled: false}], // Initialize properly based on isFree
    questions: this.fb.array([])
  });

  ngOnInit() { 
    this.route.params.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      if (params['id'] && params['id'] !== 'new') {
        this.mockTestId.set(params['id']);
        this.loadMockTest(params['id']);
      } else {
        this.route.queryParams.subscribe(qParams => {
          if (qParams['categoryId']) this.categoryId.set(qParams['categoryId']);
        });
        this.addQuestion(); // Start with one question
      }
    });

    // Handle price clearing if "isFree" is checked
    this.testForm.get('isFree')?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(isFree => {
      const priceControl = this.testForm.get('price');
      if (isFree) {
        priceControl?.setValue(0);
        priceControl?.disable();
      } else {
        priceControl?.enable();
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
  const options = this.getOptions(qIndex);
  
  if (checked) {
    // Manually uncheck all other options in this question
    options.controls.forEach((ctrl, idx) => {
      if (idx !== optIndex) {
        ctrl.get('isCorrect')?.setValue(false);
      }
    });
  } else {}
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
            duration: test.duration,
            passingMarks: test.passingMarks,
            isFree: test.isFree,
            price: test.price
          });
          this.isLoading.set(false);
        },
        error: () => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Could not load Mock Test.' });
          this.isLoading.set(false);
        }
      });
  }

  // Calculate live total marks for the UI
  calculateTotalMarks(): number {
    const questions = this.testForm.get('questions')?.value || [];
    return questions.reduce((acc: number, q: any) => acc + (q.marks || 0), 0);
  }

  saveMockTest() {
    if (this.testForm.invalid) {
      this.messageService.add({ severity: 'warn', summary: 'Missing Info', detail: 'Please check your form fields.' });
      return;
    }

    const rawData = this.testForm.getRawValue();
    
    // Construct payload strictly matching your provided Mongoose Schema
    const mockTestPayload = {
      title: rawData.title,
      description: rawData.description,
      level: rawData.level,
      duration: rawData.duration,
      passingMarks: rawData.passingMarks,
      isFree: rawData.isFree,
      price: rawData.price,
      totalQuestions: rawData.questions.length,
      totalMarks: this.calculateTotalMarks(),
      category: this.categoryId(), // Should come from queryParams
      isPublished: true
    };

    this.isSaving.set(true);

    // 1. Save Test -> 2. Save Questions (As per your Schema split)
    const request$ = this.mockTestId()
      ? this.mockTestService.update(this.mockTestId()!, mockTestPayload)
      : this.mockTestService.create(mockTestPayload).pipe(
          switchMap((res: any) => {
            const newId = res.data.mockTest._id;
            // Map questions to include the mockTest ID for reference
            const questionsWithRef = rawData.questions.map((q: any, index: number) => ({
              ...q,
              mockTest: newId,
              order: index
            }));
            return this.mockTestService.addQuestions(newId, questionsWithRef);
          })
        );

    request$.subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Published', detail: 'Mock Test is now live.' });
        setTimeout(() => this.router.navigate(['/instructor/mock-tests']), 1200);
      },
      error: () => this.isSaving.set(false)
    });
  }
}
