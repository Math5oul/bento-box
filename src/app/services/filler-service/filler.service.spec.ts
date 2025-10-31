import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FillerService } from './filler.service';

describe('FillerService', () => {
  let service: FillerService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [FillerService],
    });
    service = TestBed.inject(FillerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
