import { Component, OnInit, inject, DestroyRef, signal, effect, input, output } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe, NgClass } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

// PrimeNG Imports
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { CardModule } from 'primeng/card'; // <-- Added CardModule

import { CategoryService } from '../../../../core/services/category.service';

@Component({
  selector: 'app-category-detail',
  standalone: true,
  imports: [
    DatePipe,
    NgClass,
    ButtonModule,
    TagModule,
    CardModule // <-- Added to imports
  ],
  templateUrl: './category-detail.component.html',
  styleUrls: ['./category-detail.component.scss']
})
export class CategoryDetailComponent implements OnInit {
  categoryInput = input<any>(null, { alias: 'category' });
  edit = output<void>();
  close = output<void>();
  
  private categoryService = inject(CategoryService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  
  fullCategory = signal<any>(null);
  isLoading = signal<boolean>(false);
  isRouted = signal<boolean>(false);

  constructor() {
    effect(() => {
      const cat = this.categoryInput();
      if (cat?._id && !this.isRouted()) {
        this.loadFullDetails(cat._id);
      } else if (cat) {
        // Fallback to directly set data if API load isn't needed
        this.fullCategory.set(cat);
      }
    }, { allowSignalWrites: true });
  }

  ngOnInit(): void {
    const routeId = this.route.snapshot.paramMap.get('id');
    if (routeId) {
      this.isRouted.set(true);
      this.loadFullDetails(routeId);
    }
  }

  loadFullDetails(id: string): void {
    this.isLoading.set(true);
    this.categoryService.getCategoryById(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: any) => {
          // Adjust based on your API response structure (res.data.data)
          const payload = res?.data?.data || res?.data || this.categoryInput();
          this.fullCategory.set(payload);
          this.isLoading.set(false);
        },
        error: (error: any) => {
          console.error('Failed to load category details', error);
          this.fullCategory.set(this.categoryInput());
          this.isLoading.set(false);
        }
      });
  }

  onEdit(): void {
    if (this.isRouted()) { 
      this.router.navigate(['/categories/admin', this.fullCategory()._id, 'edit']);
    } else { 
      this.edit.emit();
    }
  }

  onClose(): void {
    if (this.isRouted()) { 
      this.goBack(); 
    } else { 
      this.close.emit(); 
    }
  }

  goBack(): void {
    this.router.navigate(['/categories/admin']);
  }
}

// import { Component, OnInit, inject, DestroyRef, signal, effect, input, output } from '@angular/core';
// import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
// import { DatePipe, NgClass } from '@angular/common';
// import { ActivatedRoute, Router } from '@angular/router';

// // PrimeNG Imports
// import { ButtonModule } from 'primeng/button';
// import { TagModule } from 'primeng/tag';

// import { CategoryService } from '../../../../core/services/category.service';

// @Component({
//   selector: 'app-category-detail',
//   standalone: true,
//   imports: [
//     DatePipe,

//     ButtonModule,
//     TagModule
//   ],
//   templateUrl: './category-detail.component.html',
//   styleUrls: ['./category-detail.component.scss']
// })
// export class CategoryDetailComponent implements OnInit {
//   categoryInput = input<any>(null, { alias: 'category' });
//   edit = output<void>();
//   close = output<void>();
//   private categoryService = inject(CategoryService);
//   private route = inject(ActivatedRoute);
//   private router = inject(Router);
//   private destroyRef = inject(DestroyRef);
//   fullCategory = signal<any>(null);
//   isLoading = signal<boolean>(false);
//   isRouted = signal<boolean>(false);
//   constructor() {
//     effect(() => {
//       const cat = this.categoryInput();
//       if (cat?._id && !this.isRouted()) {
//         this.loadFullDetails(cat._id);
//       }
//     }, { allowSignalWrites: true });
//   }

//   ngOnInit(): void {
//     const routeId = this.route.snapshot.paramMap.get('id');
//     if (routeId) {
//       this.isRouted.set(true);
//       this.loadFullDetails(routeId);
//     }
//   }

//   loadFullDetails(id: string): void {
//     this.isLoading.set(true);
//     this.categoryService.getCategoryById(id)
//       .pipe(takeUntilDestroyed(this.destroyRef))
//       .subscribe({
//         next: (res: any) => {
//           const payload = res?.data?.data || res?.data || this.categoryInput();
//           this.fullCategory.set(payload);
//           this.isLoading.set(false);
//         },
//         error: (error: any) => {
//           console.error('Failed to load category details', error);
//           this.fullCategory.set(this.categoryInput());
//           this.isLoading.set(false);
//         }
//       });
//   }

//   onEdit(): void {
//     if (this.isRouted()) { this.router.navigate(['/categories/admin', this.fullCategory()._id, 'edit']) }
//     else { this.edit.emit() }
//   }

//   onClose(): void {
//     if (this.isRouted()) { this.goBack(); }
//     else { this.close.emit(); }
//   }

//   goBack(): void {
//     this.router.navigate(['/categories/admin']);
//   }
// }
