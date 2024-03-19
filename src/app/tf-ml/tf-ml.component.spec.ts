import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TfMlComponent } from './tf-ml.component';

describe('TfMlComponent', () => {
  let component: TfMlComponent;
  let fixture: ComponentFixture<TfMlComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [TfMlComponent]
    });
    fixture = TestBed.createComponent(TfMlComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
