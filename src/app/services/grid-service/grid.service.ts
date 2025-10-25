import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class GridService {
  private gridChangedSource = new Subject<void>();
  gridChanged$ = this.gridChangedSource.asObservable();

  emitGridChanged() {
    this.gridChangedSource.next();
  }
}
