import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BentoModuleComponent } from './bento-module.component';

describe('BentoModuleComponent', () => {
  let component: BentoModuleComponent;
  let fixture: ComponentFixture<BentoModuleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BentoModuleComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BentoModuleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
