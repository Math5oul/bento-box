import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BentoToolbarComponent } from './bento-toolbar.component';

describe('BentoToolbarComponent', () => {
  let component: BentoToolbarComponent;
  let fixture: ComponentFixture<BentoToolbarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BentoToolbarComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(BentoToolbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
