import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ItemEditorModalComponent } from './item-editor-modal.component';

describe('ItemEditorModalComponent', () => {
  let component: ItemEditorModalComponent;
  let fixture: ComponentFixture<ItemEditorModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ItemEditorModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ItemEditorModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
