import {
  Component,
  EventEmitter,
  Output,
  OnInit,
  OnDestroy,
  inject,
  Renderer2,
  ElementRef,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableService } from '../../services/table-service/table.service';
import { Table, TableStatus } from '../../interfaces/table.interface';
import { AuthService } from '../../services/auth-service/auth.service';
import { AdminOrdersComponent } from '../admin/admin-orders.component';

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
  selector: 'app-admin-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminOrdersComponent],
  templateUrl: './admin-panel.component.html',
  styleUrls: ['./admin-panel.component.scss'],
})
export class AdminPanelComponent implements OnInit, OnDestroy {
  @Output() close = new EventEmitter<void>();

  private renderer = inject(Renderer2);
  private elementRef = inject(ElementRef);
  tableService = inject(TableService);
  authService = inject(AuthService);
  cdr = inject(ChangeDetectorRef);

  tables: TableWithDetails[] = [];
  selectedTable: TableWithDetails | null = null;
  showReserveModal = false;
  showQRCode = false;
  showOrdersModal = false;
  showClientsModal = false;
  showDetailsModal = false;
  showCreateModal = false;
  qrCodeImage = '';

  newTableNumber = 1;
  newTable = {
    number: 1,
    capacity: 4,
  };

  reservation = {
    tableId: '',
    clientName: '',
    clientPhone: '',
    dateTime: '',
    notes: '',
  };

  activeTab: 'tables' | 'orders' | 'stats' | 'reservations' = 'tables';

  // Filtros
  filterStatus: TableStatus | 'all' = 'all';
  searchTerm = '';

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
      // Reset form
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

  viewTableDetails(table: TableWithDetails) {
    this.selectedTable = table;
    this.showDetailsModal = true;
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
      this.showDetailsModal = false;
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
        this.showDetailsModal = false;
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
        this.showDetailsModal = false;
        alert('Mesa liberada com sucesso!');
      } catch (error) {
        console.error('Erro ao liberar mesa:', error);
        alert('Erro ao liberar mesa.');
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
    this.activeTab = 'orders';
    this.cdr.detectChanges();
  }

  async viewTableClients(table: TableWithDetails) {
    try {
      // Buscar detalhes dos clientes da mesa
      // Por enquanto, mostrar IDs dos clientes
      this.selectedTable = {
        ...table,
        clientsDetails: [
          ...table.clients.map(id => ({
            id,
            name: `Cliente ${id.substring(0, 6)}`,
            isAnonymous: false,
          })),
          ...(table.anonymousClients || []).map(session => ({
            id: session.sessionId,
            name: 'Cliente Anônimo',
            isAnonymous: true,
          })),
        ],
      };
      this.showClientsModal = true;
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
    }
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

  openReserveModal(table: TableWithDetails) {
    this.reservation.tableId = table.id;
    this.showReserveModal = true;
  }

  async cancelReservation(table: TableWithDetails) {
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

  get filteredTables(): TableWithDetails[] {
    let filtered = this.tables;

    // Filtro por status
    if (this.filterStatus !== 'all') {
      filtered = filtered.filter(t => t.status === this.filterStatus);
    }

    // Filtro por busca
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(
        t =>
          t.number.toString().includes(term) ||
          t.status.toLowerCase().includes(term) ||
          t.capacity.toString().includes(term)
      );
    }

    return filtered;
  }

  get reservedTablesCount(): number {
    return this.tables.filter(t => t.status === TableStatus.RESERVED).length;
  }

  get reservedTables(): TableWithDetails[] {
    return this.tables.filter(t => t.status === TableStatus.RESERVED);
  }

  get availableTables(): TableWithDetails[] {
    return this.tables.filter(t => t.status === TableStatus.AVAILABLE);
  }

  get totalRevenue(): number {
    return this.tables.reduce((sum, table) => sum + (table.totalConsumption || 0), 0);
  }

  get averageConsumption(): number {
    const occupied = this.tables.filter(t => t.totalConsumption && t.totalConsumption > 0);
    if (occupied.length === 0) return 0;
    return this.totalRevenue / occupied.length;
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
