import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PaymentMethod } from '../../../../interfaces/bill.interface';

interface PaymentItem {
  productName: string;
  quantity: number;
  finalPrice: number;
}

@Component({
  selector: 'app-payment-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './payment-form.component.html',
  styleUrls: ['./payment-form.component.scss'],
})
export class PaymentFormComponent {
  @Input() paymentMode: 'manual' | 'pos' | 'online' = 'manual';
  @Input() paymentMethod: PaymentMethod = PaymentMethod.CASH;
  @Input() posPaymentType: 'credit' | 'debit' | 'pix' = 'credit';
  @Input() paymentNotes: string = '';
  @Input() total: number = 0;
  @Input() loading: boolean = false;
  @Input() selectedItems: PaymentItem[] = [];
  @Input() selectedTableName: string = '';

  @Output() paymentMethodChange = new EventEmitter<PaymentMethod>();
  @Output() posPaymentTypeChange = new EventEmitter<'credit' | 'debit' | 'pix'>();
  @Output() paymentNotesChange = new EventEmitter<string>();
  @Output() processPayment = new EventEmitter<void>();
  @Output() back = new EventEmitter<void>();

  // Expose enum to template
  PaymentMethod = PaymentMethod;

  onProcessPayment(): void {
    this.processPayment.emit();
  }

  onBack(): void {
    this.back.emit();
  }
}
