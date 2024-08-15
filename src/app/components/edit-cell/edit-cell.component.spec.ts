import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditCellComponent } from './edit-cell.component';

describe('EditCellComponent', () => {
  let component: EditCellComponent;
  let fixture: ComponentFixture<EditCellComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditCellComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditCellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
