import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-waiter-tabs',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './waiter-tabs.component.html',
  styleUrls: ['./waiter-tabs.component.scss'],
})
export class WaiterTabsComponent {
  @Input() activeTab: 'deliver' | 'tables' = 'deliver';
  @Output() activeTabChange = new EventEmitter<'deliver' | 'tables'>();

  selectTab(tab: 'deliver' | 'tables'): void {
    this.activeTab = tab;
    this.activeTabChange.emit(tab);
  }
}
