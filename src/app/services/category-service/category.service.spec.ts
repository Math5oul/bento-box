import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { CategoryService } from './category.service';
import { environment } from '../../../environments/environment';

describe('CategoryService', () => {
  let service: CategoryService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiUrl}/categories`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [CategoryService],
    });

    service = TestBed.inject(CategoryService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getCurrentCategories should return initial empty array', () => {
    expect(service.getCurrentCategories()).toEqual([]);
  });

  it('getCategories should fetch and update categories$', done => {
    const mockResponse = { success: true, data: [{ id: '1', name: 'Test' }], count: 1 } as any;

    service.getCategories().subscribe(response => {
      expect(response).toEqual(mockResponse);
      // allow some microtask for tap to update subject
      setTimeout(() => {
        expect(service.getCurrentCategories().length).toBe(1);
        done();
      }, 0);
    });

    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });
});
