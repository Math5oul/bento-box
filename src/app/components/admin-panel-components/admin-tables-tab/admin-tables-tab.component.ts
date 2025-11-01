import { Component, OnInit, inject, Output, EventEmitter } from '@angular/core';
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

interface TableWithDetails extends Table {
  clientsDetails?: Array<{
    id: string;
    name: string;
    email?: string;
    isAnonymous: boolean;
  }>;
  ordersDetails?: Array<{
    id: string;
    clientName: string;
    items: Array<{ name: string; quantity: number; price: number }>;
    total: number;
    status: string;
    createdAt: Date;
  }>;
  reservationInfo?: ReservationInfo;
}

@Component({
  selector: 'app-admin-tables-tab',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-tables-tab.component.html',
  styleUrl: './admin-tables-tab.component.scss',
})
export class AdminTablesTabComponent implements OnInit {
  @Output() viewOrders = new EventEmitter<number>();

  tableService = inject(TableService);

  tables: TableWithDetails[] = [];
  selectedTable: TableWithDetails | null = null;

  showCreateModal = false;
  showQRCode = false;
  qrCodeImage = '';

  newTable = {
    number: 1,
    capacity: 4,
  };

  ngOnInit() {
    this.loadTables();
  }

  async loadTables() {
    await this.tableService.loadTables();
    this.tableService.tables$.subscribe(tables => {
      this.tables = tables as TableWithDetails[];
    });
  }

  async createTable() {
    try {
      await this.tableService.createTable({
        number: this.newTable.number,
        capacity: this.newTable.capacity,
      });
      this.showCreateModal = false;
      this.newTable = {
        number: this.getNextTableNumber(),
        capacity: 4,
      };
    } catch (error) {
      console.error('Erro ao criar mesa:', error);
      alert('Erro ao criar mesa. Verifique se o número já existe.');
    }
  }

  getNextTableNumber(): number {
    if (this.tables.length === 0) return 1;
    const maxNumber = Math.max(...this.tables.map(t => t.number));
    return maxNumber + 1;
  }

  async deleteTable(table: Table) {
    if (confirm(`Deseja realmente excluir a mesa ${table.number}?`)) {
      try {
        await this.tableService.deleteTable(table.id);
      } catch (error) {
        console.error('Erro ao excluir mesa:', error);
        alert('Erro ao excluir mesa.');
      }
    }
  }

  async openTable(table: Table) {
    try {
      await this.tableService.openTable(table.id);
      await this.loadTables();
      alert('Mesa aberta com sucesso!');
    } catch (error) {
      console.error('Erro ao abrir mesa:', error);
      alert('Erro ao abrir mesa.');
    }
  }

  async closeTable(table: Table) {
    if (confirm(`Deseja fechar a mesa ${table.number}?`)) {
      try {
        await this.tableService.closeTable(table.id);
        await this.loadTables();
        alert(
          'Mesa fechada com sucesso! Clique em "Liberar Mesa" quando estiver pronta para uso novamente.'
        );
      } catch (error) {
        console.error('Erro ao fechar mesa:', error);
        alert('Erro ao fechar mesa.');
      }
    }
  }

  async clearTable(table: Table) {
    if (confirm(`Deseja liberar a mesa ${table.number}? Isso irá limpar todos os dados.`)) {
      try {
        await this.tableService.clearTable(table.id);
        await this.loadTables();
        alert('Mesa liberada com sucesso!');
      } catch (error) {
        console.error('Erro ao liberar mesa:', error);
        alert('Erro ao liberar mesa.');
      }
    }
  }

  async confirmReservation(table: TableWithDetails) {
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

  async showTableQRCode(table: Table) {
    try {
      this.qrCodeImage = await this.tableService.generateQRCode(table.id);
      this.selectedTable = table;
      this.showQRCode = true;
    } catch (error) {
      console.error('Erro ao gerar QR Code:', error);
    }
  }

  viewTableOrders(table: TableWithDetails) {
    // Emite evento para o componente pai abrir a aba de pedidos
    this.viewOrders.emit(table.number);
  }

  getStatusColor(status: TableStatus): string {
    switch (status) {
      case TableStatus.AVAILABLE:
        return '#4caf50';
      case TableStatus.OCCUPIED:
        return '#ff9800';
      case TableStatus.RESERVED:
        return '#2196f3';
      case TableStatus.CLOSED:
        return '#f44336';
      default:
        return '#999';
    }
  }

  getStatusLabel(status: TableStatus): string {
    switch (status) {
      case TableStatus.AVAILABLE:
        return 'Disponível';
      case TableStatus.OCCUPIED:
        return 'Ocupada';
      case TableStatus.RESERVED:
        return 'Reservada';
      case TableStatus.CLOSED:
        return 'Fechada';
      default:
        return 'Desconhecido';
    }
  }

  downloadQRCode() {
    if (!this.qrCodeImage || !this.selectedTable) return;

    const link = document.createElement('a');
    link.download = `mesa-${this.selectedTable.number}-qrcode.png`;
    link.href = this.qrCodeImage;
    link.click();
  }

  printQRCode() {
    if (!this.qrCodeImage) return;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Mesa ${this.selectedTable?.number} - QR Code</title>
            <style>
              body {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 100vh;
                margin: 0;
                font-family: Arial, sans-serif;
              }
              h1 { margin-bottom: 2rem; }
            </style>
          </head>
          <body>
            <h1>Mesa ${this.selectedTable?.number}</h1>
            <img src="${this.qrCodeImage}" />
            <p>Escaneie para fazer pedidos</p>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  }
}
