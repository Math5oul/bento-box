import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SimpleProductComponent } from './simple-product.component';

describe('SimpleProductComponent', () => {
  let component: SimpleProductComponent;
  let fixture: ComponentFixture<SimpleProductComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SimpleProductComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SimpleProductComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
