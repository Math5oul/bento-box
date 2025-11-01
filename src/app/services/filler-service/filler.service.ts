import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { catchError, take, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Filler } from '../../interfaces/filler.interface';

/**
 * Serviço para gerenciar Fillers
 */
@Injectable({
  providedIn: 'root',
})
export class FillerService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/fillers`;
  private fillersSubject = new BehaviorSubject<Filler[]>([]);

  constructor() {
    // Carrega fillers ao iniciar o serviço (similar ao StorageService)
    this.loadFromServer();
  }

  private loadFromServer(): void {
    this.http
      .get<Filler[]>(this.apiUrl)
      .pipe(
        catchError(error => {
          console.error('Error loading fillers from server:', error);
          return of([] as Filler[]);
        }),
        take(1)
      )
      .subscribe(items => {
        this.fillersSubject.next(items || []);
      });
  }

  /**
   * Retorna um stream dos fillers (cacheado). Para obter apenas uma vez,
   * use `.pipe(take(1))` no consumidor — compatível com forkJoin.
   */
  getFillers(): Observable<Filler[]> {
    return this.fillersSubject.asObservable();
  }

  /**
   * Força o recarregamento dos fillers do servidor
   */
  refreshFillers(): void {
    this.loadFromServer();
  }

  /**
   * Busca um filler específico por ID
   */
  getFiller(id: string): Observable<Filler> {
    return this.http.get<Filler>(`${this.apiUrl}/${id}`);
  }

  /**
   * Cria um novo filler
   */
  createFiller(filler: Partial<Filler>): Observable<Filler> {
    return this.http.post<Filler>(this.apiUrl, filler).pipe(tap(() => this.loadFromServer()));
  }

  /**
   * Atualiza um filler existente
   */
  updateFiller(id: string, filler: Partial<Filler>): Observable<Filler> {
    return this.http
      .put<Filler>(`${this.apiUrl}/${id}`, filler)
      .pipe(tap(() => this.loadFromServer()));
  }

  /**
   * Remove um filler
   */
  deleteFiller(id: string): Observable<{ message: string; filler: Filler }> {
    return this.http
      .delete<{ message: string; filler: Filler }>(`${this.apiUrl}/${id}`)
      .pipe(tap(() => this.loadFromServer()));
  }

  /**
   * Atualiza apenas a posição de um filler no grid
   */
  updateFillerPosition(
    id: string,
    gridPosition: {
      row: number;
      col: number;
      rowSpan: number;
      colSpan: number;
    }
  ): Observable<Filler> {
    return this.http.patch<Filler>(`${this.apiUrl}/${id}/position`, {
      gridPosition,
    });
  }

  /**
   * Atualiza posições de múltiplos fillers de uma vez
   */
  updateBatchPositions(
    updates: Array<{
      id: string;
      gridPosition: { row: number; col: number; rowSpan: number; colSpan: number };
    }>
  ): Observable<Filler[]> {
    return this.http
      .patch<Filler[]>(`${this.apiUrl}/batch/positions`, {
        updates,
      })
      .pipe(tap(() => this.loadFromServer()));
  }
}
