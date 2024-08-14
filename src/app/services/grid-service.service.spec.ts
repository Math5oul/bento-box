import { TestBed } from '@angular/core/testing';

import { GridServiceService } from './grid-service.service';

describe('GridServiceService', () => {
  let service: GridServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GridServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
