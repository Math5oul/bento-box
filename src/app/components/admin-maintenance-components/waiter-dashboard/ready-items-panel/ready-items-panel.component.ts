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

  @Output() deliverItem = new EventEmitter<{ orderId: string; item: any }>();

  getTableDisplayName(table: string): string {
    if (!table) return 'Desconhecida';
    const tableStr = String(table);
    if (tableStr.startsWith('custom-')) {
      return tableStr.replace('custom-', '').toUpperCase();
    }
    return `Mesa ${tableStr}`;
  }

  onDeliverItem(orderId: string, item: any): void {
    this.deliverItem.emit({ orderId, item });
  }
}
