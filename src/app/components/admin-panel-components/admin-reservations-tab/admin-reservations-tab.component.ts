import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Table, TableStatus } from '../../../interfaces';
import { TableService } from '../../../services/table-service/table.service';

interface ReservationInfo {
  clientName: string;
  clientPhone: string;
  dateTime: Date | string;
  notes?: string;
  createdAt?: Date;
  createdBy?: string;
}

interface TableWithReservation extends Table {
  reservationInfo?: ReservationInfo;
}

@Component({
  selector: 'app-admin-reservations-tab',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-reservations-tab.component.html',
  styleUrl: './admin-reservations-tab.component.scss',
})
export class AdminReservationsTabComponent implements OnInit {
  tableService = inject(TableService);

  tables: TableWithReservation[] = [];
  showReserveModal = false;

  reservation = {
    tableId: '',
    clientName: '',
    clientPhone: '',
    dateTime: '',
    notes: '',
  };

  /**
   * Formats a phone number as (00) 00000-0000
   */
  maskPhone(value: string): string {
    // Remove all non-digit characters
    value = value.replace(/\D/g, '');
    // Apply mask: (00) 00000-0000
    if (value.length > 11) value = value.slice(0, 11);
    if (value.length > 6) {
      return `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7)}`;
    } else if (value.length > 2) {
      return `(${value.slice(0, 2)}) ${value.slice(2)}`;
    } else if (value.length > 0) {
      return `(${value}`;
    }
    return '';
  }

  ngOnInit() {
    this.loadTables();
  }

  async loadTables() {
    await this.tableService.loadTables();
    this.tableService.tables$.subscribe(tables => {
      this.tables = tables as TableWithReservation[];
    });
  }

  get reservedTables(): TableWithReservation[] {
    return this.tables.filter(t => t.status === TableStatus.RESERVED);
  }

  get availableTables(): TableWithReservation[] {
    return this.tables.filter(t => t.status === TableStatus.AVAILABLE);
  }

  async reserveTable() {
    try {
      if (
        !this.reservation.tableId ||
        !this.reservation.clientName ||
        !this.reservation.clientPhone ||
        !this.reservation.dateTime
      ) {
        alert('Por favor, preencha todos os campos obrigatórios.');
        return;
      }

      await this.tableService.reserveTable(this.reservation.tableId, {
        clientName: this.reservation.clientName,
        clientPhone: this.reservation.clientPhone,
        dateTime: this.reservation.dateTime,
        notes: this.reservation.notes,
      });

      this.showReserveModal = false;
      this.reservation = {
        tableId: '',
        clientName: '',
        clientPhone: '',
        dateTime: '',
        notes: '',
      };
      alert('Reserva criada com sucesso!');
      await this.loadTables();
    } catch (error) {
      console.error('Erro ao criar reserva:', error);
      alert('Erro ao criar reserva.');
    }
  }

  async cancelReservation(table: TableWithReservation) {
    if (confirm(`Deseja cancelar a reserva da mesa ${table.number}?`)) {
      try {
        await this.tableService.clearTable(table.id);
        await this.loadTables();
        alert('Reserva cancelada com sucesso!');
      } catch (error) {
        console.error('Erro ao cancelar reserva:', error);
        alert('Erro ao cancelar reserva.');
      }
    }
  }

  async confirmReservation(table: TableWithReservation) {
    if (confirm(`Confirmar chegada do cliente da mesa ${table.number}?`)) {
      try {
        await this.tableService.openTable(table.id);
        await this.loadTables();
        alert('Mesa aberta com sucesso!');
      } catch (error) {
        console.error('Erro ao confirmar reserva:', error);
        alert('Erro ao confirmar reserva.');
      }
    }
  }

  viewTableDetails(table: TableWithReservation) {
    console.log('Ver detalhes da mesa', table);
  }
}
