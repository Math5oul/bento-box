import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewItemModalComponent } from './new-item-modal.component';

describe('NewItemModalComponent', () => {
  let component: NewItemModalComponent;
  let fixture: ComponentFixture<NewItemModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewItemModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NewItemModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
