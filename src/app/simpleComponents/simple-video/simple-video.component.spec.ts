import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SimpleVideoComponent } from './simple-video.component';

describe('SimpleVideoComponent', () => {
  let component: SimpleVideoComponent;
  let fixture: ComponentFixture<SimpleVideoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SimpleVideoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SimpleVideoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
