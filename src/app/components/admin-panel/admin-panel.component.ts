import {
  Component,
  EventEmitter,
  Output,
  OnInit,
  OnDestroy,
  inject,
  Renderer2,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableService } from '../../services/table-service/table.service';
import { Table, TableStatus } from '../../interfaces/table.interface';

@Component({
  selector: 'app-admin-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-panel.component.html',
  styleUrls: ['./admin-panel.component.scss'],
})
export class AdminPanelComponent implements OnInit, OnDestroy {
  @Output() close = new EventEmitter<void>();

  private renderer = inject(Renderer2);
  private elementRef = inject(ElementRef);
  tableService = inject(TableService);

  tables: Table[] = [];
  selectedTable: Table | null = null;
  showCreateModal = false;
  showQRCode = false;
  qrCodeImage = '';

  newTable = {
    number: 1,
    capacity: 4,
  };

  activeTab: 'tables' | 'orders' | 'stats' = 'tables';

  ngOnInit() {
    // Move o elemento para o body ao inicializar
    this.renderer.appendChild(document.body, this.elementRef.nativeElement);
    this.loadTables();
  }

  ngOnDestroy() {
    // Remove o elemento do body ao destruir
    if (this.elementRef.nativeElement.parentNode === document.body) {
      this.renderer.removeChild(document.body, this.elementRef.nativeElement);
    }
  }

  async loadTables() {
    await this.tableService.loadTables();
    this.tableService.tables$.subscribe(tables => {
      this.tables = tables;
    });
  }

  async createTable() {
    try {
      await this.tableService.createTable(this.newTable);
      this.showCreateModal = false;
      this.newTable = { number: 1, capacity: 4 };
    } catch (error) {
      console.error('Erro ao criar mesa:', error);
      alert('Erro ao criar mesa. Verifique se o número já existe.');
    }
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
    } catch (error) {
      console.error('Erro ao abrir mesa:', error);
    }
  }

  async closeTable(table: Table) {
    if (confirm(`Deseja fechar a mesa ${table.number}?`)) {
      try {
        await this.tableService.closeTable(table.id);
      } catch (error) {
        console.error('Erro ao fechar mesa:', error);
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

  async viewTableOrders(table: Table) {
    try {
      const orders = await this.tableService.getTableOrders(table.id);
      this.selectedTable = { ...table, currentOrders: orders.map(o => o._id) };
      // TODO: Mostrar modal com pedidos
      console.log('Pedidos da mesa:', orders);
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error);
    }
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

  get occupiedTablesCount(): number {
    return this.tables.filter(t => t.status === TableStatus.OCCUPIED).length;
  }

  get availableTablesCount(): number {
    return this.tables.filter(t => t.status === TableStatus.AVAILABLE).length;
  }

  closePanel() {
    this.close.emit();
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
              img { max-width: 400px; }
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
