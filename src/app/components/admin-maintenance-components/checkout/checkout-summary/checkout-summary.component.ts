import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-checkout-summary',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './checkout-summary.component.html',
  styleUrls: ['./checkout-summary.component.scss'],
})
export class CheckoutSummaryComponent {
  @Input() subtotal: number = 0;
  @Input() totalDiscount: number = 0;
  @Input() total: number = 0;
  @Input() selectedItemsCount: number = 0;
  @Input() showButton: boolean = true;

  @Output() continueToPayment = new EventEmitter<void>();

  onContinue(): void {
    this.continueToPayment.emit();
  }
}
