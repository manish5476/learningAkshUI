import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StudentEnrollments } from './student-enrollments';

describe('StudentEnrollments', () => {
  let component: StudentEnrollments;
  let fixture: ComponentFixture<StudentEnrollments>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StudentEnrollments]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StudentEnrollments);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
