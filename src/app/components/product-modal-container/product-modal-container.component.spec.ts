import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductModalContainerComponent } from './product-modal-container.component';

describe('ProductModalContainerComponent', () => {
  let component: ProductModalContainerComponent;
  let fixture: ComponentFixture<ProductModalContainerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductModalContainerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductModalContainerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
