import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TopRatedCourses } from './top-rated-courses';

describe('TopRatedCourses', () => {
  let component: TopRatedCourses;
  let fixture: ComponentFixture<TopRatedCourses>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TopRatedCourses]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TopRatedCourses);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
