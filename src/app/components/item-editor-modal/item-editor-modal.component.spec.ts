import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ItemEditorModalComponent } from './item-editor-modal.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('ItemEditorModalComponent', () => {
  let component: ItemEditorModalComponent;
  let fixture: ComponentFixture<ItemEditorModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ItemEditorModalComponent, HttpClientTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(ItemEditorModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
