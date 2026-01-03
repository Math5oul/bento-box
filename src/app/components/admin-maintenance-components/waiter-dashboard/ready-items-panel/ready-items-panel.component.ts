import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

interface ReadyViewItem {
  orderId: string;
  tableNumber: string;
  clientName?: string;
  item: {
    productName: string;
    quantity: number;
  };
  itemIndex: number;
}

interface Table {
  id?: string;
  number: number;
  name?: string;
  capacity?: number;
  status?: string;
}

@Component({
  selector: 'app-ready-items-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ready-items-panel.component.html',
  styleUrls: ['./ready-items-panel.component.scss'],
})
export class ReadyItemsPanelComponent {
  @Input() readyViewItems: ReadyViewItem[] = [];
  @Input() canDeliverOrders: boolean = false;
  @Input() tablesMap: Map<string, Table> = new Map();

  @Output() deliverItem = new EventEmitter<{ orderId: string; item: any }>();

  getTableDisplayName(table: string): string {
    // Verificar explicitamente por null, undefined ou string vazia
    // NÃO usar !table porque 0 é falsy mas é um número de mesa válido!
    if (table === null || table === undefined || table === '') {
      return 'Desconhecida';
    }

    const tableStr = String(table);

    // Buscar informações da mesa no mapa
    const tableInfo = this.tablesMap.get(tableStr);

    if (tableInfo?.name) {
      return tableInfo.name;
    }

    // Verificar se é formato antigo "custom-nome"
    if (tableStr.startsWith('custom-')) {
      return tableStr.replace('custom-', '').toUpperCase();
    }

    return `Mesa ${tableStr}`;
  }
  onDeliverItem(orderId: string, item: any): void {
    this.deliverItem.emit({ orderId, item });
  }
}
