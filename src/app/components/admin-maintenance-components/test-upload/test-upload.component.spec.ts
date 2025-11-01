import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TestUploadComponent } from './test-upload.component';

describe('TestUploadComponent', () => {
  let component: TestUploadComponent;
  let fixture: ComponentFixture<TestUploadComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestUploadComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestUploadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('deve criar o componente', () => {
    expect(component).toBeTruthy();
  });
});
