import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BentoBoxComponent } from './bento-box.component';

describe('BentoBoxComponent', () => {
  let component: BentoBoxComponent;
  let fixture: ComponentFixture<BentoBoxComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BentoBoxComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(BentoBoxComponent);
    component = fixture.componentInstance;
    component.data = [];
    component.fillers = [];
    component.options = {
      createFillers: false,
      cellWidth: 100,
      cellHeight: 100,
      gridGap: 8,
      maxCols: 4,
      maxWidth: 0,
      mode: 'autoFill',
    };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
