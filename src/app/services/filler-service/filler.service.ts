import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
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

  /**
   * Busca todos os fillers ativos
   */
  getFillers(): Observable<Filler[]> {
    return this.http.get<Filler[]>(this.apiUrl);
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
    return this.http.post<Filler>(this.apiUrl, filler);
  }

  /**
   * Atualiza um filler existente
   */
  updateFiller(id: string, filler: Partial<Filler>): Observable<Filler> {
    return this.http.put<Filler>(`${this.apiUrl}/${id}`, filler);
  }

  /**
   * Remove (soft delete) um filler
   */
  deleteFiller(id: string): Observable<{ message: string; filler: Filler }> {
    return this.http.delete<{ message: string; filler: Filler }>(`${this.apiUrl}/${id}`);
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
    return this.http.patch<Filler[]>(`${this.apiUrl}/batch/positions`, {
      updates,
    });
  }
}
