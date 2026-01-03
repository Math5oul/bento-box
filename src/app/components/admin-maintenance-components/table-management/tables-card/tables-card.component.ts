import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Table, TableStatus } from '../../../../interfaces';
import { TableService } from '../../../../services/table-service/table.service';
import { interval, Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { TableOrdersModalComponent } from '../table-orders-modal/table-orders-modal.component';
import { EditTableModalComponent } from '../../../shared/edit-table-modal/edit-table-modal.component';

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
  selector: 'app-tables-card',
  standalone: true,
  imports: [CommonModule, FormsModule, TableOrdersModalComponent, EditTableModalComponent],
  templateUrl: './tables-card.component.html',
  styleUrl: './tables-card.component.scss',
})
export class TablesCardComponent implements OnInit, OnDestroy {
  tableService = inject(TableService);

  tables: TableWithDetails[] = [];
  selectedTable: TableWithDetails | null = null;

  showCreateModal = false;
  showQRCode = false;
  qrCodeImage = '';

  // Modal de pedidos
  showOrdersModal = false;
  selectedTableOrders: any[] = [];
  selectedTableNumber: number = 0;

  // Modal de edição
  showEditModal = false;
  selectedTableForEdit: Table | null = null;

  // Polling para atualização em tempo real
  private pollingSubscription?: Subscription;
  private readonly POLLING_INTERVAL = 10000; // 10 segundos

  newTable = {
    number: 1,
    capacity: 4,
  };

  ngOnInit() {
    this.loadTables();
    this.startPolling();
  }

  ngOnDestroy() {
    this.stopPolling();
  }

  /**
   * Inicia polling automático para atualizar mesas a cada 10 segundos
   */
  private startPolling(): void {
    this.pollingSubscription = interval(this.POLLING_INTERVAL)
      .pipe(
        switchMap(() => {
          // Recarrega as mesas silenciosamente
          return new Promise<void>(resolve => {
            this.loadTables().then(() => resolve());
          });
        })
      )
      .subscribe();
  }

  /**
   * Para o polling quando o componente for destruído
   */
  private stopPolling(): void {
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
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

  async viewTableOrders(table: TableWithDetails) {
    console.log('🔍 Abrindo pedidos da mesa:', table.number, 'ID:', table.id);
    console.log('📊 CurrentOrders:', table.currentOrders);
    this.selectedTableNumber = table.number;

    // Verifica se há pedidos antes de fazer a requisição
    if (!table.currentOrders || table.currentOrders.length === 0) {
      console.log('⚠️ Mesa sem pedidos ativos');
      alert('Esta mesa não possui pedidos ativos no momento.');
      return;
    }

    // Busca os pedidos da mesa no backend
    try {
      console.log('📡 Buscando pedidos da API...');
      const orders = await this.tableService.getTableOrders(table.id);
      console.log('✅ Pedidos recebidos:', orders);

      if (!orders || orders.length === 0) {
        console.log('⚠️ Nenhum pedido retornado pela API');
        alert('Não foi possível carregar os pedidos da mesa.');
        return;
      }

      this.selectedTableOrders = orders;
      this.showOrdersModal = true;
      console.log('🎯 Modal deve abrir agora. showOrdersModal:', this.showOrdersModal);
      console.log('📋 Pedidos para o modal:', this.selectedTableOrders);
    } catch (error) {
      console.error('❌ Erro ao buscar pedidos da mesa:', error);
      alert('Erro ao carregar pedidos da mesa. Verifique o console para mais detalhes.');
    }
  }

  closeOrdersModal() {
    this.showOrdersModal = false;
    this.selectedTableOrders = [];
    this.selectedTableNumber = 0;
  }

  /**
   * Abre modal de edição de mesa
   */
  openEditModal(table: Table) {
    console.log('🔧 Abrindo modal de edição da mesa:', table);
    this.selectedTableForEdit = table;
    this.showEditModal = true;
    console.log('🔧 showEditModal:', this.showEditModal);
    console.log('🔧 selectedTableForEdit:', this.selectedTableForEdit);
  }

  /**
   * Fecha modal de edição
   */
  /**
   * Fecha modal de criação ou edição
   */
  closeCreateOrEditModal() {
    this.showCreateModal = false;
    this.showEditModal = false;
    this.selectedTableForEdit = null;
  }

  /**
   * Fecha modal de edição
   */
  closeEditModal() {
    this.closeCreateOrEditModal();
  }

  /**
   * Salva alterações na mesa (criar ou editar)
   */
  async handleSaveTable(data: { id?: string; number: number; name?: string; capacity: number }) {
    try {
      // Se tem ID, é edição; se não tem, é criação
      if (data.id) {
        // Edição
        await this.tableService.updateTable(data.id, {
          number: data.number,
          name: data.name,
          capacity: data.capacity,
        });
        alert('Mesa atualizada com sucesso!');
      } else {
        // Criação
        await this.tableService.createTable({
          number: data.number,
          name: data.name,
          capacity: data.capacity,
        });
        alert('Mesa criada com sucesso!');
      }
      await this.loadTables();
      this.closeCreateOrEditModal();
    } catch (error: any) {
      console.error('Erro ao salvar mesa:', error);
      alert('Erro ao salvar mesa: ' + (error.error?.message || 'Verifique se o número já existe.'));
    }
  }

  /**
   * Retorna a quantidade de clientes (usuários + anônimos) na mesa
   */
  getClientCount(table: TableWithDetails): number {
    // Conta clientes registrados
    const registeredClients = table.clients?.length || 0;

    // Conta clientes anônimos
    const anonymousClients = table.anonymousClients?.length || 0;

    // Retorna o total
    return registeredClients + anonymousClients;
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
