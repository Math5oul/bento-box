import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TestHubComponent } from './test-hub.component';

describe('TestHubComponent', () => {
  let component: TestHubComponent;
  let fixture: ComponentFixture<TestHubComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHubComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHubComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
