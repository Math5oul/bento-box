import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BentoToolbarComponent } from './bento-toolbar.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('BentoToolbarComponent', () => {
  let component: BentoToolbarComponent;
  let fixture: ComponentFixture<BentoToolbarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BentoToolbarComponent, HttpClientTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(BentoToolbarComponent);
    component = fixture.componentInstance;
    component.options = {
      createFillers: false,
      cellWidth: 100,
      cellHeight: 100,
      gridGap: 10,
      maxCols: 6,
      maxWidth: 800,
      mode: 'autoFill',
    } as any;
    component.data = [] as any;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
